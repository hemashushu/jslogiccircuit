/**
 * 两个 Pin 的连接信息对象
 */
class ConnectionItem {
    /**
     * - previousModuleName, previousPinName 是信号/数据变化源的模块和端口名称，
     * - nextModuleName, nextPinName 是信号/数据变化的目标模块和端口。
     * - 对于模块和模块之间的连接，
     *   previous pin 即前一个模块的 output pin，
     *   next pin 即下一个模块的 input pin,
     * - 对于模块内部，
     *   - 模块的 input pin 是信号源，内部子模块的 input pin 是信号目标，
     *     此时 previousModuleName 参数的值为 undefined.
     *   - 内部子模块的 output pin 是信号源，模块的 output pin 是信号目标，
     *     此时 nextModuleName 参数的值为 undefined.
     *
     * @param {*} name 连接项对象的名称
     * @param {*} previousModuleName 上游逻辑模块实例的名称
     * @param {*} previousPinName 上游端口的名称
     * @param {*} nextModuleName 下游逻辑模块实例的名称
     * @param {*} nextPinName 下游端口的名称
     */
    constructor(
        name,
        previousModuleName, previousPinName,
        nextModuleName, nextPinName) {
        this.name = name;
        this.previousModuleName = previousModuleName;
        this.previousPinName = previousPinName;
        this.nextModuleName = nextModuleName;
        this.nextPinName = nextPinName;
    }
}

module.exports = ConnectionItem;