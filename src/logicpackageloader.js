const path = require('path');

const {
    YAMLFileConfig,
    JSONFileConfig,
    PromiseFileConfig} = require('jsfileconfig');

const AbstractConfigFile = require('./configfile/abstractconfigfile');
const LocalePropertyReader = require('./utils/localepropertyreader');
const LogicCircuitException = require('./logiccircuitexception');
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
 * - dependencies：依赖项（逻辑包）的名称列表；
 * - modules：当前逻辑包提供的逻辑模块项的名称列表。
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
        logicPackageItems.set(logicPackageItem.packageName, logicPackageItem);
        logicPackageReferenceCounts.set(logicPackageItem.packageName, 1);
    }

    static removeLogicPackageItem(packageName) {
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
        let modules = logicPackageItem.modules;
        for (let moduleClassName of modules) {
            LogicModuleLoader.removeModuleClass(moduleClassName);
        }

        // 再移除依赖包
        let dependencies = logicPackageItem.dependencies;
        for (let dependencyPackageName of dependencies) {
            LogicPackageLoader.removeLogicPackageItem(dependencyPackageName);
        }

        logicPackageReferenceCounts.delete(packageName);
        logicPackageItems.delete(packageName);
    }

    static getLogicPackageItem(packageName) {
        return logicPackageItems.get(packageName);
    }

    /**
     * 加载逻辑包。
     *
     * 加载过程大致如下：
     *
     * 1. 分析依赖哪些逻辑包（logic package），并逐一加载它们；
     * 2. 分析提供了哪些逻辑模块（logic module class），并通过
     *    LogicModuleFactory 加载它们。
     * 3. 把逻辑包加入到 "_logicPackageItems" 全局集合中。
     *
     *
     * @param {*} packageRepositoryDirectory 目标逻辑包所在的目录，其值一般
     *     为目标逻辑包的 '__dirname' 的父目录。
     * @param {*} packageName 目标逻辑包的名称，这个名称同时也是目录名称。
     */
    static loadLogicPackage(packageRepositoryDirectory, packageName, localeCode = 'en') {

        // 包名只可以包含 [0-9a-zA-Z_-\.] 字符
        if (!/^[\w\.-]+$/.test(packageName)) {
            throw new LogicCircuitException("Invalid logic package name.");
        }

        // 逻辑包的基本信息分布在目录的 package.json 以及 logic-package.yaml 文件。

        let logicPackagePath = path.join(packageRepositoryDirectory, packageName);

        // 获取 package name, version, author(name), email, homepage 等信息
        let npmConfigFilePath = path.join(logicPackagePath, 'package.json');

        let jsonFileConfig = new JSONFileConfig();
        let jsonPromiseFileConfig = new PromiseFileConfig(jsonFileConfig);

        let npmConfig = jsonPromiseFileConfig.load(npmConfigFilePath);

        let name = npmConfig.name;
        let version = npmConfig.version;
        let author = npmConfig.author;
        let homepage = npmConfig.homepage;

        if (name !== packageName) {
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

        let packageConfigFilePath = path.join(logicPackagePath, 'logic-package.yaml');

        if (!AbstractConfigFile.exists(packageConfigFilePath)) {
            throw new LogicCircuitException('Can not find the logic package config file: ' + packageConfigFilePath);
        }

        let yamlFileConfig = new YAMLFileConfig();
        let yamlPromiseFileConfig = new PromiseFileConfig(yamlFileConfig);
        let packageConfig = await yamlPromiseFileConfig.load(packageConfigFilePath);

        let title = LocalePropertyReader.getValue(packageConfig, 'title', localeCode)
        let description = LocalePropertyReader.getValue(packageConfig, 'description', localeCode)
        let iconFilename = packageConfig.iconFilename;

        // 加载依赖项信息
        let dependencies = packageConfig.dependencies;
        for (let dependencyPackageName of dependencies) {
            LogicPackageLoader.loadDependency(packageRepositoryDirectory, dependencyPackageName);
        }

        // 加载逻辑模块项信息
        let modules = packageConfig.modules;
        for (let moduleClassName of modules) {
            LogicModuleLoader.loadLogicModule(
                logicPackagePath, packageName, moduleClassName, localeCode);
        }

        let logicPackageItem = new LogicPackageItem(
            name, version,
            dependencies, modules,
            title, author, homepage,
            iconFilename, description);

        LogicPackageLoader.addLogicPackageItem(logicPackageItem);
    }

    /**
     * 加载依赖的逻辑包。
     *
     * 在加载依赖逻辑包之前，先检测指定包是否已经被加载，如果已经被加载过，则
     * 仅仅增加引用计数器的数值，如果没有加载过，再调用 "loadLogicPackage" 方法。
     *
     * @param {*} packageRepositoryDirectory
     * @param {*} packageName
     * @param {*} localeCode
     * @returns
     */
    static loadDependency(packageRepositoryDirectory, packageName, localeCode) {
        if (logicPackageItems.has(packageName)) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has
            let count = logicPackageReferenceCounts.get();
            count++;
            logicPackageReferenceCounts.set(packageName, count);
            return;
        }

        LogicPackageLoader.loadLogicPackage(packageRepositoryDirectory,
            packageName, localeCode);
    }
}

module.exports = LogicPackageLoader;