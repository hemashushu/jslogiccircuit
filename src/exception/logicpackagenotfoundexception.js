const LogicCircuitException = require('./logiccircuitexception');

class LogicPackageNotFoundException extends LogicCircuitException {
    constructor(message, packageName) {
        super(message);

        this.packageName = packageName;
    }
}

module.exports = LogicPackageNotFoundException;