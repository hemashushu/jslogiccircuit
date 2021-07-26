const path = require('path');

const {
    YAMLFileConfig,
    PromiseFileConfig,
    LocaleProperty
} = require('jsfileconfig');

const { FileNotFoundException } = require('jsexception');
const { PromiseFileUtils, FolderInfo } = require('jsfileutils');

const ConfigParameterResolver = require('./configparameterresolver');
const LogicCircuitException = require('./exception/logiccircuitexception');
const LogicModuleItem = require('./logicmoduleitem');
const LogicModuleNotFoundException = require('./exception/logicmodulenotfoundexception');
const PackageResourceLocator = require('./packageresourcelocator');

// 全局模块（类）对象
// 模块工厂将使用从这里获得的模块（类）然后实例化为对象。
// logicPackageToModuleItemMapMap 的结构如下:
// {
//      packageName: {
//          moduleItemMap: {
//              moduleClassName1: moduleItem1,
//              moduleClassName2: moduleItem2,
//              ...
//          },
//          simulationModuleItemMap: {
//             moduleClassName1: moduleItem1,
//             moduleClassName2: moduleItem2,
//             ...
//          }
//      }
// }
global._logicPackageToModuleItemMapMap = new Map();

// 简化引用
let logicPackageToModuleItemMapMap = global._logicPackageToModuleItemMapMap;

/**
 * 每个逻辑模块必须存放于逻辑包根目录的 “src” 目录里的单独一个目录里。
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

    static addLogicModuleItem(packageName, moduleClassName, logicModuleItem, isSimulation) {
        let moduleItemMapMap = logicPackageToModuleItemMapMap.get(packageName);
        if (moduleItemMapMap === undefined) {
            moduleItemMapMap = new Map();
            logicPackageToModuleItemMapMap.set(packageName, moduleItemMapMap);
        }

        if (isSimulation) {
            let simulationModuleItemMap = moduleItemMapMap.get('simulationModuleItemMap');
            if (simulationModuleItemMap === undefined) {
                simulationModuleItemMap = new Map();
                moduleItemMapMap.set('simulationModuleItemMap', simulationModuleItemMap);
            }
            simulationModuleItemMap.set(moduleClassName, logicModuleItem);

        }else {
            let moduleItemMap = moduleItemMapMap.get('moduleItemMap');
            if (moduleItemMap === undefined) {
                moduleItemMap = new Map();
                moduleItemMapMap.set('moduleItemMap', moduleItemMap);
            }
            moduleItemMap.set(moduleClassName, logicModuleItem);
        }
    }

    static removeLogicModuleItemByName(packageName, moduleClassName) {
        let moduleItemMapMap = logicPackageToModuleItemMapMap.get(packageName);
        if (moduleItemMapMap !== undefined) {
            if (isSimulation) {
                let simulationModuleItemMap = moduleItemMapMap.get('simulationModuleItemMap');
                if (simulationModuleItemMap !== undefined) {
                    simulationModuleItemMap.delete(moduleClassName);
                }
            }else {
                let moduleItemMap = moduleItemMapMap.get('moduleItemMap');
                if (moduleItemMap !== undefined) {
                    moduleItemMap.delete(moduleClassName);
                }
            }
        }
    }

    /**
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @returns LogicModuleItem，如果找不到指定的模块，则返回 undefined.
     */
    static getLogicModuleItemByName(packageName, moduleClassName, enableSimulationModule) {
        let moduleItemMapMap = logicPackageToModuleItemMapMap.get(packageName);
        if (moduleItemMapMap !== undefined) {
            let moduleItemMap = moduleItemMapMap.get('moduleItemMap');
            let logicModuleItem = moduleItemMap.get(moduleClassName);

            // 如果普通逻辑模块找不到，则尝试从仿真逻辑模块中查找
            if (logicModuleItem === undefined &&
                enableSimulationModule) {
                let simulationModuleItemMap = moduleItemMapMap.get('simulationModuleItemMap');
                if (simulationModuleItemMap !== undefined) {
                    logicModuleItem = simulationModuleItemMap.get(moduleClassName);
                }
            }

            return logicModuleItem;
        }
    }

    static getLogicModuleItemsByPackageName(packageName, isSimulation) {
        let moduleItemMapMap = logicPackageToModuleItemMapMap.get(packageName);
        if (moduleItemMapMap !== undefined) {
            if (isSimulation) {
                let simulationModuleItemMap = moduleItemMapMap.get('simulationModuleItemMap');
                return Array.from(simulationModuleItemMap.values());
            }else {
                let moduleItemMap = moduleItemMapMap.get('moduleItemMap');
                return Array.from(moduleItemMap.values());
            }
        }
    }

    static removeAllLogicModuleItemsByPackageName(packageName) {
        logicPackageToModuleItemMapMap.delete(packageName);
    }

    /**
     * 加载指定目录下的所有逻辑模块。
     *
     * @param {*} packageDirectory
     * @param {*} packageName
     * @param {*} isSimulation 标记是否为仿真模块，
     *     - 仿真模块不能被外部逻辑包访问，也不能被所在包的普通模块所引用；
     *     - 仿真模块可以引用普通模块；
     *     - 仿真模块可以引用仿真模块；
     * @param {*} modulePath
     * @param {*} parentModulePath
     * @param {*} localeCode
     * @returns
     */
    static async loadLogicModuleDirectory(packageDirectory, packageName,
        isSimulation, modulePath, parentModulePath = '', localeCode) {

        let childModulesDirectory = path.join(modulePath, parentModulePath);
        if (!await PromiseFileUtils.exists(childModulesDirectory)) {
            return []; // dir not found
        }

        let fileInfos = await PromiseFileUtils.list(childModulesDirectory);

        // 筛选得出目录列表
        let folderInfos = fileInfos.filter(item => {
            return (item instanceof FolderInfo &&
                item.fileName.charAt(0) !== '.'); // 过滤掉名字第一个字符为点号的隐藏文件
        });

        let moduleItems = [];

        for(let folderInfo of folderInfos) {
            let folderName = folderInfo.fileName;
            let logicModuleItem = await LogicModuleLoader.loadLogicModule(
                packageDirectory, packageName,
                isSimulation, modulePath, parentModulePath, folderName, localeCode);

            moduleItems.push(logicModuleItem);
        }

        return moduleItems;
    }

    /**
     * 加载指定目录（同时也是逻辑模块名）的逻辑模块及其所有子模块。
     *
     * 可能会抛出的异常：
     * - 如果配置文件不存在，则抛出 FileNotFoundException 异常。
     * - 如果指定的逻辑模块找不到，则抛出 LogicModuleNotFoundException 异常。
     * - 如果逻辑模块名不符合规范，则抛出 LogicCircuitException 异常。
     *
     * 解析默认参数（defaultParameters）时可能会抛出的异常：
     * - 如果配置值超出 range 范围，则抛出 IllegalArgumentException 异常。
     * - 如果指定对象文件解析错误，则抛出 ParseException 异常。
     * - 如果指定对象文件内容为空或者无实际数据，则抛出 IllegalArgumentException 异常。
     * - 如果指定的对象/二进制文件不存在，则抛出 FileNotFoundException 异常。
     * - 如果指定的对象/二进制文件读取错误，则抛出 IOException 异常。
     *
     * @param {*} packageDirectory
     * @param {*} packageName
     * @param {*} isSimulation 标记是否为仿真模块，
     *     - 仿真模块不能被外部逻辑包访问，也不能被所在包的普通模块所引用；
     *     - 仿真模块可以引用普通模块；
     *     - 仿真模块可以引用仿真模块；
     * @param {*} modulePath
     * @param {*} parentModulePath
     * @param {*} folderName 模块所在的目录的名称
     * @param {*} localeCode 诸如 'en', 'zh-CN', 'jp' 等本地化语言代号
     * @returns LogicModuleItem
     */
    static async loadLogicModule(packageDirectory, packageName,
        isSimulation, modulePath,  parentModulePath = '', folderName, localeCode) {

        // 逻辑模块名称只可以包含 [0-9a-zA-Z_\$] 字符，且只能以 [a-zA-Z_] 字符开头
        if (!/^[a-zA-Z_][\w\$]*$/.test(folderName)) {
            throw new LogicCircuitException(
                `Invalid logic module class name "${folderName}".`);
        }

        // 模块名称（moduleClassName）的组成规则：
        // 父模块的名称 + '$' + 模块所在目录的名称
        //
        // 如果不从属于其他模块，则名称为其所在目录的名称。
        let moduleNamePath = parentModulePath.replace(/\//g, '$');
        let moduleClassName = moduleNamePath === '' ? folderName : (moduleNamePath + '$' + folderName);

        let lastLogicModuleItem = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassName, isSimulation);
        if (lastLogicModuleItem !== undefined) {
            return lastLogicModuleItem;
        }

        // 模块全路径
        let packageResourceLocator = PackageResourceLocator.create(packageDirectory);
        let moduleResourceLocator = packageResourceLocator.createModuleResourceLocator(parentModulePath, folderName, isSimulation);
        let moduleDirectory = moduleResourceLocator.getModuleDirectory();

        if (!await PromiseFileUtils.exists(moduleDirectory)) {
            throw new LogicModuleNotFoundException(
                `Can not find the specified module: "${moduleClassName}"`,
                packageName, moduleClassName);
        }

        // 模块的配置文件
        let moduleConfigFilePath = moduleResourceLocator.getConfigFilePath();
        if (!await PromiseFileUtils.exists(moduleConfigFilePath)) {
            throw new FileNotFoundException(
                `Can not find the logic module config file: "${moduleConfigFilePath}"`);
        }

        let fileConfig = new YAMLFileConfig();
        let promiseFileConfig = new PromiseFileConfig(fileConfig);
        let moduleConfig = await promiseFileConfig.load(moduleConfigFilePath);

        let title = LocaleProperty.getValue(moduleConfig, 'title', localeCode);
        let group = LocaleProperty.getValue(moduleConfig, 'group', localeCode);
        let description = LocaleProperty.getValue(moduleConfig, 'description', localeCode);

        let pins = [];

        if (moduleConfig.pins !== undefined) {
            pins = moduleConfig.pins.map(item => {
                return {
                    name: item.name,
                    description: LocaleProperty.getValue(item, 'description', localeCode)
                };
            });
        }

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
            defaultParameters = await ConfigParameterResolver.resolve(
                configDefaultParameterItems, packageResourceLocator);
        }

        let moduleClass;

        // 模块的构造文件
        let structConfigFilePath = moduleResourceLocator.getStructFilePath();

        try {
            if (await PromiseFileUtils.exists(structConfigFilePath)) {
                // 优先从 struct.yaml 加载逻辑模块
                moduleClass = await promiseFileConfig.load(structConfigFilePath);
            } else {
                // 加载单一 JavaScript Class 文件
                moduleClass = require(moduleDirectory);
            }
        }catch(err) {
            throw new LogicCircuitException(
                `Can not load module: "${moduleClassName}"`, err);
        }

        let logicModuleItem = new LogicModuleItem(
            packageName, moduleClassName, moduleClass, defaultParameters,
            title, group,
            moduleDirectory,
            isSimulation,
            iconFilename, description, pins);

        LogicModuleLoader.addLogicModuleItem(
            packageName, moduleClassName, logicModuleItem, isSimulation);

        // 加载子模块
        let childModulePath = path.join(parentModulePath, folderName);
        await LogicModuleLoader.loadLogicModuleDirectory(packageDirectory, packageName,
            isSimulation, modulePath, childModulePath, localeCode);

        return logicModuleItem;
    }
}

module.exports = LogicModuleLoader;