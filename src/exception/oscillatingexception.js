const LogicCircuitException = require('./logiccircuitexception');

class OscillatingException extends LogicCircuitException {
    constructor(message = 'Oscillating error.', logicModules) {
        super(message, {
            logicModules: logicModules
        });
    }
}

module.exports = OscillatingException;