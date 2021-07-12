const LogicCircuitException = require('./logiccircuitexception');

class OscillatingException extends LogicCircuitException {
    constructor(message = 'Oscillation circuit detected.', logicModules) {
        super(message, null);

        // 更新之后，输入信号仍不稳定的逻辑模块
        this.logicModules = logicModules;
    }
}

module.exports = OscillatingException;