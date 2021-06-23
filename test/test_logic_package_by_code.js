const path = require('path');
const assert = require('assert/strict');

const { Binary } = require('jsbinary');
const { ObjectUtils, ObjectComposer } = require('jsobjectutils');
const { LogicPackageLoader, LogicModuleLoader,
    LogicModuleFactory, ModuleController,
    ConnectionUtils, Pin } = require('../index');

describe('Test LogicPackageLoader', () => {
    it('Test load packages', async () => {
        let packageName = 'sample_logic_package_by_code';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        let logicPackageItem = await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let expectLogicPackageItem = {
            name: 'sample_logic_package_by_code',
            title: 'Sample Logic Package (Code)',
            dependencies: [],
            modules: ['and-gate', 'nor-gate'],
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

        assert(ObjectUtils.arrayEquals(moduleClassNames, ['and-gate', 'nor-gate']));

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
            defaultParameters: { inputPinCount: 2, bitWidth: 1 },
            title: 'AND Gate',
            group: 'Base Gates',
            iconFilename: 'icon.png',
            description: 'Logic "AND" Gate',
            document: 'Document about AND gate'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem1, checkPropNames),
            expectAndGateLogicModuleItem
        ));

        let logicModuleItem2 = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassNames[1]);

        let expectXorGateLogicModuleItem = {
            packageName: 'sample_logic_package_by_code',
            moduleClassName: 'nor-gate',
            defaultParameters: {},
            title: 'NOR Gate',
            group: 'Base Gates',
            iconFilename: 'icon.png',
            description: 'Logic "NOR" Gate',
            document: 'Document about NOR gate'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem2, checkPropNames),
            expectXorGateLogicModuleItem
        ));
    });

        it('Test module factory', async () => {
            let packageName = 'sample_logic_package_by_code';
            let testPath = __dirname;
            let testResourcePath = path.join(testPath, 'resources');
            await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

            let andGate1 = LogicModuleFactory.createModuleInstance(packageName, 'and-gate', 'and1'); //, {bitWidth: 2, inputPinCount: 4});

            assert.equal(andGate1.getPackageName(), packageName);
            assert.equal(andGate1.getModuleClassName(), 'and-gate');

            let andIn0 = andGate1.getInputPin('in0');
            let andIn1 = andGate1.getInputPin('in1');
            let andOut = andGate1.getOutputPin('out');

            assert.equal(andIn0.name, 'in0');
            assert.equal(andIn0.bitWidth, 1);
            assert(Binary.equal(andIn0.getData(), Binary.fromDecimalString(0,1)));

            assert.equal(andIn1.name, 'in1');
            assert.equal(andIn1.bitWidth, 1);
            assert(Binary.equal(andIn1.getData(), Binary.fromDecimalString(0,1)));

            assert.equal(andOut.name, 'out');
            assert.equal(andOut.bitWidth, 1);
            assert(Binary.equal(andOut.getData(), Binary.fromDecimalString(0,1)));

            let moduleController1 = new ModuleController(andGate1);
            console.log(moduleController1);
            // assert...

            moduleController1.step();
            console.log(andGate1.getOutputPin('out'));

            andGate1.getInputPin('in0').setData(Binary.fromBinaryString('1', 1));
            andGate1.getInputPin('in1').setData(Binary.fromBinaryString('1', 1));

            moduleController1.step();
            console.log(andGate1.getOutputPin('out'));
        });
});