/**
 * LogicPackage 的配置信息
 */
class LogicPackageItem {

    /**
     *
     * @param {*} packageName 同 npm package id
     * @param {*} dependencies 依赖包的名称列表
     * @param {*} modules 模块（Class）名称列表
     * @param {*} version 版本
     * @param {*} packageTitle 逻辑包的标题，可本地化。
     *     packageTitle 跟 packageName 不同，packageTitle 主要
     *     是给人阅读，而 packageName 主要用于程序内部用作标识（id）作用。
     * @param {*} author 逻辑包的作者名称
     * @param {*} homepage 逻辑包官方主页地址
     * @param {*} iconFilename 包的图标文件名称，图标一般为 512x512 的 PNG 格式图片。
     * @param {*} description 包的描述及说明文本，为 Markdown 格式文本。可本地化。
     */
    constructor(packageName,
        version,
        dependencies,
        modules,
        packageTitle,
        author, homepage,
        iconFilename,
        description) {

        this.packageName = packageName;
        this.version = version;

        this.dependencies = dependencies;
        this.modules = modules;

        this.packageTitle = packageTitle;
        this.author = author;
        this.homepage = homepage;
        this.iconFilename = iconFilename;
        this.description = description;
    }
}

module.exports = LogicPackageItem;