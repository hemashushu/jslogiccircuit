const { Binary } = require('jsbinary');
const { IllegalArgumentException } = require('jsexception');

const ConfigurableLogicModule = require('./configurablelogicmodule');
const LogicModuleLoader = require('./logicmoduleloader');

/**
 * 通过代码或者配置文件创建逻辑模块
 *
 * - 当使用代码创建逻辑模块时，模块是一个 class，它必须继承 AbstractLogicModule；
 * - 当使用配置文件创建模块时，配置文件名称必须是 struct.yaml，
 *   配置信息如下：
 *   - inputPins: [{name, bitWidth, initialBinary:'binary_string', description, pinNumber}, ...] 输入端口；
 *   - outputPins: [{name, bitWidth, initialBinary:'binary_string', description, pinNumber}, ...] 输出端口；
 *   - logicModules: [{packageName, moduleClassName, instanceName, instanceParameters}, ...]
 *     此模块所需的所有子模块，一个逻辑模块可视为由：“一个或多个其他逻辑” + “一个或多个输入输出端口” 组合而成；
 *   - connectionItems: [{name, previousModuleName, previousPinName, nextModuleName, nextPinName}, ...]
 *     指明子模块之间、输入输出端口之间如何连接。
 *   - defaultParameters: {name: value, ...} 模块的默认参数（定义模块时所定义的参数）
 *
 * - 注意配置文件描述的是一个模块的构成，所以没有实例化参数。而内部的子模块可视为具体模块
 *   的实例化，所以有实例化参数（注意子模块仍然有默认参数，即子模块定义时所定义的参数）。
 */
class LogicModuleFactory {

    /**
     * 创建逻辑模块实例
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} instanceName
     * @param {*} instanceParameters 创建实例所需的初始参数，一个 {name:value, ...} 对象，注意这个
     *     是实例的参数，它将会跟模块的默认参数（即定义模块是所定义的参数进行合并）
     * @param {*} parentParameters 实例化指定模块时的父模块实例的参数
     * @returns 如果找不到指定的逻辑模块类，则抛出 IllegalArgumentException 异常。
     */
    static createModuleInstance(packageName, moduleClassName,
        instanceName, instanceParameters = {}, parentParameters = {}) {

        let logicModuleItem = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassName);

        if (logicModuleItem === undefined) {
            throw new IllegalArgumentException('The specified module cannot be found.');
        }

        let defaultParameters = logicModuleItem.defaultParameters;

        // 关于 defaultParameters 和 instanceParameters
        // - defaultParameters 是定义模块是所定义的参数，一般是一个常数字典
        // - instanceParameters 是当一个模块作为子模块被引入到另一个更大的模块时，可能会
        //   希望修改某些默认参数，这个实例参数就是这样的一个常数字典。
        // - 实例参数有可能包含占位符，比如希望子模块使用父模块的某个参数值（相当于 Verilog
        //   工程里的常量，但不完全一样，后面会阐述），则可以将父模块的参数名称放进一个固定的
        //   格式的字符串里：${placeholder}，实例化子模块时会将此属性值转换为父对象
        //   参数中对应的值。
        // - 跟 Verilog 工程里的常量不同，父模块的参数只能传入直接的子模块，而无法传入子模块
        //   的子模块，即做不到全局一个常量，然后所有模块使用。之所以有这样的限制，是因为每一个
        //   模块都有可能被其他（他人的）更大的模块作为子模块使用，所以在构建一个模块时，
        //   根本不知道以后可能出现的父模块会有什么参数，所以只能定义自己所需的参数，然后
        //   让父模块在创建实例时再决定子模块的具体参数。
        // - 可以通过层层传递的方式大致上实现类似 Verilog 的工程常量的效果。

        let resolvedInstanceParameters = {};

        for (let name in instanceParameters) {
            let value = instanceParameters[name];
            let match = /^\${(.+)}$/.exec(value); // 占位符的格式 ${placeholder}
            if (match !== null) {
                let placeholderName = match[1];
                value = parentParameters[placeholderName];
            }

            resolvedInstanceParameters[name] = value;
        }

        // moduleClass 可以是一个 Class，也可以是一个描述如何构建实例的对象（储存在一个 YAML 文件里）
        let moduleClass = logicModuleItem.moduleClass;

        if (typeof moduleClass === 'function') {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct
            return Reflect.construct(moduleClass, [
                instanceName,
                resolvedInstanceParameters,
                defaultParameters]);

        } else {
            return LogicModuleFactory.constructModuleInstance(
                packageName, moduleClassName,
                moduleClass,
                instanceName, resolvedInstanceParameters, defaultParameters);
        }
    }

    createModuleInstanceByConfig(
        packageName, moduleClassName,
        moduleConfig,
        moduleInstanceName, instanceParameters, defaultParameters) {

        let moduleInstance = new ConfigurableLogicModule(
            packageName, moduleClassName,
            moduleInstanceName, instanceParameters, defaultParameters);

        // 配置信息里有如下列表需要传入 ConfigurableLogicModule：
        // - inputPins: [{name, bitWidth, initialBinary:'binary_string', description, pinNumber}, ...] 输入端口；
        // - outputPins: [{name, bitWidth, initialBinary:'binary_string', description, pinNumber}, ...] 输出端口；
        // - logicModules: [{packageName, moduleClassName, instanceName, instanceParameters}, ...]
        //   此模块所需的所有子模块，一个逻辑模块可视为由：“一个或多个其他逻辑” + “一个或多个输入输出端口” 组合而成；
        // - connectionItems: [{name, previousModuleName, previousPinName, nextModuleName, nextPinName}, ...]
        //   指明子模块之间、输入输出端口之间如何连接。

        // add input pins
        let configInputPins = moduleConfig.inputPins;
        for (let configInputPin of configInputPins) {
            let name = configInputPin.name;
            let bitWidth = configInputPin.bitWidth;
            let initialData;

            if (configInputPin.initialBinary !== undefined &&
                configInputPin.initialBinary !== null) {
                // 从二进制字符串转换为 Binary 对象。
                initialData = Binary.fromBinaryString(configInputPin.initialBinary, bitWidth);
            }

            let description = configInputPin.description;
            let pinNumber = configInputPin.pinNumber;

            moduleInstance._addInputPin(name, bitWidth, initialData, description, pinNumber);
        }

        // add output pins
        let configOutputPins = moduleConfig.outputPins;
        for (let configOutputPin of configOutputPins) {
            let name = configInputPin.name;
            let bitWidth = configInputPin.bitWidth;
            let initialData;

            if (configInputPin.initialBinary !== undefined &&
                configInputPin.initialBinary !== null) {
                // 从二进制字符串转换为 Binary 对象。
                initialData = Binary.fromBinaryString(configInputPin.initialBinary, bitWidth);
            }

            let description = configInputPin.description;
            let pinNumber = configInputPin.pinNumber;

            moduleInstance._addOutputPin(name, bitWidth, initialData, description, pinNumber);
        }

        // add sub-module instances
        let configLogicModules = moduleConfig.logicModules;
        for (let configLogicModule of configLogicModules) {
            let packageName = configLogicModule.packageName;
            let moduleClassName = configLogicModule.moduleClassName;
            let instanceName = configLogicModule.instanceName;
            let instanceParameters = configLogicModule.instanceParameters;

            moduleInstance._addLogicModule(
                packageName, moduleClassName, instanceName, instanceParameters);
        }

        // add connection item
        let configConnectionItems = moduleConfig.connectionItems;
        for (let configConnectionItem of configConnectionItems) {
            moduleInstance._addConnectionItem(configConnectionItem);
        }

        return moduleInstance;
    }
}

module.exports = LogicModuleFactory;