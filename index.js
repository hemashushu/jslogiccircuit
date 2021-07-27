const ConnectionException = require('./src/exception/connectionexception');
const LogicCircuitException = require('./src/exception/logiccircuitexception');
const LogicModuleNotFoundException = require('./src/exception/logicmodulenotfoundexception');
const LogicPackageNotFoundException = require('./src/exception/logicpackagenotfoundexception');
const MultipleInputException = require('./src/exception/multipleinputexception');
const OscillatingException = require('./src/exception/oscillatingexception');
const ShortCircuitException = require('./src/exception/shortcircuitexception');

const AbstractLogicModule = require('./src/abstractlogicmodule');
const AbstractWire = require('./src/abstractwire');
const BitRange = require('./src/bitrange');
const ConfigParameterResolver = require('./src/configparameterresolver');
const ConfigParameterValueType = require('./src/configparametervaluetype');
const ConfigurableLogicModule = require('./src/configurablelogicmodule');
const ConnectionItem = require('./src/connectionitem');
const ConnectionUtils = require('./src/connectionutils');
const InteractiveLogicModule = require('./src/interactivelogicmodule');
const LogicModuleFactory = require('./src/logicmodulefactory');
const LogicModuleItem = require('./src/logicmoduleitem');
const LogicModuleLoader = require('./src/logicmoduleloader');
const LogicPackageItem = require('./src/logicpackageitem');
const LogicPackageLoader = require('./src/logicpackageloader');
const ModuleStateController = require('./src/modulestatecontroller');
const PackageRepositoryManager = require('./src/packagerepositorymanager');
const PackageResourceLocator = require('./src/packageresourcelocator');
const Pin = require('./src/pin');
const PinDirection = require('./src/pindirection');
const Signal = require('./src/signal');
const SignalAwareWire = require('./src/signalawarewire');
const SimpleLogicModule = require('./src/simplelogicmodule');
const Wire = require('./src/wire');

module.exports = {
    ConnectionException: ConnectionException,
    LogicCircuitException: LogicCircuitException,
    LogicModuleNotFoundException: LogicModuleNotFoundException,
    LogicPackageNotFoundException: LogicPackageNotFoundException,
    MultipleInputException: MultipleInputException,
    OscillatingException: OscillatingException,
    ShortCircuitException: ShortCircuitException,

    AbstractLogicModule: AbstractLogicModule,
    AbstractWire: AbstractWire,
    BitRange: BitRange,
    ConfigParameterResolver: ConfigParameterResolver,
    ConfigParameterValueType: ConfigParameterValueType,
    ConfigurableLogicModule: ConfigurableLogicModule,
    ConnectionItem: ConnectionItem,
    ConnectionUtils: ConnectionUtils,
    InteractiveLogicModule: InteractiveLogicModule,
    LogicModuleFactory: LogicModuleFactory,
    LogicModuleItem: LogicModuleItem,
    LogicModuleLoader: LogicModuleLoader,
    LogicPackageItem: LogicPackageItem,
    LogicPackageLoader: LogicPackageLoader,
    ModuleStateController: ModuleStateController,
    PackageRepositoryManager: PackageRepositoryManager,
    PackageResourceLocator: PackageResourceLocator,
    Pin: Pin,
    PinDirection: PinDirection,
    Signal: Signal,
    SignalAwareWire: SignalAwareWire,
    SimpleLogicModule: SimpleLogicModule,
    Wire: Wire
};