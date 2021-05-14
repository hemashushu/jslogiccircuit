/**
 * LogicModule 类的配置信息
 */
class LogicModuleItem {
    /**
     *
     * @param {*} packageName 逻辑包的名称。
     * @param {*} moduleClassName 模块实现的名称，注意这有区别于模块实例的名称
     * @param {*} moduleClass AbstractLogicModule 的实现
     * @param {*} defaultParameters 模块的默认参数
     * @param {*} title 逻辑模块的标题，可本地化。
     *     title 不同于 moduleClassName，title 用于给人阅读，
     *     而 moduleClassName 主要用于程序内部标识（id）作用。
     * @param {*} iconFilename 模块的图标文件名称，图标一般为 512x512 的 PNG 格式图片。
     * @param {*} description 模块的描述及说明文本，为 Markdown 格式文本。可本地化。
     */
    constructor(
        packageName,
        moduleClassName,
        moduleClass,
        defaultParameters,
        title,
        iconFilename,
        description) {

        this.packageName = packageName;
        this.moduleClassName = moduleClassName;
        this.moduleClass = moduleClass;
        this.defaultParameters = defaultParameters;

        this.title = title;
        this.iconFilename = iconFilename;
        this.description = description;
    }
}

module.exports = LogicModuleItem;