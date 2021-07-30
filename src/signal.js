const { IllegalArgumentException } = require('jsexception');
const { Binary } = require('jsbinary');

/**
 * 表示一个端口或者一根线的信号值
 *
 * 信号值一共有 3 种状态：
 * - 低电平 0
 * - 高电平 1
 * - 高阻抗，即输入端悬空的状态
 *
 * Signal 使用两个二进制数（严格来说是二进制数列、vector）来共同表示一个信号值，
 * 一个二进制数表示是否为高阻抗，另一个二进制数表示在“非高阻抗”时的电平。
 *
 * Signal: {highZ: Binary, level: Binary}
 *
 * 规则：
 * - 当 highZ 的值为 1 时，无视 level 的值，结果为高阻抗；
 * - 当 highZ 为 0 时，则视乎 level 的值：
 *   + 值为 0 时表示低电平
 *   + 值为 1 时表示高电平。
 *
 * 示例：
 *   highZ:  0   0   1
 *   level:  0   1   -
 *           ^   ^   ^
 *   low --- |   |   |
 *   high -------/   \-- 高阻抗，这时 level 的值无关重要
 *
 * 为方便起见，一个 Signal 对象可以包含多位（bit）信号。不过
 * 目前只支持最多 32 位。
 */
class Signal {
    constructor(bitWidth) {
        if (!(bitWidth >=1 && bitWidth <=32)) {
            throw new IllegalArgumentException('Bit width out of range.');
        }

        // 信号值的位宽
        // 信号值允许多位，用于简化一排端口或者一排导线的表示。
        this.bitWidth = bitWidth;

        // 信号的值，每一位的可能取值有：0 和 1
        this._level = Binary.fromInt32(0, bitWidth); // 私有成员

        // 为每一位信号添加高阻抗状态，当某一位的 highZ 的值为 1 时，表示
        // 该位为高阻抗，此时 level 对应位的值将被无视。
        this._highZ = Binary.fromInt32(0, bitWidth); // 私有成员
    }

    static create(bitWidth, level, highZ) {
        let signal = new Signal(bitWidth);
        signal.setState(level, highZ);
        return signal;
    }

    static createWithoutHighZ(bitWidth, level) {
        let notHighZ = Binary.fromInt32(0, bitWidth);
        return Signal.create(bitWidth, level, notHighZ);
    }

    static createHighZ(bitWidth) {
        let isHighZ = Binary.fromInt32(~0, bitWidth);
        let levelLow = Binary.fromInt32(0, bitWidth);
        return Signal.create(bitWidth, levelLow, isHighZ);
    }

    static createLow(bitWidth) {
        let levelLow = Binary.fromInt32(0, bitWidth);
        return Signal.createWithoutHighZ(bitWidth, levelLow);
    }

    static createHigh(bitWidth) {
        let levelHigh = Binary.fromInt32(~0, bitWidth);
        return Signal.createWithoutHighZ(bitWidth, levelHigh);
    }

    toBinaryString() {
        let levelString = this._level.toBinaryString();
        let highZint32 = this._highZ.toInt32();

        if (highZint32 !== 0) {
            let length = this.bitWidth;
            // 遍历 highZ 的每一数位的值，如果某数位的值为 1,
            // 则将 levelString 字符串相应位置的字符替换为 'z'。
            let levelChars = Array.from(levelString);
            for (let idx = 0; idx < length; idx++) {
                // 每次只检查最低一位
                if (highZint32 & 1 === 1) {
                    levelChars[length - idx - 1] = 'z'
                }

                // 每次检查完就右移一位
                highZint32 = highZint32 >> 1;
            }

            // 重新将 levelString 字符组合
            levelString = levelChars.join('');
        }

        return levelString;
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
        let leftLevelInt32 = leftSingal.getLevel().toInt32();
        let leftHighZInt32 = leftSingal.getHighZ().toInt32();
        let rightLevelInt32 = rightSignal.getLevel().toInt32();
        let rightHighZInt32 = rightSignal.getHighZ().toInt32();

        return leftHighZInt32 === rightHighZInt32 &&                   // 先比较高阻抗是否相同，再比较 level 值。
            (leftLevelInt32 & ~leftHighZInt32) === (rightLevelInt32 & ~rightHighZInt32); // 将高阻抗位对应的 level 的位视为低电平。
    }

    /**
     * 设置信号值
     * @param {*} level Binary 对象。
     * @param {*} highZ Binary 对象。
     */
    setState(level, highZ) {
        this._level = Binary.fromBinaryObject(level);
        this._highZ = Binary.fromBinaryObject(highZ);
    }

    /**
     * 读取信号值
     * @returns {level: Binary, highZ: Binary}
     */
    getState() {
        return {
            level: this._level,
            highZ: this._highZ
        };
    }

    getLevel() {
        return this._level;
    }

    getHighZ() {
        return this._highZ;
    }
}

module.exports = Signal;