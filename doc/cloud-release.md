# 车厢云端试运行

当前状态见 [workflow-current.md](workflow-current.md)。以下首次试运行记录按历史日期保留；其“尚待后续”列表不是当前阻塞清单。

本次发布验证制作工作流中的服务与部署环节，沿用 B 视角、三场景、两条完成路线和既定 UI。不是最终完整游戏验收。

- 自托管永久 UUID：cb90357b-fe01-48ab-b14b-0620eb0d556e。
- 版本标记：carriage-cloud-trial-20260910-1。
- `npm run build` 生成 cloud 前端及 Worker，Pages 工作流使用相同构建。镜像只提供主站导航与显式旧浏览器存档入口，不访问另一套云端数据库。
- Worker 只保存新旅程；用户于 2026-09-10 同意临时随机访问凭据试运行。无旧存档上传、真实账号验证、跨设备同步或账号找回。
- Narrator 固定预设规则，不将旅程发送给外部模型。
- 回滚：将 Worker 的 PRODUCTION_WRITES_ENABLED 设为 false 后重建部署，可暂停新请求；保留 DO class、绑定和迁移，不删除命名空间。旧 Pages 入口不受此开关影响。

## 验证进度

2026-09-10 已完成：

- 66 项本机测试通过，生产前端与 Worker 构建通过；源码/产物凭据扫描、API base 和 diff 检查通过。
- 真实 Cloudflare Durable Object 共 86 次合成请求通过。电台路线 15 步、照明路线 16 步均完成救援并返回客厢；库存消耗、逐操作回执重放、登记冲突、动作ID冲突、过期版本/位置、owner隔离、事件cursor和重读head正确。
- CUA 在主站真实开柜和取保险丝，重新打开后库存仍为 ×1。Pages默认显示双入口，显式旧旅程入口仍读取原保险丝 ×1；未上传旧存档。
- 实现提交 85f09c5c50e72fbb9513fbdefcbe3d2691d1eb88，两端实际入口 assets/index-C9LVvHBc.js，SHA256 c05c0650dbc67484dafa51320435bba778950c30bf34a39cab24475a45c7ba3a。两端主角、设备图集及完整许可证亦与本机构建逐字节匹配；Pages Actions 34390556408 成功。后续记录提交只改文档，保持相同可执行内容。

本机证据位于被排除的 _qa/cloud-trial-canary.json 和 _qa/cloud-trial-bundles.json，不含测试凭据。浏览器验收是桌面实际入口/恢复检查，不能当成实体 iPhone 性能验收。

尚待后续工作：正式账号身份和找回、备份恢复演练、空间遮挡、完整性能证据、工作流最后一轮独立复用与正式目录上架。当前不宣称以上完成。

## 检查器适用边界

通用 `audit-story-session-release.mjs` 本次返回失败：它硬编码文字版 `src/story/StoryShell.tsx`、`STORY_SESSIONS`、`/api/story`、`action_cache` 等命名，本项目没有该目录结构。没有添加空壳文件或伪造通过。空间壳的对应实现是 `main.tsx` / `runtime-selection.ts`、`SessionClient`、`cloud-session.ts`、`ProductionAuthority`、`CarriageJourneyAuthority` 和 `/api/lab`；`receipts`、`journeys.enrollment`、`journal` 分别负责回执、登记重放与事件。Worker 构建通过 `npm run build:worker` 间接执行，已实际产出。媒体生成不在本次运行时范围内。对应合同由本项目客户端/SQLite/DO适配器测试和真实云端 canary 验证，通用检查器仍记录为“不适用且未通过”，不能标为绿灯。

仓库级存储检查仅遍历已登记游戏，本项目尚未上架，未被纳入其计数。当前项目单独核对：HTML 在主模块前加载 scoped adapter；源码显式使用 alteruLocalStorage；IndexedDB 由 URL UUID 隔离，并有重混 UUID 与旧数据库名回归测试。

## 2026-09-10 完整单人版本更新前保护

当前开发分支增加四场景主线、接应终章和传话支线；本节不表示已经上线。在线健康只读复查仍为 `liveModelAvailable:false` 的旧版本。

新代码只允许明确支持的 mapVersion 与 StorySave v10 / carriage-07；未知版本不降级、不改写原档。旧 train-scenes-2 备份可原样导入空库再按正常读取升级，历史回执不重算。131项合成回归通过，未读取玩家存档。

回滚边界：旧发布代码尚没有本轮的未来版本保护，不能因本轮检查通过就把 f0dfb9d 等旧 Worker 覆盖到已升级数据上。出现发布事故时保留 Durable Object namespace/class/binding 和已升级数据，在兼容当前存档的代码上禁用入口或前向修复；不能用旧二进制降级存档，不能删除 namespace。既有 createHandler(false) 关闭非health请求（包括读取），不是只读维护模式。正式发布仍需核对客户端/Worker一致性、完整主线云端合成路线、同commit双部署以及AlterU平台内验收。

## 完整固定单人主线已双部署 · 2026-09-10

发布源码：`261b06424d955ba46d2eb3c9d51ddd29621e45f8`。现有main由f0dfb9d快进至此提交，没有重建游戏或变更UUID。主站沿用CarriageJourneyAuthority / CARRIAGE_JOURNEYS及原迁移标签，53份静态文件发布到原UUID的KV。GitHub Pages Actions [34472594992](https://github.com/yinxinghuan/rpgjs-story-lab/actions/runs/34472594992) 同提交成功。

主站：https://game.aiwaves.tech/cb90357b-fe01-48ab-b14b-0620eb0d556e/

前端镜像：https://yinxinghuan.github.io/rpgjs-story-lab/

两站实际模块均为 `assets/index-CwvDyYPW.js`，SHA256均为 `4ff50ffd4d725dac5b5d3e8c10545886f8ae37888876b87e269712af9a4c7d01`，与本地dist相同，包含当前runtimeContract。四场景PNG/TMX在两个站点共16份响应均200、字节数与SHA256吻合。单次检查最慢4729ms，不作为手机性能基准。

主站health返回 `carriage-single-player-20260910-2`，runtimeContract为 `carriage-session-2.train-scenes-3.story-10.relay-1`，匿名capability不变，在线叙述可用但由玩家显式开启。134项本地测试、cloud/Worker构建、凭据/API base审计、全库145游戏storage审计、正式发布入口检查通过。生产canary只新建两条合成旅程，204次HTTP请求，中文电台41步/英文照明46步，均完成传话、接应、终章、步道往返及完整备份到新SQLite恢复；没有新增真实模型输入，没有读取玩家已有存档。详细无凭据报告保存在内部 `_qa/single-player-*-261b064.json`。

实际Chrome生产UI：首次场景加载出现可重试错误，点击重试后恢复；原因尚未确定，后续16份资源摘要与响应时长没有复现问题，因此不宣称首次加载稳定性已经完全确认。随后实际开柜→拿取→刷新，目标更新为询问修理工、库存备用保险丝×1保持。390×844特写、320×568物品面板无横溢出，刷新后场景正常。浏览器扩展自身的警告与翻译悬浮控件不归入游戏错误。外部访客栏保持生产加载，UI检查时正常点击Close关闭；没有改生产布局回避访客栏。

范围：完整固定主线、现有模板支线及恢复机制已经上线；本轮生产浏览器只验证上述关键交互，完整路线由API合成验收，不能替代AlterU平台内完整试玩或真人理解验收。平台内全程、生成内容/新资产生命周期、正式身份找回以及总规划后续条目仍待推进。此前平台内旧版切片验收不代表本次新主线验收，不再迁移已入库的同一游戏。

## 慢资源调整双部署 · 2026-09-10

源码 `1f5a1823bad1be715a3fb8864dc48e60ff1d8d57` 已发布原UUID主站与Pages。Actions 34476916341同提交成功；两站实际 `assets/index-Css51iuk.js` SHA256均为 `fc30220e5833071e100352ed7fd24fc4850b1a3553780ff724f57d34988fd514`，与本地dist匹配，详见内部 `_qa/loading-release-1f5a182.json`。素材清单未变，原namespace/协议/存档保留；这次更新只调整场景等待预算和安全诊断，不重跑或改写剧情。

135项回归通过，14秒延迟场景在真实本地renderer中首次成功并能走到检修柜。主站部署进程上传KV期间较慢，但最终正常完成，没有因观察超时重启。平台内完整试玩停点及首次失败证据见platform-review.md；该调整的真实平台冷资源改善仍待后续复验，不能将本地延迟测试称为平台根因已消除。

## 2026-09-10 c063c79 · RPG-JS转场恢复

c063c798aa2b3be91300dc3d950b28a283dd0ee7 已推送main并完成现有UUID主站部署；Pages运行34482267613成功。实际读取两个站点的index-CK7H0U1J.js，SHA-256均为f5b398953b0adbeb4f729fc66fb307b42ac5b1994af7cd16b55b1b0e028c731f，与本地dist一致，包含本次地图恢复代码。初次Node TLS读取失败后使用系统curl完成校验，没有以构建成功替代线上文件验证。

141测试、前端/Worker/preflight构建、凭据/API base/存储隔离审计通过。5294初始地图与5295跨场景地图分别故意延迟34秒，超时重试恢复；行李车实际画面390×844可操作，随后返回客厢、刷新仍保留修复和当前进度。生产后台模型/身份/存档结构和绑定未改变；未新增线上模型测试或读取玩家数据。此前完整平台主线证据保留，本次慢地图故障验证来自回环浏览器，不冒充已在生产复现全部平台偶发失败。
