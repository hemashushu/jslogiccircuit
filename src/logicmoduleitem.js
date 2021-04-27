class LogicModuleItem {
    /**
     *
     * @param {*} moduleClassName 模块实现的名称，注意这有区别于模块实例的名称
     * @param {*} moduleClass AbstractLogicModule 的实现
     * @param {*} title 逻辑模块的标题，区别于 moduleClassName，title 用于阅读，
     *     而 moduleClassName 主要用于标识（id）作用。
     * @param {*} description 模块的简单描述
     * @param {*} iconFilename 模块的图标文件名称
     */
    constructor(
        moduleClassName,
        moduleClass,
        title,
        description,
        iconFilename) {

        this.moduleClassName = moduleClassName;
        this.moduleClass = moduleClass;

        this.title = title;
        this.description = description;
        this.iconFilename = iconFilename;
    }
}

module.exports = LogicModuleItem;