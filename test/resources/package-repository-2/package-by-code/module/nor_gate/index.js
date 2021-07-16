const { AbstractLogicModule, Signal } = require('../../../../../../index');
const { Binary } = require('jsbinary');

/**
 * 逻辑或非门
 */
class NorGate extends AbstractLogicModule {

    constructor(name) {
        super(name);

        this.addInputPinByDetail('A', 1);
        this.addInputPinByDetail('B', 1);
        this.addOutputPinByDetail('Q', 1);
    }

    getPackageName() {
        return 'package-by-code'; // 同目录名
    }

    getModuleClassName() {
        return 'nor_gate'; // 同目录名
    }

    // override
    updateModuleStateAndOutputPinsSignal() {
        let signal1 = this.inputPins[0].getSignal();
        let siangl2 = this.inputPins[1].getSignal();
        let resultBinary = Binary.nor(signal1.getBinary(), siangl2.getBinary());
        let resultSignal = Signal.createWithoutHighZ(1, resultBinary);
        this.outputPins[0].setSignal(resultSignal);
    }
}


module.exports = NorGate;