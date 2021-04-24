const LogicUnitFactory = require('../logicunitfactory');
const AbstractLogicModule = require('../abstractlogicmodule');

/**
 * 连接线适配器
 *
 * 只连接上一个逻辑单元部分（宽度）数据。
 * 即 wire [targetDataWidth - 1:0] target = source[targetDataWidth + dataOffset - 1:dataOffset]
 */
class Adapter extends AbstractLogicModule {

    /**
     *
     * @param {*} name 模块名称
     * @param {*} dataWidth 输出数据的宽度
     * @param {*} sourceDataWidth 源数据宽度
     * @param {*} sourceDataOffset 源数据偏移值
     */
    constructor(name, dataWidth, sourceDataWidth, sourceDataOffset) {
        super(name, {
            sourceDataOffset: sourceDataOffset
        });

        // 输出线
        let outputWire = LogicUnitFactory.createWire('out', dataWidth);
        this.outputUnits.push(outputWire);

        // 输入线
        let inputWire = LogicUnitFactory.createWire('in', sourceDataWidth);
        this.inputUnits.push(inputWire);

        inputWire.output.push(data => {
            let partialData = data.getBits(sourceDataOffset, dataWidth);
            outputWire.input(partialData);
        });
    }
}

Adapter.className = 'adapter'

module.exports = Adapter;