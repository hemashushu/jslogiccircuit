const { AbstractLogicModule } = require('../../../../../../index');

class ParentModuleSimulation extends AbstractLogicModule {

    constructor(packageName, moduleClassName, name) {
        super(packageName, moduleClassName, name);
    }

    // override
    updateModuleState() {
        //
    }
}


module.exports = ParentModuleSimulation;