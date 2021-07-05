const OscillatingException = require('./src/exception/oscillatingexception');
const LogicCircuitException = require('./src/exception/logiccircuitexception');

const AbstractLogicModule = require('./src/abstractlogicmodule');
const BitRange = require('./src/bitrange');
const ConfigurableLogicModule = require('./src/configurablelogicmodule');
const ConnectionItem = require('./src/connectionitem');
const ConnectionUtils = require('./src/connectionutils');
const InterfacePin = require('./src/interfacepin');
const LogicModuleFactory = require('./src/logicmodulefactory');
const LogicModuleItem = require('./src/logicmoduleitem');
const LogicModuleLoader = require('./src/logicmoduleloader');
const LogicPackageItem = require('./src/logicpackageitem');
const LogicPackageLoader = require('./src/logicpackageloader');
const ModuleController = require('./src/modulecontroller');
const ObservableSignal = require('./src/observablesignal');
const Pin = require('./src/pin');
const Signal = require('./src/signal');

module.exports = {
    OscillatingException: OscillatingException,
    LogicCircuitException: LogicCircuitException,

    AbstractLogicModule: AbstractLogicModule,
    BitRange: BitRange,
    ConfigurableLogicModule: ConfigurableLogicModule,
    ConnectionItem: ConnectionItem,
    ConnectionUtils: ConnectionUtils,
    InterfacePin: InterfacePin,
    LogicModuleFactory: LogicModuleFactory,
    LogicModuleItem: LogicModuleItem,
    LogicModuleLoader: LogicModuleLoader,
    LogicPackageItem: LogicPackageItem,
    LogicPackageLoader: LogicPackageLoader,
    ModuleController: ModuleController,
    ObservableSignal: ObservableSignal,
    Pin: Pin,
    Signal: Signal
};