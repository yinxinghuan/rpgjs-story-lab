# 技术文档 · 车厢云端试运行与浏览器镜像

## 1. 技术栈

React 18、TypeScript、Vite 8、RPG-JS 5 beta、CanvasEngine/PixiJS。Node 22.22.2用于构建和本地服务。界面DOM与引擎画布共享世界地图父层和尺度。第三方固定版本见package-lock.json；完整声明随public/THIRD_PARTY_NOTICES.txt进入构建。

## 2. 目录结构

- src/main.tsx / style.css：移动、镜头、HUD、特写、菜单与双语文案。
- src/space.ts / space-bridge.ts：真实RPG-JS renderer、移动与碰撞桥接。
- src/walking-motion.ts：本游戏步速、步幅与姿态名配置。
- src/vendor/space-motion/distance-motion.ts：独立的距离步态、路径移动预算与逐像素碰撞模块，与空间叙事工作流v1.8工具包同源；无引擎、DOM、存储或场景依赖。
- src/scene-layout.ts：三场景尺寸、碰撞物、接近点和连接落点。
- src/story.ts、contract.ts、contacts.ts、attendant.ts：规则、实体许可、人物介绍与记忆。
- src/journey-runtime.ts：两种存储共享的动作校验、规则执行和转场结果。
- src/browser-journey.ts：IndexedDB事务存档与回执。
- src/client-session.ts / runtime-mode.ts：显式构建模式、存档入口、待确认操作恢复。
- server/service.ts / model.ts：仅本地研究模式的SQLite服务与模型扩展。
- src/vendor/story：冻结叙事内核，来源版本见ENGINE_SOURCE.json。
- public/art、public/map、public/spritesheets：场景、独立状态图与角色图集。
- _qa/*.test.ts：剧情、场景、身份、幂等和浏览器持久化测试。
- .github/workflows/pages.yml：构建、测试并发布同一 cloud 模式 dist，Pages 入口提供主站和显式旧版浏览器旅程。

## 3. 核心模块

### 显式运行方式

`npm run build` 为 cloud 模式，输出 dist 并构建 Worker；主站使用唯一 UUID API 与 Durable Object SQLite。Pages 分发相同前端，但无法提供同源 Worker，显示主站入口及 `?story_runtime=legacy` 浏览器旧旅程入口。

`npm run build:pages` 使用mode=pages、base='./'，输出dist-pages；默认通过BrowserJourney运行预设剧情，不请求本机或平台的旅程API。设置隐藏在线模型选项，即便内部传入live，浏览器叙事处理仍只调用localReply。部署后不依赖电脑或同一网络。资源加载需要网络，未实现离线PWA。

`npm run build:local` / `npm run dev`保留本地Node/SQLite研究模式，请求 `/<GAME_ID>/api/lab`，默认数据库`.data/story.sqlite`，可用CARRIAGE_LAB_DB指定独立测试文件。此服务没有随Pages部署。各模式有不同客户端key前缀，不迁移旧电脑存档。

### 状态与恢复

浏览器数据库名为`alteru:<当前部署UUID>:pages-journeys-v1`。正式自托管域名以URL第一段UUID为权威；Pages/本地回退源码GAME_ID，保持已有数据库名不变，包含heads、enrollments、actions三个store；数据不上传。IndexedDB读写事务把剧情新版本和操作回执一起提交。版本冲突拒绝过时写入，同action_id同参数返回原回执，不重复发放物品；不同参数复用id拒绝。位置回写检查当前场景和版本，不能把过时坐标写入新区域。当前地图版本不匹配时明确失败，不猜测迁移未知版本。

待确认操作、语言和旅程id继续通过alteruLocalStorage作用域适配器保存。角色每2秒保存位置，切到后台额外尝试保存并停止持续移动；Safari终止进程时最后一次异步位置写入不保证完成。剧情操作只有事务成功才呈现已提交结果。清除网站数据、换浏览器或无痕会话结束可能失去存档，不提供云同步。角色、库存与设备状态由同一规则内核决定，图片仅投射状态。

### 输入和界面

手机宽度<700或高度<=500时全屏铺底，镜头等比跟随。地图逻辑384×576；步速110世界像素/秒；人体碰撞9×15。点地图反变换到世界坐标寻路，点击物件走到approachPoint再互动。正文/按钮DOM独立适配；打开面板暂停移动；返回地图留在原位置。iOS长按CSS防护在入口加载，文本框恢复文本选择。声音由用户开启后使用AudioContext短合成音。

主角使用 `stride-0/1/2` 静态姿态纹理，由碰撞处理后的累计实际行走距离选择，每55世界像素完成 `0→1→2→1` 周期。不使用独立定时的walk动画推进主角脚步；图集仍保留通用walk供其他消费者使用。路径在同一次更新中用完110×dt的移动预算，可连续跨越多个4像素节点，不再在节点处插入stand或免费吸附2像素。逐步扫描最多1世界像素，碰墙不累计虚假步幅；停止、到达、暂停与恢复位置时归零步态。dt仍上限40ms，严重掉帧时位移和步态一起减慢，不追赶后台积累时间。

步态回归覆盖30/60/120fps、不规则帧间隔、转角、到达、薄墙、慢速摇杆及真实客厢路径。原步态阶段66项测试通过；桌面和390×844、320×568浏览器视口已检查真实renderer行走帧序列。视口测试不代表iPhone真机性能验收，仍需用户在Safari复测。

### 平台外访问

入口保留远程guest-shell扩展，由平台管理外部访客栏；游戏不上传现有试玩记录或个人配置。平台扩展与游戏本地剧情数据库是不同边界。Pages无自有后台、无多人世界。

### 空间物件深度层（2026-09-10）

`world-objects.ts` 定义独立设备和家具的图集裁切、世界矩形、状态与落地深度。家具直接引用 `scene-layout.ts` 的同一布局对象；props 保留原 contain 比例，seat/extra 保留原铺满矩形。`space.ts` 将物件注册为穿透的 RPG-JS 事件，与角色在同一 EventLayer 中按 `y + hitbox.h` 排序。物件事件仅用 1×1 深度锚点，游戏碰撞仍读取共享布局，不能将可穿透的渲染事件当成寻路障碍来源。

`WorldArt` 只把权威 StorySave 的可见状态投射到引擎，不再用整层 DOM 家具压在角色画布下。库存和设备特写仍使用 SVG。柜内独立电池保留固定事件和贴图，深度高于柜体一单位；取出后切换 opacity=0 的 hidden 帧；设备状态、图形可见性和色调不反写剧情。每个场景使用稳定且带场景前缀的事件 ID，转场初始化时重用最新投射状态。

测试覆盖两套图集裁切边界/世界尺寸/脚底锚点、家具布局身份、柜体与电池排序及权威状态投射。几何测试不能替代真实 renderer 的遮挡证据；浏览器验收和限制见 `doc/occlusion-review.md`。

## 4. 扩展点

玩法规则改story.ts；新增实体同步scene-layout、contract、人物介绍及图集准入。视角和素材改art-catalog/sprite-config/世界图集，但须保留碰撞与状态对应。更换存储通过client-session的显式模式入口，继续复用journey-runtime。云端权威由 server/production-authority.ts 与 worker/source.ts 提供，已获批的临时 capability 只隔离持有人；账号同步、原车厢在线AI、动态资产和多人版本仍未提供。

复用移动时，将distance-motion.ts接到目标游戏自己的主循环与完整hitbox检查；通过createDistancePoseSelector配置目标素材步幅和静态姿态名。110/55参数只属于本样本。独立工具包使用另一套72单位/秒、24单位步幅的合成空间验证，并有不同步幅及错误参数检查；复制模块不等于自动获得目标引擎集成、主题素材或真机性能保证。

用户已授权继续推进完整游戏和正式部署；当前公开自托管云端试运行与同commit Pages前端镜像，实际发布证据见 doc/cloud-release.md，不自动上传个人存档。自动化测试不替代新人理解或iPhone真机帧率验收。

### 云端权威存储实现

server/production-authority.ts 通过同步 SQL 接口保存 journeys / journal / receipts，复用 journey-runtime 的同一剧情规则。head-migration.ts 同时供本机SQLite与云端预备实现使用，保留旧剧情和行囊。一次动作的head、事件游标和回执在同一 transactionSync 中提交；模型/异步准备在事务外，返回后重查版本。请求用排序后的JSON绑定语义相同的字段，不因JSON键顺序不同失去幂等。

worker/source.ts 导出 CarriageJourneyAuthority 与 handleApi。部署器合同见 worker/bindings.json；npm run build:worker 生成 worker/index.js，不能把普通 npm run build 当成Worker已重建。用户于2026-09-10批准限定的临时凭据试运行，PRODUCTION_WRITES_ENABLED=true；不访问已有本地存档。预备的令牌模式为32字节随机 capability，边界只向DO传SHA256 owner；不是已验证的平台账号身份。当前Narrator固定本地规则，不向模型发送旅程。

每个owner最多100个旅程；列表按更新时间排列。events游标每页最多100条，先验证旅程归属；位置checkpoint不推进剧情版本/游标。无上传/导入旧存档接口，也无客户端覆盖head接口。章节结局继续从权威事实计算，不另建可写结局快照。

新增8项测试使用本机SQLite模拟Durable Object同步SQL接口：两条结局路线、事件/回执/库存与重开，owner隔离，enrollment语言冲突，注入事件写入故障回滚，异步准备竞争，过时位置、关闭的生产边界与令牌清理，以及真实DO适配器入口。本节初次实现时仅有本机预检；2026-09-10 后续完成实际Cloudflare DO、前端bootstrap和双部署，具体证据见 doc/cloud-release.md；备份恢复仍待完成。

### 统一客户端与云端HTTP预览

src/session-client.ts 统一处理已有两种运行方式及准备中的云端方式：按action ID分键记录pending，原pending迁移、损坏日志隔离、按当前session恢复。动作回执后读最新head，过期结果返回recovered，不重放旧台词/成功音；确定拒绝清理该请求，未知结果保持原ID。尚有未确认操作时禁止开始新旅程。enrollment-request记录原ID和locale，丢失响应后不能随语言切换改变原请求。

src/cloud-session.ts 生成独立32字节capability并用30秒HTTP期限；不读取Pages或本机owner。云端模式要求Web Locks，不能因浏览器缺少锁或服务不可用而切换本地写入。src/runtime-selection.ts根据显式构建模式、部署主机和story_runtime=legacy选择运行方式，当前发布构建使用cloud，npm run build同时构建Worker。cloud同一前端bundle在自托管进入服务，在Pages显示主站与旧存档入口，只有显式story_runtime=legacy才打开浏览器版；设置中提供旧Pages入口。不同origin的浏览器数据不能自动读取，不承诺跨设备同步。

build:preflight / preview:preflight生成dist-preflight并在127.0.0.1:5220提供真实HTTP与SQLite模拟DO入口。server/preflight-plugin.ts仅用于显式cloud-preflight模式，拒绝非loopback主机；数据库位于内存，服务停止会清空测试旅程。此模式必须使用独立测试来源，不上传已有数据；不是生产Durable Object。普通build和Pages不加载该插件。build:local保留原本机研究构建；build:pages保留独立旧版预览。

新增9项客户端测试覆盖丢失动作/enrollment及新旅程回执、旧版本恢复、未确认操作阻止重开、旧旅程pending不篡改当前旅程、损坏日志隔离、凭据独立与服务故障不回退、部署模式选择。已用CUA从HTTP预览开柜和领取保险丝，重新打开页面后库存保险丝×1，柜子已取走状态保持。随后正式DO验收已完成；完整跨设备恢复仍未实现。

### 云端发布验证

`scripts/check-cloud.ts <HTTPS主站URL> --allow-new-test-journeys` 只创建合成新旅程；随机凭据只在进程内，输出不含凭据或存档正文。脚本验收两路线、重复动作、冲突、隔离、事件与重开。实际执行结果以 doc/cloud-release.md 和本机排除的 _qa/cloud-trial-canary.json 为准；上述历史预检记录不等于线上证据。

### 私有旅程备份

server/journey-backup.ts 维护完整备份格式与跨表一致性检查；ProductionAuthority.backup 和 Worker GET sessions/:id/backup 用原owner边界导出。scripts/restore-journey-backup.ts 仅离线恢复到新SQLite文件，未新增HTTP存档导入；完整范围、8MiB/10000事件限制及PITR未验收边界见 doc/backup-recovery.md。

### 平台目录登记

正式封面为 public/poster.png，meta.json引用/poster.png；来源与1024/160两级审查见doc/poster-provenance.json。src/game-id.ts保留服务端可用的GAME_ID/getGameApiBase，同时在浏览器启动时写入同一UUID；index.html的storage adapter加载标记和声明补齐。既有存储前缀和数据库名不变。未运行会覆盖整个game-id.ts的旧全量同步器，以免移除同UUID API合同；用针对两项目的UUID验证及全目录存储审计验证实际结果。


### 完整单人整合：稳定动作 ID（2026-09-10，开发中）

`src/story-domain-action.ts` 将已通过空间准入的动作 ID 精确绑定到 StoryCartridge 的 domain rule，再复用冻结内核的前提、数值下限、重复策略与效果解析。当前 `runRule` 已消费此适配，原语言关键词不参与地图按钮的选择。未知 ID、重复 ID 明确失败。自由文本不能直接调用此入口；当前场景/实体/距离校验和事务仍分别由 journey-runtime 与既有 authority 完成。

原《开往黎明的末班车》中英文 Cartridge 的 repair-starter 已在内存中验证：稳定 ID 对应原效果，错误地点拒绝且效果为空，原存档输入未修改。此处只是规则接入实证，不代表两款游戏的角色/资源已可自动互换。

### 统一故事回合与空间投射（2026-09-10，开发中）

`journey-runtime.ts` 保留当前地图、距离、动作及版本检查，将按钮和自由输入交给 `spatial-story-turn.ts`。后者将识别结果绑定到已准入规则，调用 Story Session 的 `executeStoryTurn` 和 `applyParsedScene`，统一记录原始输入、回应与权威效果。观察使用零效果规则；叙述里的协议命令被拒绝并回退到当前物件的作者回应。Narrator 只能接收脱离待提交状态的副本。

`spatial-story-projection.ts` 在事务之前检查唯一当前地图、转场的源场景和目标入口、新人物准入、既有身份及设备可视状态。不能表示的候选不提交。`finishStoryTurn` 保留既有人物介绍逻辑和事实派生目标，去除阅读壳自动推断的新快捷选项。返回存档按 JSON 持久化格式规范化，使即时回执和重新读取结果一致；没有修改既有数据或缓存命名空间。

本地 vendor 新增生产模板的 executeTurn，并增加已准入规则参数；reducer 禁止从受规则控制的输入额外推断地点别名。具体来源校验值与本地改动记录在 `ENGINE_SOURCE.json`，不再声称该目录与冻结模板逐字一致。尚未开启新的生产模型调用；开放剧情、完整人物关系和后续章节仍属于后续开发工作。

验证：84 项测试通过，类型检查、前端 cloud 构建和 Worker 构建通过。独立本地 5240 浏览器新旅程中，以自由输入开柜、按钮取保险丝，核对两次输入与回复各出现一次；刷新后保险丝 ×1 保留。随后介绍林、修理配电箱、进入行李检修车，实际 RPG-JS 地图与目标同步变化，浏览器错误日志为空。此证据是桌面本地行为验证，不代表本轮已部署、iPhone 真机或 AlterU 全程通关。


### 接应章节与协作关系（2026-09-10，开发分支）

`reception.ts` 提供七个稳定动作、三项可乱序准备、接应识别的错答/重试、明确交接完成及事实派生的目标与人物回应。动作注册到现有 contract，各自仍有空间目标与距离校验；领域规则补对应地图及人物前提，精确自由输入复用同一 ID。旧档缺失的新事实视为未开始，不重写旧完成事实或代选供电。没有新增地图、物品、实体角色或动态素材。

`DomainEffect.relationship` 是有来源记录的本地内核扩展：由作者规则按已介绍人物的稳定 ID，将 axis/delta/source 写入现有 StorySave.relationships；关系变化与任务事实同一事务提交。三个一次性准备/核对规则分别防止重复收益。没有新的关系存储或模型指令放行。人物页将这三类关系事件映射为已发生的协作记录，角色介绍规则不变。

`reception-ui.tsx` 复用现有对白按钮样式，只在当前正文最后一页展示新行动；主目标在交接完成前显示下一可做事项，章节结果另从已提交完成事实派生。交接完成前，第一章结果仍可在菜单回顾；最终交接结果保留实际供电后果，全部历史正文仍在旅途记录。UI 样式保持已选方向。

验证：90 项测试通过，包括中文/英文 × 电台/照明四条接应路线、错答后重试、未介绍人物、过早完成、旧完成档、三条唯一关系记录。实际 ProductionAuthority 的 SQLite 事务测试逐动作重放和重新实例化服务，关系恰好三条，事件不重复。cloud 前端、Worker 及隔离 Pages 预览构建通过。CUA 从此前本地合成旅程继续，完成电台优先求援、开始接应、先读记录/再找周雨/再找林、故意错答、自由输入正确复述、刷新、回客厢交接，人物页正确显示三条合作记录。320×568 信号选项各 44px 高且可见，390×844 结果页与固定退出操作可见。此为本地浏览器尺寸验证，未宣称新一轮 iPhone 真机、AlterU 或生产部署通过；新玩家理解未验证。

补充窄屏复验：320×568 英文结果页展开完成事项后，文档宽度仍为 320，固定操作区 bottom≈517，小于视口高度568；关闭与继续探索可用。390×844 中文结果页已目视核对。浏览器错误日志为空，临时 viewport 已恢复。


### 自然意图与按人物保存的对话上下文（2026-09-10，开发分支）

`conversation-context.ts` 为新增回合的输入/回复标记 stable speaker ID、spatial target、turn 和 role；生成上下文仅取当前已介绍说话者最近 4 个完整回合，每段输入/回复分别最多500/700字。零历史配置明确返回空，不把旧无标签正文或另一人物的对话猜作记忆。记忆作为引用数据供表达使用，不能直接产生事实、物品或关系效果。`sceneContract` 同时提供当前目标动作的标签、可用性和拒绝原因，接应识别仅在读过记录后提供；未来接应选项未开放时不发给模型。

`server/model.ts` 将行动提议收敛为 actionId，丢弃模型附带的未来状态、奖励和完成文案；领域规则仍拥有最终效果与正文。`action-intent.ts` 在模型入口和统一回合入口分别否决明确问句、否定和未来/歧义表达，不能靠另一个模型的同意绕过。其正则只是保守否决器，不是通用意图理解器。对白结构验证与语义审查继续存在；新增的便携照明承诺、人物指代、假解锁说法检查来自实际失败样本，不能视作所有自然语言一致性的数学保证。

整条生成/审查/一次修复共用22秒上限，低于客户端30秒。JSON格式错误允许一次修复，网络或总预算失败直接作者回退。ProductionAuthority 对同owner同action ID同请求的并发重试合并到一个进行中的准备请求；不同语义立即冲突。此合并仅在同一实例内减少重复生成，重启后的正确性仍依赖持久回执与版本重查，不声称跨重启模型计费恰好一次。

真实模型测试范围由用户明确授权：六条合成输入和程序新建列车状态，目的地为现有 chat.aiwaves.tech game-chat。首轮实测发现动作提议携带未来状态导致误拒，以及语义审查放过虚构备用照明；第二轮发现问句误执行与人物指代错误，均加入针对性修正。最后一轮自然开柜与人物记忆正确，问句不结算，换衣与未制作餐车没有改变状态；六次端到端耗时约1.85–7.20秒，其中格式错误/换衣两次作者回退。小样本不代表P95或任意开放剧情可靠率。最后的JSON修复改进通过模拟提供者回归，未再次声称完成线上全量验证。

以上100项测试阶段，Worker 尚未接入模型。后续开发分支接入情况见下一节；公开生产部署仍是作者回应，完整开放叙事、动态内容准入和正式生产验收仍需后续推进。

### 在线叙述接入正式会话实现（2026-09-10，开发分支，尚未发布）

Worker 的 `CarriageJourneyAuthority` 现已使用同一个 `propose` 适配器，但只有明确 `mode: live` 的自由输入才请求模型；普通按钮与默认模式仍走作者规则。`narration-policy.ts` 定义新偏好键，旧的模式键不会自动开启在线发送；静态浏览器版仍关闭在线模式。设置页说明会发送当前输入、当前场景及当前人物最近最多4个完整回合，可随时关闭。

`ProductionAuthority` 在完成空间与输入校验后，以 owner 为界限在 SQLite 中预留在线额度：每60秒窗口最多6次在线自由输入尝试。超额回合返回作者回应及 rate-limit 标记，不阻断移动、按钮和任务。额度跨 authority 重建保留；同 action ID 的重放和同实例并发合并不重复占用。额度衡量的是尝试，不是供应商请求数，也不是不可绕过的全站费用上限。未知模式在提交前明确拒绝，客户端清理对应已拒绝操作。

验证：103项测试通过，cloud 前端、Worker 和 preflight 构建通过，凭据与 API base 审计通过。5250 独立内存预发布服务使用实际 Worker 入口，以新建合成旅程和已授权输入“帮我把这扇柜门拉开。”完成一次真实模型开柜，随后按钮拾取保险丝，刷新后库存保持×1、目标正确，在线偏好保持。该测试不读取真实玩家旅程；此结果不等于生产已部署或全游戏已通关。

补充布局检查：320×568中文与390×844英文设置页实际截图检查，文档无横向溢出，内容在面板内滚动；刷新后显式在线选择保持，浏览器错误日志为空。这是浏览器尺寸验证，不是iPhone真机验证。

服务演进边界：已读取 `alteru-rpg-service/doc/给其他游戏制作任务的说明.md`（2026-09-10）。新的 Prolog 封装已部署到 Wilson 独立目录 `/home/prolog/alteru-rpg-api-v1`、回环端口 6019 并完成真实规则验证，公网新路由及正式接口包仍未交付；当前游戏继续既有已验证链路，不提前采用新 API、不自动迁移存档，也不把现有 TypeScript 规则测试当作 Wilson 规则已登记启用的证据。将来接入须依据正式接口包和上线验证结果核对版本、身份、存档与客户端。


### 终章与第四场景（2026-09-10，开发分支）

`departure.ts` 注册通路确认、撤收引导、步道往返、报平安和固定联络器交谈六个作者规则。当前地图、既有交接事实、调度身份与前提决定准入；终章事实由同一个Story Session事务写入。报平安仅在步道的联络器旁成立。模型上下文获得实际终章进度及合法动作，不获得解锁/结局写权限。许岚继续使用原稳定ID，通过两个地点的联络设备共享已有按人物记录；林和周雨不生成新的在场副本。

`scene-layout.ts` 新增walkway、客厢rearExit与步道walkwayBack/callpoint。实际生成图的通道是x150..234，运行世界保持384×576；联络器矩形164,76,56,52与障碍相同，角色接近点188,144。`world-objects`、`visual-states`、TMX和导出清单消费同一布局；不依赖React热点替代引擎场景。新背景独立保存于public/art/rescue-walkway.png，使用内置image_gen，原始提示词、参考及实际边界判断见doc/rescue-art.json。

地图版本升为train-scenes-3。服务端的增补迁移保留v2中仍可行走的原位置、故事版本、物品、事实与历史，只补未到访的新地图；浏览器旧v2旅程复用同一迁移。不是导入另一游戏的真实玩家存档，也不把已有handover_complete升级成journey_complete。

撤收引导保存guidance_released，保留power_radio/beacon_set作为历史选择；实际灯光、物件tint、配电箱状态、模型上下文和设备说明从当前事实投射。电台路线从35恢复100，照明路线保持100。结果页只读journey_complete，往返与打开结果页不会再报平安。

验证：110项回归通过，包含中英文×两供电路线从新旅程到终章、规则提前拒绝/跨场景拒绝、每步重复回执、SQLite authority重建、旧v2浏览器档增补、旧位置与历史/物品保持、当前灯光/说明与历史选择分离；四场景清单的14目标/7转场可达性和边界检查通过。cloud前端、Worker、Pages、preflight构建通过，公开凭据/API base审计通过。

真实CUA在5260独立内存服务从新旅程按正常输入完成：开柜取物→修复→电台优先求援→三处准备→接应交接→通路确认→撤收引导→新步道→联络器报平安。途中刷新交接进度保留；报平安前/后刷新均保持实际步道与对应目标。390×844实拍客厢从emergency变为full；320×568新联络点可见且报平安按钮44px，结果页有固定继续入口。

实测发现地图底端按钮焦点会使overflow:hidden容器出现37px内部滚动，造成背景/引擎整体偏移和底部空白。改为overflow:clip后同状态复验scrollTop=0、背景与引擎对齐。此为现有相机容器缺陷修正，不修改B视角、比例或碰撞坐标。真机、真人理解、AlterU内全程及本轮生产部署尚未验证；此章节完成不代表总整合目标全部完成。

补充复验：终章后返回客厢，再从同一后端出口进入步道，journey_complete保持、客厢full、两个方向map-frame.scrollTop均为0。390×844英文结局无横向溢出且继续/日志/人物入口可见；浏览器错误日志为空。仍未扩大为iPhone实机或平台内验收结论。

### 已登记场景的资源准备（2026-09-10）

`server/scene-resource-manifest.ts` 在构建时从四个实际背景 PNG、TMX 和共享布局生成 SHA-256 清单，检查画幅、正交地图尺寸和碰撞矩形/碰撞属性。Vite 将这一清单内联到前端；资源仍使用相对路径，下载时添加内容摘要作为缓存版本，校验字节数、摘要及图片解码尺寸。

`src/scene-readiness.ts` 的准备状态只属于当前页面及不可变构建，不写进故事存档。只请求当前场景或当前目标可以合法转入的场景；请求合并，成功复用，失败须显式重试，12 秒超时。先验证 TMX，再解码背景，避免后续地图失败遗留背景对象 URL。验证通过的背景使用本页 blob URL 显示。

`src/prepare-scene-action.ts` 在 `SessionClient.send` 创建待确认操作之前检查可能的转场资源。失败保留原行动、输入、版本与当前位置；重试沿用原意图，当前版本变化则要求重新选择。页面重载先恢复权威 head/receipt，再准备权威位置对应的场景，不回滚或重复已提交转场。当前场景失败使用“重试加载场景”，尚未提交的转场使用“重试原行动 / 留在这里”，与网络结果未知的操作恢复入口区分。

边界：这次只完成**固定登记场景的背景和逻辑地图可用性检查**，不是动态任务/角色/地图生成队列。RPG-JS 仍通过自身 Tiled loader 加载地图、图集和事件；本地资源检查不取代权威规则，也不把网络下载与数据库事务宣称为整体原子事务。引擎渲染失败保留权威进度，通过当前场景加载入口重试。后续动态内容准入、持久化候选状态和资产激活仍按总规划推进。

验证：117 项测试通过，其中新增 7 项覆盖真实清单、碰撞漂移、版本损坏、子路径、延迟完成、请求合并、未就绪转场不产生 pending，以及实际浏览器存档重试后只提交一次。CUA 在独立回环合成旅程用正常点击完成开柜→保险丝→认识林→修复→出口；模拟行李车背景一次 503，320×568 检查两按钮均高 44px、无横向溢出，取消与原行动重试均正常，重试后实际进入行李车。另验证当前客厢首次图片失败重试、390×844/320×568 提示，以及既有合成终章刷新回到步道。预发布故障开关只存在 `cloud-preflight` 插件，不编入正式 cloud 或 Pages 运行时。
