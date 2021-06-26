const { IllegalArgumentException } = require('jsexception');

// const LogicModuleFactory = require('./logicmodulefactory');
const ConnectionUtils = require('./connectionutils');
const AbstractLogicModule = require('./abstractlogicmodule');
const ConnectionItem = require('./connectionitem');

/**
 * 可配置的逻辑模块。
 * 用于从配置文件构建逻辑模块实例。
 *
 * 一个逻辑模块可视为由：
 * - 一个或多个其他逻辑模块（子逻辑模块） +
 * - 一个或多个输入输出端口
 * 组合而成。
 *
 */
class ConfigurableLogicModule extends AbstractLogicModule {

    /**
     * 实例化逻辑模块（类）
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} name 模块实例的名称
     * @param {*} instanceParameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     * @param {*} defaultParameters 模块的默认参数（定义模块时所定义的参数）
     */
    constructor(packageName, moduleClassName,
        name, instanceParameters, defaultParameters) {
        super(name, instanceParameters, defaultParameters);

        this.packageName = packageName;
        this.moduleClassName = moduleClassName;

        // 子逻辑模块集合
        this.logicModules = [];

        // 端口连接配置信息集合
        this.connectionItems = [];
    }

    getPackageName() {
        return this.packageName;
    }

    getModuleClassName() {
        return this.moduleClassName;
    }

    /**
     * 通过逻辑模块实例的名字获取内部子逻辑模块的实例
     *
     * @param {*} name
     * @returns 返回子模块实例，如果找不到指定实例名称，则返回 undefiend.
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
     * @param {*} moduleInstance
     */
    addLogicModule(moduleInstance) {
        this.logicModules.push(moduleInstance);
    }

    addConnectionItemByDetail(name,
        previousModuleName, previousPinName,
        nextModuleName, nextPinName) {
        let connectionItem = new ConnectionItem(name,
            previousModuleName, previousPinName,
            nextModuleName, nextPinName);
        this.addConnectionItem(connectionItem);
        return connectionItem;
    }

    /**
     * 连接模块 input pin、output pin 以及内部子模块之间的端口连接。
     *
     * 如果指定的端口或者子模块找不到，均会抛出 IllegalArgumentException 异常。
     *
     * @param {*} connectionItem
     */
    addConnectionItem(connectionItem) {
        if (connectionItem.previousModuleName === undefined ||
            connectionItem.previousModuleName === null ||
            connectionItem.previousModuleName === '') {
            // 连接模块自身的 input pin 与内部子模块的 input pin

            let moduleInputPin = this.getInputPin(connectionItem.previousPinName);
            if (moduleInputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified input pin "${connectionItem.previousPinName}" in module "${this.name}".`);
            }

            let subModule = this.getLogicModule(connectionItem.nextModuleName);
            if (subModule === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified internal module "${connectionItem.nextModuleName}" in module "${this.name}".`);
            }

            let subModuleInputPin = subModule.getInputPin(connectionItem.nextPinName);
            if (subModuleInputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified input pin "${connectionItem.nextPinName}" of the internal module "${connectionItem.nextModuleName}" in module "${this.name}".`);
            }

            // ConnectionUtils.connect(
            //     this, moduleInputPin,
            //     subModule, subModuleInputPin);
            ConnectionUtils.connect(moduleInputPin, subModuleInputPin);

        } else if (connectionItem.nextModuleName === undefined ||
            connectionItem.nextModuleName === null ||
            connectionItem.nextModuleName === '') {
            // 连接模块自身的 output pin 与内部子模块的 output pin

            let moduleOutputPin = this.getOutputPin(connectionItem.nextPinName);
            if (moduleOutputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified output pin in module "${this.name}".`);
            }

            let subModule = this.getLogicModule(connectionItem.previousModuleName);
            if (subModule === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified internal module "${connectionItem.previousModuleName}" in module "${this.name}".`);
            }

            let subModuleOutputPin = subModule.getOutputPin(connectionItem.previousPinName);
            if (subModuleOutputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified output pin "${connectionItem.previousPinName}" of the internal module "${connectionItem.previousModuleName}" in module "${this.name}".`);
            }

            // ConnectionUtils.connect(
            //     subModule, subModuleOutputPin,
            //     this, moduleOutputPin);
            ConnectionUtils.connect(subModuleOutputPin, moduleOutputPin);

        } else {
            // 连接两个子模块的 output pin 与 input pin

            let previousLogicModule = this.getLogicModule(connectionItem.previousModuleName);
            if (previousLogicModule === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified internal module "${connectionItem.previousModuleName}" in module "${this.name}".`);
            }

            let previousModuleOutputPin = previousLogicModule.getOutputPin(connectionItem.previousPinName);
            if (previousModuleOutputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified output pin "${connectionItem.previousPinName}" of the internal module "${connectionItem.previousModuleName}" in module "${this.name}".`);
            }

            let nextLogicModule = this.getLogicModule(connectionItem.nextModuleName);
            if (nextLogicModule === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified internal module "${connectionItem.nextModuleName}" in module "${this.name}".`);
            }

            let nextModuleInputPin = nextLogicModule.getInputPin(connectionItem.nextPinName);
            if (nextModuleInputPin === undefined) {
                throw new IllegalArgumentException(
                    `Cannot find the specified input pin "${connectionItem.nextPinName}" of the internal module "${connectionItem.nextModuleName}" in module "${this.name}".`);
            }

            // ConnectionUtils.connect(
            //     previousLogicModule, previousModuleOutputPin,
            //     nextLogicModule, nextModuleInputPin);
            ConnectionUtils.connect(previousModuleOutputPin, nextModuleInputPin);
        }

        this.connectionItems.push(connectionItem);
    }

    // override
    ensureInputData() {
        // 配置型逻辑模块（ConfigurableLogicModule）没有自己的业务逻辑代码，
        // input pins 的状态需要传递到下游/内部的子模块
        for (let inputPin of this.inputPins) {
            if (inputPin.isDataChanged) {
                // inputPin.writeToNextLogicModulePins();
                inputPin.writeToNextPins();
            }
        }
    }

    getAllLogicModules() {
        let allLogicModules = [];

        // 对于一个含有子模块的逻辑模块，其状态更新过程大致经历如下三个过程：
        // 1. ensureInputData
        // 2. 重新计算内部信号/数据
        // 3. writeOutputPins
        //
        // 其中第一步 ensureInputData 时，需要先让最外围的模块确保（ensure）
        // 输入端口的信号，然后让内部模块确保输入端口信号，最后让内部模块的
        // 内部模块确保输入信号，因为信号是由外部“传入”内部的。
        //
        // 到了第三步 writeOutputPins，则过程刚好相反，应该先让最内部的子模块
        // 写输出信号，然后让中间模块写输出信号，最后让最外围的本模块
        // 写输出信号（到模块的 output pins）。
        //
        // 下面的列表是按照 ensureInputData 所需的顺序组织模块的顺序，只需把这个
        // 列表倒转，就能得到 writeOutputPins 所需的顺序。

        allLogicModules.push(this);

        for (let logicModule of this.logicModules) {
            let allSubLogicModules = logicModule.getAllLogicModules();
            allLogicModules.push(...allSubLogicModules);
        }

        return allLogicModules;
    }
}

module.exports = ConfigurableLogicModule;
