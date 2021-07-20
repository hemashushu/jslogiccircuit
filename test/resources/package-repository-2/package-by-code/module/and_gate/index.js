const { SimpleLogicModule, Signal, PinDirection } = require('../../../../../../index');
const { Binary } = require('jsbinary');

/**
 * 逻辑与门
 * https://en.wikipedia.org/wiki/Logic_gate
 */
class AndGate extends SimpleLogicModule {

    // override
    init(){
        this.pinA = this.addPin('A', 1, PinDirection.input);
        this.pinB = this.addPin('B', 1, PinDirection.input)
        this.pinQ = this.addPin('Q', 1, PinDirection.output);
    }

    // override
    updateModuleState() {
        let signal1 = this.pinA.getSignal();
        let signal2 = this.pinB.getSignal();
        let binary1 = Binary.and(signal1.getBinary(), Binary.not(signal1.getHighZ()));
        let binary2 = Binary.and(signal2.getBinary(), Binary.not(signal2.getHighZ()));
        let resultBinary = Binary.and(binary1, binary2);
        let resultSignal = Signal.createWithoutHighZ(1, resultBinary);
        this.pinQ.setSignal(resultSignal);
    }
}


module.exports = AndGate;