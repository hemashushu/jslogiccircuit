class LogicPackageItem {

    /**
     *
     * @param {*} packageName 同 npm package id
     * @param {*} packageTitle 逻辑包的标题，跟 package name 不同，标题主要
     *     是给人阅读的，而 package name 则是程序内部用作标识、加载等用途。
     * @param {*} author 逻辑包的作者名称
     * @param {*} email 作者的 Email
     * @param {*} homepage 逻辑包官方主页地址
     */
    constructor(packageName, packageTitle,
        author, email, homepage) {

        this.packageName = packageName;
        this.packageTitle = packageTitle;
        this.author = author;
        this.email = email;
        this.homepage = homepage;
    }
}

module.exports = LogicPackageItem;