/**
 * LogicModule 类的配置信息
 */
class LogicModuleItem {
    /**
     *
     * @param {*} packageName 逻辑模块的名称。在同一个逻辑包里，逻辑模块名称必须是唯一的。
     * @param {*} moduleClassName 模块实现的名称，注意这有区别于模块实例的名称
     * @param {*} moduleClass AbstractLogicModule 的实现或一个 YAML 配置对象。
     * @param {*} defaultParameters 模块的默认参数
     * @param {*} title 逻辑模块的标题，可本地化。
     *     title 不同于 moduleClassName，title 用于给人阅读，
     *     而 moduleClassName 主要用于程序内部标识（id）作用。
     * @param {*} group 分组名称，一个字符串，可本地化。
     * @param {*} moduleDirectory 模块的本地文件路径
     * @param {*} iconFilename 模块的图标文件名称，图标一般为 512x512 的 PNG 格式图片。
     * @param {*} description 模块的描述及说明文本。可本地化。
     * @param {*} pins 对输入输出端口的描述，name 支持正则表达式，description 可本地化。
     * @param {*} document 模块的详细说明文档，Markdown 格式。可本地化。
     *
     */
    constructor(
        packageName,
        moduleClassName,
        moduleClass,
        defaultParameters = {},
        title,
        group,
        moduleDirectory,
        iconFilename,
        description,
        pins,
        document) {

        this.packageName = packageName;
        this.moduleClassName = moduleClassName;
        this.moduleClass = moduleClass;
        this.defaultParameters = defaultParameters;

        this.title = title;
        this.group = group;
        this.moduleDirectory = moduleDirectory;
        this.iconFilename = iconFilename;
        this.description = description;
        this.pins = pins;
        this.document = document;
    }
}

module.exports = LogicModuleItem;