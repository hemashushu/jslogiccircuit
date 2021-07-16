const { ObjectUtils } = require('jsobjectutils');
const { IllegalArgumentException, NotImplementedException } = require('jsexception');

const Pin = require('./pin');
const PinDirection = require('./pindirection');

/**
 * 逻辑模块的抽象
 *
 * - 相当于 Verilog 的 module。
 * - 当需要引用其他 logic package 里的 logic module 时，不能使用 JavaScript 的
 *   require() 或者 import() 方法加载然后创建实例，而应该使用
 *   LogicModuleFactory.createModuleInstance() 方法创建实例，该方法
 *   能解决模块的依赖问题。
 */
class AbstractLogicModule {

    /**
     * 实例化逻辑模块（类）
     *
     * - 继承此类时，需要保持构造函数的签名不变。除非确实不需要 instanceParameters 和
     *   defaultParameters。
     *
     * @param {*} instanceName 模块实例的名称，只可以
     *     包含 [0-9a-zA-Z_\$] 字符，且只能以 [a-zA-Z_] 字符开头
     * @param {*} instanceParameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     * @param {*} defaultParameters 模块的默认参数（定义模块时所定义的参数）
     */
    constructor(instanceName, instanceParameters = {}, defaultParameters = {}) {
        // 模块实例名称只可以包含 [0-9a-zA-Z_\$] 字符，且只能以 [a-zA-Z_] 字符开头
        if (!/^[a-zA-Z_][\w\$]*$/.test(instanceName)) {
            throw new IllegalArgumentException(
                `Invalid module instance name "${instanceName}"`);
        }

        // 模块实例的名称
        this.name = instanceName;

        // 一个 {name:value, ...} 对象，只有实例化一个模块内部的
        // 子模块时才有这个参数。实例一个逻辑包的顶层模块时，不存在这个参数。
        // 不过有时作单元测试时，测试程序可能会构造不同的参数用于完整
        // 测试各种情况。
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

        // 所有端口当中的具有输入属性的端口集合，是 pins 的子集。
        this.inputPins = [];

        // 所有端口当中的具有输出属性的端口集合，是 pins 的子集。
        this.outputPins = [];


        // 表示输入信号有变化，需要重新计算模块的状态。
        this.inputSignalChangedFlag = false;
        // this.inputSignalChangedFlag = 0 | 0;

        // 表示重新计算后，模块的状态有变化，需要传递信号给其他模块。
        //
        // 注意，对于复杂的逻辑模块，可能会包含有子模块，每次更新状态（ModuleController.step 方法）
        // 可能需要多次循环才完成，这个 outputSignalChangedFlag 只记录了最后一次循环是否存在
        // 输出变化的情况。所以存在输出信号在中间某次循环已经传输，而最后一次循环并不需输出
        // 的情况（因为最后一次循环输出信号没变化），这时候 isOutputDataChanged 的值为 false，但对于
        // 完整的一次更新周期来说，其实（中途）有输出数据变化。因此不能通过这个
        // 标记（isOutputDataChanged）用于判断模块的输出有无变化。
        //
        // 也就是说，对于 ModuleController.step 方法完成之后，isOutputDataChanged 属性对于外部
        // 并无多少意义，跟 inputSignalChangedFlag 属性一样，都是仅供 ModuleController.step 方法所使用。
        this.outputSignalChangedFlag = false;
        // this.outputSignalChangedFlag = 0 | 0;
    }

//     get isInputSignalChanged() {
//         return this.inputSignalChangedFlag; // !== 0;
//     }
//
//     get isOutputSignalChanged() {
//         return this.outputSignalChangedFlag; // !== 0;
//     }

    /**
     * 因为所有端口的初始值都是 0，对于一些逻辑模块，其初始输出数据可能
     * 不应该是 0，比如 “非门” 的实现的初始输出值为 0，而正确的初始输出值应该为 1。
     * 对于这种情况，模块控制器（ModuleController）采用的方法是，在模拟刚开始的时候，将所有
     * 逻辑模块都标记为 “输入数据已改变” 状态，从而迫使每一个逻辑模块都
     * 重新计算自己（内部）的信号值，然后改变输出信号，最后达到稳定且正确的状态。
     */
     setInputSignalChangedFlag() {
        this.inputSignalChangedFlag = true;
        // this.inputSignalChangedFlag = 1 | 0;
    }

    getAllLogicModules() {
        return [this];
    }

    // computeInputSignalChanged() {
    //     let changed = this.inputSignalChangedFlag;
    //     for (let inputPin of this.inputPins) {
    //         changed = changed | inputPin.signalChangedFlag;
    //     }
    //     this.inputSignalChangedFlag = changed;
    // }

    /**
     * 确保子模块输入的信号是最新的值。
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
     *
     * 更新周期的第 A2 步。
     */
    resetOutputPinsSignalChangedFlag() {
        for (let outputPin of this.outputPins) {
            outputPin.resetSignalChangedFlag();
        }
    }

    /**
     *
     * 更新周期的第 A3 步。
     */
    resetOutputSignalChangedFlag() {
        this.outputSignalChangedFlag = false;
        // this.outputSignalChangedFlag = 0 | 0;
    }

    /**
     *
     * 更新周期的第 A4 步。
     */
    updateModuleState() {
        // 这里是模块的 “业务逻辑” 代码的主要所在地，
        // 需要获取输入端口的数值然后计算模块的数值。
    }

    // computeOutputSignalChanged() {
    //     let changed = this.outputSignalChangedFlag;
    //     for (let outputPin of this.outputPins) {
    //         changed = changed | outputPin.signalChangedFlag;
    //     }
    //     this.outputSignalChangedFlag = changed;
    // }

    /**
     *
     * 更新周期的第 B1 步。
     */
    resetInputPinsSignalChangedFlag() {
        for (let inputPin of this.inputPins) {
            inputPin.resetSignalChangedFlag();
        }
    }

    /**
     *
     * 更新周期的第 B2 步。
     */
    resetInputSignalChangedFlag() {
        this.inputSignalChangedFlag = false;
        // this.inputSignalChangedFlag = 0 | 0;
    }

    /**
     *
     * 更新周期的第 B3 步。
     */
    transferOutputPinSignal() {

        // 实现模块之间的信号传递，即：
        // - 上一个模块的 output pin 传到下一个模块的 input pin
        // - 子模块的 output pin 传到父模块的 output pin
        //
        // 对于父模块的 input pin 传到 子模块的 input pin，则使用
        // transferInputPinSignal() 方法实现。

        for (let outputPin of this.outputPins) {
            // if (outputPin.signalChangedFlag) {
            // 只有数据发生改变了的 output pin 才传递数据。
            outputPin.writeToNextPins();
            // }
        }
    }

    addPin(name, bitWidth, pinDirection) {
        let signalChangeEventListener;

        switch(pinDirection) {
            case PinDirection.input:
                signalChangeEventListener = (flag) => {
                    this.inputSignalChangedFlag = this.inputSignalChangedFlag || flag;
                };
                break;

            case PinDirection.output:
                signalChangeEventListener = (flag) => {
                    this.outputSignalChangedFlag = this.outputSignalChangedFlag || flag;
                };
                break;

            // case PinDirection.bidirectional:
            //     signalChangeEventListener = (flag) => {
            //         this.inputSignalChangedFlag = this.inputSignalChangedFlag || flag;
            //         this.outputSignalChangedFlag = this.outputSignalChangedFlag || flag;
            //     };
            //     break;
        }

        let pin = new Pin(name, bitWidth, pinDirection, signalChangeEventListener);
        this.pins.push(pin);

        switch(pinDirection) {
            case PinDirection.input:
                this.inputPins.push(pin);
                break;

            case PinDirection.output:
                this.outputPins.push(pin);
                break;

            // case PinDirection.bidirectional:
            //     this.inputPins.push(pin);
            //     this.outputPins.push(pin);
            //     break;
        }

        return pin;
    }

    //     /**
    //      *
    //      * @param {*} name
    //      * @param {*} bitWidth
    //      * @returns
    //      */
    //     addInputPinByDetail(name, bitWidth) {
    //         let inputPin = new Pin(name, bitWidth, PinDirection.input);
    //         this.addInputPin(inputPin);
    //         return inputPin;
    //     }
    //
    //     addInputPin(inputPin) {
    //         this.pins.push(inputPin);
    //         this.inputPins.push(inputPin);
    //
    //         // inputPin.addSignalChangeEventListener(() => {
    //         //     this.inputSignalChangedFlag = true;
    //         // });
    //     }
    //
    //     addOutputPinByDetail(name, bitWidth) {
    //         let outputPin = new Pin(name, bitWidth, PinDirection.output);
    //         this.addOutputPin(outputPin);
    //         return outputPin;
    //     }
    //
    //     addOutputPin(outputPin) {
    //         this.pins.push(outputPin);
    //         this.outputPins.push(outputPin);
    //         // outputPin.addSignalChangeEventListener(() => {
    //         //     this.outputSignalChangedFlag = true;
    //         // });
    //     }
    //
    //     addInoutPinByDetail(name, bitWidth) {
    //         let inoutPin = new Pin(name, bitWidth, PinDirection.inout);
    //         this.addInoutPin(inoutPin);
    //         return inoutPin;
    //     }
    //
    //     addInoutPin(inoutPin) {
    //         this.pins.push(inoutPin);
    //         this.inputPins.push(inoutPin);
    //         this.outputPins.push(inoutPin);
    //         // outputPin.addSignalChangeEventListener(() => {
    //         //     this.outputSignalChangedFlag = true;
    //         // });
    //     }

    /**
     * LogicModule 实现所在的包的名称
     * 名称需同时符合 npm package 命名规范
     *
     * @returns 返回名称字符串
     */
    getPackageName() {
        // 子类需要重写（override）此方法
        throw new NotImplementedException('Not implemented yet.');
    }

    /**
     * LogicModule 实现的名称
     *
     * @returns 返回名称字符串
     */
    getModuleClassName() {
        // 子类需要重写（override）此方法
        throw new NotImplementedException('Not implemented yet.');
    }

    //     /**
    //      * 通过名字获取输入端口实例对象
    //      * @param {*} name
    //      * @returns 返回 Pin 实例对象，如果找不到相应的端口，则返回 undefined.
    //      */
    //     getInputPin(name) {
    //         return this.inputPins.find(item => item.name === name);
    //     }
    //
    //     /**
    //      * 通过名字获取输出端口实例对象
    //      *
    //      * @param {*} name
    //      * @returns 返回 Pin 实例对象，如果找不到相应的端口，则返回 undefined.
    //      */
    //     getOutputPin(name) {
    //         return this.outputPins.find(item => item.name === name);
    //     }

    /**
     * 获取所有输入端口对象。
     *
     * @returns 返回 Pin 实例对象数组
     */
    getInputPins() {
        return this.inputPins;
    }

    /**
     * 获取所有输出端口对象。
     *
     * @returns 返回 Pin 实例对象数组
     */
    getOutputPins() {
        return this.outputPins;
    }

    getPins() {
        return this.pins;
    }

    /**
     * 通过名字获取端口实例对象
     *
     * @param {*} name
     * @returns 返回 Pin 实例对象，如果找不到相应的端口，则返回 undefined.
     */
    getPin(name) {
        return this.pins.find(item => item.name === name);
    }

    /**
     * LogicModule 的默认参数
     * 注意这个参数是定义模块时自带的默认配置的默认参数，并非实例参数。
     * 实例化模块时，会将实例参数跟这个默认参数合并作为最终运行时所用的参数。
     *
     * @returns 返回参数对象，{name: value,...}
     */
    getDefaultParameters() {
        return this.defaultParameters;
    }

    /**
     * 实例化当前模块时的参数
     *
     * @returns 返回参数对象，{name: value,...}
     */
    getInstanceParameters() {
        return this.instanceParameters;
    }

    /**
     * 当前实例真正使用的实际参数
     *
     * @returns 返回参数对象，{name: value,...}
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
     * @returns 返回属性值，如果指定属性名称找不到，则返回 undefined.
     */
    getParameter(name) {
        return this.parameters[name];
    }
}

module.exports = AbstractLogicModule;