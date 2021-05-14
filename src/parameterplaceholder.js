/**
 * 逻辑模块的参数占位符。
 *
 * 一个逻辑模块可以定义一个或多个构造参数，用于将参数值
 * 传递给内部的逻辑模块实例所使用。
 *
 */
class ParameterPlaceholder {
    constructor(placeholder) {
        this.placeholder = placeholder;
    }
}

module.exports = ParameterPlaceholder;