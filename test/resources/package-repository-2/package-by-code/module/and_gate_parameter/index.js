const { Binary } = require('jsbinary');

const { Signal, SimpleLogicModule, PinDirection } = require('../../../../../../index');

/**
 * 逻辑与门
 */
class AndGate extends SimpleLogicModule {

    // override
    init(){
        // 输入端口的数量
        this._inputPinCount = this.getParameter('inputPinCount');

        // 数据宽度
        this._bitWidth = this.getParameter('bitWidth');

        this._pinOut = this.addPin('out', this._bitWidth, PinDirection.output);

        // 输入端口的名称分别为 in_0, in_1, ... in_N
        for (let idx = 0; idx < this._inputPinCount; idx++) {
            this.addPin('in_' + idx, this._bitWidth, PinDirection.input);
        }
    }

    // override
    updateModuleState() {
        let states = this.inputPins.map(pin => {
            return pin.getSignal().getState();
        });

        let state = states[0];
        let levelResult = Binary.and(state.level, Binary.not(state.highZ));

        for (let idx = 1; idx < states.length; idx++) {
            state = states[idx];
            let currentBinary = Binary.and(state.level, Binary.not(state.highZ));
            levelResult = Binary.and(levelResult, currentBinary);
        }

        let signalResult = Signal.createWithoutHighZ(this._bitWidth, levelResult);
        this._pinOut.setSignal(signalResult);
    }
}


module.exports = AndGate;