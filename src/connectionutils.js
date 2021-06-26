const LogicCircuitException = require('./exception/logiccircuitexception');
const LogicModulePin = require('./logicmodulepin');

/**
 * 连接工具，用于连接端口
 */
class ConnectionUtils {

    /**
     *
     * @param {*} previousLogicModule
     * @param {*} previousPin
     * @param {*} nextLogicModule
     * @param {*} nextPin
     */
    // static connect(previousLogicModule, previousPin,
    //     nextLogicModule, nextPin) {
    static connect(previousPin, nextPin) {
        if (previousPin.bitWidth !== nextPin.bitWidth) {
            throw new LogicCircuitException("Pin bit width does not match.");
        }

        // let nextLogicModulePin = new LogicModulePin(nextLogicModule, nextPin);
//         previousPin.addNextLogicModulePin(nextLogicModulePin);
//
//         let previousLogicModulePin = new LogicModulePin(previousLogicModule, previousPin);
//         nextPin.setPreviousLogicModulePin(previousLogicModulePin);
        previousPin.addNextPin(nextPin);
    }
}

module.exports = ConnectionUtils;