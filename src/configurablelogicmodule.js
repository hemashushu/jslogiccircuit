const { IllegalArgumentException } = require('jsexception');

const LogicModuleFactory = require('./logicmodulefactory');
const ConnectionUtils = require('./connectionutils');
const AbstractLogicModule = require('./abstractlogicmodule');

/**
 * 可配置的逻辑模块
 *
 * 用于从配置文件构建逻辑模块实例。
 * 一个逻辑模块可视为由：“一个或多个其他逻辑” + “一个或多个输入输出端口” 组合而成。
 *
 * 实例的属性：
 * - instanceName（继承）
 * - inputPins（继承）
 * - outputPins（继承）
 * - instanceParameters（继承）
 * - defaultParameters（继承）
 * - parameters（继承）
 *
 * - logicModules
 * - connectionItems
 *
 */
class ConfigurableLogicModule extends AbstractLogicModule {

    /**
     * 实例化逻辑模块（类）
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} instanceName 模块实例的名称
     * @param {*} instanceParameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     * @param {*} defaultParameters 模块的默认参数（定义模块时所定义的参数）
     */
    constructor(packageName, moduleClassName, instanceName, instanceParameters, defaultParameters) {
        super(instanceName, instanceParameters, defaultParameters);

        this.packageName = packageName;
        this.moduleClassName = moduleClassName;

        this.logicModules = [];
        this.connectionItems = [];
    }

    getPackageName() {
        return this.packageName;
    }

    getModuleClassName() {
        return this.moduleClassName;
    }

    /**
     * 通过名字获取内部子逻辑模块的实例
     * @param {*} instanceName
     * @returns 返回子模块实例，如果找不到指定实例名称，则返回 undefiend.
     */
    getLogicModule(instanceName) {
        return this.logicModules.find(item => item.name === instanceName);
    }

    getConnectionItem(name) {
        return this.connectionItems.find(item => item.name === name);
    }

    /**
     * 获取所有子逻辑模块实例
     *
     * @returns 返回模块实例数组
     */
    getLogicModules() {
        return this.logicModules;
    }

    getConnectionItems() {
        return this.connectionItems;
    }

    /**
     * 添加内部（子）逻辑模块
     *
     * 如果找不到指定的模块，则抛出 IllegalArgumentException 异常。
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} instanceName
     * @param {*} instanceParameters
     * @returns 返回子模块实例。
     */
     _addLogicModule(packageName, moduleClassName, instanceName, instanceParameters) {
        let moduleInstance = LogicModuleFactory.createModuleInstance(
            packageName, moduleClassName, instanceName, instanceParameters, this.parameters);

        this.logicModules.push(moduleInstance);
    }

    /**
     * 连接模块 input pin、output pin 以及内部子模块之间的端口连接。
     *
     * 如果指定的端口或者子模块找不到，均会抛出 IllegalArgumentException 异常。
     *
     * @param {*} connectionItem
     */
    _addConnectionItem(connectionItem) {
        if (connectionItem.previousModuleName === undefined ||
            connectionItem.previousModuleName === null ||
            connectionItem.previousModuleName === '') {
            // 连接模块的 input pin 与内部子模块的 input pin

            let moduleInputPin = this.getInputPin(connectionItem.previousPinName);
            if (moduleInputPin === undefined) {
                throw new IllegalArgumentException('Cannot find the specified input pin.');
            }

            let subModule = this.getLogicModule(connectionItem.nextModuleName);
            if (subModule === undefined) {
                throw new IllegalArgumentException('Cannot find the specified internal module.');
            }

            let subModuleInputPin = subModule.getInputPin(connectionItem.nextPinName);
            if (subModuleInputPin === undefined) {
                throw new IllegalArgumentException('Cannot find the specified input pin of the internal module.');
            }

            ConnectionUtils.connect(moduleInputPin, subModuleInputPin);

        }else if(connectionItem.nextModuleName === undefined ||
            connectionItem.nextModuleName === null ||
            connectionItem.nextModuleName === '') {
            // 连接模块的 output pin 与内部子模块的 output pin

            let moduleOutputPin = this.getOutputPin(connectionItem.nextPinName);
            if (moduleOutputPin === undefined) {
                throw new IllegalArgumentException('Cannot find the specified output pin.');
            }

            let subModule = this.getLogicModule(connectionItem.previousModuleName);
            if (subModule === undefined) {
                throw new IllegalArgumentException('Cannot find the specified internal module.');
            }

            let subModuleOutputPin = subModule.getOutputPin(connectionItem.previousPinName);
            if (subModuleOutputPin === undefined) {
                throw new IllegalArgumentException('Cannot find the specified output pin of the internal module.');
            }

            ConnectionUtils.connect(subModuleOutputPin, moduleOutputPin);

        } else {
            // 连接两个子模块的 output pin 与 input pin

            let previousLogicModule = this.getLogicModule(connectionItem.previousModuleName);
            if (previousLogicModule === undefined) {
                throw new IllegalArgumentException('Cannot find the specified internal module.');
            }

            let previousModuleOutputPin = previousLogicModule.getInputPin(connectionItem.previousPinName);
            if (previousModuleOutputPin === undefined) {
                throw new IllegalArgumentException('Cannot find the specified output pin of the internal module.');
            }

            let nextLogicModule = this.getLogicModule(connectionItem.nextModuleName);
            if (nextLogicModule === undefined) {
                throw new IllegalArgumentException('Cannot find the specified internal module.');
            }

            let nextModuleInputPin = nextLogicModule.getInputPin(connectionItem.nextPinName);
            if (nextModuleInputPin === undefined) {
                throw new IllegalArgumentException('Cannot find the specified input pin of the internal module.');
            }

            ConnectionUtils.connect(previousModuleOutputPin, nextModuleInputPin);
        }

        this.connectionItems.push(connectionItem);
    }

}

module.exports = ConfigurableLogicModule;
