# JSLogicCircuit

Simulate logic circuit with JavaScript.

使用 JavaScript 模拟简单的逻辑电路。

本库提供了逻辑模块包的实现、逻辑模块的抽象定义，以及逻辑模块包、逻辑模块的加载器实现。

为提高效率，对真实数字电路的电信号状态进行了简化：
1. 电信号状态只有 0 和 1 两种，省略了高阻态（z）和不定态（x）；
2. 忽略延迟。
