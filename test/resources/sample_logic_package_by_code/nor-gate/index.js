const { AbstractLogicModule } = require('../../../../index');
const { Binary } = require('jsbinary');

/**
 * 逻辑或非门
 */
class NorGate extends AbstractLogicModule {

    constructor(instanceName) {
        super(instanceName);

        this.addOutputPinByDetail('out', 1);

        // 输入端口的名称分别为 in0, in1, ... inN
        this.addInputPinByDetail('in0', 1);
        this.addInputPinByDetail('in1', 1);

        // [inputWire0, inputWire1].forEach(item => {
        //     item.addDataChangeListener(() => {
        //         let outputData = Binary.xor(inputWire0, inputWire1);
        //         if (!Binary.equals(outputData, outputWire.data)) {
        //             outputWire.setData(outputData);
        //         }
        //     });
        // });
    }

    getPackageName() {
        return 'sample_logic_package_by_code'; // 同目录名
    }

    getModuleClassName() {
        return 'nor-gate'; // 同目录名
    }

    // override
    updateModuleDataAndOutputPinsData() {
        let data1 = this.inputPins[0].getData();
        let data2 = this.inputPins[1].getData();
        let resultData = Binary.nor(data1, data2);
        this.outputPins[0].setData(resultData);
    }
}


module.exports = NorGate;