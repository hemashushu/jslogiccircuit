const LogicCircuitException = require('./src/exception/logiccircuitexception');
const OscillatingException = require('./src/exception/oscillatingexception');
const LogicPackageNotFoundException = require('./src/exception/logicpackagenotfoundexception');
const LogicModuleNotFoundException = require('./src/exception/logicmodulenotfoundexception');

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
const PackageRepositoryManager = require('./src/packagerepositorymanager');
const PackageResourceLocator = require('./src/packageresourcelocator');
const Pin = require('./src/pin');
const PinDirection = require('./src/pindirection');
const Signal = require('./src/signal');
const SignalAwareWire = require('./src/signalawarewire');
const SimpleLogicModule = require('./src/simplelogicmodule');
const Wire = require('./src/wire');


module.exports = {
    LogicCircuitException: LogicCircuitException,
    OscillatingException: OscillatingException,
    LogicPackageNotFoundException: LogicPackageNotFoundException,
    LogicModuleNotFoundException: LogicModuleNotFoundException,

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
    PackageRepositoryManager: PackageRepositoryManager,
    PackageResourceLocator: PackageResourceLocator,
    Pin: Pin,
    PinDirection: PinDirection,
    Signal: Signal,
    SignalAwareWire: SignalAwareWire,
    SimpleLogicModule: SimpleLogicModule,
    Wire: Wire
};