const path = require('path');

const {
    YAMLFileConfig,
    JSONFileConfig,
    PromiseFileConfig,
    LocaleProperty} = require('jsfileconfig');

const { PromiseFileUtils } = require('jsfileutils');

const LogicCircuitException = require('./exception/logiccircuitexception');
const LogicModuleLoader = require('./logicmoduleloader');
const LogicPackageItem = require('./logicpackageitem');

// 全局逻辑包集合
// key: packagename
// value: PackageItem
global._logicPackageItems = new Map();

// 全局逻辑包引用计数
// key: packagename
// value: int （值为该逻辑包被引用的次数）
global._logicPackageReferenceCounts = new Map();

// 简化引用
let logicPackageItems = global._logicPackageItems;
let logicPackageReferenceCounts = global._logicPackageReferenceCounts;

/**
 * 一个逻辑包（logic package），同时也是一个标准的 npm package，
 * 可以包含一个或若多个逻辑模块（logic module class）。
 *
 * 逻辑包根目录除了必须包含 package.json 文件之外，还必须有一个
 * 名字为 logic-package.yaml 的文件，此文件包含以下必要的属性：
 *
 * - title：逻辑包的标题，支持 locale；
 * - description：逻辑包的描述，Markdown 格式文本，支持 locale；
 * - iconFilename：图标文件名，图标文件存放于逻辑包的根目录，建议
 *   使用 512x512 的 png/webp 格式；
 * - dependencies：依赖项（逻辑包）的名称列表，为一个 String 数组；
 * - modules：当前逻辑包提供的逻辑模块项的名称列表，为一个 String 数组。
 *
 * package.json 文件有以下必要的属性：
 *
 * - name：逻辑包的名称，需跟其目录名称一致；
 * - version：逻辑包的版本；
 * - author：作者的名称，格式为 "name <email> (url)" 字符串，或者
 *   {name, email, url} 对象，其中 email 和 url 都是可选的；
 * - homepage：逻辑包的主页；
 */
class LogicPackageLoader {

    static addLogicPackageItem(logicPackageItem) {
        logicPackageItems.set(logicPackageItem.name, logicPackageItem);
        logicPackageReferenceCounts.set(logicPackageItem.name, 1);
    }

    static removeLogicPackageItemByName(packageName) {
        let logicPackageItem = logicPackageItems.get(packageName);

        if (logicPackageItem === undefined) {
            return;
        }

        let count = logicPackageReferenceCounts.get(packageName);
        if (count > 1) {
            // 减少引用数量
            count--;
            logicPackageReferenceCounts.set(packageName, count);
            return;
        }

        // 先移除逻辑模块
        let moduleClassNames = logicPackageItem.modules;
        for (let moduleClassName of moduleClassNames) {
            LogicModuleLoader.removeModuleClass(moduleClassName);
        }

        // 再移除依赖包
        let dependencyPackageNames = logicPackageItem.dependencies;
        for (let dependencyPackageName of dependencyPackageNames) {
            LogicPackageLoader.removeLogicPackageItemByName(dependencyPackageName);
        }

        logicPackageReferenceCounts.delete(packageName);
        logicPackageItems.delete(packageName);
    }

    /**
     * 获取指定名称的逻辑包
     *
     * @param {*} packageName
     * @returns 返回 LogicPackageItem，如果找不到指定名称的逻辑包，则返回 undefined.
     */
    static getLogicPackageItemByName(packageName) {
        return logicPackageItems.get(packageName);
    }

    static existPackageItem(packageName) {
        return logicPackageItems.has(packageName);
    }

    /**
     * 加载逻辑包。
     *
     * 加载过程大致如下：
     * 1. 分析依赖哪些逻辑包（logic package），并逐一加载它们，即先加载依赖包；
     * 2. 分析当前逻辑包提供了哪些逻辑模块（logic module class），并通过
     *    LogicModuleLoader 加载它们。
     * 3. 把当前逻辑包加入到 "_logicPackageItems" 全局集合中。
     * 4. 当一个逻辑包成功加载后，它所有的依赖包，依赖包的依赖包，以及所有逻辑包
     *    里面的所有逻辑模块都完成加载。
     *
     * @param {*} packageRepositoryDirectory 目标逻辑包所在的目录，即逻辑包完整路径
     *     的父目录，其值一般为目标逻辑包的 '__dirname' 值的父目录。
     * @param {*} packageName 目标逻辑包的名称，这个名称同时也是目录名称。
     * @returns LogicPackageItem
     */
    static async loadLogicPackage(packageRepositoryDirectory, packageName, localeCode = 'en') {
        // 逻辑包名称只可以包含 [0-9a-zA-Z_-\.] 字符
        if (!/^[\w\.-]+$/.test(packageName)) {
            throw new LogicCircuitException("Invalid logic package name.");
        }

        // 逻辑包的基本信息分布在目录的 package.json 以及 logic-package.yaml 这
        // 两个文件里。前者存放基本的信息，后者存放详细信息。

        let logicPackagePath = path.join(packageRepositoryDirectory, packageName);

        // 获取 package name, version, author(name), email, homepage 等信息
        let packageBaseConfigFilePath = path.join(logicPackagePath, 'package.json');

        if (!await PromiseFileUtils.exists(packageBaseConfigFilePath)) {
            throw new LogicCircuitException('Can not find the package config file: ' + packageBaseConfigFilePath);
        }

        let jsonFileConfig = new JSONFileConfig();
        let jsonPromiseFileConfig = new PromiseFileConfig(jsonFileConfig);
        let baseConfig = await jsonPromiseFileConfig.load(packageBaseConfigFilePath);

        let name = baseConfig.name;
        let version = baseConfig.version;
        let author = baseConfig.author;
        let homepage = baseConfig.homepage;

        if (name !== packageName) {
            // 为了便于管理，当前强制要求逻辑包名称必须跟所在的目录的名称一致
            throw new LogicCircuitException('Logic package directory name does not match the package name.');
        }

        // author 可能是一个对象 {name, email, url}
        // 也可能是一个字符串：
        // "author": "Hippo Spark <hippospark@gmail.com> (https://twitter.com/hemashushu/)"
        // 字符串当中的 email 和 网址是可选的。
        // https://docs.npmjs.com/cli/v7/configuring-npm/package-json#people-fields-author-contributors

        if (typeof author === 'object') {
            author = author.name;

        } else if (typeof author === 'string') {
            // 去除个人网址及 email 部分
            let urlMatch = /\(http.+\)/.exec(author);
            if (urlMatch !== null) {
                author = author.substring(0, urlMatch.index);
            }

            let emailMatch = /<.+@.+>/.exec(author);
            if (emailMatch !== null) {
                author = author.substring(0, emailMatch.index);
            }

            author = author.trim();

        } else {
            author = '';
        }

        // 获取逻辑包标题、依赖项、逻辑模块项、图标文件名、描述等信息

        let packageDetailConfigFilePath = path.join(logicPackagePath, 'logic-package.yaml');
        if (!await PromiseFileUtils.exists(packageDetailConfigFilePath)) {
            throw new LogicCircuitException('Can not find the logic package config file: ' + packageDetailConfigFilePath);
        }

        let yamlFileConfig = new YAMLFileConfig();
        let yamlPromiseFileConfig = new PromiseFileConfig(yamlFileConfig);
        let detailConfig = await yamlPromiseFileConfig.load(packageDetailConfigFilePath);

        let title = LocaleProperty.getValue(detailConfig, 'title', localeCode)
        let description = LocaleProperty.getValue(detailConfig, 'description', localeCode)
        let iconFilename = detailConfig.iconFilename;

        // 加载依赖项信息
        let dependencyPackageNames = detailConfig.dependencies;
        for (let dependencyPackageName of dependencyPackageNames) {
            await LogicPackageLoader.loadDependencyLogicPackage(packageRepositoryDirectory, dependencyPackageName, localeCode);
        }

        // 加载逻辑模块项信息
        let moduleClassNames = detailConfig.modules;
        for (let moduleClassName of moduleClassNames) {
            await LogicModuleLoader.loadLogicModule(
                logicPackagePath, packageName, moduleClassName, localeCode);
        }

        let logicPackageItem = new LogicPackageItem(
            name, version,
            dependencyPackageNames, moduleClassNames,
            title, author, homepage,
            iconFilename, description);

        LogicPackageLoader.addLogicPackageItem(logicPackageItem);
        return logicPackageItem;
    }

    /**
     * 加载依赖的逻辑包。
     *
     * - 在加载依赖逻辑包之前，先检测指定包是否已经被加载，如果已经被加载过，则
     *   仅仅增加引用计数器的数值，如果没有加载过，再调用 "loadLogicPackage" 方法。
     * - 应用程序可能会内置一些基础的逻辑包，还可能会让用户从社区下载/添加第三方逻辑包，
     *   最后会有用户自己创建及维护的一些包，所以一个典型的模拟器应用程序大致有：
     *   - 基础包
     *   - 第三方包
     *   - 用户创建的包/项目
     *   这三个逻辑包的目录，前两个应该由应用程序在启动时加载，这样可以避免加载用户包（有依赖
     *   基础包或者第三方包）时遇到 packageRepositoryDirectory 不一致导致加载失败的问题。
     *
     * @param {*} packageRepositoryDirectory
     * @param {*} packageName
     * @param {*} localeCode
     * @returns LogicPackageItem
     */
    static async loadDependencyLogicPackage(packageRepositoryDirectory, packageName, localeCode) {
        // 因为 packageName 是全局/全球唯一的，所以在判断目标包是否已加载时，
        // 只需 packageName 即可，不需要连同 packageRepositoryDirectory 比较。
        if (LogicPackageLoader.existPackageItem(packageName)) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has
            let count = logicPackageReferenceCounts.get();
            count++;
            logicPackageReferenceCounts.set(packageName, count);
            return;
        }

        return await LogicPackageLoader.loadLogicPackage(
            packageRepositoryDirectory, packageName, localeCode);
    }
}

module.exports = LogicPackageLoader;