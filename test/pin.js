const { Binary } = require('jsbinary');

const assert = require('assert/strict');

const { ConnectionUtils, Pin } = require('../index');

describe('Pin Test', () => {
    it('Test Constructor', () => {
        let pin1 = new Pin('pin1', 4);
        assert.equal(pin1.name, 'pin1');
        assert.equal(pin1.bitWidth, 4);

        let pin2 = new Pin('pin2', 8, 'description1', 'pinNumber1');
        assert.equal(pin2.name, 'pin2');
        assert.equal(pin2.bitWidth, 8);
        assert.equal(pin2.getData().toBinaryString(), '0');
        assert.equal(pin2.description, 'description1');
        assert.equal(pin2.pinNumber, 'pinNumber1');
    });

    it('Test setData()', () => {
        let pin1 = new Pin('pin1', 4);
        let binary1 = Binary.fromBinaryString('0000', 4);

        // https://nodejs.org/api/assert.html#assert_assert_value_message
        assert(Binary.equal(pin1.getData(), binary1));

        let binary2 = Binary.fromBinaryString('1010', 4);
        pin1.setData(binary2);
        assert(Binary.equal(pin1.getData(), binary2));

        let binary3 = Binary.fromBinaryString('1111', 4);
        pin1.setData(binary3);
        assert(Binary.equal(pin1.getData(), binary3));
    });

    it('Test flags and events', (done) => {
        let pin1 = new Pin('pin1', 4);
        let binary1 = Binary.fromBinaryString('1010', 4);

        pin1.addDataChangeEventListener(data => {
            assert(Binary.equal(data, binary1));
            assert(pin1.isDataChanged);

            // 重置 dataChanged 标记
            pin1.clearDataChangedFlag();
            assert(!pin1.isDataChanged);

            done();
        });

        pin1.setData(binary1);
    });

    it('Test connection', () => {
        let pin1 = new Pin('pin1', 4);
        let pin2 = new Pin('pin2', 4);

        let binary1 = Binary.fromBinaryString('0000', 4);

        // ConnectionUtils.connect(undefined, pin1, undefined, pin2);
        ConnectionUtils.connect(pin1, pin2);

        // 改变 pin1 数据
        let binary2 = Binary.fromBinaryString('1010', 4);
        pin1.setData(binary2);
        assert(pin1.isDataChanged);
        assert(Binary.equal(pin1.getData(), binary2));

        // pin2 尚未改变
        assert(!pin2.isDataChanged);
        assert(Binary.equal(pin2.getData(), binary1));

        // 让 pin1 写数据
        // pin1.writeToNextLogicModulePins();
        pin1.writeToNextPins();
        assert(pin2.isDataChanged);
        assert(Binary.equal(pin2.getData(), binary2));

        // 重置 dataChanged 标记
        pin1.clearDataChangedFlag();
        pin2.clearDataChangedFlag();

        assert(!pin1.isDataChanged);
        assert(!pin2.isDataChanged);

        // 再次改变 pin1 的数据
        let binary3 = Binary.fromBinaryString('1100', 4);
        pin1.setData(binary3);
        assert(pin1.isDataChanged);
        assert(Binary.equal(pin1.getData(), binary3));

        // // 让 pin2 读取数据
        // pin2.readFromPreviousLogicModulePin();
        // assert(pin2.isDataChanged);
        // assert(Binary.equal(pin2.getData(), binary3));
    });

    it('Test connecting to multiple pins', () => {
        let pin1 = new Pin('pin1', 4);
        let pin2 = new Pin('pin2', 4);
        let pin3 = new Pin('pin3', 4);
        let pin4 = new Pin('pin4', 4);

        // pin1 -|-- pin2 --- pin4
        //       |-- pin3

        // ConnectionUtils.connect(undefined, pin1, undefined, pin2);
        // ConnectionUtils.connect(undefined, pin1, undefined, pin3);
        // ConnectionUtils.connect(undefined, pin2, undefined, pin4);

        ConnectionUtils.connect(pin1, pin2);
        ConnectionUtils.connect(pin1, pin3);
        ConnectionUtils.connect(pin2, pin4);

        let binary1 = Binary.fromBinaryString('0000', 4);
        let binary2 = Binary.fromBinaryString('1010', 4);

        pin1.setData(binary2);
        assert(pin1.isDataChanged);
        assert(!pin2.isDataChanged);
        assert(!pin3.isDataChanged);
        assert(!pin4.isDataChanged);

        assert(Binary.equal(pin1.getData(), binary2));
        assert(Binary.equal(pin2.getData(), binary1));
        assert(Binary.equal(pin3.getData(), binary1));
        assert(Binary.equal(pin4.getData(), binary1));

        // pin1.writeToNextLogicModulePins();
        pin1.writeToNextPins();
        assert(pin1.isDataChanged);
        assert(pin2.isDataChanged);
        assert(pin3.isDataChanged);
        assert(!pin4.isDataChanged);

        assert(Binary.equal(pin1.getData(), binary2));
        assert(Binary.equal(pin2.getData(), binary2));
        assert(Binary.equal(pin3.getData(), binary2));
        assert(Binary.equal(pin4.getData(), binary1));

        // pin2.writeToNextLogicModulePins();
        pin2.writeToNextPins();
        assert(pin4.isDataChanged);
        assert(Binary.equal(pin4.getData(), binary2));
    });
});
