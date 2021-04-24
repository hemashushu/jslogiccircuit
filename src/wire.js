/**
 * 连接线
 *
 * 用于逻辑模块的输入/输出接口，约等于 Verilog 里的 wire 变量。
 *
 * 比如 `wire [7:0] led` 可以使用如下语句构造：
 * let led = new Wire('led', 8)
 */
class Wire extends AbstractLogicUnit {
    constructor(name, dataWidth) {
        super(name, dataWidth);
    }

    // override
    input(data) {
        // 更新当前单元的数值
        this.data.update(data);

        this._transit();
    }

    _transit() {
        // 传递当前数值给已连接的其他单元
        for(let lisener of this.output) {
            lisener(this.data);
        }
    }
}

Wire.className = 'wire';

module.exports = Wire;