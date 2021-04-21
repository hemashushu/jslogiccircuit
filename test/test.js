const {Binary} = require('jsbinary');

var assert = require('assert/strict');

describe('Binary', () => {
    describe('constructor', () => {
        it('fromBinaryString', () => {
            let b1 = Binary.fromBinaryString('1001', 4);
            assert.equal(b1.value, 0b1001);
            assert.equal(b1.length, 4);
        });
    });
});
