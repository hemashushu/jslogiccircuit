const {Binary} = require('binary');

const LogicUnitFactory = require('../logicunitfactory');
const AbstractLogicModule = require('../abstractlogicmodule');

/**
 * 逻辑非门
 */
class NotGate extends AbstractLogicModule {

    /**
     *
     * @param {*} name 模块名称
     */
    constructor(name) {
        super(name);

        let outputWire = LogicUnitFactory.createWire('out', 1);
        this.outputUnits.push(outputWire);

        let inputWire = LogicUnitFactory.createWire('in', 1);

        inputWire.output.push(data => {
            let value = data.getBit(0);
            let result = value === 0 ? 1 : 0;

            let outputData = outputWire.data;
            outputData.setBit(0, result);
            outputWire.input(outputData);
        });

        this.inputUnits.push(inputWire);
    }
}

NotGate.className = 'notGate';

module.exports = NotGate;