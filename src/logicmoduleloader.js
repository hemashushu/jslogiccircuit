const path = require('path');

const {
    YAMLFileConfig,
    PromiseFileConfig,
    LocaleProperty
} = require('jsfileconfig');

const { ObjectUtils } = require('jsobjectutils');
const { PromiseFileUtils } = require('jsfileutils');

const LogicCircuitException = require('./exception/logiccircuitexception');
const LogicModuleItem = require('./logicmoduleitem');

// 全局模块（类）对象
// 模块工厂将使用从这里获得的模块（类）然后实例化为对象。
global._logicModuleItemMap = new Map();

// 简化引用
let logicModuleItemMap = global._logicModuleItemMap;

/**
 * 每个逻辑模块必须存放于逻辑包根目录的单独一个目录里。
 *
 * 逻辑模块根目录必须包含一个名字叫 logic-module.yaml 的文件，该文件
 * 储存了逻辑模块的基本信息，有如下必要属性：
 *
 * - title：逻辑模块的标题，支持 locale；
 * - group: 逻辑模块的分组，支持 locale；
 * - description：逻辑模块的描述，Markdown 格式的文本，支持 locale；
 * - document：逻辑模块的详细说明文档，Markdown 格式，支持 locale；
 * - iconFilename：图标文件名称，图标文件存放在逻辑模块的根目录里，建议
 *   使用 512x512 的 png/webp 格式；
 * - defaultParameters：逻辑模块的默认参数，为一个 [{key, value, description, valueType, ...},] 对象数组。
 *       其中 description 支持 locale；
 * - pins: [{name, description}, ...]: 对输入输出端口的描述，name 支持正则表达式，description 支持 locale；
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
        logicModuleItemMap.set(key, logicModuleItem);
    }

    static removeLogicModuleItemByName(packageName, logicModuleClassName) {
        let key = `${packageName}:${logicModuleClassName}`;
        logicModuleItemMap.delete(key);
    }

    /**
     *
     * @param {*} packageName
     * @param {*} logicModuleClassName
     * @returns 返回逻辑模块项（类），如果找不到指定的模块，则返回 undefined.
     */
    static getLogicModuleItemByName(packageName, logicModuleClassName) {
        let key = `${packageName}:${logicModuleClassName}`;
        return logicModuleItemMap.get(key);
    }

    static getLogicModuleItems() {
        return Array.from(logicModuleItemMap.values());
    }

    /**
     * 加载逻辑模块。
     *
     * @param {*} logicPackagePath
     * @param {*} logicModuleClassName
     * @returns 返回 LogicModuleItem
     */
    static async loadLogicModule(logicPackagePath, packageName, moduleClassName, localeCode) {
        // 逻辑模块名称只可以包含 [0-9a-zA-Z_\$] 字符，且只能以 [a-zA-Z_] 字符开头
        if (!/^[a-zA-Z_][\w\$]*$/.test(moduleClassName)) {
            throw new LogicCircuitException(
                `Invalid logic module class name "${moduleClassName}".`);
        }

        let moduleFilePath = path.join(logicPackagePath, moduleClassName);
        let moduleConfigFilePath = path.join(moduleFilePath, 'logic-module.yaml');

        if (!await PromiseFileUtils.exists(moduleConfigFilePath)) {
            throw new LogicCircuitException(
                `Can not find the logic module config file: "${moduleConfigFilePath}"`);
        }

        let fileConfig = new YAMLFileConfig();
        let promiseFileConfig = new PromiseFileConfig(fileConfig);
        let moduleConfig = await promiseFileConfig.load(moduleConfigFilePath);

        let title = LocaleProperty.getValue(moduleConfig, 'title', localeCode);
        let group = LocaleProperty.getValue(moduleConfig, 'group', localeCode);
        let description = LocaleProperty.getValue(moduleConfig, 'description', localeCode);
        let document = LocaleProperty.getValue(moduleConfig, 'document', localeCode);
        let pins = [];

        if (moduleConfig.pins !== undefined) {
            pins = moduleConfig.pins.map(item => {
                return {
                    name: item.name,
                    description: LocaleProperty.getValue(item, 'description', localeCode)
                };
            });
        }

        // TODO:: 模块的配置文件可能还包括：图文框、测试用例、演示数据、布局等等信息。

        let iconFilename = moduleConfig.iconFilename;

        let defaultParameters = {};

        // 配置文件的 defaultParameters 是一个对象数组，示例：
        // - name: inputPinCount
        //   description: The count of input pins
        //   value: 2
        //   valueType: range
        //   valueRange:
        //     from: 1
        //     to: 32
        // - name: bitWidth
        //   description: The bit width of each pins
        //   value: 1
        //   valueType: option
        //   valueOptions:
        //     - 1
        //     - 2
        //     - 4
        //     - 8

        // 其中只有 name 和 value 属性是加载模块所需要的，其他属性是供
        // 用户在编辑模块时所（作界面操作提示）使用。

        let configDefaultParameterItems = moduleConfig.defaultParameters;
        if (configDefaultParameterItems !== undefined) {
            defaultParameters = ObjectUtils.collapseKeyValueArray(configDefaultParameterItems,
                'name', 'value');
        }

        let moduleClass;

        let structConfigFilePath = path.join(moduleFilePath, 'struct.yaml');

        if (await PromiseFileUtils.exists(structConfigFilePath)) {
            // 优先从 struct.yaml 加载逻辑模块
            moduleClass = await promiseFileConfig.load(structConfigFilePath);
        } else {
            // 加载单一 JavaScript Class 文件
            moduleClass = require(moduleFilePath);
        }

        let logicModuleItem = new LogicModuleItem(
            packageName, moduleClassName, moduleClass, defaultParameters,
            title, group, iconFilename, description, pins, document);

        LogicModuleLoader.addLogicModuleItem(packageName, moduleClassName, logicModuleItem);

        return logicModuleItem;
    }
}

module.exports = LogicModuleLoader;