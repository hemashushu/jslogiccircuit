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
    ModuleStateController,
    Signal,
    ShortCircuitException } = require('../index');

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
            ['and_gate', 'and_gate_parameter', 'nor_gate', 'or_gate',
                'parallel',
                'parent_module', 'parent_module.child_module', 'parent_module.child_module.grandchild_module',
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
                {
                    name: 'A',
                    description: 'Input pin A',
                    edge: false,
                    negative: false,
                    direction: 'auto'
                    },
                {
                    name: 'B',
                    description: 'Input pin B',
                    edge: false,
                    negative: false,
                    direction: 'auto'
                    },
                {
                    name: 'Q',
                    description: 'Output pin Q. The value of Q is `A & B`',
                    edge: false,
                    negative: false,
                    direction: 'auto'
                    }
            ]
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem1, checkPropNames),
            expectAndGateLogicModuleItem
        ));

        let logicModuleItem2 = LogicModuleLoader.getLogicModuleItemByName(packageName, 'and_gate_parameter');

        let expectAndGateExtLogicModuleItem = {
            packageName: 'package-by-code',
            moduleClassName: 'and_gate_parameter',
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

        let logicModuleItem4 = LogicModuleLoader.getLogicModuleItemByName(packageName, 'parent_module.child_module');
        assert.equal(logicModuleItem4.moduleClassName, 'parent_module.child_module');

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

        let andGateExt1 = LogicModuleFactory.createModuleInstance(packageName, 'and_gate_parameter', 'and1');

        assert.equal(andGateExt1.name, 'and1');
        assert(ObjectUtils.isEmpty(andGateExt1.instanceParameters));
        assert(ObjectUtils.equals(andGateExt1.defaultParameters, { inputPinCount: 2, bitWidth: 1 }));
        assert(ObjectUtils.equals(andGateExt1.parameters, { inputPinCount: 2, bitWidth: 1 }));
        assert.equal(andGateExt1.getPackageName(), packageName);
        assert.equal(andGateExt1.getModuleClassName(), 'and_gate_parameter');
        assert.equal(andGateExt1.getParameter('inputPinCount'), 2);
        assert.equal(andGateExt1.getParameter('bitWidth'), 1);

        let andIn0 = andGateExt1.getPin('in_0');
        let andIn1 = andGateExt1.getPin('in_1');
        let andOut = andGateExt1.getPin('out');

        let binary0 = Binary.fromDecimalString(0, 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);

        assert.equal(andIn0.name, 'in_0');
        assert.equal(andIn0.bitWidth, 1);
        assert(Signal.equal(andIn0.getSignal(), signal0));

        assert.equal(andIn1.name, 'in_1');
        assert.equal(andIn1.bitWidth, 1);
        assert(Signal.equal(andIn1.getSignal(), signal0));

        assert.equal(andOut.name, 'out');
        assert.equal(andOut.bitWidth, 1);
        assert(Signal.equal(andOut.getSignal(), signal0));

        // 加入实例化参数
        let andGateExt2 = LogicModuleFactory.createModuleInstance(packageName, 'and_gate_parameter', 'and2', { bitWidth: 8, inputPinCount: 4 });
        assert.equal(andGateExt2.getInputPins().length, 4);
        assert.equal(andGateExt2.getPin('in_0').bitWidth, 8);
        assert.equal(andGateExt2.getPin('out').bitWidth, 8);

        // 实例化 and 模块
        let andGate1 = LogicModuleFactory.createModuleInstance(packageName, 'and_gate', 'and1');
        assert.equal(andGate1.name, 'and1');
        assert.equal(andGate1.getPackageName(), packageName);
        assert.equal(andGate1.getModuleClassName(), 'and_gate');

        // 实例化子模块
        let childModule1 = LogicModuleFactory.createModuleInstance(packageName, 'parent_module.child_module', 'childModule1');
        assert.equal(childModule1.name, 'childModule1');
        assert.equal(childModule1.getPackageName(), packageName);
        assert.equal(childModule1.getModuleClassName(), 'parent_module.child_module');

    });

    it('Test module state controller - AND gate', async () => {
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

        let moduleStateController1 = new ModuleStateController(andGate1);
        assert(moduleStateController1.logicModule == andGate1);
        assert.equal(moduleStateController1.allLogicModulesForRead.length, 1);
        assert.equal(moduleStateController1.allLogicModulesForWrite.length, 1);
        assert.equal(moduleStateController1.logicModuleCount, 1);

        // 测试从初始状态（各输入端口初始值为 0）进入稳定状态
        let moves1 = moduleStateController1.update();
        assert.equal(moves1, 1); // 只需一次更新

        assert(Signal.equal(andGate1.getPin('Q').getSignal(), signal0));

        // 改变输入信号为 1,1
        andGate1.getPin('A').setSignal(signal1);
        andGate1.getPin('B').setSignal(signal1);

        let moves2 = moduleStateController1.update();
        assert.equal(moves2, 1);
        assert(Signal.equal(andGate1.getPin('Q').getSignal(), signal1));

        // 改变输入信号为 1,0
        andGate1.getPin('A').setSignal(signal1);
        andGate1.getPin('B').setSignal(signal0);

        let moves3 = moduleStateController1.update();
        assert.equal(moves3, 1);
        assert(Signal.equal(andGate1.getPin('Q').getSignal(), signal0));
    });

    it('Test module state controller - NOR gate', async () => {
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

        let moduleStateController2 = new ModuleStateController(norGate1);
        assert(moduleStateController2.logicModule == norGate1);
        assert.equal(moduleStateController2.allLogicModulesForRead.length, 1);
        assert.equal(moduleStateController2.allLogicModulesForWrite.length, 1);
        assert.equal(moduleStateController2.logicModuleCount, 1);

        // 测试从初始状态（各输入端口初始值为 0）进入稳定状态
        let movesb1 = moduleStateController2.update();
        assert.equal(movesb1, 1); // 只需一次更新

        assert(Signal.equal(norGate1.getPin('Q').getSignal(), signal1));

        // 改变输入信号为 1,1
        norGate1.getPin('A').setSignal(signal1);
        norGate1.getPin('B').setSignal(signal1);

        let movesb2 = moduleStateController2.update();
        assert.equal(movesb2, 1);
        assert(Signal.equal(norGate1.getPin('Q').getSignal(), signal0));

        // 改变输入信号为 1,0
        norGate1.getPin('A').setSignal(signal1);
        norGate1.getPin('B').setSignal(signal0);

        let movesb3 = moduleStateController2.update();
        assert.equal(movesb3, 1);
        assert(Signal.equal(norGate1.getPin('Q').getSignal(), signal0));
    });

    it('Test module state controller - Parallel', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);
        let signal1 = Signal.createWithoutHighZ(1, binary1);
        let signalZ = Signal.createHighZ(1);

        let packageName = 'package-by-code';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let parallel1 = LogicModuleFactory.createModuleInstance(packageName, 'parallel', 'parallel1');
        let pin0 = parallel1.getPin('in_0');
        let pin1 = parallel1.getPin('in_1');
        let pinOut = parallel1.getPin('out');

        let moduleStateController1 = new ModuleStateController(parallel1);

        // 测试从初始状态（各输入端口初始值为 0）进入稳定状态
        let movesa1 = moduleStateController1.update();
        assert.equal(movesa1, 1);
        assert(Signal.equal(pin0.getSignal(), signal0));
        assert(Signal.equal(pin1.getSignal(), signal0));
        assert(Signal.equal(pinOut.getSignal(), signal0));

        // 测试 Z - 1
        pin0.setSignal(signalZ);
        pin1.setSignal(signal1);
        moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signal1));

        // 测试 Z - 0
        pin0.setSignal(signalZ);
        pin1.setSignal(signal0);
        moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signal0));

        // 测试 Z - Z
        pin0.setSignal(signalZ);
        pin1.setSignal(signalZ);
        moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signalZ));

        // 测试 1 - 1
        pin0.setSignal(signal1);
        pin1.setSignal(signal1);
        moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signal1));

        // 测试 0 - 0
        pin0.setSignal(signal0);
        pin1.setSignal(signal0);
        moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signal0));

        // 测试短路
        pin0.setSignal(signal1);
        pin1.setSignal(signal0);

        try{
            moduleStateController1.update();
            assert.fail();
        }catch(err) {
            assert(err instanceof ShortCircuitException);
        }

    });

    it('Test module state controller - Parallel - 3 input pins', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);
        let signal0 = Signal.createWithoutHighZ(1, binary0);
        let signal1 = Signal.createWithoutHighZ(1, binary1);
        let signalZ = Signal.createHighZ(1);

        let packageName = 'package-by-code';
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);
        await LogicPackageLoader.loadLogicPackage(packageRepositoryManager1, packageName);

        let parallel1 = LogicModuleFactory.createModuleInstance(packageName, 'parallel', 'parallel1', {
            inputPinCount: 3
        });

        let pin0 = parallel1.getPin('in_0');
        let pin1 = parallel1.getPin('in_1');
        let pin2 = parallel1.getPin('in_2');
        let pinOut = parallel1.getPin('out');

        let moduleStateController1 = new ModuleStateController(parallel1);

        // 测试从初始状态（各输入端口初始值为 0）进入稳定状态
        let movesa1 = moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signal0));

        // 测试 Z - Z - 1
        pin0.setSignal(signalZ);
        pin1.setSignal(signalZ);
        pin2.setSignal(signal1);
        moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signal1));

        // 测试 Z - 0 - Z
        pin0.setSignal(signalZ);
        pin1.setSignal(signal0);
        pin2.setSignal(signalZ);
        moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signal0));

        // 测试 1 - 1 - Z
        pin0.setSignal(signal1);
        pin1.setSignal(signal1);
        pin2.setSignal(signalZ);
        moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signal1));

        // 测试 Z - 0 - 0
        pin0.setSignal(signalZ);
        pin1.setSignal(signal0);
        pin2.setSignal(signal0);
        moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signal0));

        // 测试 Z - Z - Z
        pin0.setSignal(signalZ);
        pin1.setSignal(signalZ);
        pin2.setSignal(signalZ);
        moduleStateController1.update();
        assert(Signal.equal(pinOut.getSignal(), signalZ));

        // 测试短路 1 - 0 - Z
        pin0.setSignal(signal1);
        pin1.setSignal(signal0);
        pin2.setSignal(signalZ);

        try{
            moduleStateController1.update();
            assert.fail();
        }catch(err) {
            assert(err instanceof ShortCircuitException);
        }

        // 测试短路 0 - 1 - 0
        pin0.setSignal(signal0);
        pin1.setSignal(signal1);
        pin2.setSignal(signal0);

        try{
            moduleStateController1.update();
            assert.fail();
        }catch(err) {
            assert(err instanceof ShortCircuitException);
        }

    });
});