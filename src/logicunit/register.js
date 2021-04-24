const {Binary} = require('jsbinary');

const AbstractLogicUnit = require('../abstractlogicunit');

/**
 * 寄存器
 *
 * 用于寄存一个数值，相当于 Verilog 里的 reg 变量。
 *
 * 比如 `reg [7:0] rs` 可以使用如下语句构造：
 * let rs = new Wire('rs', 8)
 */
class Register extends AbstractLogicUnit {

    constructor(name, dataWidth) {
        super(name, dataWidth);

        // 用于临时存放上一个逻辑单元传递过来的数值，当
        // 时钟信号到来时，再把临时数值更新到当前逻辑单元。
        this.tempData = new Binary(0, dataWidth);
    }

    // override
    input(data) {
        this.tempData.update(data);
    }

    /**
     * 时钟触发信号到来。
     */
    pulse() {
        this.data.update(this.tempData);
        this._transit();
    }

    _transit() {
        // 传递当前数值给已连接的其他单元
        for(let lisener of this.output) {
            lisener(data);
        }
    }
}

Register.className = 'register';

module.exports = Register;