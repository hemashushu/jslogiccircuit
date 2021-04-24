const LogicUnitFactory = require('../logicunitfactory');
const AbstractLogicModule = require('../abstractlogicmodule');

/**
 * 连接线组合器
 *
 * 用于拼接多个逻辑单元的输入，形成一个单一逻辑输出。
 * 比如将 `wire [3:0] a` 和 `wire [11:0] b` 组成
 * `wire [15:0] c = {a, b}`
 *
 * 实现如下：
 *
 * let a = new Wire('a', 4);
 * let b = new Wire('b', 12);
 *
 * let c = new Combiner('c', 16, [4, 12])
 * connects([a,b], c.inputUnits)
 *
 */
class Combiner extends AbstractLogicModule {

    /**
     *
     * @param {*} name 模块名称
     * @param {*} dataWidth 输出数据的宽度
     * @param {*} sourceDataWidths 各个源数据的宽度之集合
     */
    constructor(name, dataWidth, sourceDataWidths) {
        super(name, {
            dataWidth: dataWidth,
            sourceDataWidths: sourceDataWidths
        });

        // 输出线
        let outputWire = LogicUnitFactory.createWire('out', dataWidth);
        this.outputUnits.push(outputWire);

        // 输入线
        let createInputWire = (idx, targetDataOffset) => {
            let dataWidth = sourceDataWidths[idx];
            let inputWire = LogicUnitFactory.createWire('in' + idx, dataWidth);

            inputWire.output.push(data => {
                let outputData = outputWire.data;
                outputData.setBits(data, targetDataOffset);

                outputWire.input(outputData);
            });

            return inputWire;
        };

        let targetDataOffset = 0;
        for (let idx = 0; idx < sourceDataWidths.length; idx++) {
            let inputWire = createInputWire(idx, targetDataOffset);
            this.inputUnits.push(inputWire);

            // 增加数据偏移值
            targetDataOffset += dataWidth;
        }
    }
}

Combiner.className = 'combiner'

module.exports = Combiner;