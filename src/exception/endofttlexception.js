const LogicCircuitException = require('./logiccircuitexception');

class EndOfTTLException extends LogicCircuitException {
    constructor(message='end of TTL error.', moduleName) {
        super(message, {
            moduleName: moduleName
        });
    }
}

module.exports = EndOfTTLException;