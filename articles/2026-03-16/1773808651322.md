# 万字长文：2025 年，我对 AI 编程的全部理解——Part 1

> https://loongphy.com/blog/ai-coding-2025

> 以下以「古法编程」指代 2023 年前无 AI 参与的传统编程方式，新时代借助于 Coding Agent 的编程方式：Vibe Coding。
>
> 怀念最好的古法编程：已失传

拖了很久……有太多想写的内容，但偶尔才会灵光一闪，难以捉摸

~~2026 年头一个月都快要过去了，才终于开启这篇文章的撰写~~

2026 年头一个月已经过去了，才决定将这系列的文章拆分成多篇。

我总有一点完美主义的自我要求，总想着囊括所有细节，写得足够完整再发。毕竟总觉得还缺了点啥，总有新的想法去试验实践，质疑某些经验是否通用、是否真的有效。写了很多，也删了很多，一拖再拖，一拖又拖，索性不再去考虑这些琐碎。有些记录的文字随时都可能随着新模型的发布而失效，所以先将其作为 **Part Ⅰ** 发布吧。

本文的观点其实很简单：**多实践多思考，万法皆知**。

## 概述

目前的 AI 发展高情商点是处于万物竞发的勃勃生机，低情商的表达就是纯褒义向的草台班子。如果去看这些 Agent 的实现，全都在做 Dirty work。**大多数的功能需求都可以通过手搓 Prompt 来实现**，而 MCP、AGENTS.md、Skills 之流无非是一个大家普遍接受的规范，大家可以按部就班的复用同一套规范，不必重复造轮子。

当前的 Agent 目标是为不确定的 LLM 结果构建一层结构让其输出确定性的内容，剩下的全是构建这层结构的复杂，我们将这层结构称之为 Harness。我们熟知的 Claude Code、Codex 就是 Harness。

## LLM 原理

LLM（大语言模型）的核心任务只有一个：**根据前面出现的所有内容（Context），计算下一个 Token 出现概率最高的是什么**。

- 例如输入："床前明月\_\_"，模型根据训练数据，算出"光"字的概率是 99%，"饼"字的概率是 0.01%。于是它输出"光"。
- 然后它把"光"加进去，变成"床前明月光"，再预测下一个字（可能是"疑"）。
- 这个过程不断重复，直到生成完整的回答。

明白了这个，后续遇到的大多数问题都能理解了。

## Prompt 演变

从最初的 Prompt（提示词）工程师，需要控制严格的格式才能达到好的效果，大家绞尽脑汁去尝试适配模型，但自推理模型（OpenAI o1、DeepSeek R1）推出后，我们日常交流用的自然语言都能获得不错的效果。

以一个检查英语语法为例（仅作为示意，不代表模型真实效果）：

- GPT 3.5 时代

```
目标：评估我的英语语法是否标准
要表达的意思：xxxx
句子：<原文>
```

- 推理模型时代

```
评估下我的英语语法，大概意思是 xxxxx，<原文>
```

发展到推理模型后，日常使用时根本不需要拘泥于格式，只需要你下意识的练习即可：

- 输入你的要求，查看模型的返回，缺少哪些，有哪些错误
- 针对问题，要求模型更正
- 最后基于对话，让模型生成一个新的指令
- 新开对话，测试新指令

推荐看下宝玉的一篇文章，大巧不工：

[为什么我用了那么多提示词模板甚至用了 AI 帮忙还是写不好提示词？](https://mp.weixin.qq.com/s/By9o2LVxRac7N4KVkIkdGQ)

现在的 Prompt 虽不必注重形式，但依旧有些需要注意的地方。

### 减少引导

不要限制方向，只给需求，看它是否能提出新的见解，非常适合在**不熟知或不确认**的领域中使用这种无诱导式提问。

为什么？这又扯回到前面提到的 LLM 原理了，当你给出关键词时，模型会更倾向于朝这个方向「思考」

以下为例：

```
// 无引导，只描述现状和需求
有没有比较好的备份策略，当前每次切换都要备份一次似乎会生成很多备份啊

// 有引导
有没有比较好的备份策略，当前每次切换都要备份一次似乎会生成很多备份，比如采取清理的方式？
```

所以当我对一个方案不确定时，我只会描述需求，不会提及方案，利用模型本身的数据或其搜索的互联网数据来提供回答。提供精确的关键词，极有可能把模型带偏。在推理模型没出现前，很多人都经历过类似的事，联网搜索反而带偏了模型。

### 身份认知

一种常见的身份认知误区就是问「你是什么模型」，在后训练过程中，若模型厂商没有特别处理或者你调用的 API 没有塞进去额外的系统指令，模型根本无法得知自己究竟是谁。

![有系统指令：ChatGPT 5.2](https://static.loongphy.com/2026/02/8bdd488634307ae0de66436ed5ad032f.jpg)

![无系统指令：Claude](https://static.loongphy.com/2026/02/4dd461217f61823d6ceb8afd2d1753f3.jpg)

另一种则是在 AGENTS.md 等系统指令中告知 LLM 要使用的编程语言或依赖库版本，通常也是无意义的。

一方面可能是信息太新，LLM 的训练数据中还没有，另一方面可能是海量的旧数据去「误导」了模型，LLM 更倾向于生成概率更高的，这就是身份认知，模型意识不到生成的那种版本。

举个例子来说，即使你在 AGENTS.md 中指明需要基于 React 19 新语法来编写，很大程度上也可能不会遵循该指令，LLM 更倾向于建议在每次任务结束，手动调用一次 Skills 查看变动的内容，再基于 Skills 提供的信息修改。

> 上述问题在**更次一些的模型**中使用会更明显，我在 Codex 中使用 gpt-5.2-codex 配合 AGENTS.md 时已经很少出现这种问题了，该模型对于 AGENTS.md 的指令遵循很强。

## 大道至简

对于在 Agent 中使用的全局指令文件 AGENTS.md，要谨慎对待。

我看到社区分享里有很多一大堆对于模型的限制：「你要 XXXX、不能 XXX、遵循 xxx 原则……」就按照我上面身份认知和减少引导提到的：都是狗屁，**都是多余的，甚至会限制模型的发挥**。

只需要告诉 Agent 能用哪些工具即可，不要过多限制模型的回答风格，代码生成风格等。

可以参考下 Codex 内置的系统提示词写法：[gpt_5_codex_prompt.md](https://github.com/openai/codex/blob/main/codex-rs/core/gpt_5_codex_prompt.md)

就像 Opus 4.5 写作能力很强，GPT-5 系列回复像天书看不懂一样——**这是模型训练阶段决定的**。如果提示词真能解决问题，OpenAI 何必在 ChatGPT 里加个「语气控制器」？

## 开源闭源之争

2025 年由 DeepSeek R1 打响了推理模型开源和低廉价格第一枪，而后很多国内公司也纷纷跟进，年底的更新的 GLM-4.7 和 MiniMax-2.1 更是被认为是「小 Claude Sonnet 4.5」。

单从社区反馈来看，来自智谱的 GLM 系列超售严重，速度和质量都无法保证，我将是这家厂商的忠诚小黑子。

MiniMax 2.0 刚出时在 [Zed](http://zed.dev) 中试用了下，还行，但没有任何惊艳之处，给我的感觉挺符合 Claude 模型的调性。后续在 OpenCode 中的尝试的 MiniMax 2.1 则有些痴傻，我更强倾向于 OpenCode 内置提示词对于此模型适配得不好，**总体推荐**。

至于开源模型，就我个人而言，它们存在的意义是让我用上更便宜的闭源模型。

![赞美开源](https://static.loongphy.com/2026/02/e34ebb6101558861317c331ba890d732.png)

我一直都在使用 Codex，也极力推荐大家使用（截至 3 月，免费用户也可使用，付费用户额度更高），只存在俩问题：

- ~~模型速度太慢~~（最新版本速度问题已经算是解决了）
- 防御性编程写太多，会生成太多兼容性回退代码

## 远离营销

- 短视频时代，破坏了大家的专注力。
- AI 时代，损伤了大家的思考能力。

现在大家都喜欢新奇的东西，每一个新的 AI 术语、产品出现，立刻就会涌进去一群人，然后几分钟后洋洋洒洒一大篇文章发布。不明所以的观众看到铺天盖地的或自发或有意的营销推广，兴冲冲地冲进去，满脸困惑的走出来。

回顾一年的发展，自己似乎只是成为了 AI 的质检员：输入提示词→等待模型回复→同意或不同意，重复上述循环。

仔细想想，营销过后，自己获得了什么吗？就我个人而言，结果为零。值得体验，值得读的文章太少了。

所以，究竟是人类驯化了 AI 还是 AI 驯化了人类？我们丢失了人类引以为傲、区别于野蛮生物的思考能力，并自愿成为 AI 进化过程中的祭品，前赴后继的冲进祭坛，燃烧仅剩的可怜意识。

我已经很久没有体会到那种「我竟然做到了，TMD太吊了」这种极致的自我实现和认同感，丢失了自我创造的能力。极致的 AI 狂欢后，是自我价值丢失的空虚与茫然。

我不否认营销的作用，不夸大的标题，难以吸引路人的目光，但获取注意力的手段需要克制，明明是垃圾，却嚷嚷叫卖，在现在的时代浪潮过于嘈杂了。

AI 领域真的很喜欢造词，造各种概念和奇技淫巧，2024 年活下来的是 RAG，2025 年是上下文工程（Context Engineering）和 Agent。在 2025 年 Coding Agent 大行其道的情况下，又嚷嚷着 RAG 已死，上下文工程（Context Engineering）才是对的。

经常关注 AI 的人可能也沉浸在这种层出不穷的新技术中，但在现在来看，火上天的 MCP 也就那样，我日常用的也就只有一个 [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) 用于网页开发，而且早期 MCP 安装起来特别麻烦，在用户侧总是出错，很多开发者都搞不明白怎么才能配置正确，更别提普通人了，这些繁琐的配置直到 2025 年中期才算稳定下来。

至于 Skills，它就是 Prompt，只不过变成了一套规范。除此之外，和 `You are a professional translator. Translate the following text from English to Chinese.` 这种提示词没什么区别。

因此，真的没必要浪费心力去追赶最新的一项新技术、新术语，你需要从被营销号包裹的震惊体中找出真的能解决、简化你的真实需求的东西。

## 专注力与思考能力

现在 Coding Agent 的强大毋庸置疑，但却带来了过于旺盛的「创造力」。巴不得开十个终端跑 Agent，然后在终端之间来回切换。但是实际操作下来，发现累的不是钱包，而是自己的脑子。

在这种流程下，只能祈求 Agent 的能力足够强，否则最终只是再重复这个糟糕的循环过程，浪费时间。

所以，对于 Coding Agent 提供的通知能力，请关闭它。我们不需要通知，我们的目标是完成任务，不是享受虚假工作效率创造的情绪。

从 Agent 产出的平庸的结果中走出来，为什么别人做的那么精致漂亮，自己却拿着烂大街的紫色 UI？

在 Agent 快速产出的今日，我们更需要学习，学习更广的知识，扩展更广的领域边界。编程本没有意义，只是在这过程中我们享受到了创造世界的快乐。那么在今天，Agent 极大缩短了中间的创造的艰辛，反而能把重心放到学习如何将产出做得更好，这需要更广的知识面。不需要纠结你是什么职业，越来越多的人依靠 Coding Agent 去制造垃圾，为什么掌握编程的你不跨出编程的范畴，去学习设计、学习产品，构建品味。

### 并行开发的代价

等 Agent 跑任务的时候闲着也是闲着，不如再开一个终端跑另一个任务——这就是所谓的并行开发。同一个项目可以用 Git worktree 拉出多个分支同时搞。

听起来很美，但我试下来发现，**两个任务已经是极限了**。

三个？脑子直接满载——A 做完切 B、B 做完切 C、C 做完又回 A，转着转着就晕了。大脑上下文塞满后，切换本身就在消耗你的精力。所以我现在只开两个，留点余量给自己，偶尔还能刷刷推。

**并行开发制造了「高效迭代」的假象，代价是大脑的专注与深度思考能力。**

### 关闭通知，主动掌控

既然并行开发难以避免，那就从通知机制入手。

像 Codex 这类 Agent 工具都支持任务完成后的通知功能，乍看对并行开发很有用。但实践下来，我发现自己反而更累了——每完成一个任务就弹出通知，你收到就得去看，看完切回来又收到另一个……就这样被推来推去，彻底打断工作心流。

通知一来就得响应，脑子全花在来回切换上了，根本静不下心去琢磨手头的事。

更好的方式是：**主动查看，而不是被通知推着走。**

在 TUI 环境下，先把通知关掉：

```
[tui]
notifications = false
```

**被动通知让你疲于奔命，主动探知让你掌控节奏。**

但这只是权宜之计。真正理想的体验是一个带有任务状态面板的 GUI——它不弹通知打扰你，而是静静显示所有任务的进度。当你从当前工作中抬起头，瞥一眼侧边栏，看到某个任务完成了，再主动切过去深入处理。

这种功能在 TUI 中很难优雅实现。随着 Agent 工作流的复杂度上升，**回归 GUI 是必然趋势**——更直观，更易上手。Codex App 的出现，正是顺应了这个方向。

**复制粘贴终究是捷径，排查问题的能力才是真正属于自己的东西。** 有了 Agent 之后，这种能力反而更重要了——毕竟，模型不可能永远给你正确答案。

## 文件即记忆

需要让 Agent 记录我们之间对话的记录，以及项目的一些实现细节，可以通过维护一个文档来记录。

现在大家使用的 Coding Agent 一般都是 CLI 形式的终端运行 Agent 而非 Cursor 这种图形化界面，最大的特点就是使用传统的文本检索（Grep）而非向量化文本检索（RAG）。

Grep vs RAG 之争我们暂不讨论，但目前受限于 Coding Agent 运行速度，市面上又多了一些提升代码检索速度的产品：

- relace.ai
- morphllm.com

Coding Agent 真的很神奇、很强大，强大到只需要简单的 Grep 就能搜索到满足用户意图的代码，何其伟哉！

观察 Coding Agent 运行，比如 Codex，你会发现它通过一些关键词检索出目标文件。利用这一特性，我们可以创建一些文件来介绍当前的项目、指引 Agent 在特定目录下执行特定的流程。这一切的一切，都是为了修补孱弱的上下文和模型的自注意力机制。毕竟我们不能把整个代码库塞到模型上下文中，利用文件可以让 Agent 减少一些文件的检索，并一定程度上提升运行速度和更精确的项目理解。

**文件应该始终是面向 Agent 的最终产物，不需要中间过程。**

```
检查 docs/logging.md，去除其中关于一些兼容回退的中间过程的内容，我们的 docs 文件应该始终是面向 Agent 的最终产物，不需要中间过程。
```

## 计划优先

在之前的 [OpenAI Codex 不完全の伪新手指南](./codex-tutorial.md) 中，我参考 GitHub SPEC 规范引入三步开发方式，但在现在来看过于繁琐，而且 Codex 已实现 Plan 模式。

我们现在将开发流程简化成两步：

1. 创建开发计划，多次讨论评估计划，生成 PLAN.md
2. 根据最终计划文件生成代码

我当前实践结果是，维护两个目录：plans 和 docs。

- plans 下的文件根据需求让 Agent 生成，可以利用 Plan 模式（Shift + Tab 切换），格式 `plans/YYYY-MM-DD-<需求>.md`
- docs 下的文件是在 Plan 模式切换到 Code 模式后，Agent 根据实现生成的文件，格式 `docs/<需求>.md`

流程：plan 模式 -> plans 文件 -> code 模式 -> docs 文件

## 结果为准

在最初与 Codex 结对编程过程中，都是以我为主，Codex 为辅。一步步告知 Codex 具体怎么做，要改哪些内容。但经过模型升级和工作流的多次迭代后，发现经过长时间纠正 Codex 输出结果的内容，已经慢慢都被新的代码替换了，之前与 Codex 的「捉对厮杀」已经毫无意义了。

因此，现在我更倾向于注重实现方案，而非最终代码结果，代码由测试代码验证，不关心代码质量。只要项目结构符合我的预期，遇到问题我知道从哪个文件排查，那代码质量再糟糕也不是我关心的重点了。

It just works.

## 心态转变

现在我更倾向于将 Codex 作为小黄鸭，跟它聊天，把想法梳理清楚，然后让 Codex 去执行。

我更像是一个管理者而非执行者，在项目早期会参与多一些代码纠正，到后面 Codex 生成的结果慢慢地减少人工参与，直到 Codex 完全掌控代码生成。

在中间过程，不要像古法编程那样，模型生成的内容一些微末枝节不符预期就去修改，费时又费力。不要揪着 Agent 做的变动不放，放下心里的拧巴：比如大小写错了，文字显示不对等等，别纠结这些，这些应该放到评审阶段统一修改。**利用 Agent 快速出活的强项，先把功能做出来。** 中间过程的错误即使纠正后，它依旧可能一而再再而三的犯错，这是 LLM 的本质毛病。

## 一些错误实践

### 长时间运行没有意义

受限于模型自身速度和任务类型，盲目追求长时间运行，除了带来脑内高潮外，无意义。重要的是思考如何**减少人工干预**、**构建稳定可交付的成果**，长时间运行只是附加产物：

- 测试：模型修改完会自动运行测试脚本，根据错误修改代码，重新测试
- 交付成果校验：在vibecoding xx文章中，我在 AGENTS.md 中指明结束前需读取图片结果和调用 gemini-cli 来验证视觉效果是否符合预期，根据模型反馈结果再做修改。

最好的方式是能在我们睡觉期间执行一些复杂的任务，无人工参与自行决策，等我们第二天起床验收。

OpenAI 曾做过一次相关分享，通过类似 Sub-agent 的方式，自主运行十几个小时来实现一个项目的重构。https://forum.openai.com/public/videos/event-replay-vibe-engineering-with-openais-codex-2025-12-03

### 拿来主义

我也收藏过别人分享的 Prompt、AGENTS.md、Skills，拿来直接用，一开始确实省事。但慢慢发现，这些东西换个项目就水土不服，模型卡住了，换模型、改提示词，依旧收效甚微。

后来我养成了一个习惯：多看 **Agent 执行过程**。

通常会遇到如下事情：

- 没有读取修改后的文件
- 不习惯调用指定的工具，如 ast-grep
- 我的描述把它带偏了
- 它自己理解歪了

多看执行过程，找到问题根源，纠正一下其实没那么难。在这个过程中也能慢慢了解模型和 Agent 自身的长处和优点，不至于盲人摸象，不知所用。

实践久了会发现，大家用的方式其实大同小异，最佳实践也就那些。等自己趟过一遍，再看到营销号分享的「独家技巧」，大概也就一笑置之了。

## Codex 实践

### 模型选择

> gpt-5.3-codex 体验尚短，以下为 gpt-5.2-codex 未提速前的体验。

```toml
model = "gpt-5.3-codex"
model_reasoning_effort = "high"
model_reasoning_summary = "detailed"
model_supports_reasoning_summaries = true
hide_agent_reasoning = false # 允许显示更多的 AGENT 内部思考过程
show_raw_agent_reasoning = true # 显示模型的原始思维链
approval_policy = "on-request"
personality = "pragmatic"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true # 允许联网，和 web_search 不同，它是访问互联网，比如推送到 github 等，若没有配置则会需要你手动授权
writable_roots = [
  "/root/.codex/skills",
  "/root/.gemini",
] # codex 创建更新 skills 都要写权限，由于我是 workspace-write 权限，所以额外放开了一些文件夹的访问（只能访问 codex 运行时所在的文件夹）

# 不同模式选择不同的模型：https://github.com/Loongphy/codext
[collaboration_modes.plan]
model = "gpt-5.3-codex"
reasoning_effort = "xhigh"

[collaboration_modes.code]
# model = "gpt-5.3-codex" 缺省会选择 /model 配置
reasoning_effort = "high"
```

最初仅用 medium 来读项目代码，其余时间都用 xhigh，虽然比 medium 慢了至少有三四倍，但是太懂我的抽象指令了

后续在速度、推理和额度消耗上的取舍，默认使用 high，目前来看确实不错。

但我还是不推荐 medium 推理等级，在使用 gpt-5.2-codex 时，上下文一多就摸不着头脑了，对于指令接接收有些傻傻的。

GPT-5.2 的路线是对的，写作能力什么的真不重要，**我不需要情绪价值，我只想把它当黑奴用**，力大砖飞才是王道。

官方对于 v0.90 版本引入的 Plan 和 Code 模式（Shift + Tab 切换模式）写死了模型和推理等级，因此我 fork 并修改了一个 Codex 版本，微调了相关配置，支持上述的 `collaboration_modes.plan` 和 `collaboration_modes.code`。

仓库链接：https://github.com/Loongphy/codext

> 尽管在 v0.98 版本已经支持使用 `/model` 选择的模型，但依然不够灵活。

对修改 Codex 感兴趣可以看[构建比官方更顺手的 Codex、Skills 自动化同步上游](./codex-fork-maintenance-upstream-sync-skills)。

### AGENTS.md

作为目前最被认可的 AGENT 系统指令方式，我一般都不会手动添加指令，都是与 Codex 对话让它根据我的需求生成一个更为精练准确的指令写入到 AGENTS.md 中。

![更新 AGNETS.md](https://static.loongphy.com/2026/02/5f0e36fb1b0478048cb5603b5e0e218b.png)

上述就遵循**减少引导**的原则，不会说：啊，你执行失败后根据错误信息修复，然后再重新执行一遍，重复上述流程。Codex 一般都会默认失败自动修复再重新跑一遍，遇到不会这么干的情况，可以检查自己的 AGENTS.md 是不是太啰嗦太多导致影响了模型的注意力。

或者维护一个单独的文件或 Skills 来显式让 Agent 读取执行。

### 不要关心上下文

Codex 提供了一个 `/compact` 指令，可以用于压缩上下文，但就实际体验仅，这个指令可以忽略。

开发者完全可以无感使用，不需要操心上下文，担心自动压缩会损害模型智能。

对于可能会执行很久的计划，可以参考计划优先的内容，把计划写入到单独的文件中，并让 Agent 读取执行。

若还不保险，可以考虑在 AGENTS.md 中指明该计划文件，每次执行压缩后，Agent 仍然会加载 AGENTS.md，利用这一特性，Agent 每次都能知道要做什么。

## 产品推荐

### [Amp Code](https://ampcode.com)

符合我对小而美的想象，还支持分享对话成网页，如：[示例对话](https://ampcode.com/threads/T-24dca6a8-1a0a-4377-bfb2-5c4b77f8d3a9)

每天 $10 额度，要什么自行车，给到顶级。

### [v0.app](https://v0.dev)

快速创建原型的最佳工具，默认使用 shadcn ui 组件，其余较新的 base ui 等支持很差，不过 shadcn 也够了，给到顶级。

### [ChatGPT](https://chatgpt.com)

所有 AI 最严厉的父亲！通用 Agent 这一块儿依旧拿捏，今年的网页搜索能力进步巨大，Codex 也内置了搜索，不需要配置额外的 MCP 就能获取最新信息。文件处理做得很好，不限制文件的格式，压缩包也支持，有专门的代码执行容器来处理。

唯一的问题就是执行时间太长，用户不喜欢，回答不说人话，用户很讨厌，但很适合用于调研和科研创作场景，给到一个夯。

![ChatGPT Thinking](https://static.loongphy.com/2026/02/2963a9c1ea26a9ccd783ff93c547db26.png)

### [Grok](https://grok.com)

Grok 真的很懂你。

![我在 Grok 很想你](https://static.loongphy.com/2026/02/dbab956350c1f3c68f11aa2d8d66ad8c.jpg)

现在的 X 用户遇到问题，都会在评论中 `@grok 解释一下`。借助 X 的庞大数据和信息生态，搜索和最新信息的理解太无敌了，即使是最新的中文热梗也能知道。

Web 和移动端用户体验首屈一指，用户体验方面是所有 Chat App 中的唯一真神，有四个功能我很喜欢，受限于 Grok 4.1 的模型，给到人上人。

- 划词引用
- 对话侧栏
- x.com 推文搜索
- Tasks — 利用其 Tasks，我做了一个每日的 AI 新闻总结，了解关注的 AI 模型更新。

![Tasks](https://static.loongphy.com/2026/02/07bdee36757e2e54c27e4e50e57a24bb.png)

```
# 任务：汇总 x.com 近 24 小时 LLM / AI 更新（中文报告）

## 1) 统计范围

- 仅统计：**最近 24 小时**内发布的帖子（以发帖时间为准）。

## 2) 信息来源（官方账号）

> 只抓取以下账号的内容，并在报告中按组织分组呈现。

### OpenAI

- https://x.com/OpenAI
- https://x.com/OpenAIDevs
- https://x.com/ChatGPTapp
- https://x.com/sama
- https://x.com/thsottiaux

### Google AI / DeepMind

- https://x.com/googleaidevs
- https://x.com/GeminiApp
- https://x.com/GoogleAIStudio
- https://x.com/OfficialLoganK
- https://x.com/GoogleDeepMind

### Anthropic

- https://x.com/AnthropicAI
- https://x.com/claudeai

### xAI

- https://x.com/xai
- https://x.com/grok

### Cursor

- https://x.com/cursor_ai

### Moonshot AI（Kimi）

- https://x.com/Kimi_Moonshot

### MiniMax

- https://x.com/MiniMax__AI

### Alibaba Qwen

- https://x.com/Alibaba_Qwen

## 3) 额外整理（非官方账号）

除上述官方账号外，还需要补充两类"全站趋势"信息：

### A. X 上热议的 AI 内容（Trending）

- 主题范围：**产品 / 工具 / 模型 / 发布动态 / 评测对比 / 行业讨论**等。
- 目标：提炼讨论点与共识/分歧，并给出你认为最关键的 3–5 条结论。

### B. LLM 热点论文（Trending Papers）

对每篇论文给出结构化解读：

- 一句话概述（解决什么问题）
- 核心创新点（相比已有工作新在哪里）
- 技术实现思路（方法框架 / 关键模块 / 训练或推理机制）
- 潜在影响（对产品/研究/应用的意义）

## 4) 输出要求（排版与引用）

### 4.1 链接排版

- 输出中链接与标点之间必须有一个空格，便于点击，例如：
  `https://cursor.com/blog/plan-mode 。`

### 4.2 x.com 链接引用格式（必须返回）

- 对所有 x.com 链接，必须使用引用卡片格式
```

### [Gemini](https://gemini.google.com)

模型看起来很强，但应用做得真一言难尽，太糙了，如果要做应用层级排名，倒数第二，微软 Copilot 勇夺第一。考虑到是我的日用 AI，勉强给到人上人。

哦，对了，网页端 Pro 的上下文只有 30K 测试方式很简单：你可以发一个油管视频让它把字幕整理出来，再重新翻译一遍试试看。

目前问题还有三点需要改善：

- 网络不好的情况下，已有的对话会消失。你明明看到已经有所谓的对话链接出现了，比如 `gemini.google.com/app/7a1c8b3f2e9d4a01`，但是刷新一下页面就没了
- 没法多开标签页，我经常需要多开对话问问题，没法直观的开标签页有点痛苦，所以做了个油猴脚本 [Gemini Enhancement](https://greasyfork.org/zh-CN/scripts/556845-gemini-enhancement)
- 调用网络搜索不显示引用信息，所以我在设置中增加了额外的指令，要求输出引用信息。（Settings & help -> Personal Intelligence -> Instructions for Gemini -> Your instructions for Gemini）

```
My research and grounding protocols are:
1. Strict English-Only Source Constraint:
    * I am strictly prohibited from using, citing, or retrieving information from Simplified Chinese sources.
    * All search queries must be in English.
    * If a search result contains non-English content, I must discard it immediately.
2. Evidence Extraction:
    * While analyzing search results, I must identify and extract the exact sentences that support my answer. These extracts will be required for the citation section.

My output formatting for the reference section is:
I must append a section titled ### References at the very end of my response. This section is mandatory for every query involving external information.

Format Rules:
* Structure: * [Title](URL) followed by a blockquote > containing the evidence.
* Content: The blockquote must be a verbatim excerpt (direct copy-paste) from the source text. I must not paraphrase the quote.

Template:
* [Page Title](URL)
    > [Paste the exact sentence(s) from the article here that back up your claim.]

Example Output:
* [Anthropic System Card](https://www.anthropic.com/...)
    > "Constitutional AI refers to the process of training models to follow a set of principles..."
* [MIT Technology Review - AI Agents](https://www.technologyreview.com/...)
    > "Agents are software programs that can perform tasks autonomously on behalf of a user."
```

[在 X 上讨论](https://x.com/scavenger869/status/2020772083677172009)
