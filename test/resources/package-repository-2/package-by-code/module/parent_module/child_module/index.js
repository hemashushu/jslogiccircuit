const { AbstractLogicModule } = require('../../../../../../../index');

class ChildModule extends AbstractLogicModule {

    constructor(packageName, moduleClassName, name) {
        super(packageName, moduleClassName, name);
    }

    // override
    updateModuleState() {
        //
    }
}


module.exports = ChildModule;