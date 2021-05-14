const LogicModuleFactory = require('./logicmodulefactory');
const Connector = require('./connector');
const AbstractLogicModule = require('./abstractlogicmodule');
const {ObjectUtils} = require('jsobjectutils');

/**
 * 可配置的逻辑模块
 *
 * 用于从配置文件构建逻辑模块实例
 *
 */
class ConfigurableLogicModule extends AbstractLogicModule {

    /**
     * 实例化逻辑模块（类）
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} instanceName 模块实例的名称
     * @param {*} parameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     */
    constructor(packageName, moduleClassName, instanceName, instanceParameters, defaultParameters) {
        super(instanceName, instanceParameters, defaultParameters);

        this.packageName = packageName;
        this.moduleClassName = moduleClassName;

        // inputWires, outputWires:
        // 继承自父类的输入/输出接口连线实例
        //
        // 从 Wire 实例对象可以提取实例的以下配置信息：
        //
        // [{
        //     name: name,
        //     bitWidth: bitWidth
        // },...]

        // logicModules:
        // 内部（子）逻辑模块实例
        //
        // 从 LogicModule 实例对象可以提取实例的以下配置信息：
        //
        // [{
        //     packageName: packageName,
        //     moduleClassName: moduleClassName,
        //     name: name,
        //     parameters: parameters
        // },...]
        this.logicModules = [];

        // inputConnections:
        // 输入线的连接的配置信息
        //
        // [{
        //     inputWireName: inputWireName,
        //     moduleInstanceName: moduleInstanceName,
        //     moduleInputWireName: moduleInputWireName
        // },...]
        this.inputConnectionInfos = [];

        // outputConnections:
        // 输出线的连接的配置信息
        //
        // [{
        //     outputWireName: outputWireName,
        //     moduleInstanceName: moduleInstanceName,
        //     moduleOutputWireName: moduleOutputWireName
        // },...]
        this.outputConnectionInfos = [];

        // moduleConnections:
        // 内部（子）模块间的连接的配置信息
        //
        // [{
        //     previousModuleInstanceName: previousModuleInstanceName,
        //     previousModuleOutputWireName: previousModuleOutputWireName,
        //     nextModuleInstanceName: nextModuleInstanceName,
        //     nextModuleInputWireName: nextModuleInputWireName
        // },...]
        this.moduleConnectionInfos = [];
    }

    getPackageName() {
        return this.packageName;
    }

    getModuleClassName() {
        return this.moduleClassName;
    }

//     getInputWireConfigs() {
//         let wireConfigs = [];
//         for(let inputWire of this.inputWires) {
//             let wireConfig = {
//                 name: inputWire.name,
//                 bitWidth: inputWire.bitWidth
//             };
//
//             wireConfigs.push(wireConfig);
//         }
//
//         return wireConfigs;
//     }
//
//     getOutputWireConfigs() {
//         let wireConfigs = [];
//         for(let outputWire of this.outputWires) {
//             let wireConfig = {
//                 name: outputWire.name,
//                 bitWidth: outputWire.bitWidth
//             };
//
//             wireConfigs.push(wireConfig);
//         }
//
//         return wireConfigs;
//     }
//
//     getLogicModuleConfigs() {
//         let logicModuleConfigs = [];
//         for(let logicModule of this.logicModules) {
//             let logicModuleConfig = {
//                 packageName: logicModule.getPackageName(),
//                 moduleClassName: logicModule.getModuleClassName(),
//                 name: logicModule.name,
//                 parameters: logicModule.parameters
//             };
//
//             logicModuleConfigs.push(logicModuleConfig);
//         }
//
//         return logicModuleConfigs;
//     }

    /**
     * 添加内部（子）逻辑模块
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} instanceName
     * @param {*} instanceParameters
     * @returns
     */
    addLogicModule(packageName, moduleClassName, instanceName, instanceParameters) {
        let moduleInstance = LogicModuleFactory.createModuleInstance(
            packageName, moduleClassName, instanceName, instanceParameters, this.parameters);

        if (moduleInstance === undefined) {
            return;
        }

        this.logicModules.push(moduleInstance);
        return moduleInstance;
    }

    /**
     * 通过名字获取内部（子）逻辑模块的实例
     *
     * @param {*} instanceName
     */
    getLogicModuleByName(instanceName) {
        return this.logicModules.find(item => item.name === instanceName);
    }

    getLogicModules() {
        return this.logicModules;
    }

    addInputConnection(inputWireName, moduleInstanceName, moduleInputWireName) {
        let inputWire = this.getInputWire(inputWireName);
        if (inputWire === undefined) {
            return;
        }

        let logicModule = this.getLogicModuleByName(moduleInstanceName);
        if (logicModule === undefined) {
            return;
        }

        let moduleInputWire = logicModule.getInputWire(moduleInputWireName);
        if (moduleInputWire === undefined) {
            return;
        }

        Connector.connect(inputWire, moduleInputWire);

        this.inputConnectionInfos.push({
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

        let logicModule = this.getLogicModuleByName(moduleInstanceName);
        if (logicModule === undefined) {
            return;
        }

        let moduleOutputWire = logicModule.getOutputWire(moduleOutputWireName);
        if (moduleOutputWire === undefined) {
            return;
        }

        Connector.connect(moduleOutputWire, outputWire);

        this.outputConnectionInfos.push({
            outputWireName: outputWireName,
            moduleInstanceName: moduleInstanceName,
            moduleOutputWireName: moduleOutputWireName
        });
    }

    addModuleConnection(previousModuleInstanceName, previousModuleOutputWireName,
        nextModuleInstanceName, nextModuleInputWireName) {

        let previousLogicModule = this.getLogicModuleByName(previousModuleInstanceName);
        if (previousLogicModule === undefined) {
            return;
        }

        let previousModuleOutputWire = previousLogicModule.getInputWire(previousModuleOutputWireName);
        if (previousModuleOutputWire === undefined) {
            return;
        }

        let nextLogicModule = this.getLogicModuleByName(nextModuleInstanceName);
        if (nextLogicModule === undefined) {
            return;
        }

        let nextModuleInputWire = nextLogicModule.getInputWire(nextModuleInputWireName);
        if (nextModuleInputWire === undefined) {
            return;
        }

        Connector.connect(previousModuleOutputWire, nextModuleInputWire);

        this.moduleConnectionInfos.push({
            previousModuleInstanceName: previousModuleInstanceName,
            previousModuleOutputWireName: previousModuleOutputWireName,
            nextModuleInstanceName: nextModuleInstanceName,
            nextModuleInputWireName: nextModuleInputWireName
        });
    }

    getInputConnectionInfos() {
        return this.inputConnectionInfos;
    }

    getOutputConnectionInfos() {
        return this.outputConnectionInfos;
    }

    getModuleConnectionInfos() {
        return this.moduleConnectionInfos;
    }

}

module.exports = ConfigurableLogicModule;