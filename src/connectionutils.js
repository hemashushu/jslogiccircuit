const ConnectionException = require('./exception/connectionexception');
const MultipleInputException = require('./exception/multipleinputexception');

/**
 * 连接工具，用于连接端口
 */
class ConnectionUtils {

    /**
     *
     * @param {*} previousPin
     * @param {*} nextPin
     */
    static connect(previousLogicModule, previousPin, nextLogicModule, nextPin) {
        if (previousPin.bitWidth !== nextPin.bitWidth) {
            throw new ConnectionException(
                'Pin bit width does not match.',
                previousLogicModule, previousPin,
                nextLogicModule, nextPin);
        }

        if (nextPin.hasBeenConnected) {
            throw new MultipleInputException(
                'The pin has already been connected by another pin.',
                previousLogicModule, previousPin,
                nextLogicModule, nextPin);
        }

        previousPin.addNextPin(nextPin);
        nextPin.hasBeenConnected = true;
    }
}

module.exports = ConnectionUtils;