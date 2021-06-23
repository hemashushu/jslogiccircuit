const EndOfTTLException = require('./src/exception/endofttlexception');
const LogicCircuitException = require('./src/exception/logiccircuitexception');

const AbstractLogicModule = require('./src/abstractlogicmodule');
// const AbstractUIEventManager = require('./src/abstractuieventmanager');
const ConfigurableLogicModule = require('./src/configurablelogicmodule');
const ConnectionItem = require('./src/connectionitem');
const ConnectionUtils = require('./src/connectionutils');
const LogicModuleFactory = require('./src/logicmodulefactory');
const LogicModuleItem = require('./src/logicmoduleitem');
const LogicModuleLoader = require('./src/logicmoduleloader');
const LogicPackageItem = require('./src/logicpackageitem');
const LogicPackageLoader = require('./src/logicpackageloader');
// const ParameterPlaceholder = require('./src/parameterplaceholder');
// const UIEventName = require('./src/uieventname');
const Pin = require('./src/pin');

module.exports = {
    EndOfTTLException: EndOfTTLException,
    LogicCircuitException: LogicCircuitException,

    AbstractLogicModule: AbstractLogicModule,
    // AbstractUIEventManager: AbstractUIEventManager,
    ConfigurableLogicModule: ConfigurableLogicModule,
    ConnectionItem: ConnectionItem,
    ConnectionUtils: ConnectionUtils,
    LogicModuleFactory: LogicModuleFactory,
    LogicModuleItem: LogicModuleItem,
    LogicModuleLoader: LogicModuleLoader,
    LogicPackageItem: LogicPackageItem,
    LogicPackageLoader: LogicPackageLoader,
    // ParameterPlaceholder: ParameterPlaceholder,
    // UIEventName: UIEventName,
    Pin: Pin
};