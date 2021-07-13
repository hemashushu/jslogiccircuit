const { Binary } = require('jsbinary');
const { IllegalArgumentException } = require('jsexception');

/**
 * 表示一个端口或者一根线的信号值
 *
 * 信号值一共有 3 种状态：
 * - 低电平 0
 * - 高电平 1
 * - 高阻抗，即（场效应管）输入端悬空的状态
 */
class Signal {
    constructor(bitWidth) {
        if (bitWidth < 1 || bitWidth > 32) {
            throw new IllegalArgumentException('Bit width range should be from 1 to 32.');
        }

        // 信号值的位宽
        // 信号值允许多位，用于简化一排端口或者一排导线的表示。
        this.bitWidth = bitWidth;

        // 信号的值，每一位的可能取值有：0 和 1
        this._binary = Binary.fromBinaryString('0', bitWidth); // 私有成员

        // 为每一位信号添加高阻抗状态，当某一位的 highZ 的值为 1 时，表示
        // 该位为高阻抗。
        this._highZ = Binary.fromBinaryString('0', bitWidth); // 私有成员
    }

    static create(bitWidth, binary, highZ) {
        let signal = new Signal(bitWidth);
        signal.setState(binary, highZ);
        return signal;
    }

    static createWithoutHighZ(bitWidth, binary) {
        let noHighZ = Binary.fromBinaryString('0', bitWidth);
        return Signal.create(bitWidth, binary, noHighZ);
    }

    static equal(leftSingal, rightSignal) {
        return (
            Binary.equal(leftSingal.getBinary(), rightSignal.getBinary()) &&
            Binary.equal(leftSingal.getHighZ(), rightSignal.getHighZ()));
    }

    /**
     * 设置信号值
     * @param {*} binary Binary 对象。
     * @param {*} highZ
     */
    setState(binary, highZ) {
        this._binary = Binary.fromBinaryObject(binary);
        this._highZ = Binary.fromBinaryObject(highZ);
    }

    /**
     * 读取信号值
     * @returns {binary: Binary, highZ: Binary}
     */
    getState() {
        return {
            binary: this._binary,
            highZ: this._highZ
        };
    }

    getBinary() {
        return this._binary;
    }

    getHighZ() {
        return this._highZ;
    }
}

module.exports = Signal;