const SimpleLogicModule = require('./simplelogicmodule');

/**
 * 交互式的逻辑模块
 */
class InteractiveLogicModule extends SimpleLogicModule {
    constructor(packageName, moduleClassName, name, instanceParameters = {}, defaultParameters = {}) {
        super(packageName, moduleClassName, name, instanceParameters, defaultParameters);

        // 当用户通过 UI 操作改变模块的状态时，会触发一个 'activeEvent' 事件，
        // 模拟器程序应该监听此事件，并让逻辑模块状态控制器（ModuleStateController）再次
        // 更新顶层模块的信号状态。
        this.activeEventListener = () => {};

        this.init();
    }

    setActiveEventListener(listener) {
        this.activeEventListener = listener;
    }

    /**
     * 触发 activeEvent 事件。
     *
     * 当用户通过 UI 操作改变模块的状态时，需要的操作：
     * 1. 使用临时变量记录发生改变的状态的信号值，或者直接写 output pin 信号；
     * 2. 调用 setInputSignalChangedFlag() 方法设置当前模块状态
     *    已改变，待模块状态控制器（ModuleStateController）更新；
     * 3. 调用 dispatchActiveEvent() 方法通知模拟器程序，模拟器程序会根据
     *    当前的 “运行” 模式来调用模块状态控制器（ModuleStateController）的更新方法。
     */
    dispatchActiveEvent() {
        this.activeEventListener();
    }
}

module.exports = InteractiveLogicModule;