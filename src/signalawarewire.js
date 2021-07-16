const Signal = require('./signal');
const Wire = require('./wire');

/**
 * 会检测信号变动的导线
 */
class SignalAwareWire extends Wire {
    constructor(bitWidth, signalChangeEventListener) {
        super(bitWidth);

        // this.signalChangedFlag = false;
        // // 导线的信号变化事件（signalChange）监听者（即 Listener）的集合。
        // // 监听者是一个方法，方法的签名为：
        // // "void function(Signal)"
        // this.signalChangeEventListeners = [];

        // 一个 int32 数字，非 0 时表示导线的信号有变化。
        this.signalChangedFlag = false; // 0 | 0;

        this.signalChangeEventListener = signalChangeEventListener;
    }

    // /**
    //  * 添加数据变化事件（dataChange）的监听者
    //  *
    //  * @param {*} func 一个方法，方法签名为 "void function(Signal)"
    //  */
    // addSignalChangeEventListener(func) {
    //     this.signalChangeEventListeners.push(func);
    // }

    /**
     * 重写（override） Wire.setSignal() 方法。
     * 当信号值发生改变时，标记 signalChangedFlag 为 true，然后
     * 触发 signalChange 事件。
     *
     * @param {*} signal
     * @returns
     */
    setSignal(signal) {
        let lastSignal = this.getSignal();

//         // 当前的 Wire 忽略信号的高阻抗状态，只支持高电平和低电平。
//         // 所以其实也可以单独比较 Signal 的 binary 部分。
//         if (Signal.equal(lastSignal, signal)){
//             return;
//         }
//
//         super.setSignal(signal)
//
//         this.signalChangedFlag = true;
//         this.dispatchSignalChangeEvent();

        // 计算信号是否有发生改变。
        // this.signalChangedFlag =
        //     this.signalChangedFlag |
        //     Signal.compare(lastSignal, signal);

        this.signalChangedFlag = this.signalChangedFlag || !Signal.equal(lastSignal, signal);

        // 必须先计算 signalChangedFlag 再调用 setSignal
        super.setSignal(signal)

        this.signalChangeEventListener(this.signalChangedFlag);
    }

    // // private
    // dispatchSignalChangeEvent() {
    //     let lastSignal = this.getSignal();
    //     for (let listener of this.signalChangeEventListeners) {
    //         listener(lastSignal);
    //     }
    // }

    resetSignalChangedFlag() {
        this.signalChangedFlag = false;
        // this.signalChangedFlag = 0 | 0;
    }

    // get isSignalChanged() {
    //     return this.signalChangedFlag; // !== 0;
    // }
}

module.exports = SignalAwareWire;