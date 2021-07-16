const path = require('path');
const assert = require('assert/strict');

const { PackageResourceLocator } = require('../index');

const BASE_CONFIG_FILE_NAME = 'package.json';
const DETAIL_CONFIG_FILE_NAME = 'logic-package.yaml';
const MODULE_DIRECTORY_NAME = 'module';
const VALIDATE_DIRECTORY_NAME = 'validate'
const DATA_DIRECTORY_NAME = 'data';
const DOCUMENT_DIRECTORY_NAME = 'doc';
const SIMULATION_DIRECTORY_NAME = 'simulation';
const SOURCE_DIRECTORY_NAME = 'src';
const MODULE_TEST_DIRECTORY_NAME ='test';

const MODULE_CONFIG_FILE_NAME = 'logic-module.yaml';
const MODULE_STRUCT_FILE_NAME = 'struct.yaml'

describe('Test package and module resource locator', ()=>{
    it('Test PackageResourceLocator', ()=>{
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath1 = path.join(testResourceDirectory, 'package-repository-1');
        let packagePath1 = path.join(repositoryPath1, 'sample-package');

        let packageResourceLocator1 = PackageResourceLocator.create(packagePath1);

        assert.equal(packageResourceLocator1.getPackageDirectory(),
            packagePath1);

        assert.equal(packageResourceLocator1.getBaseConfigFilePath(),
            path.join(packagePath1, BASE_CONFIG_FILE_NAME));

        assert.equal(packageResourceLocator1.getDetailConfigFilePath(),
            path.join(packagePath1, DETAIL_CONFIG_FILE_NAME));

        assert.equal(packageResourceLocator1.getModuleDirectory(),
            path.join(packagePath1, MODULE_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getTestDirectory(),
            path.join(packagePath1, VALIDATE_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getDataDirectory(),
            path.join(packagePath1, DATA_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getDocumentDirectory(),
            path.join(packagePath1, DOCUMENT_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getSimulationDirectory(),
            path.join(packagePath1, SIMULATION_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getSourceDirectory(),
            path.join(packagePath1, SOURCE_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getModuleTestDirectory(),
            path.join(packagePath1, MODULE_TEST_DIRECTORY_NAME    ));
    });

    it('Test ModuleResourceLocator',()=>{
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath1 = path.join(testResourceDirectory, 'package-repository-1');
        let packagePath1 = path.join(repositoryPath1, 'sample-package');

        let packageResourceLocator1 = PackageResourceLocator.create(packagePath1);
        let moduleResourceLocator1 = packageResourceLocator1.createModuleResourceLocator('my-module');

        let moduleDirectory = moduleResourceLocator1.getModuleDirectory();
        assert.equal(moduleDirectory,
            path.join(packageResourceLocator1.getModuleDirectory(), 'my-module'));

        assert.equal(moduleResourceLocator1.getTestDirectory(),
            path.join(packageResourceLocator1.getTestDirectory(), 'my-module'));

        assert.equal(moduleResourceLocator1.getConfigFilePath(),
            path.join(moduleDirectory, MODULE_CONFIG_FILE_NAME));

        assert.equal(moduleResourceLocator1.getStructFilePath(),
            path.join(moduleDirectory, MODULE_STRUCT_FILE_NAME));
    });
});