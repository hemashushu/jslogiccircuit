const { Binary } = require('jsbinary');

const Signal = require('./signal');
const Wire = require('./wire');

/**
 * - ObservableWire 有一个 'signalChange' 事件，当导线的信号发生变化时，该
 *   事件会被触发。
 */
class ObservableWire extends Wire {
    constructor(bitWidth) {
        super(bitWidth);

        this.isSignalChanged = false;

        // 导线的信号变化事件（signalChange）监听者（即 Listener）的集合。
        // 监听者是一个方法，方法的签名为：
        // "void function(Signal)"
        this.signalChangeEventListeners = [];
    }

    /**
     * 添加数据变化事件（dataChange）的监听者
     *
     * @param {*} func 一个方法，方法签名为 "void function(Signal)"
     */
    addSignalChangeEventListener(func) {
        this.signalChangeEventListeners.push(func);
    }

    /**
     * 重写（override） Wire.setData() 方法。
     * 当信号值发生改变时，标记 isSignalChanged 为 true，然后
     * 触发 signalChange 事件。
     *
     * @param {*} signal
     * @returns
     */
    setSignal(signal) {
        let lastSignal = this.getSignal();

        // 当前的 Wire 忽略信号的高阻抗状态，只支持高电平和低电平。
        // 所以其实也可以单独比较 Signal 的 binary 部分。
        if (Signal.equal(lastSignal, signal)){
            return;
        }

        super.setSignal(signal)

        this.isSignalChanged = true;
        this.dispatchSignalChangeEvent();
    }

    // private
    dispatchSignalChangeEvent() {
        let lastSignal = this.getSignal();
        for (let listener of this.signalChangeEventListeners) {
            listener(lastSignal);
        }
    }

    clearSignalChangedFlag() {
        this.isSignalChanged = false;
    }
}

module.exports = ObservableWire;