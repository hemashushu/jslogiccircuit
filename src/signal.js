const { Binary } = require('jsbinary');

/**
 * 表示一个端口或者一根线的信号值
 *
 * 信号值一共有 3 种状态：
 * - 低电平 0
 * - 高电平 1
 * - 高阻抗，即（场效应管）输入端悬空的状态
 *
 * Signal 使用两个二进制数（严格来说是二进制数列、vector）来共同表示一个信号值，
 * 一个二进制数表示是否为高阻抗，另一个二进制数表示在“非高阻抗”时的值。
 *
 * 比如
 *   highZ:  0   0   1
 *   binary: 0   1   -
 *           ^   ^   ^
 *   low --- |   |   |
 *   high -------/   \-- 高阻抗，这时 binary 的值无关重要
 *
 * 简单来说，当 highZ 的值为 1 时，无视 binary 的值，结果为高阻抗；
 * 当 highZ 为 0 时，则视乎 binary，值为 0 时表示低电平，值为 1 时表示高电平。
 *
 * - 为简单起见，目前只支持数据最宽 32 位
 */
class Signal {
    constructor(bitWidth) {
        // 信号值的位宽
        // 信号值允许多位，用于简化一排端口或者一排导线的表示。
        this.bitWidth = bitWidth;

        // 信号的值，每一位的可能取值有：0 和 1
        this._binary = Binary.fromInt32(0, bitWidth); // 私有成员

        // 为每一位信号添加高阻抗状态，当某一位的 highZ 的值为 1 时，表示
        // 该位为高阻抗，此时 binary 对应位的值将被无视。
        this._highZ = Binary.fromInt32(0, bitWidth); // 私有成员
    }

    static create(bitWidth, binary, highZ) {
        let signal = new Signal(bitWidth);
        signal.setState(binary, highZ);
        return signal;
    }

    static createWithoutHighZ(bitWidth, binary) {
        let notHighZ = Binary.fromInt32(0, bitWidth);
        return Signal.create(bitWidth, binary, notHighZ);
    }

    static createHighZ(bitWidth) {
        let isHighZ = Binary.fromInt32(~0, bitWidth);
        let lowBinary = Binary.fromInt32(0, bitWidth);
        return Signal.create(bitWidth, lowBinary, isHighZ);
    }

    static createLow(bitWidth) {
        let lowBinary = Binary.fromInt32(0, bitWidth);
        return Signal.createWithoutHighZ(bitWidth, lowBinary);
    }

    static createHigh(bitWidth) {
        let highBinary = Binary.fromInt32(~0, bitWidth);
        return Signal.createWithoutHighZ(bitWidth, highBinary);
    }

    toBinaryString() {
        let str = this._binary.toBinaryString();
        let highZint32 = this._highZ.toInt32();

        if (highZint32 !== 0) {
            let length = this.bitWidth;
            let arr = Array.from(str);
            for (let idx = 0; idx < length; idx++) {
                if (highZint32 & 1 === 1) {
                    arr[length - idx - 1] = 'z'
                }
                highZint32 = highZint32 >> 1;
            }
            str = arr.join('');
        }

        return str;
    }

    /**
     * 比较两个信号，相同则返回 true。
     *
     * @param {*} leftSingal
     * @param {*} rightSignal
     * @returns
     */
    static equal(leftSingal, rightSignal) {
        // 为简单起见，目前只考虑数据最宽 32 位的情况。
        let leftV = leftSingal.getBinary().toInt32();
        let leftZ = leftSingal.getHighZ().toInt32();
        let rightV = rightSignal.getBinary().toInt32();
        let rightZ = rightSignal.getHighZ().toInt32();

        return leftZ === rightZ &&                   // 先比较高阻抗是否相同，再比较 binary 值。
            (leftV & ~leftZ) === (rightV & ~rightZ); // 将高阻抗位对应的 binary 的位视为低电平。
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