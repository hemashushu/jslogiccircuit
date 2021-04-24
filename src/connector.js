/**
 * 连接工具，用于连接两个逻辑单元
 */
class Connector {
    static connect(previousLogicUnit, nextLogicUnit) {
        previousLogicUnit.output.push(nextLogicUnit.input);
    }

    static connects(previousLogicUnits, nextLogicUnits) {
        for(let idx=0; idx<previousLogicUnits.length; idx++) {
            Connector.connect(previousLogicUnits[idx], nextLogicUnits[idx]);
        }
    }
}

module.exports = Connector;