const {Binary} = require('binary');

const LogicUnitFactory = require('../logicunitfactory');
const AbstractLogicModule = require('../abstractlogicmodule');

/**
 * 逻辑与门
 */
class AndGate extends AbstractLogicModule {

    /**
     *
     * @param {*} name
     * @param {*} inputWireCount 输入线的数量
     */
    constructor(name, inputWireCount) {
        super(name, {
            inputWireCount: inputWireCount
        });

        // 输出线
        let outputWire = LogicUnitFactory.createWire('out', 1);
        this.outputUnits.push(outputWire);

        let createInputWire = (idx) => {
            let inputWire = LogicUnitFactory.createWire('in' + idx, 1);

            inputWire.output.push(data => {
                let result = 1
                for(let inputUnit of this.inputUnits) {
                    if (inputUnit.data.getBit(0) === 0) {
                        result = 0;
                        break;
                    }
                }

                let outputData = outputWire.data;
                outputData.setBit(0, result);

                outputWire.input(outputData);
            });

            return inputWire;
        };

        // 输入线们
        for (let idx = 0; idx < inputWireCount; idx++) {
            let inputWire = createInputWire(idx);
            this.inputUnits.push(inputWire);
        }
    }
}

AndGate.className = 'andGate';

module.exports = AndGate;