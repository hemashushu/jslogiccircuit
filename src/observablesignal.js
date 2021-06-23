const { Binary } = require('jsbinary');

const Signal = require('./signal');

/**
 * - ObservableSignal 有一个 'dataChange' 事件，当数据发生变化时，该
 *   事件会被触发。
 */
class ObservableSignal extends Signal {
    constructor(bitWidth) {
        super(bitWidth);

        this.isDataChanged = false;

        // 数据变化事件（dataChange）监听者（即 Listener）的集合。
        // 监听者是一个方法，方法的签名为：
        // "void function(binary_object)"
        this.dataChangeEventListeners = [];
    }

    /**
     * 添加数据变化事件（dataChange）的监听者
     *
     * @param {*} func 一个方法，方法签名为 "void function(binary_object)"
     */
    addDataChangeEventListener(func) {
        this.dataChangeEventListeners.push(func);
    }

    /**
     * 重写（override） Signal.setData() 方法。
     * 当信号值发生改变时，标记 isDataChanged 为 true，然后
     * 触发 dataChange 事件。
     *
     * @param {*} data
     * @returns
     */
    setData(data) {
        let lastData = this.getData();
        if (Binary.equal(lastData, data)) {
            return;
        }

        super.setData(data)

        this.isDataChanged = true;
        this.dispatchDataChangeEvent();
    }

    // private
    dispatchDataChangeEvent() {
        let lastData = this.getData();
        for (let listener of this.dataChangeEventListeners) {
            listener(lastData);
        }
    }

    clearDataChangedFlag() {
        this.isDataChanged = false;
    }
}

module.exports = ObservableSignal;