const path = require('path');

const AbstractConfigFile = require('./persistent/abstractconfigfile');
const LocalePropertyReader = require('./utils/localepropertyreader');
const LogicModuleItem = require('./logicmoduleitem');
const YAMLConfigFile = require('./persistent/yamlconfigfile');

// 全局模块（类）对象
// 模块工厂将使用从这里获得的模块（类）然后实例化为对象。
global._logicModuleItems = new Map();

// 简化引用
let logicModuleItems = global._logicModuleItems;

/**
 * 一个逻辑模块必须存放于单独一个目录里。
 *
 * 逻辑模块根目录必须包含一个名字叫 logic-module.yaml 的文件，该文件
 * 储存了逻辑模块的基本信息，比如标题、描述、默认参数等。
 *
 * 另外逻辑模块根目录还必须包含一个 index.js 或者 struct.yaml 文件。
 *
 * 其中 index.js 必须继承 "AbstractLogicModule" 用于实现（implement）逻辑模块的功能。
 * 而 struct.yaml 的作用也是用于实现逻辑模块的功能，跟 index.js 不同的是，
 * 它通过配置的方式构建一个继承 "AbstractLogicModule" 的实现（implement）。
 *
 * 当同时存在 index.js 或者 struct.yaml 文件时，struct.yaml 会被采用而忽略 index.js。
 *
 */
class LogicModuleLoader {

    static addLogicModuleItem(packageName, logicModuleClassName, logicModuleItem) {
        let key = `${packageName}:${logicModuleClassName}`;
        logicModuleItems.set(key, logicModuleItem);
    }

    static removeLogicModuleItem(packageName, logicModuleClassName) {
        let key = `${packageName}:${logicModuleClassName}`;
        logicModuleItems.delete(key);
    }

    static getLogicModuleItem(packageName, logicModuleClassName) {
        let key = `${packageName}:${logicModuleClassName}`;
        return logicModuleItems.get(key);
    }

    /**
     * 加载逻辑模块。
     *
     * @param {*} logicPackagePath
     * @param {*} logicModuleClassName
     */
    static loadLogicModule(logicPackagePath, packageName, moduleClassName, localeCode) {
        // 包名只可以包含 [0-9a-zA-Z_-\.] 字符
        if (!/^[\w\.-]+$/.test(moduleClassName)) {
            throw new LogicCircuitException("Invalid logic module class name.");
        }

        let moduleFilePath = path.join(logicPackagePath, moduleClassName);

        let moduleConfigFilePath = path.join(moduleFilePath, moduleClassName);
        if (!AbstractConfigFile.exists(moduleConfigFilePath)) {
            throw new LogicCircuitException('Can not find the logic module config file: ' + moduleConfigFilePath);
        }

        let moduleConfigFile = new YAMLConfigFile(moduleConfigFilePath);

        let title = LocalePropertyReader.getValue(moduleConfigFile, 'title', localeCode)
        let description = LocalePropertyReader.getValue(moduleConfigFile, 'description', localeCode)
        let iconFilename = moduleConfigFile.iconFilename;
        let defaultParameters = moduleConfigFile.defaultParameters;

        let moduleClass;

        let structConfigFilePath = path.join(moduleFilePath, 'struct.yaml');
        if (AbstractConfigFile.exists(structConfigFilePath)) {
            // 优先从 struct.yaml 加载逻辑模块
            let structConfigFile = new YAMLConfigFile(structConfigFilePath);
            moduleClass = structConfigFile.load();

        }else {
            moduleClass = require(moduleFilePath);
        }

        let logicModuleItem = new LogicModuleItem(
            packageName, moduleClassName, moduleClass, defaultParameters,
            title, iconFilename, description);

        LogicModuleLoader.addLogicModuleItem(packageName, moduleClassName, logicModuleItem);
    }
}

module.exports = LogicModuleLoader;