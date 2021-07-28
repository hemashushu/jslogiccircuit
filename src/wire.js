const { IllegalArgumentException } = require('jsexception');

const Signal = require('./signal');
const AbstractWire = require('./abstractwire');

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