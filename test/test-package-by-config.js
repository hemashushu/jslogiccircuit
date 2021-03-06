const path = require('path');
const assert = require('assert/strict');

const { Binary } = require('jsbinary');
const { ObjectUtils, ObjectComposer } = require('jsobjectutils');

const {
    PackageRepositoryManager,
    LogicPackageLoader,
    LogicModuleLoader,
    LogicModuleFactory,
    ModuleStateController,
    OscillatingException,
    Signal } = require('../index');

describe('Test package-by-config', () => {
    it('Test load packages', async () => {
        let packageName = 'package-by-config';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        let logicPackageItem = await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let checkPropNames = [
            'name',
            'title',
            'dependencies',
            'mainSimulationModule',
            'isReadOnly',
            'version',
            'author',
            'homepage',
            'iconFilename',
            'description'
        ];

        let expectLogicPackageItem = {
            name: 'package-by-config',
            title: 'Sample Logic Package (Config)',
            dependencies: ['package-by-code'],
            mainSimulationModule: undefined,
            isReadOnly: false,
            version: '1.0.0',
            author: 'Hippo Spark',
            homepage: 'https://github.com/hemashushu/jslogiccircuit',
            iconFilename: 'icon.png',
            description: 'A logic package for unit testing.'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicPackageItem, checkPropNames),
            expectLogicPackageItem));

        let logicModuleItems = LogicPackageLoader.getLogicPackageItems();
        assert.equal(logicModuleItems.length, 2);
    });

    it('Test load modules', async () => {
        let packageName = 'package-by-config';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        let logicPackageItem1 = await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let logicModuleItems1 = LogicModuleLoader.getLogicModuleItemsByPackageName(packageName);
        let moduleClassNames1 = logicModuleItems1.map(item => item.moduleClassName);
        moduleClassNames1.sort(); // sort module names

        assert(ObjectUtils.arrayEquals(moduleClassNames1,
            ['half_adder', 'oscillation', 'rs']));

        let checkPropNames = [
            'packageName',
            'moduleClassName',
            'defaultParameters',
            'title',
            'group',
            'isSimulation',
            'iconFilename',
            'description'
        ];

        let logicModuleItem1 = LogicModuleLoader.getLogicModuleItemByName(packageName, 'half_adder');

        let expectHalfAdderLogicModuleItem = {
            packageName: 'package-by-config',
            moduleClassName: 'half_adder',
            defaultParameters: {},
            title: 'Half Adder',
            group: 'Combinatorial',
            isSimulation: false,
            iconFilename: 'icon.png',
            description: 'Half Adder by XOR and AND Gates'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem1, checkPropNames),
            expectHalfAdderLogicModuleItem
        ));

        let logicModuleItem2 = LogicModuleLoader.getLogicModuleItemByName(packageName, 'rs');

        let expectRSLatchLogicModuleItem = {
            packageName: 'package-by-config',
            moduleClassName: 'rs',
            defaultParameters: {},
            title: 'RS',
            group: 'Sequential',
            isSimulation: false,
            iconFilename: 'icon.png',
            description: 'RS NOR latch'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem2, checkPropNames),
            expectRSLatchLogicModuleItem
        ));

    });

    it('Test module factory', async () => {
        let packageName = 'package-by-config';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let halfAdder1 = LogicModuleFactory.createModuleInstance(packageName, 'half_adder', 'half_adder1');

        assert.equal(halfAdder1.name, 'half_adder1');
        assert(ObjectUtils.isEmpty(halfAdder1.instanceParameters));
        assert(ObjectUtils.isEmpty(halfAdder1.defaultParameters));
        assert(ObjectUtils.isEmpty(halfAdder1.parameters));
        assert.equal(halfAdder1.getPackageName(), packageName);
        assert.equal(halfAdder1.getModuleClassName(), 'half_adder');

        assert.equal(halfAdder1.getInputPins().length, 2);
        assert.equal(halfAdder1.getOutputPins().length, 2);
        assert.equal(halfAdder1.getLogicModules().length, 2);
        assert.equal(halfAdder1.getConnectionItems().length, 6);

        let A = halfAdder1.getPin('A');
        let B = halfAdder1.getPin('B');
        let S = halfAdder1.getPin('S');
        let C = halfAdder1.getPin('C');

        let binary0 = Binary.fromDecimalString(0, 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);

        assert.equal(A.name, 'A');
        assert.equal(A.bitWidth, 1);
        assert(Signal.equal(A.getSignal(), signal0));

        assert.equal(B.name, 'B');
        assert.equal(B.bitWidth, 1);
        assert(Signal.equal(B.getSignal(), signal0));

        assert.equal(S.name, 'S');
        assert.equal(S.bitWidth, 1);
        assert(Signal.equal(S.getSignal(), signal0));

        assert.equal(C.name, 'C');
        assert.equal(C.bitWidth, 1);
        assert(Signal.equal(C.getSignal(), signal0));

        let and1 = halfAdder1.getLogicModule('and1');
        assert.equal(and1.name, 'and1');
        assert.equal(and1.getModuleClassName(), 'and_gate');

        let xor1 = halfAdder1.getLogicModule('xor1');
        assert.equal(xor1.name, 'xor1');
        assert.equal(xor1.getModuleClassName(), 'xor_gate');

        let connectionItems = halfAdder1.getConnectionItems().slice().sort((a, b) => {
            return a.name < b.name;
        });

        assert.equal(connectionItems[0].name, 'a-xor1-a');
        assert.equal(connectionItems[1].name, 'a-and1-a');
        assert.equal(connectionItems[2].name, 'b-xor1-b');
        assert.equal(connectionItems[3].name, 'b-and1-b');
        assert.equal(connectionItems[4].name, 'xor1-q-s');
        assert.equal(connectionItems[5].name, 'and1-q-c');

        // ????????? rs ??????
        let rsGate1 = LogicModuleFactory.createModuleInstance(packageName, 'rs', 'rs1');
        assert.equal(rsGate1.name, 'rs1');
        assert.equal(rsGate1.getPackageName(), packageName);
        assert.equal(rsGate1.getModuleClassName(), 'rs');

    });

    it('Test module state controller - Half Adder', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);
        let signal1 = Signal.createWithoutHighZ(1, binary1);

        let packageName = 'package-by-config';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let halfAdder1 = LogicModuleFactory.createModuleInstance(packageName, 'half_adder', 'half_adder1');
        let moduleStateController1 = new ModuleStateController(halfAdder1);

        assert(moduleStateController1.logicModule == halfAdder1);
        assert.equal(moduleStateController1.allLogicModulesForRead.length, 3); // ?????????????????? + ?????? Half-Adder ?????????
        assert.equal(moduleStateController1.allLogicModulesForWrite.length, 3);
        assert.equal(moduleStateController1.logicModuleCount, 3);

        let A = halfAdder1.getPin('A');
        let B = halfAdder1.getPin('B');
        let S = halfAdder1.getPin('S');
        let C = halfAdder1.getPin('C');

        // Half-Adder
        // A B C S
        // 0 0 0 0
        // 0 1 0 1
        // 1 0 0 1
        // 1 1 1 0

        // ??????????????????????????????????????????????????? 0?????????????????????
        let moves1 = moduleStateController1.update();
        assert.equal(moves1, 1); // ??????????????????
        assert(Signal.equal(S.getSignal(), signal0));
        assert(Signal.equal(C.getSignal(), signal0));

        // ????????????????????? 0,1
        A.setSignal(signal0);
        B.setSignal(signal1);

        let moves2 = moduleStateController1.update();
        assert.equal(moves2, 1);
        assert(Signal.equal(S.getSignal(), signal1));
        assert(Signal.equal(C.getSignal(), signal0));

        // ????????????????????? 1,0
        A.setSignal(signal1);
        B.setSignal(signal0);
        let moves3 = moduleStateController1.update();
        assert.equal(moves3, 1);
        assert(Signal.equal(S.getSignal(), signal1));
        assert(Signal.equal(C.getSignal(), signal0));

        // ????????????????????? 1,1
        A.setSignal(signal1);
        B.setSignal(signal1);
        let moves4 = moduleStateController1.update();
        assert.equal(moves4, 1);
        assert(Signal.equal(S.getSignal(), signal0));
        assert(Signal.equal(C.getSignal(), signal1));
    });

    it('Test module state controller - RS NOR latch', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);
        let signal1 = Signal.createWithoutHighZ(1, binary1);

        let packageName = 'package-by-config';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let rs1 = LogicModuleFactory.createModuleInstance(packageName, 'rs', 'rs1');

        let moduleStateController1 = new ModuleStateController(rs1);

        assert(moduleStateController1.logicModule == rs1);
        assert.equal(moduleStateController1.allLogicModulesForRead.length, 3); // ?????????????????? + ?????? RS ?????????
        assert.equal(moduleStateController1.allLogicModulesForWrite.length, 3);
        assert.equal(moduleStateController1.logicModuleCount, 3);

        let R = rs1.getPin('R');
        let S = rs1.getPin('S');
        let Q = rs1.getPin('Q');
        let Qneg = rs1.getPin('_Q');

        // RS
        // R S Q _Q
        // 1 0 0  1
        // 0 0 0  1
        // 0 1 1  0
        // 0 0 1  0

        // ??????????????????????????????????????????????????? 0?????????????????????
        //
        // RS ???????????????????????? 0,0 ???????????????????????????????????????
        // ??????????????????????????????????????????????????????????????????????????????
        // RS ?????????????????? 0,0????????????????????????????????????

        // ?????????????????????????????? 1,0
        R.setSignal(signal1);
        S.setSignal(signal0);

        let moves1 = moduleStateController1.update();
        assert.equal(moves1, 2); // ???2?????????
        assert(Signal.equal(Q.getSignal(), signal0));
        assert(Signal.equal(Qneg.getSignal(), signal1));

        // ????????????????????? 0,0
        R.setSignal(signal0);
        S.setSignal(signal0);
        let moves2 = moduleStateController1.update();
        assert.equal(moves2, 1);
        assert(Signal.equal(Q.getSignal(), signal0));
        assert(Signal.equal(Qneg.getSignal(), signal1));

        // ????????????????????? 0,1
        R.setSignal(signal0);
        S.setSignal(signal1);
        let moves3 = moduleStateController1.update();
        assert.equal(moves3, 3);
        assert(Signal.equal(Q.getSignal(), signal1));
        assert(Signal.equal(Qneg.getSignal(), signal0));

        // ????????????????????? 0,0
        R.setSignal(signal0);
        S.setSignal(signal0);
        let moves4 = moduleStateController1.update();
        assert.equal(moves4, 1);
        assert(Signal.equal(Q.getSignal(), signal1));
        assert(Signal.equal(Qneg.getSignal(), signal0));
    });

    it('Test module state controller - Oscillation', async () => {
        let packageName = 'package-by-config';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let oscillation1 = LogicModuleFactory.createModuleInstance(packageName, 'oscillation', 'oscillation1');
        let moduleStateController1 = new ModuleStateController(oscillation1);
        assert.equal(moduleStateController1.logicModuleCount, 6);

        try {
            moduleStateController1.update();
            assert.fail();
        } catch (e) {
            assert(e instanceof OscillatingException);
            // ?????????????????? or2 -> or0 -> nor1 ?????????????????? moduleStateController ??????
            // ????????????????????????????????????????????????????????????????????????????????? step() ??????????????????????????????
            let issuedLogicModuleNames = e.logicModules.map(item => item.name);
            issuedLogicModuleNames.sort();
            assert(ObjectUtils.arrayEquals(issuedLogicModuleNames, ['or2', 'or3']));
        }
    });
});