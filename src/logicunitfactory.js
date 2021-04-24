const Wire = require('./logicunit/wire');
const Register = require('./logicunit/register');

class LogicUnitFactory {
    static create(className, unitName, dataWidth) {
        switch(className) {
            case 'wire':
                return new Wire(unitName, dataWidth);

            case 'register':
                return new Register(unitName, dataWidth);
        }
    }

    static createWire(unitName, dataWidth) {
        return new Wire(unitName, dataWidth);
    }

    static createRegister(unitName, dataWidth) {
        return new Register(unitName, dataWidth);
    }
}

module.exports = LogicUnitFactory;