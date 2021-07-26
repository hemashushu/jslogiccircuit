const { Binary } = require('jsbinary');
const { IllegalArgumentException } = require('jsexception');

const assert = require('assert/strict');

const { Signal } = require('../index');

describe('Signal Test', () => {
    it('Test Constructor', () => {
        let signal1 = new Signal(1);
        assert.equal(signal1.getBinary().toBinaryString(), '0');
        assert.equal(signal1.getHighZ().toBinaryString(), '0');

        let signal2 = new Signal(4);
        assert.equal(signal2.getBinary().toBinaryString(), '0000');
        assert.equal(signal2.getHighZ().toBinaryString(), '0000');

        let signal3 = Signal.createLow(4);
        assert.equal(signal3.getBinary().toBinaryString(), '0000');
        assert.equal(signal3.getHighZ().toBinaryString(), '0000');

        let signal4 = Signal.createHigh(4);
        assert.equal(signal4.getBinary().toBinaryString(), '1111');
        assert.equal(signal4.getHighZ().toBinaryString(), '0000');

        let signal5 = Signal.createHighZ(4);
        assert.equal(signal5.getBinary().toBinaryString(), '0000');
        assert.equal(signal5.getHighZ().toBinaryString(), '1111');

        try {
            new Signal(0);
            assert.fail();
        } catch (err) {
            assert(err instanceof IllegalArgumentException);
        }
    });

    it('Test toBinaryString', () => {
        let binary1 = Binary.fromBinaryString('0000', 4);
        let binary2 = Binary.fromBinaryString('1010', 4);
        let highZ1 = Binary.fromBinaryString('0000', 4);
        let highZ2 = Binary.fromBinaryString('1100', 4);

        let signal1 = Signal.create(4, binary1, highZ1);
        assert.equal(signal1.toBinaryString(), '0000');

        let signal2 = Signal.create(4, binary2, highZ1);
        assert.equal(signal2.toBinaryString(), '1010');

        let signal3 = Signal.create(4, binary1, highZ2);
        assert.equal(signal3.toBinaryString(), 'zz00');

        let signal4 = Signal.create(4, binary2, highZ2);
        assert.equal(signal4.toBinaryString(), 'zz10');
    });
});