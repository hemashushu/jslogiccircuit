const { SimpleLogicModule, Signal, PinDirection } = require('../../../../../../index');
const { Binary } = require('jsbinary');

/**
 * 逻辑与门
 * https://en.wikipedia.org/wiki/Logic_gate
 */
class AndGate extends SimpleLogicModule {

    // override
    init(){
        this._pinA = this.addPin('A', 1, PinDirection.input);
        this._pinB = this.addPin('B', 1, PinDirection.input)
        this._pinQ = this.addPin('Q', 1, PinDirection.output);
    }

    // override
    updateModuleState() {
        let signalA = this._pinA.getSignal();
        let signalB = this._pinB.getSignal();
        let levelA = Binary.and(signalA.getLevel(), Binary.not(signalA.getHighZ()));
        let levelB = Binary.and(signalB.getLevel(), Binary.not(signalB.getHighZ()));
        let resultLevel = Binary.and(levelA, levelB);
        let signalResult = Signal.createWithoutHighZ(1, resultLevel);
        this._pinQ.setSignal(signalResult);
    }
}


module.exports = AndGate;