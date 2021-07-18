const path = require('path');
const assert = require('assert/strict');

const { PackageResourceLocator } = require('../index');

const BASE_CONFIG_FILE_NAME = 'package.json';
const DETAIL_CONFIG_FILE_NAME = 'logic-package.yaml';
const MODULE_DIRECTORY_NAME = 'module';
const TEST_DIRECTORY_NAME = 'test';
const DATA_DIRECTORY_NAME = 'data';
const DOCUMENT_DIRECTORY_NAME = 'doc';
const SIMULATION_DIRECTORY_NAME = 'simulation';
const SOURCE_DIRECTORY_NAME = 'src';
const VALIDATE_DIRECTORY_NAME = 'validate'

const MODULE_CONFIG_FILE_NAME = 'logic-module.yaml';
const MODULE_STRUCT_FILE_NAME = 'struct.yaml'

describe('Test package and module resource locator', () => {
    it('Test PackageResourceLocator', () => {
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

        assert.equal(packageResourceLocator1.getModulesDirectory(),
            path.join(packagePath1, MODULE_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getTestDirectory(),
            path.join(packagePath1, TEST_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getDataDirectory(),
            path.join(packagePath1, DATA_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getDocumentDirectory(),
            path.join(packagePath1, DOCUMENT_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getSimulationsDirectory(),
            path.join(packagePath1, SIMULATION_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getSourceDirectory(),
            path.join(packagePath1, SOURCE_DIRECTORY_NAME));

        assert.equal(packageResourceLocator1.getValidateDirectory(),
            path.join(packagePath1, VALIDATE_DIRECTORY_NAME));
    });

    it('Test ModuleResourceLocator', () => {
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath1 = path.join(testResourceDirectory, 'package-repository-1');
        let packagePath1 = path.join(repositoryPath1, 'sample-package');

        let packageResourceLocator1 = PackageResourceLocator.create(packagePath1);
        let moduleResourceLocator1 = packageResourceLocator1.createModuleResourceLocator('', 'my-module');

        let moduleDirectory1 = moduleResourceLocator1.getModuleDirectory();

        assert.equal(moduleDirectory1,
            path.join(packageResourceLocator1.getModulesDirectory(), 'my-module'));

        assert.equal(moduleResourceLocator1.getModuleTestDirectory(),
            path.join(packageResourceLocator1.getTestDirectory(), 'my-module'));

        assert.equal(moduleResourceLocator1.getConfigFilePath(),
            path.join(moduleDirectory1, MODULE_CONFIG_FILE_NAME));

        assert.equal(moduleResourceLocator1.getStructFilePath(),
            path.join(moduleDirectory1, MODULE_STRUCT_FILE_NAME));

        // 带父模块的模块
        let parentModulePath = path.join('foo', 'bar');
        let moduleResourceLocator2 = packageResourceLocator1.createModuleResourceLocator(parentModulePath, 'child-module');

        let moduleDirectory2 = moduleResourceLocator2.getModuleDirectory();
        assert.equal(moduleDirectory2,
            path.join(packageResourceLocator1.getModulesDirectory(), parentModulePath, 'child-module'));

        // 仿真模块
        let moduleResourceLocator3 = packageResourceLocator1.createModuleResourceLocator('', 'my-module-sim', true);
        let moduleDirectory3 = moduleResourceLocator3.getModuleDirectory();
        assert.equal(moduleDirectory3,
            path.join(packageResourceLocator1.getSimulationsDirectory(), 'my-module-sim'));

    });
});