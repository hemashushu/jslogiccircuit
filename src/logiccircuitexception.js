class LogicCircuitException extends Error {
    constructor(message = 'Logic circuit error.') {
        super(message);
    }
}

module.exports = LogicCircuitException;