const { AbstractLogicModule } = require('../../../../index');
const { Binary } = require('jsbinary');

/**
 * 逻辑与门
 */
class AndGate extends AbstractLogicModule {

    constructor(instanceName, instanceParameters, defaultParameters) {
        super(instanceName, instanceParameters, defaultParameters);

        // 模块参数
        let inputWireCount = this.getParameter('inputWireCount'); // 输入端口的数量
        let bitWidth = this.getParameter('bitWidth'); // 数据宽度

        let outputWire = this._addOutputPin('out', bitWidth);

        // 输入端口的名称分别为 in0, in1, ... inN
        let createInputWire = (idx) => {
            let inputWire = this.addInputPin('in' + idx, bitWidth);

            inputWire.addDataChangeListener(() => {
                let outputData = this.inputPins[0].data;
                for (let idx = 1; idx < this.inputPins.length; idx++) {
                    outputData = Binary.and(outputData, this.inputPins[idx].data);
                }

                if (!Binary.equals(outputData, outputWire.data)) {
                    outputWire.setData(outputData);
                }
            });
        };

        // 输入端口们
        for (let idx = 0; idx < inputWireCount; idx++) {
            createInputWire(idx);
        }
    }

    getPackageName() {
        return 'sample_logic_package_by_code'; // 同目录名
    }

    getModuleClassName() {
        return 'and-gate'; // 同目录名
    }
}


module.exports = AndGate;