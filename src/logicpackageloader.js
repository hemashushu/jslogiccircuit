// 依赖包的名字列表，用于防止重复加载
let dependencyPackageNames = new Set();

// 逻辑包集合
let logicPackageItems = new Map();

/**
 * 一个逻辑包（logic package，一个标准的 npm package）可以包含一个或若多个
 * 逻辑模块（logic module class）。
 * 逻辑包根目录除了有 package.json 文件之外，还必须有一个
 * index.js，此文件需要完成如下事项：
 *
 * 1. 通过 ModulePackageLoader 告知它需要依赖哪些逻辑包（logic package）。
 * 2. 通过 LogicModuleFactory 注册它提供的逻辑模块（logic module class）。
 *
 * 逻辑包根目录必须存放一个名为 logic-package.yaml 文件，文件里应包含：
 * - 依赖项列表
 * - 逻辑模块项列表
 */
class LogicPackageLoader {
    static addDependency(packageName) {
        if (dependencyPackageNames.has(packageName)){
            return;
        }

        dependencyPackageNames.add(packageName);

        // 加载逻辑包，其中的 index.js 会被被自动执行
        require(packageName);
    }

    static addLogicPackageItem(logicPackageItem) {
        logicPackageItems.set(logicPackageItem.packageName, logicPackageItem);
    }

    static loadCurrentLogicPackage() {
        // 加载包基本信息

        // 加载依赖项信息

        // 加载逻辑模块项信息
    }
}

module.exports = LogicPackageLoader;