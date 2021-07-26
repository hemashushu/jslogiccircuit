const path = require('path');

const { PromiseFileUtils } = require('jsfileutils');

const LogicPackageNotFoundException = require('./exception/logicpackagenotfoundexception');

/**
 * 多个逻辑包可以放在同一个目录里，这个目录即逻辑包仓库（repository）
 * 一个典型的应用程序可能有 3 个 package repository:
 * 1. 提供基本模块（比如逻辑门、开关等）的基础包仓库；
 * 2. 由第三方提供/用户下载的扩展包仓库;
 * 3. 用户自己创建的项目的仓库。
 */
class PackageRepositoryManager {
    constructor() {
        // 逻辑包路径列表，排在前面的路径会被先搜索
        // 所以一般先压入基本模块仓库，再压入扩展包仓库，最后
        // 压入用户工作仓库
        //
        // 集合里的元素： {repositoryDirectory: String, isReadOnly: Boolean}
        this.repositoryDirectoryInfos = [];
    }

    addRepositoryDirectory(repositoryDirectory, isReadOnly) {
        this.repositoryDirectoryInfos.push({
            repositoryDirectory: repositoryDirectory,
            isReadOnly: isReadOnly
        });
    }

    /**
     * 根据包名获取包的路径
     *
     * 因为包名同时也是文件夹的名称，所以只需把仓库路径与包名拼接即可
     * 得到包的路径。
     *
     * @param {*} packageName
     * @returns {packageDirectory: String, isReadOnly: Boolean}
     *     如果没找到指定的包名，则抛出 LogicPackageNotFoundException 异常。
     */
    async findPackageDirectoryInfo(packageName) {
        for(let repositoryDirectoryInfo of this.repositoryDirectoryInfos) {
            let repositoryDirectory = repositoryDirectoryInfo.repositoryDirectory;
            let packageDirectory = path.join(repositoryDirectory, packageName);
            if (await PromiseFileUtils.exists(packageDirectory)) {
                return {
                    packageDirectory: packageDirectory,
                    isReadOnly: repositoryDirectoryInfo.isReadOnly
                };
            }
        }

        throw new LogicPackageNotFoundException(
            `Logic package "${packageName}" not found.`, packageName);
    }
}

module.exports = PackageRepositoryManager;