const { AbstractLogicModule, Signal, PinDirection } = require('../../../../../../index');
const { Binary } = require('jsbinary');

/**
 * 逻辑异或门
 */
class XorGate extends AbstractLogicModule {

    constructor(name) {
        super(name);

        this.pinA = this.addPin('A', 1, PinDirection.input);
        this.pinB = this.addPin('B', 1, PinDirection.input)
        this.pinQ = this.addPin('Q', 1, PinDirection.output);
    }

    getPackageName() {
        return 'package-by-code'; // 同目录名
    }

    getModuleClassName() {
        return 'xor_gate'; // 同目录名
    }

    // override
    updateModuleState() {
        let signal1 = this.pinA.getSignal();
        let siangl2 = this.pinB.getSignal();
        let resultBinary = Binary.xor(signal1.getBinary(), siangl2.getBinary());
        let resultSignal = Signal.createWithoutHighZ(1, resultBinary);
        this.pinQ.setSignal(resultSignal);
    }
}


module.exports = XorGate;