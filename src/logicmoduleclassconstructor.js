class LogicModuleConstructor {

    static constructModuleClass(packageName, moduleClassName, defaultParameters) {
        let moduleConfig = {};

        moduleConfig.packageName = packageName;
        moduleConfig.moduleClassName = moduleClassName;
        moduleConfig.defaultParameters = defaultParameters;

        return moduleConfig;
    }

    static addInputWire(moduleConfig, name, bitWidth) {
        let configInputWires = moduleConfig.inputWires;
        if (configInputWires === undefined) {
            configInputWires = [];
            moduleConfig.inputWires = configInputWires;
        }

        configInputWires.push({
            name: name,
            bitWidth: bitWidth
        });
    }

    static addOutputWire(moduleConfig, name, bitWidth) {
        let configOutputWires = moduleConfig.outputWires;
        if (configOutputWires === undefined) {
            configOutputWires = [];
            moduleConfig.outputWires = configOutputWires;
        }

        configOutputWires.push({
            name: name,
            bitWidth: bitWidth
        });
    }

    static addLogicModule(packageName, moduleClassName, name, parameters) {
        let configLogicModules = moduleConfig.logicModules;
        if (configLogicModules === undefined) {
            configLogicModules = [];
            moduleConfig.logicModules = configLogicModules;
        }

        configLogicModules.push({
            packageName: packageName,
            moduleClassName: moduleClassName,
            name: name,
            parameters: parameters
        });
    }

    static addInputConnection(inputWireName, moduleInstanceName, moduleInputWireName) {
        let configInputConnections = moduleConfig.inputConnections;
        if (configInputConnections === undefined) {
            configInputConnections = [];
            moduleConfig.inputConnections = configInputConnections;
        }

        configInputConnections.push({
            inputWireName: inputWireName,
            moduleInstanceName: moduleInstanceName,
            moduleInputWireName: moduleInputWireName
        });
    }

    static addOutputConnection(outputWireName, moduleInstanceName, moduleOutputWireName) {
        let configOutputConnections = moduleConfig.outputConnections;
        if (configOutputConnections === undefined) {
            configOutputConnections = [];
            moduleConfig.outputConnections = configOutputConnections;
        }

        configOutputConnections.push({
            outputWireName: outputWireName,
            moduleInstanceName: moduleInstanceName,
            moduleOutputWireName: moduleOutputWireName
        });
    }

    static addModuleConnection(
        previousModuleInstanceName, previousModuleOutputWireName,
        nextModuleInstanceName, nextModuleInputWireName) {

        let configModuleConnections = moduleConfig.moduleConnections;
        if (configModuleConnections === undefined) {
            configModuleConnections = [];
            moduleConfig.moduleConnections = configModuleConnections;
        }

        configModuleConnections.push({
            previousModuleInstanceName: previousModuleInstanceName,
            previousModuleOutputWireName: previousModuleOutputWireName,
            nextModuleInstanceName: nextModuleInstanceName,
            nextModuleInputWireName: nextModuleInputWireName
        });
    }

}

module.exports = LogicModuleConstructor;