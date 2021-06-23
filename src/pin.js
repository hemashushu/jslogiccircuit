const ObservableSignal = require('./observablesignal');

/**
 * 逻辑模块的 I/O 端口
 *
 * - 约等于 Verilog 里的 wire/reg/logic 变量。
 * - 所有端口的初始值都是 0，对于一些逻辑模块，其初始输出数据可能
 *   不应该是 0，比如 “非门”，默认输入值为 0，则正确的默认输出值应该为 1。
 *   对于这种情况，模拟控制器采用的方法是，在模拟刚开始的时候，将所有
 *   逻辑模块都标记为 “输入数据已改变” 状态，从而迫使每一个逻辑模块都
 *   重新计算自己（内部）的值，然后改变输出数据，最后达到稳定且正确的状态。
 *
 */
class Pin extends ObservableSignal {

    /**
     * 构造 Pin 对象实例
     *
     * @param {*} name 端口名称，相当于 Verilog 里的 wire/reg/logic 变量的名称。
     * @param {*} bitWidth 数据的位宽度，比如：
     *     一个端口可以只传输 1 bit 数据，也可以同时传输 8 bit。
     *     相当于 Verilog 诸如 wire/reg/logic [7:0] 里面的 [7:0]。
     * @param {*} description 实例的描述及说明文本。可本地化。
     * @param {*} pinNumber 端口编号，一个字符串，用于烧录到硬件（比如 FPGA）时，
     *     指定（assign）端口所连接的硬件引脚编号（常见的如：A1, A2, D1, D2, E1 等等）。
     *     在模拟器里没有实际用途，仅起显示作用，如果设置了此值，一般显示在名称后面，
     *     用括号包围起来，比如："LED (A1)", "Clock (D2)"。
     */
    constructor(name, bitWidth, description, pinNumber) {
        super(bitWidth);

        this.name = name;
        this.description = description;
        this.pinNumber = pinNumber;

        // 对上游端口的引用。
        this.previousLogicModulePin = undefined;

        // 下游端口的集合。
        this.nextLogicModulePins = [];

        // - 对于一个最小的逻辑模块，比如一个逻辑门，
        //   它的输入端口只有 previousLogicModulePin，而没有
        //   nextLogicModulePins。
        //   它的输出端口只有 nextLogicModulePins，而没有
        //   previousLogicModulePin。
        // - 对于一个普通的逻辑模块，它可能会由多个子逻辑模块和
        //   多个输入输出端口组成，对于这种逻辑模块，其输入输出端口
        //   都有既有 previousLogicModulePin，也有 nextLogicModulePins。
    }

    setPreviousLogicModulePin(logicModulePin) {
        this.previousLogicModulePin = logicModulePin;
    }

    readFromPreviousLogicModulePin() {
        if (this.previousLogicModulePin === undefined) {
            return;
        }
        let previousPin = this.previousLogicModulePin.pin;
        let data = previousPin.getData();
        this.setData(data);
    }

    addNextLogicModulePin(logicModulePin) {
        this.nextLogicModulePins.push(logicModulePin);
    }

    writeToNextLogicModulePins() {
        let data = this.getData();

        for (let nextLogicModulePin of this.nextLogicModulePins) {
            let pin = nextLogicModulePin.pin;
            pin.setData(data);
        }
    }

}

module.exports = Pin;