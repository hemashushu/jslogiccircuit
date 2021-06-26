const LogicCircuitException = require('./exception/logiccircuitexception');

/**
 * 连接工具，用于连接端口
 */
class ConnectionUtils {

    /**
     *
     * @param {*} previousPin
     * @param {*} nextPin
     */
    static connect(previousPin, nextPin) {
        if (previousPin.bitWidth !== nextPin.bitWidth) {
            throw new LogicCircuitException("Pin bit width does not match.");
        }

        previousPin.addNextPin(nextPin);
    }
}

module.exports = ConnectionUtils;