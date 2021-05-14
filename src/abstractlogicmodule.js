const Wire = require('./wire');
const { ObjectUtils } = require('jsobjectutils');

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
     * 实例化逻辑模块（类）
     *
     * @param {*} instanceName 模块实例的名称
     * @param {*} instanceParameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     */
    constructor(instanceName, instanceParameters, defaultParameters) {
        // 模块实例的
        this.instanceName = instanceName;

        // 输入的连接线集合
        this.inputWires = [];

        // 输出的连接线集合
        this.outputWires = [];

        // 实例化当前模块的初始参数
        // 一个 {name:value, ...} 对象
        this.instanceParameters = instanceParameters;

        // 模块的默认参数
        // 模块的默认参数是由配置文件 “logic-module.yaml” 配置的，
        // 所以需要在实例化时一起传入。
        this.defaultParameters = defaultParameters;

        // 实例实际使用的参数，由实例参数与模块（类）提供的默认参数
        // 合并而得。
        this.parameters = ObjectUtils.objectMerge(
            instanceParameters,
            defaultParameters);
    }

    /**
     * LogicModule 实现所在的包的名称
     * 名称需符合 npm package 命名规范
     */
    getPackageName() {
        // 子类需要重写（override）此方法
        return '';
    }

    /**
     * LogicModule 实现的名称
     * 名称需符合 npm package 命名规范
     */
    getModuleClassName() {
        // 子类需要重写（override）此方法
        return '';
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
    getInputWireByName(name) {
        return this.inputWires.find(item => item.name === name);
    }

    /**
     * 通过名字获取输出连接线
     * @param {*} name
     */
    getOutputWireByName(name) {
        return this.outputWires.find(item => item.name === name);
    }

    getInputWires() {
        return this.inputWires;
    }

    getOutputWires() {
        return this.outputWires;
    }

    /**
     * LogicModule 的默认参数
     * 注意这个参数是配置的默认参数、定义参数，并非实例参数。
     * 实例会将实例参数跟这个默认参数合并作为最终运行时所用的参数。
     */
    getDefaultParameters() {
        return this.defaultParameters;
    }

    getInstanceParameters() {
        return this.instanceParameters;
    }

    getParameters() {
        return this.parameters;
    }

    /**
     * 获取当前模块实例所使用的初始化参数
     *
     * 此参数由实例化时传入的参数与模块类默认参数合并而得。
     *
     * @param {*} name
     * @returns
     */
    getParameterByName(name) {
        return this.parameters[name];
    }

    /**
     * 返回当前模块的 UI 元素
     */
    getUIElement() {
        // 子类需要重写（override）此方法
    }

    /**
     * 返回当前模块的 UIEventManager 实例
     */
    getUIEventManager() {
        // 子类需要重写（override）此方法
    }
}

module.exports = AbstractLogicModule;