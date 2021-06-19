const LogicCircuitException = require('./exception/logiccircuitexception');

/**
 * 连接工具，用于连接两个连接线
 */
class Connector {
    /**
     * 连接两条线
     * @param {*} previousWire
     * @param {*} nextWire
     */
    static connect(previousWire, nextWire) {
        if (previousWire.bitWidth !== nextWire.bitWidth) {
            throw new LogicCircuitException("The bit widths of the two wires do not match.");
        }

        previousWire.addListener(data => {
            nextWire.setData(data);
        });
    }

    /**
     * 连接两组线
     * @param {*} previousWires
     * @param {*} nextWires
     */
    static connects(previousWires, nextWires) {
        if (previousWires.length !== nextWires.length) {
            throw new LogicCircuitException("The amount of wires is inconsistent.");
        }

        for (let idx = 0; idx < previousWires.length; idx++) {
            Connector.connect(previousWires[idx], nextWires[idx]);
        }
    }
}

module.exports = Connector;