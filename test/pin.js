const { Binary } = require('jsbinary');

const assert = require('assert/strict');

const { ConnectionUtils, Pin, PinDirection, Signal } = require('../index');

describe('Pin Test', () => {
    it('Test Constructor', () => {
        let pin1 = new Pin('pin1', 4, PinDirection.input);
        assert.equal(pin1.name, 'pin1');
        assert.equal(pin1.bitWidth, 4);
        assert.equal(pin1.pinDirection, PinDirection.input);

        let pin2 = new Pin('pin2', 8, PinDirection.output);
        assert.equal(pin2.name, 'pin2');
        assert.equal(pin2.bitWidth, 8);
        assert.equal(pin2.pinDirection, PinDirection.output);
        assert.equal(pin2.getSignal().getBinary().toBinaryString(), '0');
    });

    it('Test setSignal()', () => {
        let pin1 = new Pin('pin1', 4);
        let binary1 = Binary.fromBinaryString('0000', 4);
        let signal1 = Signal.createWithoutHighZ(4, binary1);

        // https://nodejs.org/api/assert.html#assert_assert_value_message
        assert(Signal.equal(pin1.getSignal(), signal1));

        let binary2 = Binary.fromBinaryString('1010', 4);
        let signal2 = Signal.createWithoutHighZ(4, binary2);
        pin1.setSignal(signal2);
        assert(Signal.equal(pin1.getSignal(), signal2));

        let binary3 = Binary.fromBinaryString('1111', 4);
        let signal3 = Signal.createWithoutHighZ(4, binary3);
        pin1.setSignal(signal3);
        assert(Signal.equal(pin1.getSignal(), signal3));
    });

//     it('Test flags and events', (done) => {
//         let pin1 = new Pin('pin1', 4);
//         let binary1 = Binary.fromBinaryString('1010', 4);
//         let signal1 = Signal.createWithoutHighZ(4, binary1);
//
//         pin1.addSignalChangeEventListener(signal => {
//             assert(Signal.equal(signal, signal1));
//             assert(pin1.signalChangedFlag);
//
//             // 重置 signalChanged 标记
//             pin1.resetSignalChangedFlag();
//             assert(!pin1.signalChangedFlag);
//
//             done();
//         });
//
//         pin1.setSignal(signal1);
//     });

    it('Test signalChangedFlag flags', () => {
        let pin1 = new Pin('pin1', 4);

//         pin1.addSignalChangeEventListener(signal => {
//             assert(Signal.equal(signal, signal1));
//             assert(pin1.signalChangedFlag);
//
//             // 重置 signalChanged 标记
//             pin1.resetSignalChangedFlag();
//             assert(!pin1.signalChangedFlag);
//
//             done();
//         });

        assert(!pin1.signalChangedFlag);

        // 第 1 次改变数据
        let binary1 = Binary.fromBinaryString('1010', 4);
        let signal1 = Signal.createWithoutHighZ(4, binary1);
        pin1.setSignal(signal1);
        assert(pin1.signalChangedFlag);

        pin1.resetSignalChangedFlag();
        assert(!pin1.signalChangedFlag);

        // 第 2 次改变数据
        let binary2 = Binary.fromBinaryString('1011', 4);
        let signal2 = Signal.createWithoutHighZ(4, binary2);
        pin1.setSignal(signal2);
        assert(pin1.signalChangedFlag);

        pin1.resetSignalChangedFlag();
        assert(!pin1.signalChangedFlag);

        // 第 3 次改变数据 - 数值跟第 2 次相同
        let binary3 = Binary.fromBinaryString('1011', 4);
        let signal3 = Signal.createWithoutHighZ(4, binary3);
        pin1.setSignal(signal3);
        assert(!pin1.signalChangedFlag);
    });

    it('Test connection', () => {
        let pin1 = new Pin('pin1', 4);
        let pin2 = new Pin('pin2', 4);

        let binary1 = Binary.fromBinaryString('0000', 4);
        let signal1 = Signal.createWithoutHighZ(4, binary1);

        ConnectionUtils.connect(pin1, pin2);

        // 改变 pin1 数据
        let binary2 = Binary.fromBinaryString('1010', 4);
        let signal2 = Signal.createWithoutHighZ(4, binary2);
        pin1.setSignal(signal2);
        assert(pin1.signalChangedFlag);
        assert(Signal.equal(pin1.getSignal(), signal2));

        // pin2 尚未改变
        assert(!pin2.signalChangedFlag);
        assert(Signal.equal(pin2.getSignal(), signal1));

        // 让 pin1 写数据
        pin1.writeToNextPins();
        assert(pin2.signalChangedFlag);
        assert(Signal.equal(pin2.getSignal(), signal2));

        // 重置 signalChanged 标记
        pin1.resetSignalChangedFlag();
        pin2.resetSignalChangedFlag();

        assert(!pin1.signalChangedFlag);
        assert(!pin2.signalChangedFlag);

        // // 再次改变 pin1 的数据
        // let binary3 = Binary.fromBinaryString('1100', 4);
        // let signal3 = Signal.createWithoutHighZ(4, binary3);
        // pin1.setSignal(signal3);
        // assert(pin1.signalChangedFlag !== 0);
        // assert(Signal.equal(pin1.getSignal(), signal3));
    });

    it('Test connecting to multiple pins', () => {
        let pin1 = new Pin('pin1', 4);
        let pin2 = new Pin('pin2', 4);
        let pin3 = new Pin('pin3', 4);
        let pin4 = new Pin('pin4', 4);

        // pin1 -|-- pin2 --- pin4
        //       |-- pin3

        ConnectionUtils.connect(pin1, pin2);
        ConnectionUtils.connect(pin1, pin3);
        ConnectionUtils.connect(pin2, pin4);

        let binary1 = Binary.fromBinaryString('0000', 4);
        let binary2 = Binary.fromBinaryString('1010', 4);
        let signal1 = Signal.createWithoutHighZ(4, binary1);
        let signal2 = Signal.createWithoutHighZ(4, binary2);

        pin1.setSignal(signal2);
        assert(pin1.signalChangedFlag);
        assert(!pin2.signalChangedFlag);
        assert(!pin3.signalChangedFlag);
        assert(!pin4.signalChangedFlag);

        assert(Signal.equal(pin1.getSignal(), signal2));
        assert(Signal.equal(pin2.getSignal(), signal1));
        assert(Signal.equal(pin3.getSignal(), signal1));
        assert(Signal.equal(pin4.getSignal(), signal1));

        // pin1.writeToNextLogicModulePins();
        pin1.writeToNextPins();
        assert(pin1.signalChangedFlag);
        assert(pin2.signalChangedFlag);
        assert(pin3.signalChangedFlag);
        assert(!pin4.signalChangedFlag);

        assert(Signal.equal(pin1.getSignal(), signal2));
        assert(Signal.equal(pin2.getSignal(), signal2));
        assert(Signal.equal(pin3.getSignal(), signal2));
        assert(Signal.equal(pin4.getSignal(), signal1));

        // pin2.writeToNextLogicModulePins();
        pin2.writeToNextPins();
        assert(pin4.signalChangedFlag);
        assert(Signal.equal(pin4.getSignal(), signal2));
    });
});
