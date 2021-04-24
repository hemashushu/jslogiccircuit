const {Binary} = require('binary');

const LogicUnitFactory = require('../logicunitfactory');
const AbstractLogicModule = require('../abstractlogicmodule');

/**
 * 逻辑或门
 */
class OrGate extends AbstractLogicModule {

    /**
     *
     * @param {*} name
     * @param {*} inputWireCount 输入线的数量
     */
    constructor(name, inputWireCount) {
        super(name, {
            inputWireCount: inputWireCount
        });

        let outputWire = LogicUnitFactory.createWire('out', 1);
        this.outputUnits.push(outputWire);

        let createInputWire = (idx) => {
            let inputWire = LogicUnitFactory.createWire('in' + idx, 1);

            inputWire.output.push(data => {
                let result = 0
                for(let inputUnit of this.inputUnits) {
                    if (inputUnit.data.getBit(0) === 1) {
                        result = 1;
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

OrGate.className = 'orGate';

module.exports = OrGate;