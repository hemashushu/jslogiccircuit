# JSLogicCircuit

Simulate logic circuit with JavaScript.

使用 JavaScript 模拟简单的逻辑电路。

本库提供了逻辑包、逻辑模块、加载器及工厂等的实现。

为简化代码，本模拟模块有一些限制：
1. 电信号状态（数值）只有 0 和 1 两种，省略了高阻态（z）；
2. 无法实现三态门；
3. 忽略延迟；
4. 不支持同时为 in 和 out 的端口。
