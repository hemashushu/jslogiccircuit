const path = require('path');

const ModuleResourceLocator = require('./moduleresourcelocator');

const BASE_CONFIG_FILE_NAME = 'package.json';
const DETAIL_CONFIG_FILE_NAME = 'logic-package.yaml';
const MODULE_DIRECTORY_NAME = 'module';
const MODULE_TEST_DIRECTORY_NAME ='test';
const DATA_DIRECTORY_NAME = 'data';
const DOCUMENT_DIRECTORY_NAME = 'doc';
const SOURCE_DIRECTORY_NAME = 'src';
const VALIDATE_DIRECTORY_NAME = 'validate'

/**
 * 逻辑包资源定位器
 *
 * 一个逻辑包同时也是一个项目，大致有如下文件及文件夹：
 *
 * --|-- module                          // 存放模块的目录
 *   |    |-- module_name_1              // 某一个模块
 *   |    |    |-- logic-module.yaml     // 模块的配置文件
 *   |    |    |-- index.js/struct.yaml  // 模块的实现代码或者结构描述文件
 *   |    |
 *   |    |-- module_name_2              // 另一个模块，结构同上
 *   |
 *   |-- test                            // 存放模块单元测试脚本的目录
 *   |    |-- module_name_1              // 某一个模块
 *   |    |    |-- base.test.txt         // 单元测试脚本
 *   |    |    |-- other.test.txt
 *   |    |
 *   |    |-- module_name_2              // 另一个模块，结构同上
 *   |
 *   |-- data                            // 存放数据对象或者二进制资源的目录
 *   |    |-- rom_image.dat              // 比如 ROM 的内容、LUT 的数据等
 *   |    |-- module_parameter.yaml      // 以及一些模块的参数等
 *   |
 *   |-- doc
 *   |    |-- README.md                  // 跟项目有关的文档
 *   |    |-- assert                     // 供文档所使用的资源目录
 *   |    |    |-- diagram.png           //
 *   |
 *   |-- simulation                      // 用户仿真模块的目录，结构跟 module 一样
 *   |    |-- module_name_1              // 跟普通模块一样，但一般会添加输入输出模块，用于直观的仿真
 *   |
 *   |-- src                             // 存放跟模拟相关的代码的目录
 *   |    |-- assembly.S                 // 比如某些汇编代码
 *   |    |-- process.c                  // 又或者是某些需要编译的代码
 *   |    |-- memory.c                   //
 *   |    |-- demo.c                     // 还可以是用于生成 ROM 内容的程序代码
 *   |
 *   |-- validate                        // 结合了模块的测试的代码目录
 *   |    |-- memory_validate.c          // 用于验证软硬件结合后的功能
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

    createModuleResourceLocator(moduleClassName) {
        let moduleDirectory = path.join(this.getModuleDirectory(), moduleClassName);
        let moduleTestDirectory = path.join(this.getTestDirectory(), moduleClassName);
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

    getModuleDirectory() {
        return path.join(this.packageDirectory, MODULE_DIRECTORY_NAME);
    }

    getModuleTestDirectory() {
        return path.join(this.packageDirectory, MODULE_TEST_DIRECTORY_NAME);
    }

    getDataDirectory() {
        return path.join(this.packageDirectory, DATA_DIRECTORY_NAME);
    }

    getDocumentDirectory() {
        return path.join(this.packageDirectory, DOCUMENT_DIRECTORY_NAME);
    }

    getSourceDirectory() {
        return path.join(this.packageDirectory, SOURCE_DIRECTORY_NAME);
    }

    getTestDirectory() {
        return path.join(this.packageDirectory, VALIDATE_DIRECTORY_NAME);
    }
}

module.exports = PackageResourceLocator;