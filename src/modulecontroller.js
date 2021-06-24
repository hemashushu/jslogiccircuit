const OscillatingException = require('./exception/oscillatingexception');

class ModuleController {
    constructor(logicModule) {
        this.logicModule = logicModule;

        this.allLogicModulesForRead = this.logicModule.getAllLogicModules();
        this.allLogicModulesForWrite = this.allLogicModulesForRead.slice().reverse();

        this.logicModuleCount = this.allLogicModulesForRead.length;

        this.markAllLogicModulesStateToUnstable()
    }

    markAllLogicModulesStateToUnstable() {
        for (let logicModule of this.allLogicModulesForRead) {
            logicModule.markInputDataChangedFlag();
        }
    }

    /**
     * 更新模块的信号状态，直到状态稳定为止。
     * 信号状态稳定表示输入和输出的信号都不再改变。
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
        for (; cycle <= this.logicModuleCount; cycle++) {

            // 表示模块是否处于稳定状态
            let isStable = true;

            // 一个更新周期共有 7 步，
            // 4 步为读取信号、计算信号
            // 3 步为写信号

            // 读取信号
            for (let logicModule of this.allLogicModulesForRead) {
                if (logicModule.isInputDataChanged) {
                    isStable = false;
                    logicModule.readInputs();                        // A1
                }
            }

            // 如果没有模块需要读取并计算信号，则视为进入了稳定状态。
            if (isStable) {
                break;
            }

            // 计算信号
            for (let logicModule of this.allLogicModulesForRead) {
                logicModule.clearOutputPinsDataChangedFlag();        // A2
                logicModule.clearOutputDataChangedFlag();            // A3

                if (logicModule.isInputDataChanged) {
                    logicModule.updateModuleDataAndOutputPinsData(); // A4
                }
            }

            // 后半周期，写信号，受到新信号影响的模块的 isInputDataChanged 的
            // 标记会被设置为 true。
            for (let logicModule of this.allLogicModulesForWrite) {
                logicModule.clearInputPinDataChangedFlags();     // B1
                logicModule.clearInputDataChangedFlag();         // B2

                if (logicModule.isOutputDataChanged) {
                    logicModule.writeOutputPins();               // B3
                }
            }
        }

        if (cycle > this.logicModuleCount) {
            // 可能是振荡电路
            let issuedLogicModules = this.allLogicModulesForRead.filter(item => {
                return item.isInputDataChanged === true;
            });

            throw new OscillatingException(undefined, issuedLogicModules);
        }

        return cycle;
    }
}

module.exports = ModuleController;