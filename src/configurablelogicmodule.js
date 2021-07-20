const { IllegalArgumentException } = require('jsexception');

const LogicCircuitException = require('./exception/logiccircuitexception');
const ConnectionUtils = require('./connectionutils');
const AbstractLogicModule = require('./abstractlogicmodule');
const ConnectionItem = require('./connectionitem');

/**
 * 可配置的逻辑模块。
 * 用于从配置文件构建逻辑模块实例。
 *
 * 一个逻辑模块可视为由如下 2 部分组成：
 * - 一个或多个其他逻辑模块（子逻辑模块）
 * - 一个或多个输入输出端口
 *
 */
class ConfigurableLogicModule extends AbstractLogicModule {

    /**
     * 实例化逻辑模块
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} name 模块实例的名称
     * @param {*} instanceParameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     * @param {*} defaultParameters 模块的默认参数（定义模块时所定义的参数）
     */
    constructor(packageName, moduleClassName,
        name, instanceParameters, defaultParameters) {
        super(packageName, moduleClassName, name, instanceParameters, defaultParameters);

        // 子逻辑模块集合
        this.logicModules = [];

        // 端口连接配置信息集合
        this.connectionItems = [];
    }

    /**
     * 通过逻辑模块实例的名字获取内部子逻辑模块的实例
     *
     * @param {*} name
     * @returns 子模块实例，如果找不到指定实例名称，则返回 undefiend.
     */
    getLogicModule(name) {
        return this.logicModules.find(item => item.name === name);
    }

    getConnectionItem(name) {
        return this.connectionItems.find(item => item.name === name);
    }

    /**
     * 获取所有子逻辑模块实例
     *
     * @returns 模块实例数组
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
     * @param {*} moduleInstance
     */
    addLogicModule(moduleInstance) {
        this.logicModules.push(moduleInstance);
    }

    /**
     *
     * 连接模块 input pin、output pin 以及内部子模块之间的端口连接。
     * 如果指定的端口或者子模块找不到，均会抛出 IllegalArgumentException 异常。
     *
     * @param {*} name
     * @param {*} previousModuleName
     * @param {*} previousPinName
     * @param {*} nextModuleName
     * @param {*} nextPinName
     * @returns
     */
    addConnection(name,
        previousModuleName, previousPinName,
        nextModuleName, nextPinName) {

        // 导线的连接一共有以下 3 种情况。
        if (previousModuleName === undefined ||
            previousModuleName === null ||
            previousModuleName === '') {
            // 连接模块自身的 input pin 到内部子模块的 input pin

            let moduleInputPin = this.getPin(previousPinName);
            if (moduleInputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified input pin "${previousPinName}" in module "${this.name}".`);
            }

            let subModule = this.getLogicModule(nextModuleName);
            if (subModule === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified internal module "${nextModuleName}" in module "${this.name}".`);
            }

            let subModuleInputPin = subModule.getPin(nextPinName);
            if (subModuleInputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified input pin "${nextPinName}" of the internal module "${nextModuleName}" in module "${this.name}".`);
            }

            ConnectionUtils.connect(this, moduleInputPin, subModule, subModuleInputPin);

        } else if (nextModuleName === undefined ||
            nextModuleName === null ||
            nextModuleName === '') {
            // 连接内部子模块的 output pin 到模块自身的 output pin

            let moduleOutputPin = this.getPin(nextPinName);
            if (moduleOutputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified output pin in module "${this.name}".`);
            }

            let subModule = this.getLogicModule(previousModuleName);
            if (subModule === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified internal module "${previousModuleName}" in module "${this.name}".`);
            }

            let subModuleOutputPin = subModule.getPin(previousPinName);
            if (subModuleOutputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified output pin "${previousPinName}" of the internal module "${previousModuleName}" in module "${this.name}".`);
            }

            ConnectionUtils.connect(subModule, subModuleOutputPin, this, moduleOutputPin);

        } else {
            // 连接一个子模块的 output pin 到另一个子模块的 input pin

            let previousLogicModule = this.getLogicModule(previousModuleName);
            if (previousLogicModule === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified internal module "${previousModuleName}" in module "${this.name}".`);
            }

            let previousModuleOutputPin = previousLogicModule.getPin(previousPinName);
            if (previousModuleOutputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified output pin "${previousPinName}" of the internal module "${previousModuleName}" in module "${this.name}".`);
            }

            let nextLogicModule = this.getLogicModule(nextModuleName);
            if (nextLogicModule === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified internal module "${nextModuleName}" in module "${this.name}".`);
            }

            let nextModuleInputPin = nextLogicModule.getPin(nextPinName);
            if (nextModuleInputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified input pin "${nextPinName}" of the internal module "${nextModuleName}" in module "${this.name}".`);
            }

            ConnectionUtils.connect(
                previousLogicModule, previousModuleOutputPin,
                nextLogicModule, nextModuleInputPin);
        }

        let connectionItem = new ConnectionItem(name,
            previousModuleName, previousPinName,
            nextModuleName, nextPinName);

        this.connectionItems.push(connectionItem);
        return connectionItem;
    }

    // override
    transferInputPinSignal() {
        // 将 input pins 的信号传递到内部的子模块
        for (let inputPin of this.inputPins) {
            if (inputPin.signalChangedFlag) {
                inputPin.writeToNextPins();
            }
        }
    }

    // override
    updateModuleState() {
        // 配置型逻辑模块（ConfigurableLogicModule）没有自己的业务逻辑代码。
        // 子模块的终点模块的 updateModuleState() 会由 ModuleController.step() 方法
        // 所调用，所以这里不用做任何事。
    }

    getAllLogicModules() {
        let allLogicModules = [];

        // 对于一个含有子模块的逻辑模块，其信号的更新过程大致经历如下三个过程：
        // 1. transferInputPinSignal
        // 2. 重新计算内部状态/信号
        // 3. transferOutputPinSignal
        //
        // 其中第一步 transferInputPinSignal，是从最外围的模块 “传入” 最内部的。
        // 到了第三步 transferOutputPinSignal，则过程刚好相反，应该先让最内部的子模块
        // 输出信号，然后让中间模块输出信号，最后让最外围（本模块）
        // 输出信号（到本模块的 output pins）。
        //
        // 下面的列表是按照 transferInputPinSignal 所需的顺序组织模块的顺序，
        // 把这个列表倒转即得到满足 transferOutputPinSignal 所需的顺序。

        allLogicModules.push(this);

        for (let logicModule of this.logicModules) {
            let allSubLogicModules = logicModule.getAllLogicModules();
            allLogicModules.push(...allSubLogicModules);
        }

        return allLogicModules;
    }
}

module.exports = ConfigurableLogicModule;
