const { Binary } = require('jsbinary');
const { IllegalArgumentException } = require('jsexception');

const EndOfTTLException = require('./exception/endofttlexception');

/**
 * I/O 端口
 *
 * 用于逻辑模块（logic module）的输入/输出接口，约等于 Verilog 里的 pin/logic 变量。
 *
 * 比如 "pin [7:0] led" 可以使用如下语句构造：
 * let led = new Pin('led', 8)
 */
class Pin {
    /**
     * 构造 Pin 对象实例
     *
     * @param {*} name 端口名称，相当于 Verilog 里的 pin/logic 变量的名称。
     * @param {*} bitWidth 数据的位宽度，比如：
     *     一个端口可以只传输 1 bit 数据，也可以同时传输 8 bit。
     *     相当于 Verilog 诸如 logic [7:0] 里面的 [7:0]。
     * @param {*} initialData 初始化的数据，一个 Binary 对象，可选。
     * @param {*} description 实例的描述及说明文本。可本地化。
     * @param {*} pinNumber 端口编号，一个字符串，用于烧录到硬件（比如 FPGA）时，
     *     指定（assign）端口所连接的硬件引脚编号（常见的如：A1, A2, D1, D2, E1 等等）。
     *     在模拟器里没有实际用途，仅起显示作用，如果设置了此值，一般显示在名称后面，
     *     用括号包围起来，比如："LED (A1)", "Clock (D2)"。
     */
    constructor(name, bitWidth, initialData, description, pinNumber) {
        if (bitWidth < 1 || bitWidth > 32) {
            throw new IllegalArgumentException('Bit width range should be from 1 to 32.');
        }

        this.name = name;
        this.bitWidth = bitWidth;

        // - this._data 是一个私有成员，外部请勿直接访问该成员，
        //   可以通过 setData() 和 getData 方法访问。
        // - 当一个 pin 作为模块的输入端口时，初始值必须为 0。

        if (initialData === undefined) {
            this._data = Binary.fromBinaryString('0', bitWidth);
        } else {
            if (initialData.bitWidth !== bitWidth) {
                throw new IllegalArgumentException('Initial data bit width does not match.');
            }

            this._data = Binary.fromBinaryObject(initialData);
        }

        this.description = description;
        this.pinNumber = pinNumber

        // 数据变化监听者（即 Lisener）的集合。
        // 供模块绑定当前端口的数据变化事件。
        //
        // 方法的签名为 "void function(binary_data)"
        this.dataChangeListeners = [];
    }

    /**
     * 更新当前端口的数值并传播到“数据变化监听者”
     *
     * @param {*} binaryObject Binary 对象
     */
    setData(binaryObject) {
        if (binaryObject.bitWidth !== this._data.bitWidth) {
            throw new IllegalArgumentException('Data bit width does not match.');
        }

        this._data = Binary.fromBinaryObject(binaryObject);

        // 传递当前数值给其他端口
        for (let dataChangeLisener of this.dataChangeListeners) {
            dataChangeLisener(this._data);
        }
    }

    /**
     * 更新当前端口的数值，并递减一个计数值，当计数值大于零时，方法的行为跟
     * setData 一样，当计数值为零时，抛出异常。
     * 此方法用于检测电路是否存在振荡问题（死循环问题）。
     *
     * @param {*} binaryObject
     */
    setDataWithTTL(binaryObject, ttl) {
        if (binaryObject.bitWidth !== this._data.bitWidth) {
            throw new IllegalArgumentException('Data bit width does not match.');
        }

        ttl--;

        if (ttl <= 0) {
            throw new EndOfTTLException(undefined, this.name);
        }

        this._data = Binary.fromBinaryObject(binaryObject);

        // 传递当前数值给其他端口
        for (let dataChangeLisener of this.dataChangeListeners) {
            dataChangeLisener(this._data);
        }
    }

    /**
     * 获取当前端口的数值
     *
     * @returns 返回 Binary 对象。
     */
    getData() {
        return this._data;
    }

    /**
     * 添加数据变化事件的监听者
     *
     * @param {*} func 监听者（方法），方法签名为 "void function(binary_data)"
     */
    addDataChangeListener(func) {
        if (typeof func !== 'function') {
            throw new IllegalArgumentException('The listener should be a function.');
        }

        this.dataChangeListeners.push(func);
    }
}

module.exports = Pin;