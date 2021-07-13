const { NotImplementedException } = require('jsexception');

/**
 * 导线接口
 *
 * - JavaScript 没有接口，暂时使用（抽象）类代替
 * - 为简化起见，当前的 AbstractWire 忽略信号的高阻抗状态，只支持
 *   高电平和低电平。
 */
class AbstractWire {
    /**
     * 设置信号值
     * @param {*} signal Signal 对象。
     */
    setSignal(signal) {
        throw new NotImplementedException();
    }

    /**
     * 读取信号值
     * @returns Signal 对象。
     */
    getSignal() {
        throw new NotImplementedException();
    }
}

module.exports = AbstractWire;