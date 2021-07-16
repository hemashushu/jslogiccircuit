const path = require('path');
const assert = require('assert/strict');

const { PackageResourceLocator } = require('../index');

const BASE_CONFIG_FILE_NAME = 'package.json';
const DETAIL_CONFIG_FILE_NAME = 'logic-package.yaml';
const MODULE_DIRECTORY_NAME = 'module';
const MODULE_VALIDATE_DIRECTORY_NAME = 'validate'
const DATA_DIRECTORY_NAME = 'data';
const DOCUMENT_DIRECTORY_NAME = 'doc';
const SOURCE_DIRECTORY_NAME = 'src';
const TEST_DIRECTORY_NAME ='test';

const MODULE_CONFIG_FILE_NAME = 'logic-module.yaml';
const MODULE_STRUCT_FILE_NAME = 'struct.yaml'

describe('Test package and module resource locator', ()=>{
    it('Test PackageResourceLocator', ()=>{
        let testDirectory = __dirname;
        let resourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath1 = path.join(resourceDirectory, 'package-repository-1');
        let packagePath1 = path.join(repositoryPath1, 'sample-package');

        let packageResourceLocator1 = PackageResourceLocator.create(packagePath1);

        assert.equal(packageResourceLocator1.getPackagePath(),
            packagePath1);

        assert.equal(packageResourceLocator1.getBaseConfigFilePath(),
            path.join(packagePath1, BASE_CONFIG_FILE_NAME));

        assert.equal(packageResourceLocator1.getDetailConfigFilePath(),
            path.join(packagePath1, DETAIL_CONFIG_FILE_NAME));

        assert.equal(packageResourceLocator1.getModuleDirectory(),
            path.join(packagePath1, MODULE_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getModuleValidateDirectory(),
            path.join(packagePath1, MODULE_VALIDATE_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getDataDirectory(),
            path.join(packagePath1, DATA_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getDocumentDirectory(),
            path.join(packagePath1, DOCUMENT_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getSourceDirectory(),
            path.join(packagePath1, SOURCE_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getTestDirectory(),
            path.join(packagePath1, TEST_DIRECTORY_NAME    ));
    });

    it('Test ModuleResourceLocator',()=>{
        let testDirectory = __dirname;
        let resourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath1 = path.join(resourceDirectory, 'package-repository-1');
        let packagePath1 = path.join(repositoryPath1, 'sample-package');

        let packageResourceLocator1 = PackageResourceLocator.create(packagePath1);
        let moduleResourceLocator1 = packageResourceLocator1.createModuleResourceLocator('my-module');

        let modulePath = moduleResourceLocator1.getModulePath();
        assert.equal(modulePath,
            path.join(packageResourceLocator1.getModuleDirectory(), 'my-module'));

        assert.equal(moduleResourceLocator1.getModuleValidatePath(),
            path.join(packageResourceLocator1.getModuleValidateDirectory(), 'my-module'));

        assert.equal(moduleResourceLocator1.getConfigFilePath(),
            path.join(modulePath, MODULE_CONFIG_FILE_NAME));

        assert.equal(moduleResourceLocator1.getStructFilePath(),
            path.join(modulePath, MODULE_STRUCT_FILE_NAME));
    });
});