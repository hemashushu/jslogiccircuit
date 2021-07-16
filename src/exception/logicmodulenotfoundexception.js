const LogicCircuitException = require('./logiccircuitexception');

class LogicModuleNotFoundException extends LogicCircuitException {
    constructor(message, packageName, moduleClassName) {
        super(message);

        this.packageName = packageName;
        this.moduleClassName = moduleClassName;
    }
}

module.exports = LogicModuleNotFoundException;