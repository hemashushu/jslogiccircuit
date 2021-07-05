const path = require('path');
const assert = require('assert/strict');

const { Binary } = require('jsbinary');
const { ObjectUtils, ObjectComposer } = require('jsobjectutils');
const { LogicPackageLoader, LogicModuleLoader,
    LogicModuleFactory, ModuleController } = require('../index');

describe('Test sample_logic_package_by_config', () => {
    it('Test load packages', async () => {
        let packageName = 'sample_logic_package_by_config';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        let logicPackageItem = await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let expectLogicPackageItem = {
            name: 'sample_logic_package_by_config',
            title: 'Sample Logic Package (Config)',
            dependencies: ['sample_logic_package_by_code'],
            modules: ['half_adder', 'rs'],
            mainModule: 'half_adder',
            version: '1.0.0',
            author: 'Hippo Spark',
            homepage: 'https://github.com/hemashushu/jslogiccircuit',
            iconFilename: 'icon.png',
            description: 'A logic package for unit testing.'
        };

        assert(ObjectUtils.equals(logicPackageItem, expectLogicPackageItem));

        let logicModuleItems = LogicPackageLoader.getLogicPackageItems();
        assert.equal(logicModuleItems.length, 2);
    });

    it('Test load modules', async () => {
        let packageName = 'sample_logic_package_by_config';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        let logicPackageItem = await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let moduleClassNames = logicPackageItem.modules;

        // sort module names
        moduleClassNames.sort();

        assert(ObjectUtils.arrayEquals(moduleClassNames, ['half_adder', 'rs']));

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

        let expectHalfAdderLogicModuleItem = {
            packageName: 'sample_logic_package_by_config',
            moduleClassName: 'half_adder',
            defaultParameters: {},
            title: 'Half Adder',
            group: 'Combinatorial',
            iconFilename: 'icon.png',
            description: 'Half Adder by XOR and AND Gates',
            document: 'Document about Half Adder'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem1, checkPropNames),
            expectHalfAdderLogicModuleItem
        ));

        let logicModuleItem2 = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassNames[1]);

        let expectRSLatchLogicModuleItem = {
            packageName: 'sample_logic_package_by_config',
            moduleClassName: 'rs',
            defaultParameters: {},
            title: 'RS',
            group: 'Sequential',
            iconFilename: 'icon.png',
            description: 'RS NOR latch',
            document: 'Document about RS NOR latch'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem2, checkPropNames),
            expectRSLatchLogicModuleItem
        ));

    });

    it('Test module factory', async () => {
        let packageName = 'sample_logic_package_by_config';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let halfAdder1 = LogicModuleFactory.createModuleInstance(packageName, 'half_adder', 'half-adder1');

        assert.equal(halfAdder1.name, 'half-adder1');
        assert(ObjectUtils.isEmpty(halfAdder1.instanceParameters));
        assert(ObjectUtils.isEmpty(halfAdder1.defaultParameters));
        assert(ObjectUtils.isEmpty(halfAdder1.parameters));
        assert.equal(halfAdder1.getPackageName(), packageName);
        assert.equal(halfAdder1.getModuleClassName(), 'half_adder');
        assert(!halfAdder1.isInputDataChanged);
        assert(!halfAdder1.isOutputDataChanged);

        assert.equal(halfAdder1.getInputPins().length, 2);
        assert.equal(halfAdder1.getOutputPins().length, 2);
        assert.equal(halfAdder1.getLogicModules().length, 2);
        assert.equal(halfAdder1.getConnectionItems().length, 6);

        let A = halfAdder1.getInputPin('A');
        let B = halfAdder1.getInputPin('B');
        let S = halfAdder1.getOutputPin('S');
        let C = halfAdder1.getOutputPin('C');

        let binary0 = Binary.fromDecimalString(0, 1);

        assert.equal(A.name, 'A');
        assert.equal(A.bitWidth, 1);
        assert(Binary.equal(A.getData(), binary0));

        assert.equal(B.name, 'B');
        assert.equal(B.bitWidth, 1);
        assert(Binary.equal(B.getData(), binary0));

        assert.equal(S.name, 'S');
        assert.equal(S.bitWidth, 1);
        assert(Binary.equal(S.getData(), binary0));

        assert.equal(C.name, 'C');
        assert.equal(C.bitWidth, 1);
        assert(Binary.equal(C.getData(), binary0));

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

        // 实例化 rs 模块
        let rsGate1 = LogicModuleFactory.createModuleInstance(packageName, 'rs', 'rs1');
        assert.equal(rsGate1.name, 'rs1');
        assert.equal(rsGate1.getPackageName(), packageName);
        assert.equal(rsGate1.getModuleClassName(), 'rs');

    });

    it('Test module controller - Half Adder', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);

        let packageName = 'sample_logic_package_by_config';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let halfAdder1 = LogicModuleFactory.createModuleInstance(packageName, 'half_adder', 'half-adder1');
        assert(!halfAdder1.isInputDataChanged);
        assert(!halfAdder1.isOutputDataChanged);
        let moduleController1 = new ModuleController(halfAdder1);

        assert(moduleController1.logicModule == halfAdder1);
        assert.equal(moduleController1.allLogicModulesForRead.length, 3); // 两个内部模块 + 一个 Half-Adder 本模块
        assert.equal(moduleController1.allLogicModulesForWrite.length, 3);
        assert.equal(moduleController1.logicModuleCount, 3);

        let A = halfAdder1.getInputPin('A');
        let B = halfAdder1.getInputPin('B');
        let S = halfAdder1.getOutputPin('S');
        let C = halfAdder1.getOutputPin('C');

        // Half-Adder
        // A B C S
        // 0 0 0 0
        // 0 1 0 1
        // 1 0 0 1
        // 1 1 1 0

        // 测试从初始状态（各输入端口初始值为 0）进入稳定状态
        assert(halfAdder1.isInputDataChanged);
        assert(!halfAdder1.isOutputDataChanged);

        let moves1 = moduleController1.step();
        assert.equal(moves1, 1); // 只需一次更新

        assert(!halfAdder1.isInputDataChanged);
        assert(!halfAdder1.isOutputDataChanged);
        assert(Binary.equal(S.getData(), binary0));
        assert(Binary.equal(C.getData(), binary0));

        // 改变输入信号为 0,1
        A.setData(binary0);
        B.setData(binary1);
        assert(halfAdder1.isInputDataChanged);
        assert(!halfAdder1.isOutputDataChanged);

        let moves2 = moduleController1.step();
        assert.equal(moves2, 1);
        assert(!halfAdder1.isInputDataChanged);
        assert(halfAdder1.isOutputDataChanged);
        assert(Binary.equal(S.getData(), binary1));
        assert(Binary.equal(C.getData(), binary0));

        // 改变输入信号为 1,0
        A.setData(binary1);
        B.setData(binary0);
        let moves3 = moduleController1.step();
        assert.equal(moves3, 1);
        assert(Binary.equal(S.getData(), binary1));
        assert(Binary.equal(C.getData(), binary0));

        // 改变输入信号为 1,1
        A.setData(binary1);
        B.setData(binary1);
        let moves4 = moduleController1.step();
        assert.equal(moves4, 1);
        assert(Binary.equal(S.getData(), binary0));
        assert(Binary.equal(C.getData(), binary1));
    });

    it('Test module controller - RS NOR latch', async () => {
        let binary0 = Binary.fromBinaryString('0', 1);
        let binary1 = Binary.fromBinaryString('1', 1);

        let packageName = 'sample_logic_package_by_config';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let rs1 = LogicModuleFactory.createModuleInstance(packageName, 'rs', 'rs1');
        assert(!rs1.isInputDataChanged);
        assert(!rs1.isOutputDataChanged);
        let moduleController1 = new ModuleController(rs1);

        assert(moduleController1.logicModule == rs1);
        assert.equal(moduleController1.allLogicModulesForRead.length, 3); // 两个内部模块 + 一个 RS 本模块
        assert.equal(moduleController1.allLogicModulesForWrite.length, 3);
        assert.equal(moduleController1.logicModuleCount, 3);

        let R = rs1.getInputPin('R');
        let S = rs1.getInputPin('S');
        let Q = rs1.getOutputPin('Q');
        let Qneg = rs1.getOutputPin('Q_');

        // RS
        // R S Q Q_
        // 1 0 0  1
        // 0 0 0  1
        // 0 1 1  0
        // 0 0 1  0

        // 测试从初始状态（各输入端口初始值为 0）进入稳定状态
        //
        // RS 锁存器在输入值为 0,0 时，输出为保持之前的数据，
        // 至于之前的数据是什么则由具体的实现决定，所以严格来说
        // RS 一开始就输入 0,0，输出的数据是不确定的。

        // 设定第一次输入数据为 1,0
        R.setData(binary1);
        S.setData(binary0);
        assert(rs1.isInputDataChanged);
        assert(!rs1.isOutputDataChanged);

        let moves1 = moduleController1.step();
        assert.equal(moves1, 2); // 需2次更新

        assert(!rs1.isInputDataChanged);
        assert(!rs1.isOutputDataChanged);
        assert(Binary.equal(Q.getData(), binary0));
        assert(Binary.equal(Qneg.getData(), binary1));

        // 改变输入信号为 0,0
        R.setData(binary0);
        S.setData(binary0);
        let moves2 = moduleController1.step();
        assert.equal(moves2, 1);
        assert(Binary.equal(Q.getData(), binary0));
        assert(Binary.equal(Qneg.getData(), binary1));

        // 改变输入信号为 0,1
        R.setData(binary0);
        S.setData(binary1);
        let moves3 = moduleController1.step();
        assert.equal(moves3, 3);
        assert(Binary.equal(Q.getData(), binary1));
        assert(Binary.equal(Qneg.getData(), binary0));

        // 改变输入信号为 0,0
        R.setData(binary0);
        S.setData(binary0);
        let moves4 = moduleController1.step();
        assert.equal(moves4, 1);
        assert(Binary.equal(Q.getData(), binary1));
        assert(Binary.equal(Qneg.getData(), binary0));
    });


});