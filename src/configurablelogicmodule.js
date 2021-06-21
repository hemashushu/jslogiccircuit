const { ObjectUtils } = require('jsobjectutils');
const { IllegalArgumentException } = require('jsexception');

const LogicModuleFactory = require('./logicmodulefactory');
const Connector = require('./connector');
const AbstractLogicModule = require('./abstractlogicmodule');

/**
 * 可配置的逻辑模块
 *
 * 用于从配置文件构建逻辑模块实例
 *
 * 实例的属性：
 * - instanceName（继承）
 * - inputWires（继承）
 * - outputWires（继承）
 * - instanceParameters（继承）
 * - defaultParameters（继承）
 * - parameters（继承）
 * - logicModules
 *
 * 下列属性主要供实例化工厂使用：
 * - logicModules
 * - inputConnectionInfos
 * - outputConnectionInfos
 * - moduleConnectionInfos
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

        // logicModules:
        // 内部（子）逻辑模块实例
        // 从 LogicModule 实例对象可以提取实例的以下配置信息：
        // [{
        //     packageName: packageName,
        //     moduleClassName: moduleClassName,
        //     name: name,
        //     parameters: parameters
        // },...]
        this.logicModules = [];

        // inputConnections:
        // 输入线的连接的配置信息
        // [{
        //     inputWireName: inputWireName,
        //     moduleInstanceName: moduleInstanceName,
        //     moduleInputWireName: moduleInputWireName
        // },...]
        this.inputConnectionInfos = [];

        // outputConnections:
        // 输出线的连接的配置信息
        // [{
        //     outputWireName: outputWireName,
        //     moduleInstanceName: moduleInstanceName,
        //     moduleOutputWireName: moduleOutputWireName
        // },...]
        this.outputConnectionInfos = [];

        // moduleConnections:
        // 内部（子）模块间的连接的配置信息
        // [{
        //     previousModuleInstanceName: previousModuleInstanceName,
        //     previousModuleOutputWireName: previousModuleOutputWireName,
        //     nextModuleInstanceName: nextModuleInstanceName,
        //     nextModuleInputWireName: nextModuleInputWireName
        // },...]
        this.moduleConnectionInfos = [];

        // 另外还有两个继承自父类的输入/输出接口连线实例：
        // - this.inputWires
        // - this.outputWires
        //
        // 从 Wire 实例对象可以提取实例的以下配置信息：
        // [{
        //     name: name,
        //     bitWidth: bitWidth
        // },...]
    }

    getPackageName() {
        return this.packageName;
    }

    getModuleClassName() {
        return this.moduleClassName;
    }

    /**
     * 添加内部（子）逻辑模块
     * 该方法供“模块实例化工厂”使用，用于“从配置文件实例化一个模块”。
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} instanceName
     * @param {*} instanceParameters
     * @returns 返回子模块实例。如果找不到指定的模块，则抛出 IllegalArgumentException 异常。
     */
    addLogicModule(packageName, moduleClassName, instanceName, instanceParameters) {
        let moduleInstance = LogicModuleFactory.createModuleInstance(
            packageName, moduleClassName, instanceName, instanceParameters, this.parameters);

        this.logicModules.push(moduleInstance);
        return moduleInstance;
    }

    /**
     * 通过名字获取内部子逻辑模块的实例
     * @param {*} instanceName
     * @returns 返回子模块实例，如果找不到指定实例名称，则返回 undefiend.
     */
    getLogicModule(instanceName) {
        return this.logicModules.find(item => item.name === instanceName);
    }

    /**
     * 获取所有子逻辑模块实例
     *
     * @returns 返回模块实例数组
     */
    getLogicModules() {
        return this.logicModules;
    }

    /**
     * 连接当前模块输入线到内部子模块的输入线。
     * 即，将当前模块的 I/O 输入端口，连接到内部指定子模块的 I/O 输入端口。
     * 该方法供“模块实例化工厂”使用，用于“从配置文件实例化一个模块”。
     *
     * 如果指定的线或者子模块找不到，均会抛出 IllegalArgumentException 异样。
     * @param {*} inputWireName
     * @param {*} moduleInstanceName
     * @param {*} moduleInputWireName
     */
    addInputConnection(inputWireName, moduleInstanceName, moduleInputWireName) {
        let inputWire = this.getInputWire(inputWireName);
        if (inputWire === undefined) {
            throw new IllegalArgumentException('Cannot find the specified input wire.');
        }

        let logicModule = this.getLogicModule(moduleInstanceName);
        if (logicModule === undefined) {
            throw new IllegalArgumentException('Cannot find the specified internal submodule.');
        }

        let moduleInputWire = logicModule.getInputWire(moduleInputWireName);
        if (moduleInputWire === undefined) {
            throw new IllegalArgumentException('Cannot find the specified input wire of the internal submodule.');
        }

        Connector.connect(inputWire, moduleInputWire);

        this.inputConnectionInfos.push({
            inputWireName: inputWireName,
            moduleInstanceName: moduleInstanceName,
            moduleInputWireName: moduleInputWireName
        });
    }

    /**
     * 连接当前模块输出线到内部子模块的输出线。
     * 即，将当前模块的 I/O 输出端口，连接到内部指定子模块的 I/O 输出端口。
     * 该方法供“模块实例化工厂”使用，用于“从配置文件实例化一个模块”。
     *
     * 如果指定的线或者子模块找不到，均会抛出 IllegalArgumentException 异样。
     *
     * @param {*} outputWireName
     * @param {*} moduleInstanceName
     * @param {*} moduleOutputWireName
     */
    addOutputConnection(outputWireName, moduleInstanceName, moduleOutputWireName) {
        let outputWire = this.getOutputWire(outputWireName);
        if (outputWire === undefined) {
            throw new IllegalArgumentException('Cannot find the specified output wire.');
        }

        let logicModule = this.getLogicModule(moduleInstanceName);
        if (logicModule === undefined) {
            throw new IllegalArgumentException('Cannot find the specified internal submodule.');
        }

        let moduleOutputWire = logicModule.getOutputWire(moduleOutputWireName);
        if (moduleOutputWire === undefined) {
            throw new IllegalArgumentException('Cannot find the specified output wire of the internal submodule.');
        }

        Connector.connect(moduleOutputWire, outputWire);

        this.outputConnectionInfos.push({
            outputWireName: outputWireName,
            moduleInstanceName: moduleInstanceName,
            moduleOutputWireName: moduleOutputWireName
        });
    }

    /**
     * 连接内部子模块之间的连线。
     * 该方法供“模块实例化工厂”使用，用于“从配置文件实例化一个模块”。
     *
     * 如果指定的线或者子模块找不到，均会抛出 IllegalArgumentException 异样。
     *
     * @param {*} previousModuleInstanceName
     * @param {*} previousModuleOutputWireName
     * @param {*} nextModuleInstanceName
     * @param {*} nextModuleInputWireName
     */
    addModuleConnection(previousModuleInstanceName, previousModuleOutputWireName,
        nextModuleInstanceName, nextModuleInputWireName) {

        let previousLogicModule = this.getLogicModule(previousModuleInstanceName);
        if (previousLogicModule === undefined) {
            throw new IllegalArgumentException('Cannot find the specified internal submodule.');
        }

        let previousModuleOutputWire = previousLogicModule.getInputWire(previousModuleOutputWireName);
        if (previousModuleOutputWire === undefined) {
            throw new IllegalArgumentException('Cannot find the specified output wire.');
        }

        let nextLogicModule = this.getLogicModule(nextModuleInstanceName);
        if (nextLogicModule === undefined) {
            throw new IllegalArgumentException('Cannot find the specified internal submodule.');
        }

        let nextModuleInputWire = nextLogicModule.getInputWire(nextModuleInputWireName);
        if (nextModuleInputWire === undefined) {
            throw new IllegalArgumentException('Cannot find the specified input wire.');
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