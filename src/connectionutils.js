const LogicCircuitException = require('./exception/logiccircuitexception');

/**
 * 连接工具，用于连接端口
 */
class ConnectionUtils {
    /**
     * 连接两个端口
     * @param {*} previousPin
     * @param {*} nextPin
     */
    static connect(previousPin, nextPin) {
        if (previousPin.bitWidth !== nextPin.bitWidth) {
            throw new LogicCircuitException("Pin bit width does not match.");
        }

        previousPin.addDataChangeListener(data => {
            nextPin.setData(data);
        });
    }

    /**
     * 连接两组端口
     * @param {*} previousPins
     * @param {*} nextPins
     */
    static connects(previousPins, nextPins) {
        if (previousPins.length !== nextPins.length) {
            throw new LogicCircuitException("The amount of pins does not match.");
        }

        for (let idx = 0; idx < previousPins.length; idx++) {
            ConnectionUtils.connect(previousPins[idx], nextPins[idx]);
        }
    }
}

module.exports = ConnectionUtils;