const ConfigParameterResolver = require('./configparameterresolver');
const ConfigurableLogicModule = require('./configurablelogicmodule');
const LogicModuleLoader = require('./logicmoduleloader');
const LogicModuleNotFoundException = require('./exception/logicmodulenotfoundexception');
const LogicPackageLoader = require('./logicpackageloader');
const LogicPackageNotFoundException = require('./exception/logicpackagenotfoundexception');
const PinDirection = require('./pindirection');

/**
 * 通过代码或者配置文件创建逻辑模块
 *
 * - 当使用代码创建逻辑模块时，模块是一个 class，它必须继承 AbstractLogicModule；
 * - 当使用配置文件创建模块时，配置文件名称必须是 struct.yaml，
 *   配置信息里有如下列表需要传入 ConfigurableLogicModule：
 *   - inputPins: [{name, bitWidth}, ...] 输入端口；
 *   - outputPins: [{name, bitWidth}, ...] 输出端口；
 *   - logicModules: [{packageName, moduleClassName, name, parameters}, ...]
 *     此模块所需的所有子模块，一个逻辑模块可视为由：“一个或多个其他逻辑” + “一个或多个输入输出端口” 组合而成；
 *     这里的 'parameters' 是实例该逻辑模块是所用的实例参数（instanceParameters）。
 *   - connections: [{name, previousModuleName, previousPinName, nextModuleName, nextPinName}, ...]
 *     指明子模块之间、输入输出端口之间如何连接。
 *
 * - 注意配置文件描述的是一个模块的构成，所以没有实例化参数。而内部的子模块可视为具体模块
 *   的实例化，所以有实例化参数（注意子模块仍然有默认参数，即子模块定义时所定义的参数）。
 */
class LogicModuleFactory {

    /**
     * 创建逻辑模块实例
     *
     * @param {*} packageName
     * @param {*} moduleClassName 模块的名称
     *     模块可以是普通的逻辑模块（或仿真逻辑模块），也可以是一个子模块（包括子模块的子模块），
     *     当加载子模块时，需要在父模块和子模块的名称之间使用点号（.）分隔。
     * @param {*} instanceName 模块实例名称，只可以
     *     包含 [0-9a-zA-Z_\$] 字符，且只能以 [a-zA-Z_] 字符开头
     * @param {*} instanceParameters 实例参数，一个 {name:value, ...} 对象，注意这个
     *     是实例的参数，它将会跟模块的默认参数（即定义模块是所定义的参数进行合并）
     * @param {*} enableSimulationModule 是否允许实例化仿真模块，
     *     普通逻辑模块不能引用仿真模块，但仿真模块允许引用普通模块
     * @returns AbstractLogicModule 实例。
     *     - 如果找不到指定的逻辑模块类，则抛出 LogicModuleNotFoundException 异常。
     */
    static createModuleInstance(packageName, moduleClassName,
        instanceName, instanceParameters = {}, enableSimulationModule = false) {

        if (!LogicPackageLoader.existPackageItem(packageName)) {
            throw new LogicPackageNotFoundException(
                `Can not find the specified package "${packageName}".`,
                packageName);
        }

        let logicModuleItem = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassName, enableSimulationModule);

        if (logicModuleItem === undefined) {
            throw new LogicModuleNotFoundException(
                `Can not find the specified module class "${moduleClassName}".`,
                packageName, moduleClassName);
        }

        // 关于 defaultParameters 和 instanceParameters
        //
        // - defaultParameters 是定义模块时所定义的参数，一般是一个常数字典。defaultParameters
        //   写在配置文件 “logic-module.yaml” 里，键名是 “defaultParameters”。
        // - instanceParameters 是当一个模块作为子模块被引入到另一个更大的模块时，可能会
        //   希望某些参数使用跟默认参数不一样的值，这些需要修改参数的集合就是实例参数。
        //   instanceParameters 写在配置文件 “struct.yaml” 的子模块列表里，子模块列表如下：
        //   logicModules: [{packageName, moduleClassName, name, parameters}, ...]
        //   其中的 “parameters” 即表示 instanceParameters。
        // - 当实例作为一个逻辑包的 **顶层逻辑模块** 运行时，显然是没有 instanceParameters 的，
        //   但作单元测试时，可以允许指定 instanceParameters 一些不同的值以便于测试完整。
        // - 简而言之，模块在单独运行时，只有 defaultParameters；模块作为子模块给其他模块所
        //   引用时，其他模块可以传参数给它，这些参数就是 instanceParameters。
        //
        // - instanceParameters 有可能包含占位符，比如希望子模块使用父模块的某个参数值（
        //   相当于 Verilog 工程里的常量，但不完全一样，后面会阐述），则可以将父模块的参
        //   数名称放进一个固定的格式的字符串里：${placeholder}，实例化子模块时会将此
        //   属性值转换为父对象参数中对应的值。
        // - 跟 Verilog 工程里的常量不同，父模块的参数只能传入直接的子模块，而无法传入子模块
        //   的子模块，即做不到全局一个常量，然后所有模块使用。之所以有这样的限制，是因为每一个
        //   模块都有可能被其他（他人的）更大的模块作为子模块使用，所以在构建一个模块时，
        //   根本不知道以后可能出现的父模块会有什么参数，所以只能定义自己所需的参数，然后
        //   让父模块在创建实例时再决定子模块的具体参数。
        // - 可以通过层层传递的方式大致上实现类似 Verilog 的工程常量的效果。
        //
        // - 无论何时，defaultParameters 不允许存在占位符；
        // - 当前方法（即 LogicModuleFactory.createModuleInstance）的参数 instanceParameters
        //   必须是已经解析过占位符的，即在该方法里，该参数不允许存在占位符。

        let defaultParameters = logicModuleItem.defaultParameters;

        // moduleClass 可以是一个 Class，也可以是一个描述如何构建实例的对象（储存在一个 YAML 文件里）
        let moduleClass = logicModuleItem.moduleClass;

        if (typeof moduleClass === 'function') {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct
            return LogicModuleFactory.constructAbstractLogicModuleInstance(
                packageName, moduleClassName,
                moduleClass,
                instanceName, instanceParameters, defaultParameters);

        } else {
            // 普通逻辑模块不允许引用仿真模块
            if (!logicModuleItem.isSimulation) {
                enableSimulationModule = false;
            }

            return LogicModuleFactory.constructConfigurableLogicModuleInstance(
                packageName, moduleClassName,
                moduleClass,
                instanceName, instanceParameters, defaultParameters, enableSimulationModule);
        }
    }

    static constructAbstractLogicModuleInstance(
        packageName, moduleClassName,
        moduleClass,
        instanceName, instanceParameters, defaultParameters) {
        return Reflect.construct(moduleClass, [
            packageName, moduleClassName,
            instanceName,
            instanceParameters,
            defaultParameters]);
    }

    static constructConfigurableLogicModuleInstance(
        packageName, moduleClassName,
        moduleConfig,
        instanceName, instanceParameters, defaultParameters,
        enableSimulationModule) {

        let moduleInstance = new ConfigurableLogicModule(
            packageName, moduleClassName,
            instanceName, instanceParameters, defaultParameters);

        // 获取实例参数
        let parameters = moduleInstance.getParameters();

        // add input pins
        let configInputPins = moduleConfig.inputPins ?? [];
        for (let configInputPin of configInputPins) {
            let name = configInputPin.name;
            let bitWidth = configInputPin.bitWidth ?? 1;
            moduleInstance.addPin(name, bitWidth, PinDirection.input);
        }

        // add output pins
        let configOutputPins = moduleConfig.outputPins ?? [];
        for (let configOutputPin of configOutputPins) {
            let name = configOutputPin.name;
            let bitWidth = configOutputPin.bitWidth ?? 1;
            moduleInstance.addPin(name, bitWidth, PinDirection.output);
        }

        // add sub-module instances
        let configLogicModules = moduleConfig.logicModules;
        for (let configLogicModule of configLogicModules) {
            let subPackageName = configLogicModule.packageName;
            let subModuleClassName = configLogicModule.moduleClassName;
            let subInstanceName = configLogicModule.name;

            // 这是个用于实例逻辑模块所用的实例参数
            // 子模块的实例参数允许存在占位符
            //
            // parameters 的示例：
            // parameters:
            //   inputPinCount: 4         # 普通的数字/布尔/字符串类型参数
            //   bitWidth: "${bitWidth}"  # 表示继承父模块的参数
            //   inlineObject:            # 对象型参数
            //     key1: value1
            //     key2: value2
            //
            // 不支持外部文件的对象和字节数组，如需这两种类型，可以使用占位符从模块的默认属性里获取。

            let instanceParameters = ConfigParameterResolver.resolveInstanceParameters(
                configLogicModule.parameters,
                parameters);

            // 仿真模块不能引用不同逻辑包的仿真模块
            let subEnableSimulationModule = enableSimulationModule &&
                (packageName === subPackageName);

            let subModuleInstance = LogicModuleFactory.createModuleInstance(
                subPackageName, subModuleClassName, subInstanceName,
                instanceParameters, subEnableSimulationModule);

            moduleInstance.addLogicModule(subModuleInstance);
        }

        // add connection item
        let configConnections = moduleConfig.connections;
        for (let configConnection of configConnections) {
            moduleInstance.addConnection(
                configConnection.name,
                configConnection.previousModuleName,
                configConnection.previousPinName,
                configConnection.nextModuleName,
                configConnection.nextPinName
            );
        }

        return moduleInstance;
    }
}

module.exports = LogicModuleFactory;