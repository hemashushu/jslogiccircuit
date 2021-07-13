const OscillatingException = require('./exception/oscillatingexception');

class ModuleController {
    constructor(logicModule) {
        this.logicModule = logicModule;

        this.allLogicModulesForRead = this.logicModule.getAllLogicModules();
        this.allLogicModulesForWrite = this.allLogicModulesForRead.slice().reverse();

        this.logicModuleCount = this.allLogicModulesForRead.length;

        // 首次通电（比如运行 step 方法）需要设置所有逻辑模块的
        // inputDataChanged 标记，以让它们都重新计算一次，以进入稳定状态。
        this.markAllLogicModulesStateToUnstable()
    }

    markAllLogicModulesStateToUnstable() {
        for (let logicModule of this.allLogicModulesForRead) {
            logicModule.markupInputSignalChangedFlag();
        }
    }

    /**
     * 当设置了顶层模块（即 this.logicModule）的输入端口信号/数据之后，
     * 调用本方法以更新模块内部的信号/数据状态，直到状态稳定为止。
     *
     * “信号状态稳定” 是指所有模块的输入和输出的信号都不再发生改变。
     *
     * - 通常一个模块需要经历多次读取信号、计算信号、写信号
     *   才能达到稳定状态。
     * - 这里假设最多只需要经历跟“模块个数”一样的次数更新周期
     *   便能达到稳定状态，否则视为振荡电路，即状态永远不会停止
     *   的电路，并抛出 OscillatingException 异常。
     *
     * @returns 返回达到稳定状态时所需的更新次数
     */
    step() {
        let cycle = 0;
        let maxCycle = this.logicModuleCount + 1;
        for (; cycle < maxCycle; cycle++) {

            // 表示模块是否处于稳定状态
            let isStable = true;

            // 一个更新周期共有 7 步
            //
            // 以下是前半周期

            // 写信号到内部模块
            for (let logicModule of this.allLogicModulesForRead) {
                if (logicModule.isInputSignalChanged) {
                    isStable = false;
                    logicModule.transferInputPinSignal();                // A1
                }
            }

            // 如果没有模块需要读取并计算信号，则视为进入了稳定状态。
            if (isStable) {
                break;
            }

            // 清除 output pin 的 signalChanged 和模块本身的 output signalChanged 标记
            for (let logicModule of this.allLogicModulesForRead) {
                logicModule.clearOutputPinsSignalChangedFlag();          // A2
                logicModule.clearOutputSignalChangedFlag();              // A3
            }

            // 计算新信号
            for (let logicModule of this.allLogicModulesForRead) {
                if (logicModule.isInputSignalChanged) {
                    logicModule.updateModuleStateAndOutputPinsSignal();  // A4
                }
            }

            // 以下是后半周期

            // 清除 input pin 的 signalChanged 和模块本身的 input signalChanged 标记
            for (let logicModule of this.allLogicModulesForWrite) {
                logicModule.clearInputPinsSignalChangedFlag();           // B1
                logicModule.clearInputSignalChangedFlag();               // B2
            }

            // 写信号到下一个模块，受到新信号影响的模块的 isInputSignalChanged 的
            // 标记会自动被设置为 true。然后再循环一次以检测是否所有模块达到稳定状态。
            for (let logicModule of this.allLogicModulesForWrite) {
                if (logicModule.isOutputSignalChanged) {
                    logicModule.transferOutputPinSignal();               // B3
                }
            }
        }

        if (cycle >= maxCycle) {
            // 振荡电路一般是由多个模块组成的回路引起的，目前 ModuleController 只能获取
            // 整个回路当中输入信号不稳定的部分模块，而且会因 maxCycle 的不同而不同。
            let issuedLogicModule = this.allLogicModulesForRead.filter(item=>item.isInputSignalChanged);
            throw new OscillatingException('Oscillation circuit detected.', issuedLogicModule);
        }

        return cycle;
    }
}

module.exports = ModuleController;