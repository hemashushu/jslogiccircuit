const { IllegalArgumentException } = require('jsexception');

const Signal = require('./signal');
const AbstractWire = require('./abstractwire');

/**
 * 为方便起见，导线支持多位宽（bit width）。
 * 比如一条 4 位宽的导线，可以同时传输 4 bit 信号。
 * 一条多位宽的导线可以理解为“捆绑”在一起的多条导线。
 *
 * 在概念上，一条 4 位宽的导线，跟 4 条（普通意义上的）导线是一样的。
 */
class Wire extends AbstractWire {
    constructor(bitWidth) {
        super();

        if (!(bitWidth >=1 && bitWidth <=32)) {
            throw new IllegalArgumentException('Bit width out of range.');
        }

        this.bitWidth = bitWidth;
        this._signal = new Signal(bitWidth);
    }

    setSignal(signal) {
        let { level, highZ } = signal.getState()
        this._signal.setState(level, highZ);
    }

    getSignal() {
        return this._signal;
    }
}

module.exports = Wire;