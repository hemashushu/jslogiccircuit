const LogicCircuitException = require('./logiccircuitexception');

/**
 * 连接工具，用于连接两个连接线
 */
class Connector {
    static connect(previousWire, nextWire) {
        if (previousWire.dataWidth !== nextWire.dataWidth) {
            throw new LogicCircuitException("Wire length does not match.");
        }

        previousWire.addListener(data => {
            nextWire.setData(data);
        });
    }

    static connects(previousWires, nextWires) {
        if (previousWires.length !== nextWires.length) {
            throw new LogicCircuitException("Wires count does not match.");
        }

        for (let idx = 0; idx < previousWires.length; idx++) {
            Connector.connect(previousWires[idx], nextWires[idx]);
        }
    }
}

module.exports = Connector;