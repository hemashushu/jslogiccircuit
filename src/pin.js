const LogicCircuitException = require('./exception/logiccircuitexception');
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
     * Pin 还能添加描述文本，支持本地化，文本内容在模块的 logic-module.yaml 里配置。
     *
     * @param {*} name 端口名称，相当于 Verilog 里的 wire/reg/logic 变量的名称。
     *     端口名称名称只可以包含 [0-9a-zA-Z_\$] 字符，且只能以 [a-zA-Z_] 字符开头
     * @param {*} bitWidth 数据的位宽度，比如：
     *     一个端口可以只传输 1 bit 数据，也可以同时传输 8 bit。
     *     相当于 Verilog 诸如 wire/reg/logic [7:0] 里面的 [7:0]。
     * @param {*} pinNumber 端口编号，一个字符串，用于烧录到硬件（比如 FPGA）时，
     *     指定（assign）端口所连接的硬件引脚编号（常见的如：A1, A2, D1, D2, E1 等等）。
     *     在模拟器里没有实际用途，仅起显示作用，如果设置了此值，一般显示在名称后面，
     *     用括号包围起来，比如："LED (A1)", "Clock (D2)"。
     */
    constructor(name, bitWidth, pinNumber) {
        super(bitWidth);

        // 端口名称名称只可以包含 [0-9a-zA-Z_\$] 字符，且只能以 [a-zA-Z_] 字符开头
        if (!/^[a-zA-Z_][\w\$]*$/.test(name)) {
            throw new LogicCircuitException(
                `Invalid logic module class name "${name}".`);
        }

        this.name = name;
        this.pinNumber = pinNumber;

        // 下游端口的集合。
        this.nextPins = [];
    }

    addNextPin(pin) {
        this.nextPins.push(pin);
    }

    writeToNextPins() {
        let data = this.getData();

        for (let nextPin of this.nextPins) {
            nextPin.setData(data);
        }
    }

}

module.exports = Pin;