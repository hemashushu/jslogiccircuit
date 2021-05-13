const Wire = require('./wire');
const LogicModuleFactory = require('./logicmodulefactory');
const Connector = require('./connector');
const AbstractLogicModule = require('./abstractlogicmodule');

/**
 * 可配置的逻辑模块
 *
 * 用于从配置文件构建逻辑模块实例
 *
 */
class ConfigurableLogicModule extends AbstractLogicModule {

    /**
     *
     * @param {*} instanceName 模块实例的名称
     * @param {*} parameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     */
    constructor(packageName, moduleClassName, instanceName, parameters) {
        super(instanceName, parameters);

        this.packageName = packageName;
        this.moduleClassName = moduleClassName;

        // inputWires, outputWires:
        //
        // [{
        //     name: name,
        //     bitWidth: bitWidth
        // },...]

        // logicModules:
        //
        // [{
        //     packageName: packageName,
        //     moduleClassName: moduleClassName,
        //     name: name,
        //     parameters: parameters
        // },...]
        this.logicModules = [];


        // inputConnections:
        //
        // [{
        //     inputWireName: inputWireName,
        //     moduleInstanceName: moduleInstanceName,
        //     moduleInputWireName: moduleInputWireName
        // },...]
        this.inputConnections = [];

        // outputConnections:
        //
        // [{
        //     outputWireName: outputWireName,
        //     moduleInstanceName: moduleInstanceName,
        //     moduleOutputWireName: moduleOutputWireName
        // },...]
        this.outputConnections = [];

        // moduleConnections:
        //
        // [{
        //     previousModuleInstanceName: previousModuleInstanceName,
        //     previousModuleOutputWireName: previousModuleOutputWireName,
        //     nextModuleInstanceName: nextModuleInstanceName,
        //     nextModuleInputWireName: nextModuleInputWireName
        // },...]
        this.moduleConnections = [];
    }

    getPackageName() {
        return this.packageName;
    }

    getModuleClassName() {
        return this.moduleClassName;
    }

    addLogicModule(packageName, moduleClassName, name, parameters) {
        let moduleInstance = LogicModuleFactory.createModuleInstance(
            packageName, moduleClassName, name, parameters, this.parameters);

        if (moduleInstance === undefined) {
            return;
        }

        this.logicModules.push(moduleInstance);
        return moduleInstance;
    }

    /**
     * 通过名字获取内部逻辑模块的实例
     * @param {*} instanceName
     */
    getLogicModule(instanceName) {
        return this.logicModules.find(item => item.name === instanceName);
    }

    addInputConnection(inputWireName, moduleInstanceName, moduleInputWireName) {
        let inputWire = this.getInputWire(inputWireName);
        if (inputWire === undefined) {
            return;
        }

        let logicModule = this.getLogicModule(moduleInstanceName);
        if (logicModule === undefined) {
            return;
        }

        let moduleInputWire = logicModule.getInputWire(moduleInputWireName);
        if (moduleInputWire === undefined) {
            return;
        }

        Connector.connect(inputWire, moduleInputWire);

        this.inputConnections.push({
            inputWireName: inputWireName,
            moduleInstanceName: moduleInstanceName,
            moduleInputWireName: moduleInputWireName
        });
    }

    addOutputConnection(outputWireName, moduleInstanceName, moduleOutputWireName) {
        let outputWire = this.getOutputWire(outputWireName);
        if (outputWire === undefined) {
            return;
        }

        let logicModule = this.getLogicModule(moduleInstanceName);
        if (logicModule === undefined) {
            return;
        }

        let moduleOutputWire = logicModule.getOutputWire(moduleOutputWireName);
        if (moduleOutputWire === undefined) {
            return;
        }

        Connector.connect(moduleOutputWire, outputWire);

        this.outputConnections.push({
            outputWireName: outputWireName,
            moduleInstanceName: moduleInstanceName,
            moduleOutputWireName: moduleOutputWireName
        });
    }

    addModuleConnection(previousModuleInstanceName, previousModuleOutputWireName,
        nextModuleInstanceName, nextModuleInputWireName) {

        let previousLogicModule = this.getLogicModule(previousModuleInstanceName);
        if (previousLogicModule === undefined) {
            return;
        }

        let previousModuleOutputWire = previousLogicModule.getInputWire(previousModuleOutputWireName);
        if (previousModuleOutputWire === undefined) {
            return;
        }

        let nextLogicModule = this.getLogicModule(nextModuleInstanceName);
        if (nextLogicModule === undefined) {
            return;
        }

        let nextModuleInputWire = nextLogicModule.getInputWire(nextModuleInputWireName);
        if (nextModuleInputWire === undefined) {
            return;
        }

        Connector.connect(previousModuleOutputWire, nextModuleInputWire);

        this.moduleConnections.push({
            previousModuleInstanceName: previousModuleInstanceName,
            previousModuleOutputWireName: previousModuleOutputWireName,
            nextModuleInstanceName: nextModuleInstanceName,
            nextModuleInputWireName: nextModuleInputWireName
        });
    }

}

module.exports = ConfigurableLogicModule;