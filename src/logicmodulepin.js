/**
 * Logic module 对象与 Pin 对象的组合。
 *
 * 用于 Pin 对象对另一个 Pin 对象的连接的引用。
 */
class LogicModulePin {

    /**
     *
     * @param {*} logicModule LogicModule 对象
     * @param {*} pin Pin 对象
     */
    constructor(logicModule, pin) {
        this.logicModule = logicModule;
        this.pin = pin;
    }
}

module.exports = LogicModulePin;