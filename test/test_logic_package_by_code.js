const path = require('path');
const assert = require('assert/strict');

const { Binary } = require('jsbinary');
const { ObjectUtils, ObjectComposer } = require('jsobjectutils');
const { LogicPackageLoader, LogicModuleLoader, LogicModuleFactory, Connector, Wire } = require('../index');

describe('Test LogicPackageLoader', () => {
    it('Test load packages', async () => {
        let packageName = 'sample_logic_package_by_code';
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        let logicPackageItem = await LogicPackageLoader.loadLogicPackage(testResourcePath, packageName);

        let expectLogicPackageItem = {
            packageName: 'sample_logic_package_by_code',
            version: '1.0.0',
            dependencies: [],
            modules: ['and-gate', 'xor-gate'],
            packageTitle: 'Sample Logic Package (Code)',
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

        assert(ObjectUtils.arrayEquals(moduleClassNames, ['and-gate', 'xor-gate']));

        let checkPropNames = [
            'packageName',
            'moduleClassName',
            'defaultParameters',
            'title',
            'iconFilename',
            'description'
        ];

        let logicModuleItem1 = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassNames[0]);

        let expectAndGateLogicModuleItem = {
            packageName: 'sample_logic_package_by_code',
            moduleClassName: 'and-gate',
            //moduleClass: [class AndGate extends AbstractLogicModule],
            defaultParameters: { inputWireCount: 2, bitWidth: 1 },
            title: 'AND Gate',
            iconFilename: 'icon.png',
            description: 'Logic "AND" Gate'
        };

        assert(ObjectUtils.equals(
            ObjectComposer.compose(logicModuleItem1, checkPropNames),
            expectAndGateLogicModuleItem
        ));

        let logicModuleItem2 = LogicModuleLoader.getLogicModuleItemByName(packageName, moduleClassNames[1]);

        let expectXorGateLogicModuleItem = {
            packageName: 'sample_logic_package_by_code',
            moduleClassName: 'xor-gate',
            // moduleClass: [class XorGate extends AbstractLogicModule],
            defaultParameters: {},
            title: 'XOR Gate',
            iconFilename: 'icon.png',
            description: 'Logic "XOR" Gate'
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

        let and1 = LogicModuleFactory.createModuleInstance(packageName, 'and-gate', 'and1'); //, {bitWidth: 2, inputWireCount: 4});

        assert.equal(and1.getPackageName(), packageName);
        assert.equal(and1.getModuleClassName(), 'and-gate');

        let andIn0 = and1.getInputWire('in0');
        let andIn1 = and1.getInputWire('in1');
        let andOut = and1.getOutputWire('out');

        assert.equal(andIn0.name, 'in0');
        assert.equal(andIn0.bitWidth, 1);
        assert(Binary.equals(andIn0.data, Binary.fromDecimalString(0,1)));

        assert.equal(andIn1.name, 'in1');
        assert.equal(andIn1.bitWidth, 1);
        assert(Binary.equals(andIn1.data, Binary.fromDecimalString(0,1)));

        assert.equal(andOut.name, 'out');
        assert.equal(andOut.bitWidth, 1);
        assert(Binary.equals(andOut.data, Binary.fromDecimalString(0,1)));

    });
});