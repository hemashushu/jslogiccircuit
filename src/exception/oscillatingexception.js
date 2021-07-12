const LogicCircuitException = require('./logiccircuitexception');

class OscillatingException extends LogicCircuitException {
    constructor(message = 'Oscillation circuit detected.', logicModule) {
        super(message, null);

        // 更新之后仍处于不稳定的逻辑模块
        // 振荡电路一般是由多个模块组成的回路引起的，这里只能获取
        // 回路其中的一个。
        this.logicModule = logicModule;
    }
}

module.exports = OscillatingException;