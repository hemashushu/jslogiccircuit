const validateNpmPackageName = require("validate-npm-package-name");

const {
    YAMLFileConfig,
    JSONFileConfig,
    PromiseFileConfig,
    LocaleProperty } = require('jsfileconfig');

const { PromiseFileUtils } = require('jsfileutils');
const { FileNotFoundException } = require('jsexception');

const LogicCircuitException = require('./exception/logiccircuitexception');
const LogicModuleLoader = require('./logicmoduleloader');
const LogicPackageItem = require('./logicpackageitem');
const PackageResourceLocator = require('./packageresourcelocator');

// 全局逻辑包集合
// _logicPackageItemMap 的结构如下：
// {
//     packageName1: LogicPackageItem1,
//     packageName2: LogicPackageItem2,
//     ...
// }
global._logicPackageItemMap = new Map();

// 全局逻辑包引用计数
// _logicPackageReferenceCountMap 的结构如下：
// {
//     packageName1: Number1, // Number 为该逻辑包被引用的次数
//     packageName2: Number2,
//     ...
// }
global._logicPackageReferenceCountMap = new Map();

// 简化引用
let logicPackageItemMap = global._logicPackageItemMap;
let logicPackageReferenceCountMap = global._logicPackageReferenceCountMap;

/**
 * 一个逻辑包（logic package），同时也是一个标准的 npm package，
 * 可以包含一个或若多个逻辑模块（logic module class），
 * 逻辑包的目录结构请见 PackageResourceLocator.
 *
 * 逻辑包根目录必须包含 package.json 文件，该文件有以下必要的属性：
 *
 * - name：逻辑包的名称，需跟其目录名称一致；
 * - version：逻辑包的版本；
 * - author：作者的名称，格式为 "name <email> (url)" 字符串，
 *   或者 {name, email, url} 对象，其中 email 和 url 都是可选的；
 * - homepage：逻辑包的主页；
 *
 * 另外还有一个名字为 logic-package.yaml 的文件，此文件包含以下必要的属性：
 *
 * - title：逻辑包的标题，支持 locale；
 * - description：逻辑包的描述，支持 locale；
 * - iconFilename：图标文件名，图标文件存放于逻辑包的根目录，建议
 *   使用 512x512 的 png/webp 格式；
 * - dependencies：依赖项（逻辑包）的名称列表，为一个 String 数组；
 * - modules：当前逻辑包提供的逻辑模块项的名称列表，为一个 String 数组。
 *
 */
class LogicPackageLoader {

    static addLogicPackageItem(logicPackageItem) {
        logicPackageItemMap.set(logicPackageItem.name, logicPackageItem);
        logicPackageReferenceCountMap.set(logicPackageItem.name, 1);
    }

    /**
     * 获取指定名称的逻辑包
     *
     * @param {*} packageName
     * @returns LogicPackageItem，如果找不到指定名称的逻辑包，则返回 undefined.
     */
    static getLogicPackageItemByName(packageName) {
        return logicPackageItemMap.get(packageName);
    }

    static existPackageItem(packageName) {
        return logicPackageItemMap.has(packageName);
    }

    static getLogicPackageItems() {
        return Array.from(logicPackageItemMap.values());
    }

    static removeLogicPackageItemByName(packageName) {
        let logicPackageItem = logicPackageItemMap.get(packageName);

        if (logicPackageItem === undefined) {
            // 集合里未找到指定的逻辑包名称
            // 可能是重复调用了 removeLogicPackageItemByName() 方法
            return;
        }

        // 获取逻辑包的引用次数，如果
        // - 大于 1 则减少引用数，但不移除 LogicPackageItem
        // - 等于 1，说明没有其它逻辑包引用它，则真正移除 LogicPackageItem
        let count = logicPackageReferenceCountMap.get(packageName);

        if (count > 1) {
            // 减少引用数量，不移除 LogicPackageItem
            count--;
            logicPackageReferenceCountMap.set(packageName, count);
            return;
        }

        // 先移除逻辑模块
        LogicModuleLoader.removeAllLogicModuleItemsByPackageName(packageName);

        // 再移除依赖包
        let dependencyPackageNames = logicPackageItem.dependencies;
        for (let dependencyPackageName of dependencyPackageNames) {
            LogicPackageLoader.removeLogicPackageItemByName(dependencyPackageName);
        }

        // 再移除 LogicPackageItem 自身
        logicPackageReferenceCountMap.delete(packageName);
        logicPackageItemMap.delete(packageName);
    }

    /**
     * 加载逻辑包。
     *
     * 加载过程大致如下：
     * 1. 分析依赖哪些逻辑包，并逐一加载它们，即先加载依赖包；
     * 2. 分析当前逻辑包提供了哪些逻辑模块（logic module），包括普通的逻辑模块和
     *    用于仿真的逻辑模块，并通过 LogicModuleLoader 加载它们。
     * 3. 把当前逻辑包加入到 "_logicPackageItemMap" 全局集合中。
     * 4. 当一个逻辑包成功加载后，它所有的依赖包，以及依赖包的依赖包，以及所有
     *    所有逻辑模块（包括普通逻辑模块和仿真逻辑模块）都已完成加载。
     * 5. 逻辑模块需要实例化才能 “运行”，实例化由 LogicModuleFactory 完成。
     *
     * @param {*} packageRepositoryManager
     * @param {*} packageName 目标逻辑包的名称，这个名称同时也是目录名称。
     * @param {*} localeCode 诸如 'en', 'zh-CN', 'jp' 等本地化语言代号
     * @returns LogicPackageItem
     *     - 如果指定的逻辑包找不到，则抛出 LogicPackageNotFoundException 异常。
     *     - 如果逻辑包名不符合规范，则抛出 LogicCircuitException 异常。
     *     - 如果基本配置文件、逻辑包配置文件不存在，则抛出 FileNotFoundException 异常。
     *     - 如果逻辑包名跟目录名不一致，则抛出 LogicCircuitException 异常。
     */
    static async loadLogicPackage(packageRepositoryManager, packageName, localeCode = 'en') {
        // 逻辑包名称需符合 npm package 命名规范
        // 详细请见 https://github.com/npm/validate-npm-package-name
        let { validForNewPackages } = validateNpmPackageName(packageName);
        if (!validForNewPackages) {
            throw new LogicCircuitException(
                `Invalid logic package name "${packageName}".`);
        }

        // 检查是否已经加载
        let lastPackageItem = LogicPackageLoader.getLogicPackageItemByName(packageName);
        if (lastPackageItem !== undefined) {
            return lastPackageItem;
        }

        // 如果指定的逻辑包找不到，findPackageDirectoryInfo() 会抛出 LogicPackageNotFoundException 异常。
        let packageDirectoryInfo = await packageRepositoryManager.findPackageDirectoryInfo(packageName);
        let packageDirectory = packageDirectoryInfo.packageDirectory;

        let packageResourceLocator = PackageResourceLocator.create(packageDirectory);

        // 逻辑包的基本信息分布在目录的 package.json 以及 logic-package.yaml 这
        // 两个文件里。前者存放基本的信息，后者存放详细信息。

        // 获取 package name, version, author(name), email, homepage 等信息
        let packageBaseConfigFilePath = packageResourceLocator.getBaseConfigFilePath();

        if (!await PromiseFileUtils.exists(packageBaseConfigFilePath)) {
            throw new FileNotFoundException(
                `Can not find the package config file: "${packageBaseConfigFilePath}"`);
        }

        let jsonFileConfig = new JSONFileConfig();
        let jsonPromiseFileConfig = new PromiseFileConfig(jsonFileConfig);
        let baseConfig = await jsonPromiseFileConfig.load(packageBaseConfigFilePath);

        let name = baseConfig.name;
        let version = baseConfig.version;
        let author = baseConfig.author;
        let homepage = baseConfig.homepage;

        if (name !== packageName) {
            // 为了便于管理，当前强制要求逻辑包名称必须跟其目录的名称一致
            throw new LogicCircuitException(
                `Logic package directory name "${packageName}" does not match the package name "${name}".`);
        }

        // 基本配置文件里的 author 属性可能是一个对象 ：
        // {name, email, url}
        //
        // 也可能是如下的一个字符串：
        // "author": "Hippo Spark <hippospark@gmail.com> (https://twitter.com/hemashushu/)"
        // 字符串当中的 email 和 网址是可选的。
        //
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

        let packageDetailConfigFilePath = packageResourceLocator.getDetailConfigFilePath();
        if (!await PromiseFileUtils.exists(packageDetailConfigFilePath)) {
            throw new FileNotFoundException(
                `Can not find the logic package config file: "${packageDetailConfigFilePath}"`);
        }

        let yamlFileConfig = new YAMLFileConfig();
        let yamlPromiseFileConfig = new PromiseFileConfig(yamlFileConfig);
        let detailConfig = await yamlPromiseFileConfig.load(packageDetailConfigFilePath);

        let title = LocaleProperty.getValue(detailConfig, 'title', localeCode)
        let description = LocaleProperty.getValue(detailConfig, 'description', localeCode)
        let iconFilename = detailConfig.iconFilename;
        let mainSimulationModule = detailConfig.mainSimulationModule;

        // 加载依赖项信息
        let dependencyPackageNames = detailConfig.dependencies;
        for (let dependencyPackageName of dependencyPackageNames) {
            await LogicPackageLoader.loadDependencyLogicPackage(
                packageRepositoryManager, dependencyPackageName, localeCode);
        }

        // 加载 module 目录里的逻辑模块
        await LogicModuleLoader.loadLogicModuleByDirectory(
            packageDirectory, packageName, false, '', localeCode);

        // 加载 simulation 目录里的逻辑模块
        await LogicModuleLoader.loadLogicModuleByDirectory(
            packageDirectory, packageName, true, '', localeCode);

        let logicPackageItem = new LogicPackageItem(
            name, title,
            dependencyPackageNames, mainSimulationModule,
            packageDirectory,
            packageDirectoryInfo.isReadOnly,
            version, author, homepage,
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
     *   这三个逻辑包的目录在加载时会先搜索前面的仓库，然后再搜索后面的仓库。
     *
     * @param {*} packageRepositoryManager
     * @param {*} packageName
     * @param {*} localeCode
     * @returns LogicPackageItem
     */
    static async loadDependencyLogicPackage(packageRepositoryManager, packageName, localeCode) {
        if (LogicPackageLoader.existPackageItem(packageName)) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has
            let count = logicPackageReferenceCountMap.get();
            count++;
            logicPackageReferenceCountMap.set(packageName, count);
            return;
        }

        return await LogicPackageLoader.loadLogicPackage(
            packageRepositoryManager, packageName, localeCode);
    }
}

module.exports = LogicPackageLoader;