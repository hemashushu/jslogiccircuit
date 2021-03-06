const path = require('path');
const assert = require('assert/strict');

const { Binary } = require('jsbinary');

const {
    PackageRepositoryManager,
    LogicPackageLoader,
    LogicModuleFactory,
    ModuleStateController,
    Signal } = require('../index');

describe('Test package-by-mix', () => {
    it('Test module state controller - Full Adder', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);
        let signal1 = Signal.createWithoutHighZ(1, binary1);

        let packageName = 'package-by-mix';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let fullAdder1 = LogicModuleFactory.createModuleInstance(packageName, 'full_adder', 'full_adder1');
        let moduleStateController1 = new ModuleStateController(fullAdder1);

        // 2 个 Half Adder (3 modules each half adder) + 1 个 OR gate + Full Adder 本模块 = 8
        assert.equal(moduleStateController1.logicModuleCount, 8);

        let A = fullAdder1.getPin('A');
        let B = fullAdder1.getPin('B');
        let Cin = fullAdder1.getPin('Cin');
        let S = fullAdder1.getPin('S');
        let Cout = fullAdder1.getPin('Cout');

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

        let numberToSignal = (num) => {
            return num === 0 ? signal0 : signal1;
        }

        let check = (a, b, cin, cout, s, moves) => {
            // 改变输入信号
            A.setSignal(numberToSignal(a));
            B.setSignal(numberToSignal(b));
            Cin.setSignal(numberToSignal(cin));

            let moves1 = moduleStateController1.update();
            assert(moves1, moves);

            // 测试输出信号
            assert(Signal.equal(Cout.getSignal(), numberToSignal(cout)));
            assert(Signal.equal(S.getSignal(), numberToSignal(s)));
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

    it('Test module state controller - 4-bit Adder', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);
        let signal1 = Signal.createWithoutHighZ(1, binary1);

        let packageName = 'package-by-mix';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let fourBitAdder1 = LogicModuleFactory.createModuleInstance(packageName, 'four_bit_adder', 'four_bit_adder1');
        let moduleStateController1 = new ModuleStateController(fourBitAdder1);

        // 4 * (full adder 8 modules) + 1 module self
        assert.equal(moduleStateController1.logicModuleCount, 33);

        let Cin = fourBitAdder1.getPin('Cin');
        let A0 = fourBitAdder1.getPin('A0');
        let B0 = fourBitAdder1.getPin('B0');
        let A1 = fourBitAdder1.getPin('A1');
        let B1 = fourBitAdder1.getPin('B1');
        let A2 = fourBitAdder1.getPin('A2');
        let B2 = fourBitAdder1.getPin('B2');
        let A3 = fourBitAdder1.getPin('A3');
        let B3 = fourBitAdder1.getPin('B3');

        let S0 = fourBitAdder1.getPin('S0');
        let S1 = fourBitAdder1.getPin('S1');
        let S2 = fourBitAdder1.getPin('S2');
        let S3 = fourBitAdder1.getPin('S3');
        let Cout = fourBitAdder1.getPin('Cout');

        let numberToSignal = (num) => {
            return num === 0 ? signal0 : signal1;
        }

        let check = (a, b, c, s) => {
            let binA = Binary.fromInt32(a, 8); // 将 A 视为 4 位二进制数 {A3, A2, A1, A0}
            let binB = Binary.fromInt32(b, 8); // 将 B 视为 4 位二进制数 {B3, B2, B1, B0}

            Cin.setSignal(numberToSignal(c));
            A0.setSignal(numberToSignal(binA.getBit(0)));
            A1.setSignal(numberToSignal(binA.getBit(1)));
            A2.setSignal(numberToSignal(binA.getBit(2)));
            A3.setSignal(numberToSignal(binA.getBit(3)));

            B0.setSignal(numberToSignal(binB.getBit(0)));
            B1.setSignal(numberToSignal(binB.getBit(1)));
            B2.setSignal(numberToSignal(binB.getBit(2)));
            B3.setSignal(numberToSignal(binB.getBit(3)));

            moduleStateController1.update();

            let binS = Binary.fromInt32(s, 8); // 将 S 视为 5 位二进制数 {Cout, S3, S2, S1, S0}
            assert(Signal.equal(S0.getSignal(), numberToSignal(binS.getBit(0))));
            assert(Signal.equal(S1.getSignal(), numberToSignal(binS.getBit(1))));
            assert(Signal.equal(S2.getSignal(), numberToSignal(binS.getBit(2))));
            assert(Signal.equal(S3.getSignal(), numberToSignal(binS.getBit(3))));
            assert(Signal.equal(Cout.getSignal(), numberToSignal(binS.getBit(4))));
        };

        // let start = new Date();

        // for(let repeat = 0; repeat<100; repeat++) {
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
        // }

        // let end = new Date();
        // let span = end - start;
        // console.log('Repeat 100 times: ' + span + ' ms');
    });
});