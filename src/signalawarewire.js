const Signal = require('./signal');
const Wire = require('./wire');

/**
 * 会检测信号变动的导线
 */
class SignalAwareWire extends Wire {
    /**
     *
     * @param {*} bitWidth
     * @param {*} signalSetEventListener “信号被设置事件”的监听者，
     *     一个 void function(Boolean) 函数。信号被设置并不等于信号
     *     发生了改变，由 Boolean 参数反映信号是否**曾**发生过改变。
     */
    constructor(bitWidth, signalSetEventListener) {
        super(bitWidth);

        // 表示导线的信号有变化。
        this.signalChangedFlag = false;

        this.signalSetEventListener = signalSetEventListener;
    }

    /**
     * 重写（override） Wire.setSignal() 方法。
     * 当信号值发生改变时，标记 signalChangedFlag 为 true，然后
     * 通知“信号被设置事件”监听者。
     *
     * @param {*} signal
     * @returns
     */
    setSignal(signal) {
        let lastSignal = this.getSignal();

        // 计算信号是否有发生改变。
        this.signalChangedFlag = this.signalChangedFlag || !Signal.equal(lastSignal, signal);

        // 必须先计算 signalChangedFlag 再调用 setSignal
        super.setSignal(signal)

        // 通知“信号被设置事件”监听者
        this.signalSetEventListener(this.signalChangedFlag);
    }

    resetSignalChangedFlag() {
        this.signalChangedFlag = false;
    }
}

module.exports = SignalAwareWire;