const {Binary} = require('jsbinary');

/**
 * 抽象的逻辑单元
 *
 * 逻辑单元包括连接线、寄存器等，用于构造 Verilog 中的 logic, wire, reg 等变量。
 */
class AbstractLogicUnit {

    /**
     * 构造函数
     *
     * @param {*} name 逻辑单元的名称，相当于 Verilog 里的变量名称。
     * @param {*} dataWidth 逻辑单元的数据宽度，单位为“位”，比如
     *     一条连接线可以是只传输 1 bit 数据的线，也可以是可以同时
     *     传输 8 bit 的排线。相当于 Verilog 诸如 logic [31:0] 里面
     *     的 [31:0]。
     */
    constructor(name, dataWidth) {
        this.name = name;
        this.dataWidth = dataWidth;
        this.data = new Binary(0, dataWidth);

        // 绑定到当前逻辑单元数据变化的监听者(Lisener)。
        //
        // 监听者一般是其他逻辑单元的 input 方法，或者
        // 具有 "void input(Binary data)" 签名的方法。
        this.output = [];
    }

    /**
     * 设置当前单元的数值
     *
     * @param {*} data Binary 对象
     */
    input(data) {
        //
    }

}

AbstractLogicUnit.className = 'abstractLogicUnit';

module.exports = AbstractLogicUnit;