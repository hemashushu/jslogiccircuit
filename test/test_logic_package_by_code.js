const path = require('path');
const assert = require('assert/strict');

const { LogicPackageLoader, Connector, Wire } = require('../index');

describe('Test LogicPackageLoader', ()=>{
    it('Test load packages/load modules', async ()=>{
        let testPath = __dirname;
        let testResourcePath = path.join(testPath, 'resources');
        let logicPackageItem = await LogicPackageLoader.loadLogicPackage(testResourcePath,
            'sample_logic_package_by_code');

    });
});