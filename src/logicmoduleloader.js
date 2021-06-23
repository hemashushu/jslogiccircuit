const path = require('path');

const {
    YAMLFileConfig,
    PromiseFileConfig,
    LocaleProperty
    } = require('jsfileconfig');

const { PromiseFileUtils } = require('jsfileutils');

const LogicCircuitException = require('./exception/logiccircuitexception');
const LogicModuleItem = require('./logicmoduleitem');

// 全局模块（类）对象
// 模块工厂将使用从这里获得的模块（类）然后实例化为对象。
global._logicModuleItems = new Map();

// 简化引用
let logicModuleItems = global._logicModuleItems;

/**
 * 每个逻辑模块必须存放于逻辑包根目录的单独一个目录里。
 *
 * 逻辑模块根目录必须包含一个名字叫 logic-module.yaml 的文件，该文件
 * 储存了逻辑模块的基本信息，有如下必要属性：
 *
 * - title：逻辑模块的标题，支持 locale；
 * - group: 逻辑模块的分组，支持 locale；
 * - description：逻辑模块的描述，Markdown 格式的文本，支持 locale；
 * - iconFilename：图标文件名称，图标文件存放在逻辑模块的根目录里，建议
 *   使用 512x512 的 png/webp 格式；
 * - defaultParameters：逻辑模块的默认参数，为一个 {key: value, ...} 对象。
 *
 * 另外逻辑模块根目录还必须包含一个 index.js 或者 struct.yaml 文件。
 *
 * 其中 index.js 必须继承 "AbstractLogicModule" 用于实现（implement）逻辑模块的功能。
 * 而 struct.yaml 的作用也是用于实现逻辑模块的功能，跟 index.js 不同的是，
 * 它通过配置的方式构建一个继承 "AbstractLogicModule" 的实现（implement）。
 *
 * 当同时存在 index.js 或者 struct.yaml 文件时，struct.yaml 会被采用而忽略 index.js。
 * struct.yaml 文件内容见 LogicModuleFactory.js。
 */
class LogicModuleLoader {

    static addLogicModuleItem(packageName, logicModuleClassName, logicModuleItem) {
        let key = `${packageName}:${logicModuleClassName}`;
        logicModuleItems.set(key, logicModuleItem);
    }

    static removeLogicModuleItemByName(packageName, logicModuleClassName) {
        let key = `${packageName}:${logicModuleClassName}`;
        logicModuleItems.delete(key);
    }

    /**
     *
     * @param {*} packageName
     * @param {*} logicModuleClassName
     * @returns 返回逻辑模块项（类），如果找不到指定的模块，则返回 undefined.
     */
    static getLogicModuleItemByName(packageName, logicModuleClassName) {
        let key = `${packageName}:${logicModuleClassName}`;
        return logicModuleItems.get(key);
    }

    /**
     * 加载逻辑模块。
     *
     * @param {*} logicPackagePath
     * @param {*} logicModuleClassName
     * @returns 返回 LogicModuleItem
     */
    static async loadLogicModule(logicPackagePath, packageName, moduleClassName, localeCode) {
        // 逻辑模块名称只可以包含 [0-9a-zA-Z_-\.] 字符
        if (!/^[\w\.-]+$/.test(moduleClassName)) {
            throw new LogicCircuitException("Invalid logic module class name.");
        }

        let moduleFilePath = path.join(logicPackagePath, moduleClassName);
        let moduleConfigFilePath = path.join(moduleFilePath, 'logic-module.yaml');

        if (!await PromiseFileUtils.exists(moduleConfigFilePath)) {
            throw new LogicCircuitException('Can not find the logic module config file: ' + moduleConfigFilePath);
        }

        let fileConfig = new YAMLFileConfig();
        let promiseFileConfig = new PromiseFileConfig(fileConfig);
        let moduleConfig = await promiseFileConfig.load(moduleConfigFilePath);

        let title = LocaleProperty.getValue(moduleConfig, 'title', localeCode);
        let group = LocaleProperty.getValue(moduleConfig, 'group', localeCode);
        let description = LocaleProperty.getValue(moduleConfig, 'description', localeCode);
        let document = LocaleProperty.getValue(moduleConfig, 'document', localeCode);

        // TODO:: 模块的配置文件可能还包括：图文框、测试用例、演示数据、布局等等信息。
        let iconFilename = moduleConfig.iconFilename;
        let defaultParameters = moduleConfig.defaultParameters;

        let moduleClass;

        let structConfigFilePath = path.join(moduleFilePath, 'struct.yaml');

        if (await PromiseFileUtils.exists(structConfigFilePath)) {
            // 优先从 struct.yaml 加载逻辑模块
            moduleClass = await promiseFileConfig.load(structConfigFilePath);
        }else {
            // 加载单一 JavaScript Class 文件
            moduleClass = require(moduleFilePath);
        }

        let logicModuleItem = new LogicModuleItem(
            packageName, moduleClassName, moduleClass, defaultParameters,
            title, group, iconFilename, description, document);

        LogicModuleLoader.addLogicModuleItem(packageName, moduleClassName, logicModuleItem);

        return logicModuleItem;
    }
}

module.exports = LogicModuleLoader;