const path = require('path');
const assert = require('assert/strict');

const { PackageRepositoryManager } = require('../index');

describe('Test PackageRepositoryManager', ()=>{
    it('Test findPackagePath()', async ()=>{
        let testDirectory = __dirname;
        let resourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath1 = path.join(resourceDirectory, 'package-repository-1');
        let repositoryPath2 = path.join(resourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath1);
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2);

        let packagePath1 = await packageRepositoryManager1.findPackagePath('sample-package');
        assert.equal(packagePath1, path.join(repositoryPath1, 'sample-package'));

        let packagePath2 = await packageRepositoryManager1.findPackagePath('package-by-code');
        assert.equal(packagePath2, path.join(repositoryPath2, 'package-by-code'));

        // 尝试获取一个不存在的逻辑包路径
        let packagePath3 = await packageRepositoryManager1.findPackagePath('no-this-package');
        assert(packagePath3 === undefined);
    });
});