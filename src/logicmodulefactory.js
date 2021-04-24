const LogicCircuitException = require('../logiccircuitexception');

let logicModules = new Map();

class LogicModuleFactory {
    static addLogicModule(logicModule) {
        logicModules.set(logicModule.className, logicModule);
    }

    static createLogicModule(className, moduleName, ...args) {
        let logicModule = logicModules.get(className);

        if (logicModule === undefined) {
            throw new LogicCircuitException('Can not find logic module: ' + className);
        }

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct
        return Reflect.construct(logicModule, [moduleName, ...args]);
    }
}

module.exports = LogicModuleFactory;