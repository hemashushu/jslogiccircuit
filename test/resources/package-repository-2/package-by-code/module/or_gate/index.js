const { SimpleLogicModule, Signal, PinDirection } = require('../../../../../../index');
const { Binary } = require('jsbinary');

/**
 * 逻辑或门
 */
class OrGate extends SimpleLogicModule {
    // override
    init() {
        this._pinA = this.addPin('A', 1, PinDirection.input);
        this._pinB = this.addPin('B', 1, PinDirection.input)
        this._pinQ = this.addPin('Q', 1, PinDirection.output);
    }

    // override
    updateModuleState() {
        let signal1 = this._pinA.getSignal();
        let signal2 = this._pinB.getSignal();
        let binary1 = Binary.and(signal1.getBinary(), Binary.not(signal1.getHighZ()));
        let binary2 = Binary.and(signal2.getBinary(), Binary.not(signal2.getHighZ()));
        let resultBinary = Binary.or(binary1, binary2);
        let resultSignal = Signal.createWithoutHighZ(1, resultBinary);
        this._pinQ.setSignal(resultSignal);
    }
}


module.exports = OrGate;