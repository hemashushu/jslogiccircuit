const path = require('path');
const assert = require('assert/strict');

const { Binary } = require('jsbinary');
const { ObjectUtils, ObjectComposer } = require('jsobjectutils');

const {
    PackageRepositoryManager,
    PackageResourceLocator,
    LogicPackageLoader,
    LogicModuleLoader,
    LogicModuleFactory,
    ModuleController,
    Signal } = require('../index');

describe('Test package-by-code', () => {
    it('Test load packages', async () => {
        let packageName = 'package-by-code';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, true);
        let logicPackageItem = await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        assert.equal(logicPackageItem.packageDirectory,
            path.join(repositoryPath2, packageName));

        let checkPropNames = [
            'name',
            'title',
            'dependencies',
            // 'modules',
            'mainSimulationModule',
            'isReadOnly',
            'version',
            'author',
            'homepage',
            'iconFilename',
            'description'
        ];

        let expectLogicPackageItem = {
            name: 'package-by-code',
            title: 'Sample Logic Package (Code)',
            dependencies: [],
            // modules: ['and_gate', 'and_gate_ext', 'nor_gate', 'or_gate', 'xor_gate'],
            mainSimulationModule: 'and_gate_sim',
            isReadOnly: true,
            version: '1.0.0',
            author: 'Hippo Spark',
            homepage: 'https://github.com/hemashushu/jslogiccircuit',
            iconFilename: 'icon.png',
            description: 'A logic package for unit testing.'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicPackageItem, checkPropNames),
            expectLogicPackageItem));

        let logicPackageItems = LogicPackageLoader.getLogicPackageItems();
        assert.equal(logicPackageItems.length, 1);
        assert(logicPackageItems[0] === logicPackageItem);
    });

    it('Test load modules', async () => {
        let packageName = 'package-by-code';
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
            ['and_gate', 'and_gate_ext', 'nor_gate', 'or_gate',
            'parent_module', 'parent_module$child_module' ,'parent_module$child_module$mu_module' ,
            'xor_gate']));

        let checkPropNames = [
            'packageName',
            'moduleClassName',
            'defaultParameters',
            'title',
            'group',
            'isSimulation',
            'iconFilename',
            'description',
            'pins'
        ];

        let logicModuleItem1 = LogicModuleLoader.getLogicModuleItemByName(packageName, 'and_gate');

        // 检查模块目录
        let packageResourceLocator1 = PackageResourceLocator.create(logicPackageItem1.packageDirectory);
        let moduleResourceLocator1 = packageResourceLocator1.createModuleResourceLocator('', 'and_gate');

        assert.equal(
            logicModuleItem1.moduleDirectory,
            moduleResourceLocator1.getModuleDirectory());

        // 检查模块的属性
        let expectAndGateLogicModuleItem = {
            packageName: 'package-by-code',
            moduleClassName: 'and_gate',
            defaultParameters: {},
            title: 'AND Gate',
            group: 'Logic',
            isSimulation: false,
            iconFilename: 'icon.png',
            description: 'Logic "AND" Gate',
            pins: [
                { name: 'A', description: 'Input pin A' },
                { name: 'B', description: 'Input pin B' },
                { name: 'Q', description: 'Output pin Q. The value of Q is `A & B`' }
            ]
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem1, checkPropNames),
            expectAndGateLogicModuleItem
        ));

        let logicModuleItem2 = LogicModuleLoader.getLogicModuleItemByName(packageName, 'and_gate_ext');

        let expectAndGateExtLogicModuleItem = {
            packageName: 'package-by-code',
            moduleClassName: 'and_gate_ext',
            defaultParameters: { inputPinCount: 2, bitWidth: 1 },
            title: 'AND Gate Ext',
            group: 'Logic',
            isSimulation: false,
            iconFilename: 'icon.png',
            description: 'Logic "AND" Gate Extension',
            pins: []
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem2, checkPropNames),
            expectAndGateExtLogicModuleItem
        ));

        // 检查父子模块
        let logicModuleItem3 = LogicModuleLoader.getLogicModuleItemByName(packageName, 'parent_module');
        assert.equal(logicModuleItem3.moduleClassName, 'parent_module');

        let logicModuleItem4 = LogicModuleLoader.getLogicModuleItemByName(packageName, 'parent_module$child_module');
        assert.equal(logicModuleItem4.moduleClassName, 'parent_module$child_module');

        let moduleResourceLocator2 = packageResourceLocator1.createModuleResourceLocator('parent_module', 'child_module');

        assert.equal(
            logicModuleItem4.moduleDirectory,
            moduleResourceLocator2.getModuleDirectory());
    });

    it('Test module factory', async () => {
        let packageName = 'package-by-code';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let andGateExt1 = LogicModuleFactory.createModuleInstance(packageName, 'and_gate_ext', 'and1');

        assert.equal(andGateExt1.name, 'and1');
        assert(ObjectUtils.isEmpty(andGateExt1.instanceParameters));
        assert(ObjectUtils.equals(andGateExt1.defaultParameters, { inputPinCount: 2, bitWidth: 1 }));
        assert(ObjectUtils.equals(andGateExt1.parameters, { inputPinCount: 2, bitWidth: 1 }));
        assert.equal(andGateExt1.getPackageName(), packageName);
        assert.equal(andGateExt1.getModuleClassName(), 'and_gate_ext');
        assert.equal(andGateExt1.getParameter('inputPinCount'), 2);
        assert.equal(andGateExt1.getParameter('bitWidth'), 1);
        // assert(!andGateExt1.isInputSignalChanged);
        // assert(!andGateExt1.isOutputSignalChanged);

        let andIn0 = andGateExt1.getPin('in0');
        let andIn1 = andGateExt1.getPin('in1');
        let andOut = andGateExt1.getPin('out');

        let binary0 = Binary.fromDecimalString(0, 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);

        assert.equal(andIn0.name, 'in0');
        assert.equal(andIn0.bitWidth, 1);
        assert(Signal.equal(andIn0.getSignal(), signal0));

        assert.equal(andIn1.name, 'in1');
        assert.equal(andIn1.bitWidth, 1);
        assert(Signal.equal(andIn1.getSignal(), signal0));

        assert.equal(andOut.name, 'out');
        assert.equal(andOut.bitWidth, 1);
        assert(Signal.equal(andOut.getSignal(), signal0));

        // 加入实例化参数
        let andGateExt2 = LogicModuleFactory.createModuleInstance(packageName, 'and_gate_ext', 'and2', { bitWidth: 8, inputPinCount: 4 });
        assert.equal(andGateExt2.getInputPins().length, 4);
        assert.equal(andGateExt2.getPin('in0').bitWidth, 8);
        assert.equal(andGateExt2.getPin('out').bitWidth, 8);

        // 实例化 and 模块
        let andGate1 = LogicModuleFactory.createModuleInstance(packageName, 'and_gate', 'and1');
        assert.equal(andGate1.name, 'and1');
        assert.equal(andGate1.getPackageName(), packageName);
        assert.equal(andGate1.getModuleClassName(), 'and_gate');

//         // 实例化 nor 模块
//         let norGate1 = LogicModuleFactory.createModuleInstance(packageName, 'nor_gate', 'nor1');
//         assert.equal(norGate1.name, 'nor1');
//         assert.equal(norGate1.getPackageName(), packageName);
//         assert.equal(norGate1.getModuleClassName(), 'nor_gate');
//
//         // 实例化 or 模块
//         let orGate1 = LogicModuleFactory.createModuleInstance(packageName, 'or_gate', 'or1');
//         assert.equal(orGate1.name, 'or1');
//         assert.equal(orGate1.getPackageName(), packageName);
//         assert.equal(orGate1.getModuleClassName(), 'or_gate');
//
//         // 实例化 xor 模块
//         let xorGate1 = LogicModuleFactory.createModuleInstance(packageName, 'xor_gate', 'xor1');
//         assert.equal(xorGate1.name, 'xor1');
//         assert.equal(xorGate1.getPackageName(), packageName);
//         assert.equal(xorGate1.getModuleClassName(), 'xor_gate');

        // 实例化子模块
        let childModule1 = LogicModuleFactory.createModuleInstance(packageName, 'parent_module$child_module', 'childModule1');
        assert.equal(childModule1.name, 'childModule1');
        assert.equal(childModule1.getPackageName(), packageName);
        assert.equal(childModule1.getModuleClassName(), 'parent_module$child_module');

    });

    it('Test module controller - AND gate', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);
        let signal1 = Signal.createWithoutHighZ(1, binary1);

        let packageName = 'package-by-code';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let andGate1 = LogicModuleFactory.createModuleInstance(packageName, 'and_gate', 'and1');
        // assert(!andGate1.isInputSignalChanged);
        // assert(!andGate1.isOutputSignalChanged);

        let moduleController1 = new ModuleController(andGate1);
        assert(moduleController1.logicModule == andGate1);
        assert.equal(moduleController1.allLogicModulesForRead.length, 1);
        assert.equal(moduleController1.allLogicModulesForWrite.length, 1);
        assert.equal(moduleController1.logicModuleCount, 1);

        // 测试从初始状态（各输入端口初始值为 0）进入稳定状态
        // assert(andGate1.isInputSignalChanged);
        // assert(!andGate1.isOutputSignalChanged);

        let moves1 = moduleController1.step();
        assert.equal(moves1, 1); // 只需一次更新

        // assert(!andGate1.isInputSignalChanged);
        // assert(!andGate1.isOutputSignalChanged);
        assert(Signal.equal(andGate1.getPin('Q').getSignal(), signal0));

        // 改变输入信号为 1,1
        andGate1.getPin('A').setSignal(signal1);
        andGate1.getPin('B').setSignal(signal1);
        // assert(andGate1.isInputSignalChanged);
        // assert(!andGate1.isOutputSignalChanged);

        let moves2 = moduleController1.step();
        assert.equal(moves2, 1);
        // assert(!andGate1.isInputSignalChanged);
        // assert(andGate1.isOutputSignalChanged);
        assert(Signal.equal(andGate1.getPin('Q').getSignal(), signal1));

        // 改变输入信号为 1,0
        andGate1.getPin('A').setSignal(signal1);
        andGate1.getPin('B').setSignal(signal0);
        // assert(andGate1.isInputSignalChanged);
        // assert(andGate1.isOutputSignalChanged);

        let moves3 = moduleController1.step();
        assert.equal(moves3, 1);
        // assert(!andGate1.isInputSignalChanged);
        // assert(andGate1.isOutputSignalChanged);
        assert(Signal.equal(andGate1.getPin('Q').getSignal(), signal0));
    });

    it('Test module controller - NOR gate', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);
        let signal1 = Signal.createWithoutHighZ(1, binary1);

        let packageName = 'package-by-code';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let norGate1 = LogicModuleFactory.createModuleInstance(packageName, 'nor_gate', 'nor1');
        // assert(!norGate1.isInputSignalChanged);
        // assert(!norGate1.isOutputSignalChanged);

        let moduleController2 = new ModuleController(norGate1);
        assert(moduleController2.logicModule == norGate1);
        assert.equal(moduleController2.allLogicModulesForRead.length, 1);
        assert.equal(moduleController2.allLogicModulesForWrite.length, 1);
        assert.equal(moduleController2.logicModuleCount, 1);

        // 测试从初始状态（各输入端口初始值为 0）进入稳定状态
        // assert(norGate1.isInputSignalChanged);
        // assert(!norGate1.isOutputSignalChanged);

        let movesb1 = moduleController2.step();
        assert.equal(movesb1, 1); // 只需一次更新

        // assert(!norGate1.isInputSignalChanged);
        // assert(norGate1.isOutputSignalChanged);
        assert(Signal.equal(norGate1.getPin('Q').getSignal(), signal1));

        // 改变输入信号为 1,1
        norGate1.getPin('A').setSignal(signal1);
        norGate1.getPin('B').setSignal(signal1);
        // assert(norGate1.isInputSignalChanged);
        // assert(norGate1.isOutputSignalChanged);

        let movesb2 = moduleController2.step();
        assert.equal(movesb2, 1);
        // assert(!norGate1.isInputSignalChanged);
        // assert(norGate1.isOutputSignalChanged);
        assert(Signal.equal(norGate1.getPin('Q').getSignal(), signal0));

        // 改变输入信号为 1,0
        norGate1.getPin('A').setSignal(signal1);
        norGate1.getPin('B').setSignal(signal0);
        // assert(norGate1.isInputSignalChanged);
        // assert(norGate1.isOutputSignalChanged);

        let movesb3 = moduleController2.step();
        assert.equal(movesb3, 1);
        // assert(!norGate1.isInputSignalChanged);
        // assert(!norGate1.isOutputSignalChanged);
        assert(Signal.equal(norGate1.getPin('Q').getSignal(), signal0));
    });
});