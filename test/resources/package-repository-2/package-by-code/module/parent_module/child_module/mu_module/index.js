const { AbstractLogicModule } = require('../../../../../../../../index');

class MuModule extends AbstractLogicModule {

    constructor(packageName, moduleClassName, name) {
        super(packageName, moduleClassName, name);
    }

    // override
    updateModuleState() {
        //
    }
}


module.exports = MuModule;