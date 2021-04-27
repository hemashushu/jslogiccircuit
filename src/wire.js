const { Binary } = require('jsbinary');

const Connector = require('./connector');
const LogicCircuitException = require('./logiccircuitexception');

/**
 * 连接线
 *
 * 用于逻辑模块的输入/输出接口，约等于 Verilog 里的 wire/logic 变量。
 *
 * 比如 "wire [7:0] led" 可以使用如下语句构造：
 * let led = new Wire('led', 8)
 */
class Wire {
    /**
     * 构造函数
     *
     * @param {*} name 连接线实例的名称，相当于 Verilog 里的 wire 变量的名称。
     * @param {*} dataWidth 连接线的数据宽度，单位为“位”，比如
     *     一条连接线可以只传输 1 bit 数据，也可以同时传输 8 bit。
     *     相当于 Verilog 诸如 logic [31:0] 里面的 [31:0]。
     */
    constructor(name, dataWidth) {
        if (dataWidth <0 || dataWidth>32) {
            throw new LogicCircuitException('Data width exceeds.');
        }

        this.name = name;
        this.dataWidth = dataWidth;
        this.data = new Binary(0, dataWidth);

        // 数据变化监听者（即 Lisener）的集合。
        // 供其他连接线绑定当前连接线数据变化的事件。
        //
        // 方法的签名为 "void func(Binary data)"
        this.listeners = [];
    }

    /**
     * 更新当前单元的数值
     * @param {*} data Binary 对象
     */
    setData(data) {
        // 为了提高效率，这里未对 'data' 进行有效性检测，调用者需要确定
        // 'data' 为 Binary 对象，同时它的数据宽度 dataWidth 必须
        // 跟当前连接线的数据宽度一致。
        this.data.update(data);
        this._transit();
    }

    /**
     * 传递当前数值给其他连接线
     */
    _transit() {
        for (let lisener of this.listeners) {
            lisener(this.data);
        }
    }

    /**
     * 添加数据变化监听者
     *
     * @param {*} func
     */
    addListener(func) {
        if (typeof func !== 'function') {
            throw new LogicCircuitException('Listener should be a function.');
        }

        this.listeners.push(func);
    }

    /**
     * 连接到上一个连线
     *
     * @param {*} previousWire
     */
    connect(previousWire) {
        Connector.connect(previousWire, this);
    }
}

Wire.className = 'wire';

module.exports = Wire;