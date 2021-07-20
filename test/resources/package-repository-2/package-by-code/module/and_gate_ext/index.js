const { Binary } = require('jsbinary');

const { Signal, SimpleLogicModule, PinDirection } = require('../../../../../../index');

/**
 * 逻辑与门
 */
class AndGate extends SimpleLogicModule {

    init(){
        // 模块参数
        let inputPinCount = this.getParameter('inputPinCount'); // 输入端口的数量
        let bitWidth = this.getParameter('bitWidth'); // 数据宽度

        this.pinOut = this.addPin('out', bitWidth, PinDirection.output);

        // 输入端口的名称分别为 in_0, in_1, ... in_N
        for (let idx = 0; idx < inputPinCount; idx++) {
            this.addPin('in_' + idx, bitWidth, PinDirection.input);
        }
    }

    // override
    updateModuleState() {
        let binaries = this.inputPins.map(pin => {
            return pin.getSignal().getBinary();
        });

        let resultBinary = binaries[0];
        for (let idx = 1; idx < binaries.length; idx++) {
            resultBinary = Binary.and(resultBinary, binaries[idx]);
        }

        let resultSignal = Signal.createWithoutHighZ(this.pinOut.bitWidth, resultBinary);
        this.pinOut.setSignal(resultSignal);
    }
}


module.exports = AndGate;