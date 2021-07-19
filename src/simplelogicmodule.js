const AbstractLogicModule = require('./abstractlogicmodule');

class SimpleLogicModule extends AbstractLogicModule {
    constructor(packageName, moduleClassName, name, instanceParameters = {}, defaultParameters = {}) {
        super(packageName, moduleClassName, name, instanceParameters, defaultParameters);
        this.init();
    }

    init() {
        throw new NotImplementedException();
    }
}

module.exports = SimpleLogicModule;