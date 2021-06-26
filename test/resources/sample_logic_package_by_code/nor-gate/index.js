const { AbstractLogicModule } = require('../../../../index');
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