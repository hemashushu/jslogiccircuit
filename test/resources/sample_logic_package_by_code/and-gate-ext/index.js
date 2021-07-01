const { AbstractLogicModule } = require('../../../../index');
const { Binary } = require('jsbinary');

/**
 * 逻辑与门
 */
class AndGate extends AbstractLogicModule {

    constructor(name, instanceParameters, defaultParameters) {
        super(name, instanceParameters, defaultParameters);

        // 模块参数
        let inputPinNumber = this.getParameter('inputPinNumber'); // 输入端口的数量
        let bitWidth = this.getParameter('bitWidth'); // 数据宽度

        this.addOutputPinByDetail('out', bitWidth);

        // 输入端口的名称分别为 in0, in1, ... inN
        let createInputPin = (idx) => {
            this.addInputPinByDetail('in' + idx, bitWidth);
        };

        // 输入端口
        for (let idx = 0; idx < inputPinNumber; idx++) {
            createInputPin(idx);
        }

        this.dataZero = Binary.fromBinaryString('0', bitWidth);
    }

    getPackageName() {
        return 'sample_logic_package_by_code'; // 同目录名
    }

    getModuleClassName() {
        return 'and-gate-ext'; // 同目录名
    }

    // override
    updateModuleDataAndOutputPinsData() {
        let datas = this.inputPins.map(pin=>{
            return pin.getData();
        });

        let resultData = datas[0];
        for (let idx = 1; idx < datas.length; idx++) {
            resultData = Binary.and(resultData, datas[idx]);

            if (Binary.equal(resultData, this.dataZero)){
                break;
            }
        }

        this.outputPins[0].setData(resultData);
    }
}


module.exports = AndGate;