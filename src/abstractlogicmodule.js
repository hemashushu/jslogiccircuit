/**
 * 抽象逻辑模块
 *
 * 相当于 Verilog 的 module。
 */
class AbstractLogicModule {

    /**
     *
     * @param {*} name 模块的名称
     * @param {*} properties 调用构造函数时的各个参数名称及其数值。
     */
    constructor(name, properties) {
        // 模块名称
        this.name = name;

        // 输入的逻辑单元集合
        this.inputUnits = [];

        // 输出的逻辑单元集合
        this.outputUnits = [];

        // 当前模块使用到的所有对时钟信号感知的逻辑单元或者逻辑模块
        //
        // 在模块内创建一个对时钟信号感知的逻辑单元或者逻辑模块时，需要
        // 手动把它添加到这个集合。
        this.allPulseComponents = [];

        // 当前模块的初始参数名称及其数值
        this.propertyBag = new Map();

        for(let name in properties) {
            this.propertyBag.set(name, properties[name]);
        }
    }

    /**
     * 通过名字获取输入单元
     * @param {*} name
     */
    getInputUnit(name) {
        this.inputUnits.find(item => item.name === name);
    }

    /**
     * 通过名字获取输出单元
     * @param {*} name
     */
    getOutputUnit(name) {
        this.outputUnits.find(item => item.name === name);
    }

    /**
     * 时钟触发信号到来。
     */
    pulse() {
        for(let pulseComponent of this.allPulseComponents) {
            pulseComponent.pulse();
        }
    }
}

// 模块的类型赋一个名称，该名称用于构造模块实例。
// 当实现（implement）一个新模块时，都需要覆盖它的 'className' 属性。
AbstractLogicModule.className = 'abstractLogicModule';

module.exports = AbstractLogicModule;