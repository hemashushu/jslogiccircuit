const { AbstractLogicModule } = require('../../../../index');
const { Binary } = require('jsbinary');

/**
 * 逻辑异或门
 */
class XorGate extends AbstractLogicModule {

    constructor(instanceName) {
        super(instanceName);

        let outputWire = this.addOutputWire('out', 1);

        // 输入线的名称分别为 in0, in1, ... inN
        let inputWire0 = this.addInputWire('in0', 1);
        let inputWire1 = this.addInputWire('in1', 1);

        [inputWire0, inputWire1].forEach(item => {
            item.addListener(() => {
                let outputData = Binary.xor(inputWire0, inputWire1);
                if (!Binary.equals(outputData, outputWire.data)) {
                    outputWire.setData(outputData);
                }
            });
        });


    }

    getPackageName() {
        return 'sample_logic_package_by_code'; // 同目录名
    }

    getModuleClassName() {
        return 'xor-gate'; // 同目录名
    }
}


module.exports = XorGate;