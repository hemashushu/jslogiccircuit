const Wire = require('./wire');

/**
 * 抽象逻辑模块
 *
 * 相当于 Verilog 的 module。
 */
class AbstractLogicModule {

    /**
     *
     * @param {*} name 模块实例的名称
     * @param {*} properties 构造当前模块时所需的各种初始参数的名称及其数值。
     */
    constructor(name, properties) {
        // 模块实例的
        this.name = name;

        // 输入的连接线集合
        this.inputWires = [];

        // 输出的连接线集合
        this.outputWires = [];

        // 当前模块使用到的所有对时钟信号感知的连接线或者逻辑模块
        //
        // 在模块内创建一个对时钟信号感知的连接线或者逻辑模块时，需要
        // 手动把它添加到这个集合。
        this.pulseAwareModules = [];

        // 当前模块的初始参数名称及其数值
        this.propertyBag = new Map();

        for(let name in properties) {
            this.propertyBag.set(name, properties[name]);
        }
    }

    /**
     * 创建并添加输入连接线
     *
     * @param {*} name 输入线名称
     * @param {*} dataWidth 数据宽度
     * @returns
     */
    addInputWire(name, dataWidth) {
        let inputWire = new Wire(name, dataWidth);
        this.inputWires.push(inputWire);
        return inputWire;
    }

    /**
     * 创建并添加输出连接线
     *
     * @param {*} name 输出线名称
     * @param {*} dataWidth 数据宽度
     * @returns
     */
    addOutputWire(name, dataWidth) {
        let outputWire = new Wire(name, dataWidth);
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

    getUIElement() {
        // 返回当前模块的 UI 元素
    }

    getUIEventManager() {
        // 返回当前模块的 UIEventManager 实例
    }

    /**
     * 时钟触发信号到来。
     */
    pulse() {
        for(let pulseAwareModule of this.pulseAwareModules) {
            pulseAwareModule.pulse();
        }
    }
}

// 模块的类型赋一个名称，该名称用于构造模块实例。
// 当实现（implement）一个新模块时，都需要覆盖它的 'className' 属性。
AbstractLogicModule.className = 'abstractLogicModule';

module.exports = AbstractLogicModule;