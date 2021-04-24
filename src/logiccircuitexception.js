class LogicCircuitException extends Error {
    constructor(message = 'logic circuite error.') {
        super(message);
    }
}

module.exports = LogicCircuitException;