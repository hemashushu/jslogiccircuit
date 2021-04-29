const Wire = require('./wire');
const LogicCircuitException = require('./logiccircuitexception');

/**
 * 抽象逻辑模块
 *
 * 相当于 Verilog 的 module。
 *
 * 注：
 *
 * 当需要引用其他 logic package 里的 logic module 时，不能使用 JavaScript 的
 * require() 或者 import() 方法加载然后创建实例，而应该使用
 * LogicModuleFactory.createModuleInstance() 方法创建实例，该方法
 * 能解决模块依赖问题。
 */
class AbstractLogicModule {

    /**
     *
     * @param {*} name 模块实例的名称
     * @param {*} parameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     */
    constructor(name, parameters) {
        // 模块实例的
        this.name = name;

        // 输入的连接线集合
        this.inputWires = [];

        // 输出的连接线集合
        this.outputWires = [];

        // 当前模块的初始参数
        // 一个 {name:value, ...} 对象
        this.parameters = {};

        // 复制一份
        for (let name in parameters) {
            let value = parameters[name];
            this.parameters[name] = value;
        }
    }

    getPackageName() {
        throw new LogicCircuitException('Logic module does not provide package name yet.');
    }

    getModuleClassName() {
        throw new LogicCircuitException('Logic module does not provide class name yet.');
    }

    /**
     * 创建并添加输入连接线
     *
     * @param {*} name 输入线名称
     * @param {*} bitWidth 位宽
     * @returns
     */
    addInputWire(name, bitWidth) {
        let inputWire = new Wire(name, bitWidth);
        this.inputWires.push(inputWire);
        return inputWire;
    }

    /**
     * 创建并添加输出连接线
     *
     * @param {*} name 输出线名称
     * @param {*} bitWidth 位宽
     * @returns
     */
    addOutputWire(name, bitWidth) {
        let outputWire = new Wire(name, bitWidth);
        this.outputWires.push(outputWire);
        return outputWire;
    }

    /**
     * 通过名字获取输入连接线
     * @param {*} name
     */
    getInputWire(name) {
        return this.inputWires.find(item => item.name === name);
    }

    /**
     * 通过名字获取输出连接线
     * @param {*} name
     */
    getOutputWire(name) {
        return this.outputWires.find(item => item.name === name);
    }

    getParameter(name) {
        return this.parameters[name];
    }

    setParameter(name, value) {
        this.parameters[name] = value;
    }

    getUIElement() {
        // 返回当前模块的 UI 元素
    }

    getUIEventManager() {
        // 返回当前模块的 UIEventManager 实例
    }
}

module.exports = AbstractLogicModule;