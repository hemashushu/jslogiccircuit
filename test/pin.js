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

//     it('Test setData()', () => {
//         let pin1 = new Pin('pin1', 4);
//         let binary1 = Binary.fromBinaryString('0000', 4);
//
//         // https://nodejs.org/api/assert.html#assert_assert_value_message
//         assert(Binary.equals(pin1.getData(), binary1));
//
//         let binary2 = Binary.fromBinaryString('1010', 4);
//         pin1.setData(binary2);
//         assert(Binary.equals(pin1.getData(), binary2));
//
//         let binary3 = Binary.fromBinaryString('1111', 4);
//         pin1.setData(binary3);
//         assert(Binary.equals(pin1.getData(), binary3));
//     });
//
//     describe('Test data transit', () => {
//         it('Add lisener', (done) => {
//             let pin1 = new Pin('pin1', 4);
//             let binary1 = Binary.fromBinaryString('1010', 4);
//
//             pin1.addDataChangeListener(data => {
//                 assert(Binary.equals(data, binary1));
//                 done();
//             });
//
//             pin1.setData(binary1);
//         });
//
//         it('Add multiple liseners', (done) => {
//             let pin1 = new Pin('pin1', 4);
//
//             let binary1 = Binary.fromBinaryString('1010', 4);
//
//             let count = 0;
//             let plusOne = () => {
//                 count++;
//                 if (count === 3) {
//                     done();
//                 }
//             };
//
//             pin1.addDataChangeListener((data) => {
//                 assert(Binary.equal(data, binary1));
//                 plusOne();
//             });
//
//             pin1.addDataChangeListener((data) => {
//                 assert(Binary.equal(data, binary1));
//                 plusOne();
//             });
//
//             pin1.addDataChangeListener((data) => {
//                 assert(Binary.equal(data, binary1));
//                 plusOne();
//             });
//
//             pin1.setData(binary1);
//         });
//     });
//
//     describe('Test connection', () => {
//         it('Chain multiple wires', (done) => {
//             let pin1 = new Pin('pin1', 4);
//             let pin2 = new Pin('pin2', 4);
//             let pin3 = new Pin('pin3', 4);
//
//             ConnectionUtils.connect(pin1, pin2);
//             ConnectionUtils.connect(pin2, pin3);
//
//             let binary1 = Binary.fromBinaryString('1010', 4);
//
//             pin3.addDataChangeListener(data => {
//                 assert(Binary.equals(data, binary1));
//                 done();
//             });
//
//             pin1.setData(binary1);
//
//             assert(Binary.equals(pin1.getData(), binary1));
//             assert(Binary.equals(pin2.getData(), binary1));
//             assert(Binary.equals(pin3.getData(), binary1));
//         });
//
//         it('Connect multiple wires', () => {
//             let sourcePin1 = new Pin('pin1', 2);
//             let sourcePin2 = new Pin('pin2', 2);
//             let destPin1 = new Pin('pin3', 2);
//             let destPin2 = new Pin('pin4', 2);
//
//             ConnectionUtils.connects(
//                 [sourcePin1, sourcePin2],
//                 [destPin1, destPin2]);
//
//             let binary1 = Binary.fromBinaryString('10', 2);
//             let binary2 = Binary.fromBinaryString('11', 2);
//
//             sourcePin1.setData(binary1);
//             sourcePin2.setData(binary2);
//
//             assert(Binary.equals(destPin1.getData(), binary1));
//             assert(Binary.equals(destPin2.getData(), binary2));
//         });
//     });
});
