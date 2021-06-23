const { Binary } = require('jsbinary');
const { IllegalArgumentException } = require('jsexception');

/**
 * 表示一个端口或者一根线的信号值
 */
class Signal {
    constructor(bitWidth) {
        if (bitWidth < 1 || bitWidth > 32) {
            throw new IllegalArgumentException('Bit width range should be from 1 to 32.');
        }

        this.bitWidth = bitWidth;

        // this._data 是一个私有成员，外部请勿直接访问该成员，
        // 可以通过 setData() 和 getData 方法访问。
        this._data = Binary.fromBinaryString('0', bitWidth);
    }

    /**
     * 设置信号值
     * @param {*} data Binary 对象。
     */
    setData(data) {
        this._data = Binary.fromBinaryObject(data);
    }

    /**
     * 读取信号值
     * @returns Binary 对象。
     */
    getData() {
        return this._data;
    }
}

module.exports = Signal;