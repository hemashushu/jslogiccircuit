const { Binary } = require('binary');

const AbstractLogicModule = require('../abstractlogicmodule');
const LogicCircuitException = require('../logiccircuitexception');
const LogicUnitFactory = require('../logicunitfactory');

/**
 * 多路复用器
 *
 */
class Multiplexer extends AbstractLogicModule {
    /**
     *
     * @param {*} name 模块名称
     * @param {*} dataWidth 数据宽度
     * @param {*} sourceWireCount 源数据线（候选数据线）的数量
     * @param {*} controlWireDataWidth 控制信号的数据宽度，必须满足
     *   '2 ** controlWireDataWidth === sourceWireCount' 条件。
     */
    constructor(name, dataWidth, sourceWireCount, controlWireDataWidth) {
        super(name, {
            dataWidth: dataWidth,
            sourceWireCount: sourceWireCount,
            controlWireDataWidth: controlWireDataWidth
        });

        if (2 ** controlWireDataWidth !== sourceWireCount) {
            throw new LogicCircuitException('Control wire data width error.');
        }

        // 输出线
        let outputWire = LogicUnitFactory.createWire('out', dataWidth);
        this.outputUnits.push(outputWire);

        // 输入线
        let buildInputWire = (idx) => {
            let inputWire = LogicUnitFactory.createWire('in' + idx, dataWidth);

            inputWire.output.push(data => {
                if (Binary.equals(data, controlWire.data)) {
                    outputWire.input(data);
                }
            });

            return inputWire;
        };

        for (let idx = 0; idx < sourceWireCount; idx++) {
            let inputWire = buildInputWire(idx);
            this.inputUnits.push(inputWire);
        }

        // 控制线
        let controlWire = LogicUnitFactory.createWire('control', controlWireDataWidth);
        this.inputUnits.push(controlWire);

        // 当控制信号改变时，重新传递相应源数据到输出线。
        controlWire.output.push(data => {
            let sourceIdx = data.value;
            let inputWire = this.inputUnits[sourceIdx];

            let outputData = inputWire.data;
            outputWire.input(outputData);
        });
    }
}

Multiplexer.className = 'multiplexer';

module.exports = Multiplexer;