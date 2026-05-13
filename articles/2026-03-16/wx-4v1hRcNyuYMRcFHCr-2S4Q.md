# 解析 OpenClaw 26.3.8 大更新及 mem9 如何利用新 ContextEngine 接口实现全周期记忆管理

> - 来源：我世界的源代码（微信公众号）
> - 作者：dongxu
> - 日期：2026 年 3 月 10 日
> - 原文链接：https://mp.weixin.qq.com/s/4v1hRcNyuYMRcFHCr-2S4Q

---

> 省流：这是一篇硬核技术文，面向龙虾（OpenClaw）的插件开发者，如果只是想了解 mem9 的普通用户，请直接前往：[脑子是个好东西：最好的龙虾记忆方案 mem9](https://mp.weixin.qq.com/s?__biz=MzI3MjI4Njk0Ng==&mid=2247484689&idx=1&sn=039b8b9b0281e08f79e988664bf3e89d&scene=21#wechat_redirect)

预警：本文 AI 含量接近 30%，由 GPT 5.4 extended thinking 辅助。

--- 正文的分割线 ---

最近正好在做关于给龙虾换脑子的事情，总觉得 Hook 点太少了，对 Session 和 Context 的控制太弱，但是因为需求太疼，基于已有的 Hook 就先上了。

不过 mem9 刚发了一天，3.8 大更新就来了，OpenClaw 3.8 里最（唯一）值得关注的是 `ContextEngine` 这个插件位终于正式打开了。它不是一个普通 hook，而是一整套上下文生命周期接口。mem9 也第一时间支持了（主要真的是想啥来啥😂。。。。）

为什么这个 API 对于🦞的记忆存储方案如此重要？因为大概这套接口可以决定：

> 谁来恢复上下文、谁来组装 prompt、谁来决定压缩、谁来处理 subagent 边界，现在都可以交给插件接管。

官方文档里也写得很直白：`contextEngine` 是一个独占 slot，context engine 插件负责 session context orchestration，包括 ingest、assembly 和 compaction；不配置时仍走内置 `legacy hook points`，保证原有行为不变。

这件事的本质，其实就一句话：

Context Engine 核心思想：把记忆的控制权，从 OpenClaw 还给插件。

也就是从：

**"OpenClaw 用 memory 插件进行 hook"**

变成：

**"memory 插件接管更细粒度驱动 OpenClaw 的上下文"**。

前天发布的 mem9 解决的问题其实很简单，就是🦞记忆断片的问题，其实这个问题的本质是 Compact（因为 Context 空间总是有限的）。

前面还在一个复杂任务里连续推进，后面上下文一压缩，它突然像刚睡醒一样："我们刚刚在做什么来着？"

更糟的是，这种事不是总会提前打招呼。OpenClaw 当然不是完全没做记忆，它一直有 session transcript、compaction summary、memory 文件这些层；但问题在于，这几层在很多人的实际体验里，常常还是会被混成一句话：**"反正它会想办法别忘。"** 可惜现实不一样。

OpenClaw 代码中已经把几件事拆得很清楚了：一层是 `sessions.json` 这种 session store，另一层是 `*.jsonl` transcript，里面保存真实对话、tool calls、以及 compaction summary。

另外还有 workspace 里的 Markdown memory 文件，官方明确写了，memory files 才是 source of truth，模型真正"记住"的，是那些被写到磁盘上的被压缩过的内容。

> 也就是说，compaction 后的 memory files 和我们理解的记忆，本来就不是一回事。

这也是我会对龙虾的原生记忆系统不放心的根本原因：

> 它不是没有记忆，而是记忆的产生、提炼、召回、压缩，很多时候还没有被当成一个完整系统来治理。

于是你会看到一堆典型问题：

- 对话长了，就 compact（无通知）
- 窗口快满了，就摘要（强行摘要）
- 旧历史太多了，就尽量压短一点再塞回去

**其实和所有 Coding Agent 一样，compaction 这个东西，本质是预算管理，不该兼职扮演完整的记忆系统，这个问题在普通的 Coding Agent 表现并不明显，因为过去的 Coding Session 大多是独立的新 Session，用户也会有预期的 Context 预算限制，但是因为龙虾的产品形态是单一无限 Session，于是 Compact 就会严重影响用户体验，因为：** 裁剪、压缩、写记忆、召回，本来就是不同层面的事。

而 OpenClaw 3.8 最重要的变化，就是终于承认了这件事，并且把对应的系统接口打开了。

3.8 release notes 里写得非常明确：`ContextEngine` 插件接口带来的是**完整 lifecycle hooks**，包括：

`bootstrap`、`ingest`、`assemble`、`compact`、`afterTurn`、`prepareSubagentSpawn`、`onSubagentEnded`；

同时还有 slot-based registry、`LegacyContextEngine` 兼容包装，以及默认不配置时零行为变化。

> 这意味着什么？意味着 OpenClaw 终于不再把"上下文怎么拼""什么时候压缩""哪些信息该留下" "subagent 之间怎么传" 这些事情，全部硬编码在 core 的黑盒流程里。

3.8 中升级成了一层**可扩展、可编排的运行时接口**。你可以通过这个接口完全控制龙虾的上下文，这个也是 Memory 管理的最佳方式，mem9 也是这么做的。

以前更像是：

OpenClaw 先决定上下文怎么流，memory 插件只能在旁边补一层 recall 或 capture。

现在变成：

插件可以直接参与，甚至主导这条上下文生命周期。

把这些接口翻成人话，其实很好理解：

- `bootstrap`：session 启动时，先恢复什么
- `assemble`：这一轮 prompt 到底该带什么
- `afterTurn / ingest`：这一轮结束后，什么该提炼成长期信息
- `compact`：token 紧张时，该压什么、转什么、丢什么
- `prepareSubagentSpawn / onSubagentEnded`：子 agent 派出去时带多少脑子，回来时回灌哪些结果

看到这里你就会明白，为什么我会坚持：

**真正的 Agent Memory，不该再写死在 Compaction 后的文件里。**

如果 memory 只在 compact 时才被动处理，问题其实有三个：

**第一，太晚。** 偏好、事实、决策这类长期信息，应该在每轮结束后就沉淀，而不是等上下文快爆了再抢救。

**第二，不准。** 真正该进 prompt 的内容，应该由 assemble 按当前任务动态装配，而不是先全塞进去，等 compact 时再被动补救。

**第三，不够用。** 一旦进入多 agent 协作，问题就变成上下文继承、记忆隔离、结果回流和共享沉淀，这已经不是 compaction 能单独解决的事。

所以 OpenClaw 这次开放的，不只是一个压缩接口，而是一整层可编排的上下文运行时。

这时候再看 mem9，切入点就很自然了。

mem9 本来解决的，就是另一半问题：**记忆存哪、怎么检索、怎么共享、怎么跨 session / 跨机器 / 跨 agent 复用。** 如果把 OpenClaw 和 mem9 放在一起看，会发现它们刚好补齐了 Agent Memory 这条链路的两端。

- OpenClaw 3.8 打开的，是**上下文控制层**。它把 session 启动时恢复什么、这一轮 prompt 带什么、何时压缩、子 agent 带走多少上下文、结束后回灌什么结果，这些原本写死在 core 里的流程，正式开放成了一套可编排的运行时接口。
- mem9 补上的，则是**持久化记忆层**。它负责把记忆稳定存下来、做好索引和召回，并让这些记忆可以跨会话、跨设备、跨 agent 复用，而不是散落在本地 transcript 或临时摘要里。

这两者结合后，意义就变了。

以前，mem9 更像一个外挂 memory backend：

能存一点长期记忆，做一点 recall，再给 prompt 补一层增强。

但现在，有了 Context Engine，mem9 就可以直接参与整条上下文生命周期：

- **bootstrap**：启动 session 时，先恢复哪些长期信息
- **assemble**：这一轮只装配真正和当前任务相关的记忆
- **afterTurn / ingest**：把本轮里值得长期保留的事实、偏好、决策提炼出来
- **compact**：在 token 紧张时，决定哪些该压缩、哪些该转存、哪些不必继续占上下文
- **prepareSubagentSpawn / onSubagentEnded**：处理父子 agent 之间的上下文继承、隔离和结果回流

以前是 OpenClaw 先决定上下文怎么流，memory 插件只能在旁边补救；

现在是插件可以直接参与，甚至主导这条上下文链路。

这带来的收益也很实在：

- 第一，**记忆处理更及时**。重要信息不用等到 compact 时才被动抢救，而是可以在每轮结束后就及时沉淀。
- 第二，**上下文装配更精准**。进入 prompt 的不再是"能塞多少塞多少"，而是"当前任务真正需要什么带什么"。
- 第三，**长会话更稳定**。compact 不再只是黑盒压缩，而能和外部记忆策略协同工作，减少聊久了突然断片的情况。
- 第四，**多 agent 协作终于有了合理边界**。哪些记忆该继承，哪些该隔离，哪些结果该回流共享，第一次有了正式的系统接口去处理。

所以，Context Engine 的价值，是第一次把 Agent Memory 从一个附属能力，升级成了一个正式的系统层（完全接管），使得插件可以控制：**什么该进入 prompt，什么该沉淀为长期记忆，什么该共享，什么该隔离。**

mem9 第一时间接入，然后把这层能力补完整了，它让 🦞 有机会在**对的时候，调入对的记忆**。结果就是：用户少重复，回答更准确，prompt 更精简（更省 token），整个体验也会更好。

最后，还没有体验的朋友，可以体验一下 mem9, 只需要把这段话发给你的🦞：

> 阅读 https://mem9.ai/SKILL.md ，按照说明为 OpenClaw 安装并配置 mem9
