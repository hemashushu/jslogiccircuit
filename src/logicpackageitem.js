/**
 * LogicPackage 的配置信息
 */
class LogicPackageItem {

    /**
     *
     * @param {*} name 同 npm package id，每个逻辑包的名称应该是全局/全球唯一的。
     * @param {*} title 逻辑包的标题，可本地化。
     * @param {*} dependencies 依赖包的名称列表
     * @param {*} modules 模块（Class）名称列表
     * @param {*} mainModule 主模块的名称，一个逻辑包可以有一个主模块，当用户“运行”
     *     一个模块包时，主模块则是运行的入口。
     * @param {*} packageDirectory 逻辑包的本地文件路径。
     * @param {*} isReadOnly
     * @param {*} version 版本
     *     package title 跟 package name 不同，package title 主要
     *     是给人阅读，而 package name 主要用作标识（id）作用。
     * @param {*} author 逻辑包的作者名称
     * @param {*} homepage 逻辑包官方主页地址
     * @param {*} iconFilename 包的图标文件名称，图标一般为 512x512 的 PNG 格式图片。
     * @param {*} description 包的描述及说明文本，为 Markdown 格式文本。可本地化。
     */
    constructor(name,
        title,
        dependencies = [],
        modules = [],
        mainModule,
        packageDirectory,
        isReadOnly,
        version,
        author,
        homepage,
        iconFilename,
        description) {

        this.name = name;
        this.title = title;

        this.dependencies = dependencies;
        this.modules = modules;
        this.mainModule = mainModule;

        this.packageDirectory = packageDirectory;
        this.isReadOnly = isReadOnly;
        this.version = version;
        this.author = author;
        this.homepage = homepage;
        this.iconFilename = iconFilename;
        this.description = description;

        // 摘抄 NPM package 的命名规则：
        // Below is a list of rules that valid npm package name should conform to.
        //
        // - package name length should be greater than zero
        // - all the characters in the package name must be lowercase i.e., no uppercase or mixed case names are allowed
        // - package name can consist of hyphens
        // - package name must not contain any non-url-safe characters (since name ends up being part of a URL)
        // - package name should not start with . or _
        // - package name should not contain any leading or trailing spaces
        // - package name should not contain any of the following characters: ~)('!*
        // - package name cannot be the same as a node.js/io.js core module nor a reserved/blacklisted name. For example, the following names are invalid:
        // - http
        // - stream
        // - node_modules
        // - favicon.ico
        // - package name length cannot exceed 214
        //
        // https://github.com/npm/validate-npm-package-name

    }
}

module.exports = LogicPackageItem;