const { ObjectUtils } = require('jsobjectutils');
const { NotImplementedException } = require('jsexception');

const Pin = require('./pin');

/**
 * 抽象逻辑模块
 *
 * - 相当于 Verilog 的 module。
 * - 当需要引用其他 logic package 里的 logic module 时，不能使用 JavaScript 的
 *   require() 或者 import() 方法加载然后创建实例，而应该使用
 *   LogicModuleFactory.createModuleInstance() 方法创建实例，该方法
 *   能解决模块的依赖问题。
 *
 * 实例的属性：
 * - instanceName
 * - inputPins
 * - outputPins
 * - instanceParameters
 * - defaultParameters
 * - parameters
 */
class AbstractLogicModule {

    /**
     * 实例化逻辑模块（类）
     *
     * @param {*} instanceName 模块实例的名称
     * @param {*} instanceParameters 创建实例所需的初始参数，一个 {name:value, ...} 对象
     * @param {*} defaultParameters 模块的默认参数（定义模块时所定义的参数）
     */
    constructor(instanceName, instanceParameters = {}, defaultParameters = {}) {
        // 模块实例的名称
        this.instanceName = instanceName;

        // 输入的端口集合
        this.inputPins = [];

        // 输出的端口集合
        this.outputPins = [];

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
     *
     * @returns 返回名称字符串
     */
    getPackageName() {
        // 子类需要重写（override）此方法
        throw new NotImplementedException('Not implemented yet.');
    }

    /**
     * LogicModule 实现的名称
     * 名称需符合 npm package 命名规范
     *
     * @returns 返回名称字符串
     */
    getModuleClassName() {
        // 子类需要重写（override）此方法
        throw new NotImplementedException('Not implemented yet.');
    }

    /**
     * 通过名字获取输入端口实例对象
     * @param {*} name
     * @returns 返回 Pin 实例对象，如果找不到相应的端口，则返回 undefined.
     */
    getInputPin(name) {
        return this.inputPins.find(item => item.name === name);
    }

    /**
     * 通过名字获取输出端口实例对象
     *
     * @param {*} name
     * @returns 返回 Pin 实例对象，如果找不到相应的端口，则返回 undefined.
     */
    getOutputPin(name) {
        return this.outputPins.find(item => item.name === name);
    }

    /**
     * 获取所有输入端口对象。
     *
     * @returns 返回 Pin 实例对象数组
     */
    getInputPins() {
        return this.inputPins;
    }

    /**
     * 获取所有输出端口对象。
     *
     * @returns 返回 Pin 实例对象数组
     */
    getOutputPins() {
        return this.outputPins;
    }

    /**
     * LogicModule 的默认参数
     * 注意这个参数是定义模块时自带的默认配置的默认参数，并非实例参数。
     * 实例化模块时，会将实例参数跟这个默认参数合并作为最终运行时所用的参数。
     *
     * @returns 返回参数对象，{name: value,...}
     */
    getDefaultParameters() {
        return this.defaultParameters;
    }

    /**
     * 实例化当前模块时的参数
     *
     * @returns 返回参数对象，{name: value,...}
     */
    getInstanceParameters() {
        return this.instanceParameters;
    }

    /**
     * 当前实例真正使用的实际参数
     *
     * @returns 返回参数对象，{name: value,...}
     */
    getParameters() {
        return this.parameters;
    }

    /**
     * 获取当前模块实例所使用的实际初始化参数
     *
     * 此参数由实例化时传入的参数与模块类默认参数合并而得。
     *
     * @param {*} name
     * @returns 返回属性值，如果指定属性名称找不到，则返回 undefined.
     */
    getParameter(name) {
        return this.parameters[name];
    }

    /**
     * 创建并添加输入端口
     *
     * @param {*} name 输入端口名称
     * @param {*} bitWidth 位宽
     * @param {*} initialData
     * @param {*} description
     * @param {*} pinNumber
     */
    _addInputPin(name, bitWidth, initialData, description, pinNumber) {
        let inputPin = new Pin(name, bitWidth, initialData, description, pinNumber);
        this.inputPins.push(inputPin);
    }

    /**
     * 创建并添加输出端口
     *
     * @param {*} name 输出端口名称
     * @param {*} bitWidth 位宽
     * @param {*} initialData
     * @param {*} description
     * @param {*} pinNumber
     * @returns
     */
    _addOutputPin(name, bitWidth, initialData, description, pinNumber) {
        let outputPin = new Pin(name, bitWidth, initialData, description, pinNumber);
        this.outputPins.push(outputPin);
    }
}

module.exports = AbstractLogicModule;