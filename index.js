const LogicCircuitException = require('./src/exception/logiccircuitexception');
const OscillatingException = require('./src/exception/oscillatingexception');

const AbstractLogicModule = require('./src/abstractlogicmodule');
const AbstractWire = require('./src/abstractwire');
const BitRange = require('./src/bitrange');
const ConfigurableLogicModule = require('./src/configurablelogicmodule');
const ConnectionItem = require('./src/connectionitem');
const ConnectionUtils = require('./src/connectionutils');
const LogicModuleFactory = require('./src/logicmodulefactory');
const LogicModuleItem = require('./src/logicmoduleitem');
const LogicModuleLoader = require('./src/logicmoduleloader');
const LogicPackageItem = require('./src/logicpackageitem');
const LogicPackageLoader = require('./src/logicpackageloader');
const ModuleController = require('./src/modulecontroller');
const ObservableWire = require('./src/observablewire');
const Pin = require('./src/pin');
const Signal = require('./src/signal');
const Wire = require('./src/wire');

module.exports = {
    LogicCircuitException: LogicCircuitException,
    OscillatingException: OscillatingException,

    AbstractLogicModule: AbstractLogicModule,
    AbstractWire: AbstractWire,
    BitRange: BitRange,
    ConfigurableLogicModule: ConfigurableLogicModule,
    ConnectionItem: ConnectionItem,
    ConnectionUtils: ConnectionUtils,
    LogicModuleFactory: LogicModuleFactory,
    LogicModuleItem: LogicModuleItem,
    LogicModuleLoader: LogicModuleLoader,
    LogicPackageItem: LogicPackageItem,
    LogicPackageLoader: LogicPackageLoader,
    ModuleController: ModuleController,
    ObservableWire: ObservableWire,
    Pin: Pin,
    Signal: Signal,
    Wire: Wire
};