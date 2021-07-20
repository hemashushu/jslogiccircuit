const ConnectionException = require('./connectionexception');

/**
 * 多线路输入异常。
 *
 * 目前 Pin 只支持单线路输入，
 * 如果一个端口被多条线路连接，则会抛出此异常。
 */
class MultipleInputException extends ConnectionException {
    constructor(message = 'Multiple input error.',
        previousLogicModule, previousPin,
        nextLogicModule, nextPin) {
        super(message,
            previousLogicModule, previousPin,
            nextLogicModule, nextPin);
    }
}

module.exports = MultipleInputException;