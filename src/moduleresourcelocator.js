const path = require('path');

const CONFIG_FILE_NAME = 'logic-module.yaml';
const STRUCT_FILE_NAME = 'struct.yaml'

/**
 * 一个模块包含两部分：
 * 1. 模块的定义文件，包括配置以及模块的实现（implement）代码或者结构描述文件
 * 2. 模块的验证（相当于单元测试）文件，主要是验证脚本
 *
 * -- module
 *     |-- module_name_1              // 某一个模块
 *     |    |-- logic-module.yaml     // 模块的配置文件
 *     |    |-- index.js/struct.yaml  // 模块的实现代码或者结构描述文件
 *
 * -- validate                        // 存放模块验证（模块的单元测试）脚本的目录
 *     |-- module_name_1              // 某一个模块
 *     |    |-- base.validate.txt     // 单元测试脚本*
 */
class ModuleResourceLocator {
    constructor(packagePath, modulePath, moduleValidatePath) {
        this.packagePath = packagePath;
        this.modulePath = modulePath;
        this.moduleValidatePath = moduleValidatePath;
    }

    getModulePath() {
        return this.modulePath;
    }

    getModuleValidatePath() {
        return this.moduleValidatePath;
    }

    getConfigFilePath() {
        return path.join(this.packagePath, CONFIG_FILE_NAME);
    }

    getStructFilePath() {
        return path.join(this.packagePath, STRUCT_FILE_NAME);
    }
}

module.exports = ModuleResourceLocator;