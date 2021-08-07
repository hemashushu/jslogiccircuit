/**
 * LogicModule 类的配置信息
 */
class LogicModuleItem {
    /**
     *
     * @param {*} packageName 逻辑包的名称。
     * @param {*} moduleClassName 逻辑模块的名称
     *     模块可以是普通的逻辑模块（或仿真逻辑模块），也可以是一个子模块（包括子模块的子模块）
     *     - 模块的完成名称（moduleClassName）的组成规则：
     *       父模块的名称 + '.' + 模块所在目录的名称
     *     - 如果一个模块不是子模块（即它不从属于其他模块），则其名称恰好是其所在目录的名称。
     *     - 在同一个逻辑包里，逻辑模块（包括普通逻辑模块和仿真逻辑模块）的完整名称必须是唯一的。
     *       也就是说，分别从属于两个不同模块的子模块的自身名称（目录名）是可以相同的。
     *     - 注意模块名称不同于模块实例的名称
     * @param {*} moduleClass AbstractLogicModule 的实现或一个 YAML 配置对象。
     * @param {*} defaultParameters 模块的默认参数
     * @param {*} title 逻辑模块的标题，可本地化。
     *     title 不同于 moduleClassName，title 用于给人阅读，
     *     而 moduleClassName 主要用于程序内部标识（id）作用。
     * @param {*} group 分组名称，一个字符串，可本地化。
     * @param {*} moduleDirectory 模块的本地文件路径
     * @param {*} isSimulation 标记是否为仿真模块，
     *     - 仿真模块不能被外部逻辑包访问，也不能被所在包的普通模块所引用；
     *     - 仿真模块可以引用普通模块；
     *     - 仿真模块可以引用仿真模块；
     * @param {*} iconFilename 模块的图标文件名称，图标一般为 512x512 的 PNG 格式图片。
     * @param {*} description 模块的描述及说明文本。可本地化。
     * @param {*} pins 对输入输出端口的描述，name 支持正则表达式，
     *     description 可本地化，之所以把 pin 的描述放在这里，是因为有些
     *     模块是用代码实现的，它们没有构造配置文件，所以只好写在模块的配置文件里。
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
        isSimulation,
        iconFilename,
        description,
        pins) {

        this.packageName = packageName;
        this.moduleClassName = moduleClassName;
        this.moduleClass = moduleClass;
        this.defaultParameters = defaultParameters;

        this.title = title;
        this.group = group;
        this.moduleDirectory = moduleDirectory;
        this.isSimulation = isSimulation;
        this.iconFilename = iconFilename;
        this.description = description;
        this.pins = pins;
    }
}

module.exports = LogicModuleItem;