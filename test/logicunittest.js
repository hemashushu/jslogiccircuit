const {Binary} = require('jsbinary');

const Connector = require('../src/connector');
const LogicUnitFactory = require('../src/logicunitfactory');
const Register = require('../src/logicunit/register');
const Wire = require('../src/logicunit/wire');

var assert = require('assert/strict');

describe('LogicUnit Test', () => {
    describe('Wire', () => {
        it('Constructor', () => {
            let w1 = new Wire('wire1', 4);
            assert.equal(w1.name, 'wire1');
            assert.equal(w1.dataWidth, 4);
        });

        it('Input data', ()=>{
            let w1 = new Wire('wire1', 4);
            let b1 = Binary.fromBinaryString('0000', 4);

            // https://nodejs.org/api/assert.html#assert_assert_value_message
            assert(Binary.equals(w1.data, b1));

            let b2 = Binary.fromBinaryString('1010', 4);
            w1.input(b2);
            assert(Binary.equals(w1.data, b2));
        });

        it('Transit data', (done)=>{
            let w1 = new Wire('wire1', 4);

            let b1 = Binary.fromBinaryString('1010', 4);

            w1.output.push(data => {
                assert(Binary.equals(data, b1));
                done();
            });

            w1.input(b1);
        });
    });
});
