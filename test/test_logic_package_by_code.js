const path = require('path');
const assert = require('assert/strict');

const { Binary } = require('jsbinary');
const { ObjectUtils, ObjectComposer } = require('jsobjectutils');
const { LogicPackageLoader, LogicModuleLoader,
    LogicModuleFactory, ModuleController } = require('../index');

describe('Test sample_logic_package_by_code', () => {
    it('Test load packages', async () => {
        let packageName = 'sample_logic_package_by_code';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        let logicPackageItem = await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let expectLogicPackageItem = {
            name: 'sample_logic_package_by_code',
            title: 'Sample Logic Package (Code)',
            dependencies: [],
            modules: ['and-gate', 'and-gate-ext', 'nor-gate', 'or-gate', 'xor-gate'],
            mainModule: 'and-gate',
            version: '1.0.0',
            author: 'Hippo Spark',
            homepage: 'https://github.com/hemashushu/jslogiccircuit',
            iconFilename: 'icon.png',
            description: 'A logic package for unit testing.'
        };

        assert(ObjectUtils.equals(logicPackageItem, expectLogicPackageItem));
    });

    it('Test load modules', async () => {
        let packageName = 'sample_logic_package_by_code';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        let logicPackageItem = await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let moduleClassNames = logicPackageItem.modules;

        // sort module names
        moduleClassNames.sort();

        assert(ObjectUtils.arrayEquals(moduleClassNames, ['and-gate', 'and-gate-ext', 'nor-gate', 'or-gate', 'xor-gate']));

        let checkPropNames = [
            'packageName',
            'moduleClassName',
            'defaultParameters',
            'group',
            'title',
            'iconFilename',
            'description',
            'document'
        ];

        let logicModuleItem1 = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassNames[0]);

        let expectAndGateLogicModuleItem = {
            packageName: 'sample_logic_package_by_code',
            moduleClassName: 'and-gate',
            defaultParameters: {},
            title: 'AND Gate',
            group: 'Logic',
            iconFilename: 'icon.png',
            description: 'Logic "AND" Gate',
            document: 'Document about AND gate'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem1, checkPropNames),
            expectAndGateLogicModuleItem
        ));

        let logicModuleItem2 = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassNames[1]);

        let expectAndGateExtLogicModuleItem = {
            packageName: 'sample_logic_package_by_code',
            moduleClassName: 'and-gate-ext',
            defaultParameters: { inputPinCount: 2, bitWidth: 1 },
            title: 'AND Gate Ext',
            group: 'Logic',
            iconFilename: 'icon.png',
            description: 'Logic "AND" Gate Extension',
            document: 'Document about AND gate extension'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem2, checkPropNames),
            expectAndGateExtLogicModuleItem
        ));

        let logicModuleItem3 = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassNames[2]);

        let expectXorGateLogicModuleItem = {
            packageName: 'sample_logic_package_by_code',
            moduleClassName: 'nor-gate',
            defaultParameters: {},
            title: 'NOR Gate',
            group: 'Logic',
            iconFilename: 'icon.png',
            description: 'Logic "NOR" Gate',
            document: 'Document about NOR gate'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem3, checkPropNames),
            expectXorGateLogicModuleItem
        ));

        let logicModuleItem4 = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassNames[3]);
        assert.equal(logicModuleItem4.moduleClassName, 'or-gate');

        let logicModuleItem5 = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassNames[4]);
        assert.equal(logicModuleItem5.moduleClassName, 'xor-gate');
    });

    it('Test module factory', async () => {
        let packageName = 'sample_logic_package_by_code';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let andGateExt1 = LogicModuleFactory.createModuleInstance(packageName, 'and-gate-ext', 'and1');

        assert.equal(andGateExt1.name, 'and1');
        assert(ObjectUtils.isEmpty(andGateExt1.instanceParameters));
        assert(ObjectUtils.equals(andGateExt1.defaultParameters, { inputPinCount: 2, bitWidth: 1 }));
        assert(ObjectUtils.equals(andGateExt1.parameters, { inputPinCount: 2, bitWidth: 1 }));
        assert.equal(andGateExt1.getPackageName(), packageName);
        assert.equal(andGateExt1.getModuleClassName(), 'and-gate-ext');
        assert.equal(andGateExt1.getParameter('inputPinCount'), 2);
        assert.equal(andGateExt1.getParameter('bitWidth'), 1);
        assert(!andGateExt1.isInputDataChanged);
        assert(!andGateExt1.isOutputDataChanged);

        let andIn0 = andGateExt1.getInputPin('in0');
        let andIn1 = andGateExt1.getInputPin('in1');
        let andOut = andGateExt1.getOutputPin('out');

        let binary0 = Binary.fromDecimalString(0, 1);

        assert.equal(andIn0.name, 'in0');
        assert.equal(andIn0.bitWidth, 1);
        assert(Binary.equal(andIn0.getData(), binary0));

        assert.equal(andIn1.name, 'in1');
        assert.equal(andIn1.bitWidth, 1);
        assert(Binary.equal(andIn1.getData(), binary0));

        assert.equal(andOut.name, 'out');
        assert.equal(andOut.bitWidth, 1);
        assert(Binary.equal(andOut.getData(), binary0));

        // 加入实例化参数
        let andGateExt2 = LogicModuleFactory.createModuleInstance(packageName, 'and-gate-ext', 'and2', { bitWidth: 8, inputPinCount: 4 });
        assert.equal(andGateExt2.getInputPins().length, 4);
        assert.equal(andGateExt2.getInputPin('in0').bitWidth, 8);
        assert.equal(andGateExt2.getOutputPin('out').bitWidth, 8);

        // 实例化 and 模块
        let andGate1 = LogicModuleFactory.createModuleInstance(packageName, 'and-gate', 'and1');
        assert.equal(andGate1.name, 'and1');
        assert.equal(andGate1.getPackageName(), packageName);
        assert.equal(andGate1.getModuleClassName(), 'and-gate');

        // 实例化 nor 模块
        let norGate1 = LogicModuleFactory.createModuleInstance(packageName, 'nor-gate', 'nor1');
        assert.equal(norGate1.name, 'nor1');
        assert.equal(norGate1.getPackageName(), packageName);
        assert.equal(norGate1.getModuleClassName(), 'nor-gate');

        // 实例化 or 模块
        let orGate1 = LogicModuleFactory.createModuleInstance(packageName, 'or-gate', 'or1');
        assert.equal(orGate1.name, 'or1');
        assert.equal(orGate1.getPackageName(), packageName);
        assert.equal(orGate1.getModuleClassName(), 'or-gate');

        // 实例化 xor 模块
        let xorGate1 = LogicModuleFactory.createModuleInstance(packageName, 'xor-gate', 'xor1');
        assert.equal(xorGate1.name, 'xor1');
        assert.equal(xorGate1.getPackageName(), packageName);
        assert.equal(xorGate1.getModuleClassName(), 'xor-gate');
    });

    it('Test module controller - AND gate', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);

        let packageName = 'sample_logic_package_by_code';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let andGate1 = LogicModuleFactory.createModuleInstance(packageName, 'and-gate', 'and1');
        assert(!andGate1.isInputDataChanged);
        assert(!andGate1.isOutputDataChanged);

        let moduleController1 = new ModuleController(andGate1);
        assert(moduleController1.logicModule == andGate1);
        assert.equal(moduleController1.allLogicModulesForRead.length, 1);
        assert.equal(moduleController1.allLogicModulesForWrite.length, 1);
        assert.equal(moduleController1.logicModuleCount, 1);

        // 测试从初始状态（各输入端口初始值为 0）进入稳定状态
        assert(andGate1.isInputDataChanged);
        assert(!andGate1.isOutputDataChanged);

        let moves1 = moduleController1.step();
        assert.equal(moves1, 1); // 只需一次更新

        assert(!andGate1.isInputDataChanged);
        assert(!andGate1.isOutputDataChanged);
        assert(Binary.equal(andGate1.getOutputPin('Q').getData(), binary0));

        // 改变输入信号为 1,1
        andGate1.getInputPin('A').setData(binary1);
        andGate1.getInputPin('B').setData(binary1);
        assert(andGate1.isInputDataChanged);
        assert(!andGate1.isOutputDataChanged);

        let moves2 = moduleController1.step();
        assert.equal(moves2, 1);
        assert(!andGate1.isInputDataChanged);
        assert(andGate1.isOutputDataChanged);
        assert(Binary.equal(andGate1.getOutputPin('Q').getData(), binary1));

        // 改变输入信号为 1,0
        andGate1.getInputPin('A').setData(binary1);
        andGate1.getInputPin('B').setData(binary0);
        assert(andGate1.isInputDataChanged);
        assert(andGate1.isOutputDataChanged);

        let moves3 = moduleController1.step();
        assert.equal(moves3, 1);
        assert(!andGate1.isInputDataChanged);
        assert(andGate1.isOutputDataChanged);
        assert(Binary.equal(andGate1.getOutputPin('Q').getData(), binary0));
    });

    it('Test module controller - NOR gate', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);

        let packageName = 'sample_logic_package_by_code';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let norGate1 = LogicModuleFactory.createModuleInstance(packageName, 'nor-gate', 'nor1');
        assert(!norGate1.isInputDataChanged);
        assert(!norGate1.isOutputDataChanged);

        let moduleController2 = new ModuleController(norGate1);
        assert(moduleController2.logicModule == norGate1);
        assert.equal(moduleController2.allLogicModulesForRead.length, 1);
        assert.equal(moduleController2.allLogicModulesForWrite.length, 1);
        assert.equal(moduleController2.logicModuleCount, 1);

        // 测试从初始状态（各输入端口初始值为 0）进入稳定状态
        assert(norGate1.isInputDataChanged);
        assert(!norGate1.isOutputDataChanged);

        let movesb1 = moduleController2.step();
        assert.equal(movesb1, 1); // 只需一次更新

        assert(!norGate1.isInputDataChanged);
        assert(norGate1.isOutputDataChanged);
        assert(Binary.equal(norGate1.getOutputPin('Q').getData(), binary1));

        // 改变输入信号为 1,1
        norGate1.getInputPin('A').setData(binary1);
        norGate1.getInputPin('B').setData(binary1);
        assert(norGate1.isInputDataChanged);
        assert(norGate1.isOutputDataChanged);

        let movesb2 = moduleController2.step();
        assert.equal(movesb2, 1);
        assert(!norGate1.isInputDataChanged);
        assert(norGate1.isOutputDataChanged);
        assert(Binary.equal(norGate1.getOutputPin('Q').getData(), binary0));

        // 改变输入信号为 1,0
        norGate1.getInputPin('A').setData(binary1);
        norGate1.getInputPin('B').setData(binary0);
        assert(norGate1.isInputDataChanged);
        assert(norGate1.isOutputDataChanged);

        let movesb3 = moduleController2.step();
        assert.equal(movesb3, 1);
        assert(!norGate1.isInputDataChanged);
        assert(!norGate1.isOutputDataChanged);
        assert(Binary.equal(norGate1.getOutputPin('Q').getData(), binary0));
    });
});