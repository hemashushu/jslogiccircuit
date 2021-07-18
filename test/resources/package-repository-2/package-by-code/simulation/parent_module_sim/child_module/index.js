const { AbstractLogicModule } = require('../../../../../../../index');

class ChildModuleSimulation extends AbstractLogicModule {

    constructor(packageName, moduleClassName, name) {
        super(packageName, moduleClassName, name);
    }

    // override
    updateModuleState() {
        //
    }
}


module.exports = ChildModuleSimulation;