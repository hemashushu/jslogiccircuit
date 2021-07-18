const path = require('path');

const ModuleResourceLocator = require('./moduleresourcelocator');

const BASE_CONFIG_FILE_NAME = 'package.json';
const DETAIL_CONFIG_FILE_NAME = 'logic-package.yaml';
const MODULE_DIRECTORY_NAME = 'module';
const TEST_DIRECTORY_NAME ='test';
const DATA_DIRECTORY_NAME = 'data';
const DOCUMENT_DIRECTORY_NAME = 'doc';
const SIMULATION_DIRECTORY_NAME = 'simulation';
const SOURCE_DIRECTORY_NAME = 'src';
const VALIDATE_DIRECTORY_NAME = 'validate'

/**
 * 逻辑包资源定位器
 *
 * 一个逻辑包同时也是一个项目，大致有如下文件及文件夹：
 *
 * --|-- module                          // 存放模块的目录，位于这个目录之下的每一个
 *   |    |                              // 子目录都会将被自动加载为一个模块
 *   |    |-- module_name_1              // 某一个模块，目录名会自动成为模块的名称。
 *   |    |    |-- logic-module.yaml     // 模块的配置文件
 *   |    |    |-- index.js/struct.yaml  // 模块实现的代码或者结构描述文件，如果使用代码
 *   |    |    |                         // 实现模块，文件名必须是 index.js
 *   |    |    |-- document.md           // 对该模块的说明文档（可选），如果文档包含有图片
 *   |    |    |                         // 等资源，都必须放在当前目录之内，不能创建子文件夹。
 *   |    |    |-- document[zh-CN].md    // 说明文档的本地化（可选）
 *   |    |
 *   |    |-- module_name_2              // 另一个模块，结构同上
 *   |         |-- module_name_2_1       // 位于一个模块之内的子模块，通常该子模块是仅供它的父模块
 *   |                                   // 所使用的。模块的名称将会自动命名为 "parent$child"。即
 *   |                                   // 在父模块和子模块的目录名之间加上 “$” 符号。
 *   |
 *   |-- test                            // 存放模块单元测试脚本的目录
 *   |    |-- module_name_1              // 某一个模块
 *   |    |    |-- base.test.txt         // 单元测试脚本
 *   |    |    |-- other.test.txt        // 单元测试脚本可以有多个
 *   |    |    |-- image.bin             // 测试脚本所需的外部数据文件必须放在当前目录之内，不能创建子
 *   |    |                              // 文件夹。
 *   |    |
 *   |    |-- module_name_2              // 另一个模块，结构同上
 *   |         |-- module_name_2_1       // 基本上 test 的目录结构是跟 module 目录一一对应的。
 *   |
 *   |-- data                            // 存放数据对象或者二进制资源的目录
 *   |    |-- rom_image.dat              // 比如 ROM 的内容、LUT 的数据等
 *   |    |-- lut_data_table.yaml
 *   |
 *   |-- doc
 *   |    |-- README.md                  // 跟项目有关的文档
 *   |    |-- assert                     // 供文档所使用的资源目录
 *   |    |    |-- diagram.png           //
 *   |
 *   |-- simulation                      // 用户仿真模块的目录，跟普通的模块不同，该目录之内的
 *   |    |                              // 模块不能被其他逻辑包所引用，只能在当前逻辑包里使用。
 *   |    |                              // 同一个包里的仿真模块可以引用。
 *   |    |-- simulation_module_name_1   // 目录的内容跟普通模块一样，但一般会添加输入输出模块
 *   |         |                         // 以及外设等，用于带图形界面的模拟。
 *   |         |-- child_module          // 跟 module 目录一样，仿真模块目录也支持子目录（子模块）。
 *   |
 *   |-- src                             // 存放跟模拟相关的代码的目录
 *   |    |-- assembly.S                 // 比如某些汇编代码
 *   |    |-- boot.c                     // 或者某些需要编译然后供 ROM 所使用的代码等。
 *   |
 *   |-- validate                        // 用脚本来验证/测试模块的代码目录
 *   |    |                              // 用于实现某些无法使用单元测试脚本完成的测试。
 *   |    |-- process_validate.js
 *   |
 *   |-- logic-package.yaml              // 逻辑包的详细配置文件
 *   |-- package.json                    // 逻辑包的基本配置文件
 */
class PackageResourceLocator {
    constructor(packageDirectory) {
        this.packageDirectory = packageDirectory;
    }

    static create(packageDirectory) {
        return new PackageResourceLocator(packageDirectory);
    }

    createModuleResourceLocator(parentModulePath = '', folderName, isSimulation = false) {
        let moduleDirectory;
        if (isSimulation) {
            moduleDirectory = path.join(this.getSimulationsDirectory(), parentModulePath, folderName);
        }else {
            moduleDirectory = path.join(this.getModulesDirectory(), parentModulePath, folderName);
        }

        let moduleTestDirectory = path.join(this.getTestDirectory(), parentModulePath, folderName);
        return new ModuleResourceLocator(this.packageDirectory, moduleDirectory, moduleTestDirectory);
    }

    getPackageDirectory() {
        return this.packageDirectory;
    }

    getBaseConfigFilePath() {
        return path.join(this.packageDirectory, BASE_CONFIG_FILE_NAME);
    }

    getDetailConfigFilePath() {
        return path.join(this.packageDirectory, DETAIL_CONFIG_FILE_NAME);
    }

    getModulesDirectory() {
        return path.join(this.packageDirectory, MODULE_DIRECTORY_NAME);
    }

    getTestDirectory() {
        return path.join(this.packageDirectory, TEST_DIRECTORY_NAME);
    }

    getDataDirectory() {
        return path.join(this.packageDirectory, DATA_DIRECTORY_NAME);
    }

    getDocumentDirectory() {
        return path.join(this.packageDirectory, DOCUMENT_DIRECTORY_NAME);
    }

    getSimulationsDirectory() {
        return path.join(this.packageDirectory, SIMULATION_DIRECTORY_NAME);
    }

    getSourceDirectory() {
        return path.join(this.packageDirectory, SOURCE_DIRECTORY_NAME);
    }

    getValidateDirectory() {
        return path.join(this.packageDirectory, VALIDATE_DIRECTORY_NAME);
    }
}

module.exports = PackageResourceLocator;