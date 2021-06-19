const { Binary } = require('jsbinary');
const { IllegalArgumentException } = require('jsexception');

const Connector = require('./connector');

/**
 * 连接线
 *
 * 用于逻辑模块（logic module）的输入/输出接口，约等于 Verilog 里的 wire/logic 变量。
 *
 * 比如 "wire [7:0] led" 可以使用如下语句构造：
 * let led = new Wire('led', 8)
 */
class Wire {
    /**
     * 构造函数
     *
     * @param {*} name 连接线实例的名称，相当于 Verilog 里的 wire 变量的名称。
     * @param {*} bitWidth 连接线的位宽度，比如
     *     一条连接线可以只传输 1 bit 数据，也可以同时传输 8 bit。
     *     相当于 Verilog 诸如 logic [7:0] 里面的 [7:0]。
     */
    constructor(name, bitWidth) {
        if (bitWidth < 1 || bitWidth > 32) {
            throw new IllegalArgumentException('Bit width should be from 1 to 32.');
        }

        this.name = name;
        this.bitWidth = bitWidth;
        this.data = new Binary(0, bitWidth);

        // 数据变化监听者（即 Lisener）的集合。
        // 供其他连接线绑定当前连接线数据变化的事件。
        //
        // 方法的签名为 "void function(binary_data)"
        this.listeners = [];
    }

    /**
     * 更新当前单元的数值
     * @param {*} data Binary 对象
     */
    setData(data) {
        // 为了提高效率，这里未对 'data' 进行有效性检测，调用者需要确定
        // 'data' 为 Binary 对象，同时它的位宽 bitWidth 必须
        // 跟当前连接线的位宽一致。
        this.data.update(data);

        // 传递当前数值给其他连接线
        for (let lisener of this.listeners) {
            lisener(this.data);
        }
    }

    /**
     * 添加数据变化事件的监听者
     *
     * @param {*} func 监听者（方法），方法签名为 "void function(binary_data)"
     */
    addListener(func) {
        if (typeof func !== 'function') {
            throw new IllegalArgumentException('The listener should be a function.');
        }

        this.listeners.push(func);
    }

    /**
     * 连接到上 1 个连接线
     *
     * 1 条连接线只能连接 1 条上游连接线，但可以同时被多条下游线连接。
     *
     * @param {*} previousWire
     */
    connect(previousWire) {
        Connector.connect(previousWire, this);
    }
}

module.exports = Wire;