const path = require('path');
const assert = require('assert/strict');

const { Binary } = require('jsbinary');
const { ObjectUtils, ObjectComposer } = require('jsobjectutils');
const { LogicPackageLoader, LogicModuleLoader,
    LogicModuleFactory, ModuleController } = require('../index');

describe('Test sample_logic_package_by_mix', () => {
    it('Test module controller - Full Adder', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);

        let packageName = 'sample_logic_package_by_mix';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let fullAdder1 = LogicModuleFactory.createModuleInstance(packageName, 'full_adder', 'full_adder1');
        let moduleController1 = new ModuleController(fullAdder1);

        // 2 个 Half Adder (3 modules each half adder) + 1 个 OR gate + Full Adder 本模块 = 8
        assert.equal(moduleController1.logicModuleCount, 8);

        let A = fullAdder1.getInputPin('A');
        let B = fullAdder1.getInputPin('B');
        let Cin = fullAdder1.getInputPin('Cin');
        let S = fullAdder1.getOutputPin('S');
        let Cout = fullAdder1.getOutputPin('Cout');

        // Full Adder
        // Inputs    Outputs
        // A    B    Cin  Cout S
        // 0    0    0    0    0
        // 0    0    1    0    1
        // 0    1    0    0    1
        // 0    1    1    1    0
        // 1    0    0    0    1
        // 1    0    1    1    0
        // 1    1    0    1    0
        // 1    1    1    1    1

        let num2bin = (num) => {
            return num === 0 ? binary0 : binary1;
        }

        let check = (a, b, cin, cout, s, moves) => {
            // 改变输入信号
            A.setData(num2bin(a));
            B.setData(num2bin(b));
            Cin.setData(num2bin(cin));

            let moves1 = moduleController1.step();
            assert(moves1, moves);

            // 测试输出信号
            assert(Binary.equal(Cout.getData(), num2bin(cout)));
            assert(Binary.equal(S.getData(), num2bin(s)));
        };

        check(0, 0, 0, 0, 0, 1);
        check(0, 0, 1, 0, 1, 1);
        check(0, 1, 0, 0, 1, 2);
        check(0, 1, 1, 1, 0, 2);
        check(1, 0, 0, 0, 1, 2);
        check(1, 0, 1, 1, 0, 2);
        check(1, 1, 0, 1, 0, 2);
        check(1, 1, 1, 1, 1, 1);
    });

    it('Test module controller - 4-bit Adder', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);

        let packageName = 'sample_logic_package_by_mix';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let fourBitAdder1 = LogicModuleFactory.createModuleInstance(packageName, 'four_bit_adder', 'four_bit_adder1');
        let moduleController1 = new ModuleController(fourBitAdder1);

        // 4 * (full adder 8 modules) + 1 module self
        assert.equal(moduleController1.logicModuleCount, 33);

        let Cin = fourBitAdder1.getInputPin('Cin');
        let A0 = fourBitAdder1.getInputPin('A0');
        let B0 = fourBitAdder1.getInputPin('B0');
        let A1 = fourBitAdder1.getInputPin('A1');
        let B1 = fourBitAdder1.getInputPin('B1');
        let A2 = fourBitAdder1.getInputPin('A2');
        let B2 = fourBitAdder1.getInputPin('B2');
        let A3 = fourBitAdder1.getInputPin('A3');
        let B3 = fourBitAdder1.getInputPin('B3');

        let S0 = fourBitAdder1.getOutputPin('S0');
        let S1 = fourBitAdder1.getOutputPin('S1');
        let S2 = fourBitAdder1.getOutputPin('S2');
        let S3 = fourBitAdder1.getOutputPin('S3');
        let Cout = fourBitAdder1.getOutputPin('Cout');

        let num2bin = (num) => {
            return num === 0 ? binary0 : binary1;
        }

        let check = (a, b, c, s) => {
            let binA = Binary.fromInt32(a, 8); // 将 A 视为 4 位二进制数 {A3, A2, A1, A0}
            let binB = Binary.fromInt32(b, 8); // 将 B 视为 4 位二进制数 {B3, B2, B1, B0}

            Cin.setData(num2bin(c));
            A0.setData(num2bin(binA.getBit(0)));
            A1.setData(num2bin(binA.getBit(1)));
            A2.setData(num2bin(binA.getBit(2)));
            A3.setData(num2bin(binA.getBit(3)));

            B0.setData(num2bin(binB.getBit(0)));
            B1.setData(num2bin(binB.getBit(1)));
            B2.setData(num2bin(binB.getBit(2)));
            B3.setData(num2bin(binB.getBit(3)));

            let m = moduleController1.step();

            let binS = Binary.fromInt32(s, 8); // 将 S 视为 5 位二进制数 {Cout, S3, S2, S1, S0}
            assert(Binary.equal(S0.getData(), num2bin(binS.getBit(0))));
            assert(Binary.equal(S1.getData(), num2bin(binS.getBit(1))));
            assert(Binary.equal(S2.getData(), num2bin(binS.getBit(2))));
            assert(Binary.equal(S3.getData(), num2bin(binS.getBit(3))));
            assert(Binary.equal(Cout.getData(), num2bin(binS.getBit(4))));
        };

        for (let a = 0; a < 15; a++) {
            for (let b = 0; b < 15; b++) {
                let s = a + b;
                check(a, b, 0, s);
            }
        }

        for (let a = 0; a < 15; a++) {
            for (let b = 0; b < 15; b++) {
                let s = a + b + 1;
                check(a, b, 1, s);
            }
        }

    });

});