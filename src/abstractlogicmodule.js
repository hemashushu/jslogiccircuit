const { ObjectUtils } = require('jsobjectutils');
const { IllegalArgumentException, NotImplementedException } = require('jsexception');

const Pin = require('./pin');
const PinDirection = require('./pindirection');

/**
 * 逻辑模块的抽象
 *
 * - 相当于 Verilog 的 module。
 * - 当需要引用其他 logic package 里的 logic module 时，不能使用 JavaScript 的
 *   require() 或者 import() 方法加载，而应该使用
 *   LogicModuleFactory.createModuleInstance() 方法创建实例，该方法
 *   能解决模块的依赖问题。
 *
 * 注意：
 * - 当前实现会忽略线路延迟，因此不会产生冒险（Hazard）问题（不会产生毛刺）。
 * - 很多逻辑模块都会忽略高阻抗输入的情况。
 */
class AbstractLogicModule {

    /**
     * 实例化逻辑模块
     *
     * - 继承此类时，需要保持构造函数的签名不变。除非确实不需要 instanceParameters 和
     *   defaultParameters。
     *
     * @param {*} packageName
     * @param {*} moduleClassName
     * @param {*} name 模块实例的名称，只可以
     *     包含 [0-9a-zA-Z_\$] 字符，且只能以 [a-zA-Z_] 字符开头
     * @param {*} instanceParameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     * @param {*} defaultParameters 模块的默认参数（定义模块时所定义的参数）
     */
    constructor(
        packageName, moduleClassName,
        name, instanceParameters = {}, defaultParameters = {}) {

        // 模块实例名称只可以包含 [0-9a-zA-Z_\$] 字符，且只能以 [a-zA-Z_] 字符开头
        if (!/^[a-zA-Z_][\w\$]*$/.test(name)) {
            throw new IllegalArgumentException(
                `Invalid module instance name "${name}"`);
        }

        this.packageName = packageName;
        this.moduleClassName = moduleClassName;

        // 模块实例的名称
        this.name = name;

        // 一个 {name:value, ...} 对象
        // value 的数据类型有：
        // - 数字
        // - 一个数据对象
        // - 一个二进制数据（Nodejs 的 Buffer 对象）
        //
        // 一般来说只有：
        // - 实例化一个模块内部的子模块时
        // - 模块作作单元测试时
        // 才会有这个参数。

        this.instanceParameters = instanceParameters;

        // 模块的默认参数
        // 模块的默认参数是由配置文件 “logic-module.yaml” 配置的，
        // 所以需要在实例化时一起传入。
        this.defaultParameters = defaultParameters;

        // 实例实际使用的参数，由实例参数与模块（类）提供的默认参数
        // 合并而得。
        this.parameters = ObjectUtils.objectMerge(
            instanceParameters,
            defaultParameters);

        // 注意：
        // 1. instanceParameters，defaultParameters，parameters 都只读，不要往里面添加
        //    新项或者写入新值。
        // 2. 在模块内部，**不要使用（读取）** instanceParameters 和 defaultParameters，
        //    这两个成员仅用于构造 parameters，以及供实例化工厂所使用。
        //    在模块内部只能使用前两者所合并的 parameters， 或者通过 getParameter(name) 方法
        //    获取所需要的正确的参数值。

        // 所有端口的集合，包括输入端口/输出端口/双向端口
        this.pins = [];

        // 端口当中的输入端口，是 pins 的子集，用于提高检索速度。
        this.inputPins = [];

        // 端口当中的输出端口，是 pins 的子集，用于提供检索速度。
        this.outputPins = [];

        // 表示输入信号有变化，需要重新计算模块的状态。
        // 当 input pin 的信号值发生改变时，会自动更新此变量的值。
        this.inputSignalChangedFlag = false;

        // 表示重新计算后，模块的状态有变化，需要传递信号给其他模块。
        // 当 output pin 的信号值发生改变时，会自动更新此变量的值。
        this.outputSignalChangedFlag = false;

        // 复杂的逻辑模块可能会包含有子模块，每次更新模块状态（即 ModuleStateController.step 方法）
        // 可能需要多次循环才完成，这个 outputSignalChangedFlag 只记录了最后一次循环是否存在
        // 输出变化的情况。
        // 所以存在这样的情况：输出信号在中间某次循环发生改变并已经传输，而最后一次循环并没有再
        // 发生改变（也不需再输出）。
        // 这时候 outputSignalChangedFlag 的值为 false，但对于
        // 完整的一次更新周期来说，其实（中途）输出数据是有变化且有输出。因此不能通过这个
        // 标记（outputSignalChangedFlag）用于判断模块的输出有无变化。
        // inputSignalChangedFlag 标记也有相同的情况，所以这两个属性仅供 ModuleStateController.step 方法
        // 使用，对外部意义不大。
    }

    /**
     * 将 input pin 的信号传输到下一个端口。
     *
     * 更新周期的第 A1 步。
     */
    transferInputPinSignal() {
        // 当部分 input pin 数据发生改变时（input pin 的 setSignal 方法被调用），会
        // 引起本模块的 inputSignalChangedFlag 标记设置为 true。
        //
        // 对于简单的逻辑模块，比如 AND，XOR 等逻辑门模块，并不需要额外
        // 读取 input pins 的数据，因为外界已经通过 transferOutputPinSignal()
        // 方法更新了当前 input pin 的数据，在 updateModuleState()
        // 方法内部只需直接读取 input pin 的数据即可。
        //
        // 但对于多层次的逻辑模块（即模块里包含子模块），本模块的 input pins 可能
        // 直接连接到内部的子模块的 input pins，则需要将信号
        // 发生改变的 input pin 的信号传播到内部模块，否则内部模块不知道外界
        // 的信号变化。此方法用于确保内部的子模块得到最新的输入信号。
    }

    /**
     * 重置 output pin 的 signalChangedFlag
     *
     * 更新周期的第 A2 步。
     */
    resetOutputPinsSignalChangedFlag() {
        for (let outputPin of this.outputPins) {
            outputPin.resetSignalChangedFlag();
        }
    }

    /**
     * 重置 outputSignalChangedFlag。
     *
     * 更新周期的第 A3 步。
     */
    resetOutputSignalChangedFlag() {
        this.outputSignalChangedFlag = false;
    }

    /**
     * 更新模块的信号状态，这里是模块的 “业务逻辑” 代码的主要所在地。
     *
     * 更新周期的第 A4 步。
     */
    updateModuleState() {
        throw new NotImplementedException();
    }

    /**
     * 重置 input pin 的 signalChangedFlag
     *
     * 更新周期的第 B1 步。
     */
    resetInputPinsSignalChangedFlag() {
        for (let inputPin of this.inputPins) {
            inputPin.resetSignalChangedFlag();
        }
    }

    /**
     * 重置 inputSignalChangedFlag
     *
     * 更新周期的第 B2 步。
     */
    resetInputSignalChangedFlag() {
        this.inputSignalChangedFlag = false;
    }

    /**
     * 将 output pin 的信号传输到下一个端口。
     *
     * 一个 output pin 有可能连接到：
     * - 下一个模块的 input pin
     * - 父模块的 output pin
     *
     * 加上 transferInputPinSignal() 方法用于传递
     * input pin 信号到子模块的 input pin。
     *
     * 两个方法共同完成了所有连接类型的信号传递。
     *
     * 更新周期的第 B3 步。
     */
    transferOutputPinSignal() {
        for (let outputPin of this.outputPins) {
            outputPin.writeToNextPins();
        }
    }

    /**
     * 因为所有端口的初始值都是 0，对于一些逻辑模块，其初始输出数据可能
     * 不应该是 0，比如 “非门” 的实现的初始输出值为 0，而正确的初始输出值应该为 1。
     * 对于这种情况，模块控制器（ModuleStateController）采用的方法是，在模拟刚开始的时候，将所有
     * 逻辑模块都标记为 “输入数据已改变” 状态，从而迫使每一个逻辑模块都
     * 重新计算自己（内部）的信号值，然后改变输出信号，最后达到稳定且正确的状态。
     */
    setInputSignalChangedFlag() {
        this.inputSignalChangedFlag = true;
    }

    /**
     * 获取当前模块即所有子模块。
     *
     * @returns
     */
    getAllLogicModules() {
        // 对于终点模块（即没有子模块的模块），只需返回自身。
        return [this];
    }

    inputSignalChange(flag) {
        this.inputSignalChangedFlag = this.inputSignalChangedFlag || flag;
    }

    outputSignalChange(flag) {
        this.outputSignalChangedFlag = this.outputSignalChangedFlag || flag;
    }

    addPin(name, bitWidth, pinDirection) {
        // 端口数据改变事件的监听者（一个 void function(Boolean) 函数）
        let signalChangeEventListener;

        switch (pinDirection) {
            case PinDirection.input:
                signalChangeEventListener = (flag) => {
                    this.inputSignalChange(flag);
                };
                break;

            case PinDirection.output:
                signalChangeEventListener = (flag) => {
                    this.outputSignalChange(flag);
                };
                break;
        }

        let pin = new Pin(name, bitWidth, pinDirection, signalChangeEventListener);
        this.pins.push(pin);

        // inputPins 和 outputPins 是 pins 的子集，用于提高检索速度。
        switch (pinDirection) {
            case PinDirection.input:
                this.inputPins.push(pin);
                break;

            case PinDirection.output:
                this.outputPins.push(pin);
                break;
        }

        return pin;
    }

    /**
     * Logic module 所在的逻辑包的名称
     *
     * @returns 逻辑包名称字符串
     */
     getPackageName() {
        return this.packageName;
    }


    /**
     * Logic module 类的名称
     *
     * @returns 逻辑模块名称字符串
     */
    getModuleClassName() {
        return this.moduleClassName;
    }

    /**
     * 获取所有输入端口对象。
     *
     * @returns Pin 实例对象数组
     */
    getInputPins() {
        return this.inputPins;
    }

    /**
     * 获取所有输出端口对象。
     *
     * @returns Pin 实例对象数组
     */
    getOutputPins() {
        return this.outputPins;
    }

    /**
     * 获取所有端口。
     *
     * @returns
     */
    getPins() {
        return this.pins;
    }

    /**
     * 通过名字获取端口实例对象
     *
     * @param {*} name
     * @returns Pin 实例对象，如果找不到相应的端口，则返回 undefined.
     */
    getPin(name) {
        return this.pins.find(item => item.name === name);
    }

    /**
     * LogicModule 的默认参数
     * 注意这个参数是定义模块时自带的默认配置的默认参数，并非实例参数。
     * 实例化模块时，会将实例参数跟这个默认参数合并作为最终运行时所用的参数。
     *
     * @returns 参数对象，{name: value,...}
     */
    getDefaultParameters() {
        return this.defaultParameters;
    }

    /**
     * 实例化当前模块时的参数
     *
     * @returns 参数对象，{name: value,...}
     */
    getInstanceParameters() {
        return this.instanceParameters;
    }

    /**
     * 当前实例真正使用的实际参数
     *
     * @returns 参数对象，{name: value,...}
     */
    getParameters() {
        return this.parameters;
    }

    /**
     * 获取当前模块实例所使用的实际初始化参数
     *
     * 此参数由实例化时传入的参数与模块类默认参数合并而得。
     *
     * @param {*} name
     * @returns 属性值，如果指定属性名称找不到，则返回 undefined.
     */
    getParameter(name) {
        return this.parameters[name];
    }
}

module.exports = AbstractLogicModule;