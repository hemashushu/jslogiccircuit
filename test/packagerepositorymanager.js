const path = require('path');
const assert = require('assert/strict');

const { PackageRepositoryManager, LogicPackageNotFoundException } = require('../index');

describe('Test PackageRepositoryManager', ()=>{
    it('Test findPackageDirectoryInfo()', async ()=>{
        let testDirectory = __dirname;
        let testResourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath1 = path.join(testResourceDirectory, 'package-repository-1');
        let repositoryPath2 = path.join(testResourceDirectory, 'package-repository-2');

        let packageRepositoryManager1 = new PackageRepositoryManager();
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath1, true);
        packageRepositoryManager1.addRepositoryDirectory(repositoryPath2, false);

        let packageDirectoryInfo1 = await packageRepositoryManager1.findPackageDirectoryInfo('sample-package');
        assert.equal(packageDirectoryInfo1.packageDirectory, path.join(repositoryPath1, 'sample-package'));
        assert.equal(packageDirectoryInfo1.isReadOnly, true);

        let packageDirectoryInfo2 = await packageRepositoryManager1.findPackageDirectoryInfo('package-by-code');
        assert.equal(packageDirectoryInfo2.packageDirectory, path.join(repositoryPath2, 'package-by-code'));
        assert.equal(packageDirectoryInfo2.isReadOnly, false);

        // 尝试获取一个不存在的逻辑包路径
        try{
            await packageRepositoryManager1.findPackageDirectoryInfo('no-this-package');
            assert.fail();
        }catch(err) {
            assert(err instanceof LogicPackageNotFoundException);
        }
    });
});