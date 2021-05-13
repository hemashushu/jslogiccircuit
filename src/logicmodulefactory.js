const ConfigurableLogicModule = require('./configurablelogicmodule');
const LogicModuleLoader = require('./logicmoduleloader');

/**
 * 通过代码或者配置文件创建逻辑模块
 *
 * 当使用代码创建逻辑模块时，模块是一个 class，它必须继承 AbstractLogicModule；
 * 当使用配置文件创建模块时，配置文件名称必须是 struct.yaml，内容如下：
 *
 * - inputWires: [{name, bitWidth}, ...] 输入线/端口的名称即位宽；
 * - outputWires: [{name, bitWidth}, ...] 输出线/端口的名称即位宽；
 * - logicModules: [{packageName, moduleClassName, name, parameters}, ...]
 *   此模块所需的所有子模块，一个逻辑模块是由一个或多个其他逻辑组合而成；
 * - inputConnections: [{inputWireName, moduleInstanceName, moduleInputWireName}, ...]
 *   指明哪些子模块连接到输入线；
 * - outputConnections: [{outputWireName, moduleInstanceName, moduleOutputWireName}, ...]
 *   指明输出线连接到哪些子模块；
 * - moduleConnections: [{previousModuleInstanceName, previousModuleOutputWireName,
 *   nextModuleInstanceName, nextModuleInputWireName}, ...]
 *   指明子模块之间如何连接。
 */
class LogicModuleFactory {

    /**
     * 创建逻辑模块实例
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} moduleInstanceName
     * @param {*} parameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     * @returns 如果找不到指定的逻辑模块类，则返回 undefined。
     */
    static createModuleInstance(packageName, moduleClassName, moduleInstanceName, parameters = {}, parentParameters = {}) {
        let logicModuleItem = LogicModuleLoader.getModuleClass(packageName, moduleClassName);

        if (logicModuleItem === undefined) {
            return;
        }

        let moduleClass = logicModuleItem.moduleClass;
        let defaultParameters = logicModuleItem.defaultParameters;

        let combinedParameters = {};
        for (let name in parameters) {
            combinedParameters[name] = parameters[name];
        }

        let keys = Object.keys(combinedParameters);
        for (let name in defaultParameters) {
            if (keys.includes(name)) {
                continue;
            }

            combinedParameters[name] = defaultParameters[name];
        }

        // fill the parameter placeholder
        let resolvedParameters = {};

        for (let name in combinedParameters) {
            let value = combinedParameters[name];
            if (typeof value === 'object') {
                let placeholderName = value.name;
                value = parentParameters[placeholderName];
            }
            resolvedParameters[name] = value;
        }

        // moduleClass 可以是一个 Class，也可以是一个描述如何构建实例的 YAML 对象

        if (typeof moduleClass === 'function') {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct
            return Reflect.construct(moduleClass, [moduleInstanceName, resolvedParameters]);

        } else {
            return LogicModuleFactory.constructModuleInstance(
                packageName, moduleClassName,
                moduleClass, moduleInstanceName, resolvedParameters);
        }
    }

    constructModuleInstance(packageName, moduleClassName, moduleConfig, moduleInstanceName, parameters) {
        let moduleInstance = new ConfigurableLogicModule(
            packageName, moduleClassName,
            moduleInstanceName, parameters);

        // add input wires
        let configInputWires = moduleConfig.inputWires;
        for (let configInputWire of configInputWires) {
            let name = configInputWire.name;
            let bitWidth = configInputWire.bitWidth;
            moduleInstance.addInputWire(name, bitWidth);
        }

        // add output wires
        let configOutputWires = moduleConfig.outputWires;
        for (let configOutputWire of configOutputWires) {
            let name = configOutputWire.name;
            let bitWidth = configOutputWire.bitWidth;
            moduleInstance.addOutputWire(name, bitWidth);
        }

        // add module instances
        let configLogicModules = moduleConfig.logicModules;
        for (let configLogicModule of configLogicModules) {
            let packageName = configLogicModule.packageName;
            let moduleClassName = configLogicModule.moduleClassName;
            let name = configLogicModule.name;
            let parameters = configLogicModule.parameters;

            moduleInstance.addLogicModule(
                packageName, moduleClassName, name, parameters);
        }

        // add input connectors
        let configInputConnections = moduleConfig.inputConnections;
        for (let configInputConnection of configInputConnections) {
            let inputWireName = configInputConnection.inputWireName;
            let moduleInstanceName = configInputConnection.moduleInstanceName;
            let moduleInputWireName = configInputConnection.moduleInputWireName;

            moduleInstance.addInputConnection(
                inputWireName, moduleInstanceName, moduleInputWireName);
        }

        // add output connectors
        let configOutputConnections = moduleConfig.outputConnections;
        for (let configOutputConnection of configOutputConnections) {
            let outputWireName = configOutputConnection.outputWireName;
            let moduleInstanceName = configOutputConnection.moduleInstanceName;
            let moduleOutputWireName = configOutputConnection.moduleOutputWireName;

            moduleInstance.addOutputConnection(
                outputWireName, moduleInstanceName, moduleOutputWireName);
        }

        // add module connectors
        let configModuleConnections = moduleConfig.moduleConnections;
        for (let configModuleConnection of configModuleConnections) {
            let previousModuleInstanceName = configModuleConnection.previousModuleInstanceName;
            let previousModuleOutputWireName = configModuleConnection.previousModuleOutputWireName;
            let nextModuleInstanceName = configModuleConnection.nextModuleInstanceName;
            let nextModuleInputWireName = configModuleConnection.nextModuleInputWireName;

            moduleInstance.addModuleConnection(
                previousModuleInstanceName, previousModuleOutputWireName,
                nextModuleInstanceName, nextModuleInputWireName);
        }

        return moduleInstance;
    }
}

module.exports = LogicModuleFactory;