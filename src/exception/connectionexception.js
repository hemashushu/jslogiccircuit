const { Exception } = require('jsexception');

/**
 * 线路连接异常。
 *
 */
class ConnectionException extends Exception {
    constructor(message = 'Pin connection error.',
        previousLogicModule, previousPin,
        nextLogicModule, nextPin) {
        super(message, null);

        this.connection = {
            previousLogicModule,
            previousPin,
            nextLogicModule,
            nextPin
        };
    }
}

module.exports = ConnectionException;