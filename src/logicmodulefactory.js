const { ObjectUtils } = require('jsobjectutils');
const { IllegalArgumentException } = require('jsexception');

const ConfigurableLogicModule = require('./configurablelogicmodule');
const LogicModuleLoader = require('./logicmoduleloader');

/**
 * 通过代码或者配置文件创建逻辑模块
 *
 * - 当使用代码创建逻辑模块时，模块是一个 class，它必须继承 AbstractLogicModule；
 * - 当使用配置文件创建模块时，配置文件名称必须是 struct.yaml，
 *   配置信息如下：
 *
 * - inputWires: [{name, bitWidth}, ...] 输入线/端口的名称即位宽；
 * - outputWires: [{name, bitWidth}, ...] 输出线/端口的名称即位宽；
 * - logicModules: [{packageName, moduleClassName, instanceName, instanceParameters}, ...]
 *   此模块所需的所有子模块，一个逻辑模块是由一个或多个其他逻辑组合而成；
 * - inputConnections: [{inputWireName, moduleInstanceName, moduleInputWireName}, ...]
 *   指明哪些子模块连接到输入线；
 * - outputConnections: [{outputWireName, moduleInstanceName, moduleOutputWireName}, ...]
 *   指明输出线连接到哪些子模块；
 * - moduleConnections: [{previousModuleInstanceName, previousModuleOutputWireName,
 *   nextModuleInstanceName, nextModuleInputWireName}, ...]
 *   指明子模块之间如何连接。
 * - defaultParameters: {name: value, ...} 模块的默认参数（定义参数）
 *
 */
class LogicModuleFactory {

    /**
     * 创建逻辑模块实例
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} instanceName
     * @param {*} instanceParameters 创建实例所需的初始参数，一个 {name:value, ...} 对象，注意这个
     *     是实例的参数，它将会跟模块的默认参数（即定义参数进行合并）
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

        // 实例参数有可能包含占位符，比如某个子模块希望使用父模块的
        // 某个参数值（相当于 Verilog 工程里的常量），则可以将此参数值
        // 赋值为一个对象 {placeholder: 'name string'}，实例化时会
        // 将此属性值转换为父对象实例参数中的 'name string' 属性对应的值。

        let resolvedInstanceParameters = {};

        for (let name in instanceParameters) {
            let value = instanceParameters[name];
            if (ObjectUtils.isObject(value)) {
                let placeholderName = value.placeholder;
                value = parentParameters[placeholderName];
            }
            resolvedInstanceParameters[name] = value;
        }

        // moduleClass 可以是一个 Class，也可以是一个描述如何构建实例的 YAML 对象
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

    constructModuleInstanceByConfig(
        packageName, moduleClassName,
        moduleConfig,
        moduleInstanceName, instanceParameters, defaultParameters) {

        let moduleInstance = new ConfigurableLogicModule(
            packageName, moduleClassName,
            moduleInstanceName, instanceParameters, defaultParameters);

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
            let instanceName = configLogicModule.instanceName;
            let instanceParameters = configLogicModule.instanceParameters;

            moduleInstance.addLogicModule(
                packageName, moduleClassName, instanceName, instanceParameters);
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