const { Exception } = require('jsexception');

class LogicCircuitException extends Exception {
    constructor(message = 'Logic circuit error.', cause) {
        super(message, cause);
    }
}

module.exports = LogicCircuitException;