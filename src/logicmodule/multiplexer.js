const { Binary } = require('jsbinary');

const AbstractLogicModule = require('../abstractlogicmodule');
const LogicCircuitException = require('../logiccircuitexception');

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

        let outputWire = this.addOutputWire('out', dataWidth);

        let buildInputWire = (idx) => {
            let inputWire = this.addInputWire('in' + idx, dataWidth);

            inputWire.addListener(data => {
                if (Binary.equals(data, controlWire.data)) {
                    outputWire.setData(data);
                }
            });
        };

        for (let idx = 0; idx < sourceWireCount; idx++) {
            buildInputWire(idx);
        }

        // 控制线
        let controlWire = this.addInputWire('control', controlWireDataWidth);

        // 当控制信号改变时，重新传递相应源数据到输出线。
        controlWire.addListener(data => {
            let sourceIdx = data.value;
            let inputWire = this.inputWires[sourceIdx];

            let outputData = inputWire.data;
            outputWire.setData(outputData);
        });
    }
}

Multiplexer.className = 'multiplexer';

module.exports = Multiplexer;