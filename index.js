const LogicCircuitException = require('./src/exception/logiccircuitexception');
const OscillatingException = require('./src/exception/oscillatingexception');

const AbstractLogicModule = require('./src/abstractlogicmodule');
const AbstractWire = require('./src/abstractwire');
const BitRange = require('./src/bitrange');
const ConfigParameterResolver = require('./src/configparameterresolver');
const ConfigParameterValueType = require('./src/configparametervaluetype');
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
const PackageRepositoryManager = require('./src/packagerepositorymanager');
const PackageResourceLocator = require('./src/packageresourcelocator');
const Pin = require('./src/pin');
const Signal = require('./src/signal');
const Wire = require('./src/wire');


module.exports = {
    LogicCircuitException: LogicCircuitException,
    OscillatingException: OscillatingException,

    AbstractLogicModule: AbstractLogicModule,
    AbstractWire: AbstractWire,
    BitRange: BitRange,
    ConfigParameterResolver: ConfigParameterResolver,
    ConfigParameterValueType: ConfigParameterValueType,
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
    PackageRepositoryManager: PackageRepositoryManager,
    PackageResourceLocator: PackageResourceLocator,
    Pin: Pin,
    Signal: Signal,
    Wire: Wire
};