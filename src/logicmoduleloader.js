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

const SIMULATION_MODULE_ITEM_MAP_NAME = 'simulationModuleItemMap';
const MODULE_ITEM_MAP_NAME = 'moduleItemMap';

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
 * - pins: [{name, description, edge:false/true, negative: false/true, direction: auto/up/bottom}, ...]
 *   对输入输出端口的描述，name 支持正则表达式，description 支持 locale；
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

    /**
     * 添加逻辑模块
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} logicModuleItem
     * @param {*} isSimulation
     */
    static addLogicModuleItem(packageName, moduleClassName, logicModuleItem, isSimulation) {
        let moduleItemMapMap = logicPackageToModuleItemMapMap.get(packageName);
        if (moduleItemMapMap === undefined) {
            // 构建树状结构:
            // {
            //     packageName: {
            //         moduleItemMap: {},
            //         simulationModuleItemMap: {}
            //     }
            // }
            moduleItemMapMap = new Map();
            moduleItemMapMap.set(SIMULATION_MODULE_ITEM_MAP_NAME, new Map());
            moduleItemMapMap.set(MODULE_ITEM_MAP_NAME, new Map());
            logicPackageToModuleItemMapMap.set(packageName, moduleItemMapMap);
        }

        if (isSimulation) {
            let simulationModuleItemMap = moduleItemMapMap.get(SIMULATION_MODULE_ITEM_MAP_NAME);
            simulationModuleItemMap.set(moduleClassName, logicModuleItem);
        }else {
            let moduleItemMap = moduleItemMapMap.get(MODULE_ITEM_MAP_NAME);
            moduleItemMap.set(moduleClassName, logicModuleItem);
        }
    }

    /**
     * 移除指定逻辑模块（包括仿真模块）
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     */
    static removeLogicModuleItemByName(packageName, moduleClassName) {
        let moduleItemMapMap = logicPackageToModuleItemMapMap.get(packageName);
        if (moduleItemMapMap !== undefined) {
            if (isSimulation) {
                let simulationModuleItemMap = moduleItemMapMap.get(SIMULATION_MODULE_ITEM_MAP_NAME);
                simulationModuleItemMap.delete(moduleClassName);
            }else {
                let moduleItemMap = moduleItemMapMap.get(MODULE_ITEM_MAP_NAME);
                moduleItemMap.delete(moduleClassName);
            }
        }
    }

    /**
     * 获取指定逻辑模块
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @returns LogicModuleItem，如果找不到指定的模块，则返回 undefined.
     */
    static getLogicModuleItemByName(packageName, moduleClassName, enableSimulationModule) {
        let moduleItemMapMap = logicPackageToModuleItemMapMap.get(packageName);
        if (moduleItemMapMap !== undefined) {
            let moduleItemMap = moduleItemMapMap.get(MODULE_ITEM_MAP_NAME);
            let logicModuleItem = moduleItemMap.get(moduleClassName);

            // 如果普通逻辑模块找不到，则尝试从仿真逻辑模块中查找
            if (logicModuleItem === undefined &&
                enableSimulationModule) {
                let simulationModuleItemMap = moduleItemMapMap.get(SIMULATION_MODULE_ITEM_MAP_NAME);
                logicModuleItem = simulationModuleItemMap.get(moduleClassName);
            }

            return logicModuleItem;
        }
    }

    /**
     * 获取指定逻辑包的逻辑模块列表
     *
     * @param {*} packageName
     * @param {*} isSimulation
     * @returns LogicModuleItem[]，如果找不到指定的模块，则返回 undefined.
     */
    static getLogicModuleItemsByPackageName(packageName, isSimulation) {
        let moduleItemMapMap = logicPackageToModuleItemMapMap.get(packageName);
        if (moduleItemMapMap !== undefined) {
            if (isSimulation) {
                let simulationModuleItemMap = moduleItemMapMap.get(SIMULATION_MODULE_ITEM_MAP_NAME);
                return Array.from(simulationModuleItemMap.values());
            }else {
                let moduleItemMap = moduleItemMapMap.get(MODULE_ITEM_MAP_NAME);
                return Array.from(moduleItemMap.values());
            }
        }
    }

    static removeAllLogicModuleItemsByPackageName(packageName) {
        logicPackageToModuleItemMapMap.delete(packageName);
    }

    /**
     * 获取衍生逻辑模块列表
     *
     * @param {*} logicModuleItem
     */
    static getDerivativeModuleItems(logicModuleItem) {
        // TODO::
    }

    /**
     * 加载指定目录下的所有逻辑模块。
     *
     * @param {*} packageDirectory 逻辑包的目录（一个绝对路径）
     * @param {*} packageName 逻辑包的名称
     * @param {*} isSimulation 标记是否加载仿真模块，
     *     - 仿真模块不能被外部逻辑包访问，也不能被所在包的普通模块所引用；
     *     - 仿真模块可以引用普通模块；
     *     - 仿真模块可以引用仿真模块；
     * @param {*} parentModulePath 模块的父目录的路径，一个相对于当前逻辑包的相对路径。
     * @param {*} localeCode
     * @returns
     */
    static async loadLogicModuleByDirectory(packageDirectory, packageName,
        isSimulation, parentModulePath = '', localeCode) {

        // 逻辑包当中存储逻辑模块的路径
        // 因为逻辑包可以包含普通逻辑模块，也可以包含仿真逻辑模块，所以这个参数
        // 对于具体的一个逻辑包来说，实际上有两个可能的值：
        // - ${packageDirectory}/module
        // - ${packageDirectory}/simulation
        let packageModulePath;

        let packageResourceLocator = PackageResourceLocator.create(packageDirectory);
        if (isSimulation) {
            // 加载 simulation 目录里的逻辑模块
            packageModulePath = packageResourceLocator.getSimulationsDirectory();
        }else {
            // 加载 module 目录里的逻辑模块
            packageModulePath = packageResourceLocator.getModulesDirectory();
        }

        // 当前方法不仅用于加载一级逻辑模块，同时也用于加载子模块，所以这里
        // 拼接 packageModulePath 和 parentModulePath，得到当前要加载的实际目录。
        let childModulesDirectory = path.join(packageModulePath, parentModulePath);
        if (!await PromiseFileUtils.exists(childModulesDirectory)) {
            return []; // dir not found
        }

        let fileInfos = await PromiseFileUtils.list(childModulesDirectory);

        // 筛选得出目录列表
        let folderInfos = fileInfos.filter(item => {
            return (item instanceof FolderInfo &&  // 过滤掉非目录文件
                item.fileName.charAt(0) !== '.' && // 过滤掉名字第一个字符为点号的隐藏文件夹，包括 “.DS_Store”
                item.fileName !== '__MACOSX'       // 过滤掉 macOS 里常见的隐藏文件夹
                );
        });

        let moduleItems = [];

        for(let folderInfo of folderInfos) {
            let folderName = folderInfo.fileName;
            let logicModuleItem = await LogicModuleLoader.loadLogicModule(
                packageDirectory, packageName,
                isSimulation, parentModulePath, folderName, localeCode);

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
     * @param {*} parentModulePath 模块的父目录的路径，一个相对于当前逻辑包的相对路径。
     * @param {*} folderName 模块所在的目录的名称
     * @param {*} localeCode 诸如 'en', 'zh-CN', 'jp' 等本地化语言代号
     * @returns LogicModuleItem
     */
    static async loadLogicModule(packageDirectory, packageName,
        isSimulation, parentModulePath = '', folderName, localeCode) {

        // 逻辑模块名称只可以包含 [0-9a-zA-Z_\$] 字符，且只能以 [a-zA-Z_] 字符开头
        if (!/^[a-zA-Z_][\w\$]*$/.test(folderName)) {
            throw new LogicCircuitException(
                `Invalid logic module class name "${folderName}".`);
        }

        // 一个模块可能会包含有子模块，模块完整名称（moduleClassName）的组成规则：
        // 父模块的名称 + '.' + 模块所在目录的名称
        //
        // 如果一个模块不从属于其他模块，则其模块名称即为其所在目录的名称。
        let moduleNamePath = parentModulePath.replace(/[\/\\]/g, '.');
        let moduleClassName = (moduleNamePath === '') ? folderName : (moduleNamePath + '.' + folderName);

        // 仿真模块和普通模块也不能重名
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
                    description: LocaleProperty.getValue(item, 'description', localeCode),

                    // 当 edge == true 是，表示上升沿/下降沿（positive/negative）触发
                    // 在 UI 上会多个小三角形。
                    // Boolean: false(default)|true
                    edge: item.edge ?? false,

                    // 表示低电平有效，在 UI 上会多一个小空心圆圈。
                    // Boolean: false(default)|true
                    negative: item.negative ?? false,

                    // 引脚在 UI 上的方向
                    // 默认情况下模块的 UI 是自动绘制的，通常是一个矩形，
                    // 引脚会根据信号方向自动排在矩形左侧或者右侧。
                    //
                    // 但有时需要如把诸如时钟/控制信号等引脚放置在矩形的上侧
                    // 或下侧，这时就需要设置 direction 属性，属性的可能值有：
                    // String: 'auto'(default)|'up'|'bottom'
                    direction: item.direction ?? 'auto'
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
            defaultParameters = await ConfigParameterResolver.resolveDefaultParameters(
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

        // 尝试加载当前模块的子模块
        let childModulePath = path.join(parentModulePath, folderName);
        await LogicModuleLoader.loadLogicModuleByDirectory(packageDirectory, packageName,
            isSimulation, childModulePath, localeCode);

        return logicModuleItem;
    }
}

module.exports = LogicModuleLoader;