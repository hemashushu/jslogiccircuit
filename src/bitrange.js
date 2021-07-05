class BitRange {
    /**
     *
     * @param {*} bitHigh 位范围的高位
     *     比如某个 pin 的位宽为 16, 需要获取 [12:8] 范围的数据
     *     （即从第 8 位到第 12 位之间的数据，第 8 位和第 12 位皆包括），
     *     则 bitHigh 传入 12，bitLow 传入 8。
     * @param {*} bitLow 位范围的低位
     */
    constructor(bitHigh, bitLow) {
        this.bitHigh = bitHigh;
        this.bitLow = bitLow;
    }

    getBitWidth() {
        return this.bitHigh - this.bitLow + 1;
    }
}

module.exports = BitRange;