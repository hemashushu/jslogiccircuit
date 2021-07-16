const { AbstractLogicModule, Signal } = require('../../../../../../index');
const { Binary } = require('jsbinary');

/**
 * 逻辑与门
 */
class AndGate extends AbstractLogicModule {

    constructor(name) {
        super(name);

        this.addInputPinByDetail('A', 1)
        this.addInputPinByDetail('B', 1)
        this.addOutputPinByDetail('Q', 1);
    }

    getPackageName() {
        return 'package-by-code'; // 同目录名
    }

    getModuleClassName() {
        return 'and_gate'; // 同目录名
    }

    // override
    updateModuleStateAndOutputPinsSignal() {
        let signal1 = this.inputPins[0].getSignal();
        let siangl2 = this.inputPins[1].getSignal();
        let resultBinary = Binary.and(signal1.getBinary(), siangl2.getBinary());
        let resultSignal = Signal.createWithoutHighZ(1, resultBinary);
        this.outputPins[0].setSignal(resultSignal);
    }
}


module.exports = AndGate;