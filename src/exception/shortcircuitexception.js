const { Exception } = require('jsexception');

class ShortCircuitException extends Exception {
    constructor(message = 'Short circuit error.', logicModules) {
        super(message, null);

        this.logicModules = logicModules;
    }
}

module.exports = ShortCircuitException;