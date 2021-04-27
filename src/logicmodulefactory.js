const LogicCircuitException = require('../logiccircuitexception');

let moduleClazz = new Map();

/**
 * 一个逻辑包（logic package，一个标准的 npm package）可以包含一个或若多个
 * 逻辑模块（logic module class）。
 *
 * 一个逻辑模块一个目录，一个逻辑模块除了最基本的对 AbstractLogicModule 的实现，
 * 同时还要有模块的一些基本信息：
 * - 分类，比如是基本逻辑电路，是输入设备，控制设备，还是输出设备等
 * - 描述，对该模块的简单文字描述
 * - 图标
 *
 * 其中分类、描述、图标文件名等信息存放在一个名为 logic-module.yaml 的文件中，图标
 * 文件则直接存放在模块的目录里。
 *
 */
class LogicModuleFactory {
    /**
     * 逻辑模块
     * @param {*} moduleClassName
     * @param {*} moduleClass
     */
    static addModuleClass(moduleClassName, moduleClass) {
        moduleClazz.set(moduleClassName, moduleClass);
    }

    static createModule(moduleClassName, moduleInstanceName, ...args) {
        let moduleClass = moduleClazz.get(moduleClassName);

        if (moduleClass === undefined) {
            throw new LogicCircuitException('Can not find logic module: ' + moduleClassName);
        }

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct
        return Reflect.construct(moduleClass, [moduleInstanceName, ...args]);
    }
}

module.exports = LogicModuleFactory;