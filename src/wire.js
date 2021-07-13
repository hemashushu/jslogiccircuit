const { Binary } = require('jsbinary');

const Signal = require('./signal');
const AbstractWire = require('./abstractwire');

/**
 * - 为简化起见，当前的 Wire 忽略信号的高阻抗状态，只支持
 *   高电平和低电平。
 */
class Wire extends AbstractWire {
    constructor(bitWidth) {
        super();

        this.bitWidth = bitWidth;
        this._signal = new Signal(bitWidth);
    }

    setSignal(signal) {
        let { binary, highZ } = signal.getState()
        this._signal.setState(binary, highZ);
    }

    getSignal() {
        return this._signal;
    }
}

module.exports = Wire;