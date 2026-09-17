# 技术文档 · 车厢云端试运行与浏览器镜像

## 2026-09-17 屋顶底片的空间后果

`old-street-roof-recovery.ts` 定义六个领域动作、归档标记前置、纸套占有不变量与缺口／桥板几何。仅新建 v3 旅程写入 roof-recovery 功能事实；旧旅程升级不回填。`bindOldStreet` 对未开启旅程移除六条不可用的可选规则，保持完整动作绑定校验，而非把实体硬塞进旧屋顶。`oldStreetProjectedProps` 随搭板收缩木板堆的碰撞；正常两个出口保持可达。

显影提交开启读背面标记；按钮与精确自由输入共用领域动作，暗房输入白名单包含该动作。底片交还写入摄影师关系、笔记与结局，原件库存相应移除。`old-street-roof-recovery-view.tsx` 投射柜门及地面状态；归还纸套使用 `old-street-photo-table.ts` 的独立精灵和桌子占地坐标。没有新增模型调用、媒体调用、后台或线上开关。定向测试和实际小屏联测范围见 `roof-recovery-review-20260917.md`。

## 2026-09-17 借阅日志的空间落地

`ArchiveContent.ledgerSite` 可选 photo/laundry；缺省保留架上原件。准备编译器接收 archive/photo/laundry，拒绝未支持地点及外放日志搭配 denseSource=ledger；后者只能把密集夹页放在 index。`archive-ledger-site` 是同一内容的图层投影，head 校验两者相等。`archive-loan-read` 只保存可见借阅信息，不授予 ledger 证据。

`old-street-archive-loan.ts` 共用位置、去向短文与独立纸层；`old-street-archive-actions.ts` 通过同一个 bindOldStreet 验证正确场景和家具接近点，实体读日志才写 examined。按钮和自由输入走相同动作，既有桌面动作／补充便笺保持。笔记与目标复用同一借阅位置；已生成内容不重新抽取。

28 项定向检查通过。真实 renderer 从档案架走到洗衣店，再回档案桌完成调查与刷新恢复；前置进度是 QA 专用数据库中的普通权威动作准备，不是从开场全程 UI 试玩。两份真实生成内容共 7 次请求均选择 archive；因此外放路线仅有合成内容与实际 renderer 证据，不能声称自然生成多样性通过。详见 `archive-loan-review-20260917.md`。

## 显影台操作与版本保持（2026-09-17）

新建 v3 campaign 写入可选 `photoMethod: develop-v1`，请求创建时将它复制到唯一扩展意图。旧 campaign / request 缺字段则继续拼图，升级不回填；head 校验两处方法一致。原 `expansion-photo-match` 行动继续承载提交，方法由权威请求决定，不由客户端随意切换。新方法验证照片hash及焦距/曝光；旧方法仍验证半片与旋转。完成发现、keep/leave、当前目标、库存与结局继续走原 Story Session，不增加一套进度。

`old-street-developing-puzzle.ts` 从同一照片hash得到稳定校准，两个控制各为0–6；只有预览 blur=0 且 brightness=1时接受。`old-street-developing-view.tsx` 只对正在显示的图像应用CSS滤镜，不改媒体文件。档位草稿存入按旅程ID及hash区分的 `alteruSessionStorage`，同标签刷新/再开保持，跨设备仅同步已经确认的照片结果，不承诺未提交试调同步。

`requestExpansion` 原先把 RecoverableSessionClient 返回的确定拒绝当作成功关窗，现先更新读回的head，再根据 rejectionCode 保留失败状态。拼图与调焦都维持面板供纠正。控件调整会清除已过期的失败提示。

本地媒体复用已有平台照片：`_qa/archive-photo-playtest-server.ts` 可显式配置 `OLDSTREET_PHOTO_QA_REPLAY`，与 --live-media 互斥。`_qa/commission-playtest-progress.ts` 在隔离QA库内通过正常权威行动准备前段，可在显影台前停住；不是浏览器全程步行或新模型生成证据。详情见 `developing-review-20260917.md`。


## 连续生成的题材与照片核对（2026-09-17）

`compileTraceDraft` 现在分别抽取题材与界面行序，三条模型主题都可能成为实际调查对象；结果仍保存为原 `TraceContent`，旧存档读取不重抽。独立的 `subjectVariant` 只用于可复现测试。

`old-street-expansion-planner.ts` 删除了容易被当成输出照抄的木板例句。`reviewArchivePhotograph` 核对源事件、照片描述摘录、对象/材料与观察陈述；缺少证据、相互矛盾的检查或否定项不准入。仍只调用一次生成及一次复核，不增加媒体次数。它不是语义正确性的证明：真实复测仍出现错误的 observationOnly 判断，详见 `commission-continuity-review-20260917.md`。

`scripts/test-oldstreet-campaign-live.ts --with-photo` 在两条合成链中连接档案与照片规划，每链最多8次请求，共16次；原三阶段模式保留原12次总额度。`_qa/commission-photo-recheck.ts` 以原两份合成档案复核旧错误，再生成新候选，最多6次。报告逐次落盘，不覆盖已有报告；不读取玩家存档、不生图、不发布。


## 完整委托候选 v3（2026-09-17）

`OldStreetCampaign.version=3` 仅经显式 `letter-trail-v3` 新建；本地调试菜单需 campaign/planning/media 能力齐备。v1/v2 不迁移、不加照片门槛；生产 campaign 开关仍关闭。新委托开场和目标在 `old-street-campaign-story.ts` 定义，`campaignPhotoPurpose` 供笔记与准备提交共用。runtime 的 `finish` 只在候选上复制 save 更新 objective，再经过原权威校验，不改准备前的头部。

v3 暗房请求必须继承本旅程已还原的 `archivePhotoSource`，早期无关请求不占用唯一扩展槽位。实际媒体匹配时保存 `campaign-photo-archive`；`campaignComplete(campaign,facts)` 同时要求已观察匹配照片、关联档案与明确 keep/leave。`assertOldStreetHead` 校验来源、观察与照片库存一致。生成、房间准入、匹配和去向是不同状态，重试不自动完成；离开仍由同一 Story Session 事务裁决。生成任务与媒体接口复用原实现，未创建第二套状态引擎。

`_qa/commission-playtest-progress.ts --seed-synthetic` 只针对隔离 QA 数据库中唯一零进度 v3 旅程，通过正常 authority 行动和 jobs 准备到未解答的档案桌，供代表性 renderer 检查。它不是浏览器步行证据或正式游戏入口。`showExpansionPhoto` 在照片去向已确定且离台时关闭常驻面板，照片仍在权威旅程中保存，靠近重新读取。


## 便笺副本与归还（2026-09-17）

可选 `campaign.field.copy` 存储已观察原件的 title/finding 快照，`field-note-copy` 是独立行囊物品与 fact，不重新生成内容。复制只允许在实际接近照相馆放大台且原件在手（或原本就在台上）时执行；同一原件只做一份副本。原件 take/leave 可在离开前通过 borrow/return 改变，原始所在地不变。沿用原 Session 事务和回执；旧字段缺失时保持兼容，结束旅程不再提供操作。

`fieldChoices` 给附近操作及自由输入同一组动作；抄录不自动归还或完成主线。`fieldHandling` 描述目前原件/副本与下一地点，已存在的放大镜/照片操作仍保留；有可用便笺操作时不显示无关照片夹缺失提示。地图纸层依原件去向，副本进入背包/发现/结局。证据见 `field-copy-review-20260917.md`。

## 实地追查便笺（2026-09-17）

`old-street-field-inquiry.ts` 定义 field 内容、地点、可用动作和已知范围；`old-street-field-actions.ts` 在原权威 Session 内验证档案完成、目标接近和抽屉开放，提交观察/去向及库存。field 内容进入 campaign 并持久保存，facts 与 inventory 由 head 校验一致。`campaign-field` 沿用任务队列、失败重试及同一历史上下文；生产开关不变。

`OldStreetFieldLead` 嵌入已有档案桌面板，准备时可关闭继续探索；之后既有附近行动与自由输入共用 read/take/leave 动作。fieldKnowledge 在观察前只提供地点，观察后提供正文；明确分享给居民后才加入该人物知识。地图复用已有纸夹图层，带走隐藏，不改家具碰撞。详见 `field-inquiry-review-20260917.md`。


## 密集档案夹页的替代辨读（2026-09-17）

新 `ArchiveContent.denseSource` 可指定 index 或 ledger，编译/持久读取验证枚举，旧实例没有该字段保持原行为。`archive-dense-source` 是场景投影，与内容严格一致；`archive-reading-position` 为 carried/desk 或省略（原架），head校验行囊 `archive-reading-sheet` 恰与 carried 对应。

`old-street-archive-reading.ts` 提供当前物品/位置允许的按钮与自由输入动作，服务端 `applyArchiveReading` 在原空间接近验证之后执行：read-lens 要求 lens，carry-sheet 只在原架/桌面取纸，spread-sheet 只在桌边阅读，return-sheet 只在原来源归还。普通 observe 不绕过未辨读的 denseSource；仅真实读成功才记 examined。归还不移除证据，prepareArchiveAction 的 archiveReconstructed 只对真正提交顺序计1。

UI不自动 observe 密集来源，直接给两条可用操作和当前纸页位置；实际事件三种pose由同一facts驱动，基础家具始终保持，纸层隐藏或摊开。已完成录入/拿起不会使共享库存多一份。新真实生成可指定密集来源，本地QA有独立明确的来源覆盖便于核心机制测试，不进入生产入口。证据与范围见 `archive-reading-review-20260917.md`。


## 成套调查准备（2026-09-17）

`server/old-street-investigation-draft.ts` 将完整四事件稿编译为 `PreparedInvestigation`：固定记录保留在指定端点，同一 chronology 分发为纸袋、证据和结论，房间仍交给现有 composer。兼容此前三个补充事件的未准入稿格式；不迁移已保存文本。纸袋只列出实际端点记录与未明的先后，不接受生成摘要泄露答案。语义复核读取精简后的固定事件、开场、顺序和结论，不把家具网格传入判断。

`OldStreetCampaignJobs.run` 在原规划 attempt 仍有效时，将 public parcel job 与匹配 archive job 同事务写入。纸袋的 HTTP 返回不包含未来档案；archive 的现有读取条件仍要求纸袋已观察，准入和实际调查仍走原权威行动。同步写事务之前读取最新 head（authority 读取可能自身开启迁移事务），两者之间没有异步等待。发现纸袋已准入或 archive job 已存在时不覆盖。重启、轮询和随后请求 archive 复用既有候选，无第二次作者调用。旧纸袋沿用旧 archive 生成路径。

实际本地/Worker入口通过 jobs 注入候选，直接 generator 的旧测试入口不会拆包吞掉未来档案。后者收到完整 bundle 会按原 schema 拒绝，不能用于新生产接入。开发回放保存 public accepted 与 preparedArchive 两部分；报告保留所有作者/复核/失败请求。详见 `campaign-live-20260917/prepared-investigation-review.md`。18次实际请求中的早期失败、语义复核漏检及最终样本调查性不足均保留，不将格式通过视为完整动态章节验收。


## 内容复核与程序化房间组装（2026-09-17）

`old-street-campaign-planner.ts` 在未准入草稿阶段最多进行两次作者请求。每次先编译规则，再对调查纸条/档案调用 `old-street-campaign-review.ts`；档案复核上下文携带前文和由实际关系链推导的完整顺序。通过才返回候选，二次失败/异常保持原后台失败恢复行为，所有请求沿用同一个 AbortSignal。旧已准入内容不经此流程，模型复核不授予状态或完成事实。

`old-street-room-composer.ts` 将新请求的 `roomPlan` 编译为持久的9×5布局。模型指定 indexSide、storageShelves、rack，种子驱动放置资料架、桌子、可移动架和固定架，站位行预留，最多尝试128次；每份结果用原 `archiveRoomLayout` 验证两种状态。没有找到合法摆法则明确失败，不塞入一个固定兜底房间冒充生成。运行读取保存的行数据，不重新随机。以前的 room 输出仍可编译；仅生成边界允许等价换行字符串，持久读取仍要求已规范化的数组。

真实请求记录与局限见 `campaign-live-20260917/reviewed-chain-review.md`。四批共38请求，最终一组结构及模型复核通过，但人工评审仍发现因果薄弱；没有宣称语义复核已保证剧情质量。程序组装解决的是空间格式/可达性，不能代替完整故事骨架。

## 可移动档案架（2026-09-17）

生成布局可选一对相邻水平 `M/m`，分别是40×40储物架的初始位置和停车位。`archiveRoomLayout` 同时验证两种状态、扫过区域、索引确实被阻挡及两侧操作点可达，并缓存两份投影。`archiveLayoutFromFacts` 读取唯一移动状态 `archive-rack-shifted`；渲染、碰撞、寻路和互动共用它，初始受阻索引不进入互动绑定。

`archiveEventSlots` 预登记第10个家具槽 `archive-rack`，使用原储物架素材；准入后按布局显示，移动后跟随状态定位。切换旅程时 `archive-room` 有变化也重建 renderer。无 M/m 的房间与旧左右布局维持原行为。

`prepareArchiveAction` 接受同一 Session 内 `campaign-decide` 的 `slide/restore`，保留位置、版本和回执检查；新位置不能覆盖玩家。移动不产生调查完成事实，复位不移除已读证据。附近按钮直接提交该动作，避免把界面语言的标签当成另一语言旅程的自由输入；自由输入仍通过 `campaignInputActions` 映射到同一动作。

两次真实布局请求一份有效、一份拒绝；合成及有效真实布局的操作、查阅和恢复见 `archive-rack-review-20260917.md`。34项定向检查及正式构建通过。仅房间空间行为已证实，联合生成质量、完整节奏和生产验收不在此结论内。

## 生成布局与真实空间（2026-09-17）

`old-street-archive-room.ts` 将 9×5 字符格转换为既有两处资料架、整理桌和最多6个固定储物架；入口及地面边界固定。使用实际 `findGridPath`、16×26角色占地和同一物件占地检查所有互动点可达，失败不准入。最多缓存32份已验证投影，避免动画循环重复寻路。

`ArchiveContent.room` 对持久旧内容可选，新 inquiry 生成请求则必须提供。准入时把行数据保存为 `facts['archive-room']`；head校验它与当前档案实例一致。`archiveLayoutFromFacts` 供显示、碰撞、寻路及互动共享，旧档没有此字段时沿用原左右布局，不改变旧入口或任务。

RPG-JS启动时预登记3件调查家具及6个储物槽，在各自 `onInit` 读取已准入布局定位；不用的储物槽隐藏。储物架参与碰撞及场景信息，不生成空互动面板；只有调查家具叠加纸页。复用已有准入美术，未增加生图任务。

真实两次布局请求中一份不可达被拒绝，一份进入实际游戏。浏览器将它与以前单独生成的内容组合回放，不能视为剧情与房间一次生成的完整链。33项定向测试及390/320实际操作、往返和独立刷新证据见 `archive-room-review-20260917.md`。当前仅证明布局接入，不代表完整主线或内容质量验收。

## 调查摘要的街区后果（2026-09-17）

档案完成后，记录册的 `campaign-decide` 接受 `share` / `withdraw`，仍经过原 Session 的位置、版本、回执与完成检查。唯一状态为 `save.facts['archive-published']`；只有真实完成的档案可公开。原件库存、私人发现、关系与结局准入不变，同一操作回执可重放。按钮和自由输入共用 `campaignInputActions`，未完成调查不提供该动作。

`old-street-public-record.ts` 提供标签与公开知识。NPC 对话只收到实际已公开摘要或已撤下状态，不把私人调查直接灌入角色知识，也不声称居民已经读过；本轮验证上下文接入，不宣称真实模型对白已验收。发现页和最终结局读取同一事实，撤下不抹掉私人发现或历史。

`old-street-record-book.ts` 为原四种册页状态增加独立 summary 组合，复用已准入纸夹纹理，撤下只隐藏新层，不影响旧钟/旧照。实际 renderer 发现最初纸层偏低被主角遮住，已移至册页面内并复拍。记录册面板在调查完成后优先显示结论与发布选择，原匹配记录收进原生 details。证据见 `public-record-review-20260917.md`。

## 两事件调查与证据结论（2026-09-17）

新调查纸袋使用 `ParcelContent.inquiry` 保存两个事件身份。`compileLinkedParcel` 将实际选中记录的标题固定为第一个事件，模型只提供另一个事件和短片段；`inquiryQuestion` 生成问题。历史纸袋没有此字段时仍沿用旧格式和旧生成路线，不回填或重新生成。

`compileInquiryArchive` 保留两个事件为卡片 a/b，模型提供中间两事件、场景既有布局及历史先后方向。程序将四事件串联为三条来源关系，分到两处资料架；每处单独都不能确定问题两端的顺序。卡片呈现顺序独立排列并持久化。`inquiryConclusion` 从该证据链生成结论，不采用模型另写的自由结论。

`assertArchiveInquiry` 在生成、候选准入和存档读取时核对事件身份、证据必要性和结论一致性；中间卡片含明显 before/after 等关系描述时拒绝，避免把答案写进事件标签。此检查不宣称能理解所有自然语言含义，片段泄题、同义暗示、事件常识与趣味性仍需要内容评审。

实测与边界见 `campaign-live-20260917/inquiry-review.md`。固定两个事件的版本完成一批六请求，两组结构通过但一组语义拒绝；可接受的一组已在 renderer 完成调查、结论和刷新恢复。随后最终“程序固定记录主题”格式新批实际五请求：一链结构通过但事件常识不合理，另一链片段超长拒绝。本批无完整内容合格链；机械约束仍不能证明叙事连贯或动态内容验收。

## 真实模型的记录配对修复（2026-09-17）

首批真实 trace 两次都没有双特征匹配项。现 `createOldStreetCampaignPlanner` 请求 `{title,marks,wrappings,subjects}`，`compileTraceDraft` 构造唯一配对和两种干扰并随机排列，继续用 `readTraceContent` 校验和保存既有格式。已保存记录不再运行编译。原有合法 `records` 返回仍能验证读取，不静默修补不合法旧候选。

`scripts/test-oldstreet-campaign-live.ts` 记录每次请求上下文、原始输出、结构准入和累计使用量；已有报告路径拒绝覆盖。`OLDSTREET_MODEL_TEST_USED` 用于同一有界批次在修复后延续累计计数，不是批准追加额度。`_qa/campaign-fixture.ts` 可显式指定 `OLDSTREET_QA_CAMPAIGN_REPORT` 回放已记录的一组内容，严格检查上下文一致，无新网络请求，也不用于生产。

实际六请求及叙事失败见 `campaign-live-20260917/review.md`：模型输出可解并不代表问题被回答，当前尚无已验证的语义准入保证。

## 新主线的委托、问题与答案（2026-09-17，本地增量）

`old-street-campaign-story.ts` 只在新建 `letter-trail-v2` 旅程时写入委托事实、目标与可见开场；恢复、升级以及 v1/普通旅程不回填它。启动提示读取该旅程保存的开场，发现页和已知信息共用同一委托标记。结局只有在该标记和调查完成事实都成立时才称为完成家人委托，旧结局不改写。

新 v2 纸袋生成上下文携带 `investigation: true`，要求一个具体待查问题；`ParcelContent.question` 对旧存档仍为可选。模型返回的新调查材料缺少问题时拒绝准入。档案生成读取前一阶段完整材料及问题，要求四事件与来源关系共同给出答案；结构检查证明排序可解，不能证明自然语言的事实一致性或趣味性。问题只有在玩家阅读材料后进入自由输入知识和发现页；后台准备不等于已知。

当前实证见 `campaign-commission-review-20260917.md`。没有调用真实模型或新增媒体，也没有发布或开启正式 campaign 开关。

## 档案工作间动态调查（2026-09-17，本地开发增量）

`letter-trail-v2` 在既有两段材料后增加 `archive` 准备任务；`v1` 与不带 campaign 的旧旅程保留原结局条件。`old-street-archive.ts` 定义四张事件卡、两处来源、三条先后关系；穷举四事件的排列验证唯一解，且任一来源单独不能给出完整顺序。生成器读取前一段实际选中的记录和已准入材料，返回有约束的内容，不能提供可执行规则或自行授予完成。

`server/old-street-archive-actions.ts` 在地下室资料架准入候选，只开放真实侧门，不传送；进入后在各自接近点读取两处证据、在桌面提交顺序。来源、答题结果和发现进入同一权威旅程、动作回执与日志；错误顺序可调整。Worker 与本地服务共用 `campaign-archive` 后台任务、期限、显式重试和候选读取。仍由既有发布开关控制，未在线上开启。

地图、碰撞与生成器两种家具布局共用 `archiveLayout()`。RPG-JS 在启动时建立事件登记，故必须预登记未开放房间的稳定家具 ID，再在实际房间初始化时读取已准入坐标；否则游玩中生成房间会出现有碰撞无家具。切换不同档案布局的旅程时重载该单实例渲染器。地图热点使用无底实体区域，点击走近后直接查阅；保留独立自由输入入口，解谜完成后直接显示发现与顺序。

本轮 27 项 campaign/archive/Worker 定向测试、10 项地图/环境/空间测试与实际浏览器检查的范围见 `archive-playtest-20260917.md`。合成生成不证明真实模型内容质量；房间机制不证明完整主线内容量或新玩家理解。

## 自由输入实际界面恢复（2026-09-16，本地待集中发布）

本机故障注入发现两个玩家流程问题：恢复按钮在沉浸式布局中脱离行动区，位于顶部，与诊断栏和外部访客栏重叠；另外，客户端已收到明确拒绝、随后读取最新head失败时，重连会再次提交那次已拒绝的行动，触发第二次模型尝试。恢复按钮现置于下方错误提示之后。`RecoverableSessionClient` 在原pending信封上保存可选 `confirmedRejection`，只接受既有终止错误白名单；重连仅补读权威head，成功后按原流程清理pending。未收到明确拒绝的请求仍保留原编号重放；玩家主动重试才创建新编号，不改变存档、规则或服务端协议。

`_qa/old-street-recovery-ui-server.mjs` 使用同一游戏页面、客户端和SQLite权威服务，仅注入合成回应与一次性传输失败，不调用真实模型。CUA实际操作验证：已提交回应丢失后显示原短回应，生成1次；拒绝后读取失败重连回填原输入，生成1次（修复前2次），随后按钮移盒正常推进至v3。恢复按钮原地可见可点，外部访客栏通过其自身关闭按钮关闭，不改游戏构图。65项客户端/旧街/原作准备行动相关测试及正式构建通过。证据 `oldstreet-input-recovery-ui-20260916.json`；319×676本机浏览器与合成输出不代表真实模型、iPhone或正式AlterU验收。

## 旧街 NPC 短步行走修正（2026-09-16，本地待集中发布）

`src/old-street-resident-motion.ts` 的修表师傅原本已按实际位移切帧，但用主角图集缩放推算出了约51.33世界单位的步态周期。在24单位/秒的慢走速度下，每帧约535ms，首次24单位的小段行走还没到另一只脚就停下。现在独立配置NPC短步周期20单位，保持速度24、活动范围左右24、停留3秒；四阶段每次移动5单位切换，正常间隔约208ms。靠近、选中、暂停、阻挡或到达时归站姿并重置周期，暂停时间不累积虚假步幅。

17项相关测试通过，含30/60/120fps首次短段内完整两步、每姿势不超过250ms及停步恢复；类型检查、正式构建、资源摘要和Worker启动检查通过。本地真实RPG-JS场景经街口→照相馆→屋顶→工作棚进入，CUA连续8帧（约1秒）可见走动中的伸腿/收腿切换，选中人物后停步转向玩家。证据为本次CUA截图序列；这不等同于iPhone真机检查。旧素材侧向两个迈步帧轮廓仍接近，本次未重画素材。阿岚/许青仍只有站姿候选，不把此修复记作它们的行走素材准入。旧列车同行角色另用与主角共用的55单位距离周期，本次未修改其速度或存档。

## 当前正式接入合同（2026-09-12）

画页UI开发增量：`src/original-illustration-panel.tsx` 接入原作日志，独立busy/读取序列和图片版本key处理等待、下载失败与迟到响应；`src/original-illustration-contract.ts` 验证列表并决定创建/恢复/重试/返回地点/次数用完状态。原作health的 `illustrationsAvailable` 为唯一可见入口开关，生产仍false。本机测试服务仅在显式保留素材回放参数下启用；没有生产测试query。新请求配方v2只对已知北岬基准加强暗蓝雨夜约束，数据库中v1请求不改写。最终实际日志流程、真实图片读取与错误恢复证据见 `original-illustration-ui-review-20260912.json`；两张媒体候选均未准入，下一步完成候选放弃/保留/回退。

开发分支新增 `server/original-illustration.ts`，为原作提供独立画页任务、24,000字节分块保存、摘要检查、120秒租约与每日意向配额；`server/original-http.ts` 接 `/sessions/:id/illustrations` 和场景文件读取。它运行在现有 `original-v8:<owner>` 数据库，读取原作状态做来源校验，但不写剧情、坐标、资源或行动回执。`src/original-background-sources.ts` 与构建共用真实仓库原图路径，避免把构建时才生成的 `art/approved/` 地址误作Git引用。`ORIGINAL_ILLUSTRATION_RELEASED=false`，生产请求仍拒绝；仅显式注入的本机合成媒体测试启用。首张真实画页因夜色改变未通过美术验收，尚无正式画页UI，不改变下列线上版本。恢复与真实PNG浏览器解码证据见 `original-illustration-review-20260912.json`。
- `src/original-release.ts`：cloud主入口选完整原作；`?story=carriage`继续旧车厢，`?story_runtime=legacy`保留旧浏览器存档。Pages镜像不访问原作后台；preflight仍需显式`?story=original`。
- `server/original-presentation.ts`：准入检查九房间绑定、四名固定人物素材、通风机、当前地面与交互点、旅程内素材身份不变。它是结构检查，不是自动审美认证，也不表示其他设备素材全部完成。原始运行时仍默认拒绝；正式Worker显式使用此gate。
- `vite.config.ts`及`server/original-scene-preview.ts`：cloud/Pages和preflight输出完整地图与背景；`scripts/check-original-dist.ts`在构建时核验实际采用资源的字节、SHA、尺寸和许可证文件，拒绝采用whitebox背景。
- `worker/source.ts`：原作服务在同一DO namespace的`original-v8:<owner>`内运行，旧车厢对象和数据库迁移标签不变。正式原作使用现有game-chat接口的行动理解/交谈适配器、20秒预算、持久6回合/分钟配额和玩家主动开启；按钮无需模型。显式测试gate不会隐式获得在线provider。
- 当前正式原作wire为`original-session-15.assets-12.story-8.original-train-authoring-10`；旧车厢wire及creator wire保持。发布身份为`carriage-assembly-20260912-1`，正式主站/Pages同一8c4ebb1，发布记录为assembly-release-20260912.json。
- `_qa/original-production-server.ts`仅供本机测试：原样导入已编译Worker、服务dist、全新临时SQLite，禁止服务器外发；浏览器脚本另拦截所有远程来源。它不是生产Worker，也不读取生产或个人存档。
- 原作与车厢切换先保存位置；有待确认操作时不得切换。原作目录和两种故事的续玩键保留，不做自动存档迁移。平台账户恢复、全面设备状态美术、最终真实AlterU整段验收仍待完成；上线与实测结果另记发布证据，后文历史“原作关闭”不代表当前候选代码。


## 1. 技术栈

React 18、TypeScript、Vite 8、RPG-JS 5 beta、CanvasEngine/PixiJS。Node 22.22.2用于构建和本地服务。界面DOM与引擎画布共享世界地图父层和尺度。第三方固定版本见package-lock.json；完整声明随public/THIRD_PARTY_NOTICES.txt进入构建。

## 2. 目录结构

- `src/art-draft.ts` / `art-creator.tsx`：独立 creator.html 浏览器背景制作、固定请求 ID、Web Locks 单任务互斥、IndexedDB 当前草稿和历史候选、下载上限/摘要/原生解码。无长期密钥，也不访问玩家旅程。真实 localhost 生成请求被服务以 `ORIGIN_NOT_ALLOWED` 拒绝；05db41c 已在正式来源完成真实创建、下载、刷新和地图试走，详见 doc/authoring-release-20260911.json。已生成真实样本可以从浏览器保存并进入同一地图，不冒充新生成成功。

- `scripts/platform-art-candidate.ts`：制作期公共媒体探针，使用游戏同源媒体客户端、预先固定请求 ID 和落盘任务状态；重跑需 `--resume`，不自动新建计费请求。当前是内部证据工具，尚非创作者自助入口。
- `doc/platform-art-candidates/20260911/`：五次真实服务请求、未修改图片、摘要、透明检查及真实地图对照记录。`server/original-scene-preview.ts` 只在 preflight 输出背景候选与摘要，`?scene_preview=north-cape&art_source=platform` 使用相同地图/碰撞/既有主角比较背景；生成角色和设备未准入。

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

### 浏览器制作候选（2026-09-11）

`creator.html`（旧 preflight 查询入口仍兼容）提供冷光/暖光的固定布局背景变体；状态是 prepared/generating/failed/candidate，candidate 不是生产 active。提交前保存 request ID；有 task ID 时仅查询旧任务，无回执时复用原请求。明确终态失败与不确定网络失败分开，限流等待服务指示，来源拒绝在当前失败状态下禁用再次生成。Web Locks 覆盖准备、提交、回执保存与样本载入；不支持该能力的浏览器明确失败，不静默失去跨窗口互斥。

数据库 `alteru:<部署 UUID>:creator-art-drafts-v1` 独立于 StorySave；自托管取地址第一段 UUID。历史按 draft ID 保存，当前指针另存。字节只在下载大小、尺寸、摘要和浏览器解码通过后成为候选；草稿地图按 URL 的固定 draft ID 读取历史，旧版本不会随新制作覆盖。地图复用已有 SceneReadiness 和 RPG-JS 几何，仍显示待质量验收。当前草稿只保存在该浏览器，尚无创作者云端恢复、发布版本或完整角色/设备生产入口。05db41c 已将独立 creator.html 入口及候选资源纳入同一 cloud/Pages 构建；普通 index.html 入口不自动加载制作页。候选分发不等于准入主游戏。

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

服务演进边界（更新至交付0.1.1）：维护方文档现确认公网 API 与包已交付，旧“公网未开通”记录作废；本轮无鉴权只读GET /health实测返回ok=true、version=0.1.1、model_enabled=true、public_platform_ready=false；证明公网健康端点可达，不能代替可信后台连接、真实登录、游戏注册和模型可用额度验收。已核对配套 game-definition、api-v1、platform-integration 合同，继续既有权威链路并保持原存档。新服务须经可信平台代理，不能用浏览器自报身份或现有匿名 capability 替代平台验证。v1规则固定3数值、最多64行动/64简单事实、字符串事实最多128字符；本游戏的结构化传话记录、关系效果、空间位置与表现准入需要明确适配，不能直接提交StorySave或仅替换URL。snapshot含relationships/jobs不等于作者规则合同已支持全部写入。接入前逐项验证能力和合成存档恢复，禁止双reducer结算；不为配合格式删减需求。未发送新增模型输入；文档所列共享剩余额度不是本游戏独占额度。


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

### 同一旅程中的模板支线（2026-09-10）

`src/relay-content.ts` 增加 `relay-message-v1` 模板：在林与周雨均已介绍、电路已修复后，组合当前发起人、另一位接收人及感谢/关心主题。服务器以当前 journey ID 作为稳定 seed；在线意图提议只能选择已列出的 templateId/theme，按钮及离线模式使用稳定种子选择。模型不能提交文案、人物或奖励定义。

候选依次经过 proposed/preparing/validated/active 检查，验证身份、原地图居民绑定、B 图集路径/版本和从合法出生点到角色接近点的实际寻路。成功与失败的阶段/原因都进入版本1记录；成功后才生成可见委托。它是已入库资产上的同步模板装配，不是后台异步生图队列。客户端提出委托前准备两个涉及场景的现有资源；服务端执行模板准入，不信任客户端授予规则或人物身份。

记录放在唯一 StorySave 的 `facts.spatial_relay_v1` 中，内容为有界、带版本的 JSON；现有 v10 facts 本就允许字符串，不新增第二份任务存档。plan 保存 seed、templateId、主题、人物绑定、素材参考版本；phase 为 offered/accepted/delivered/completed/declined。旧存档没有该字段时不自动生成委托；已有或失败计划重试保留身份，拒绝后不重新生成。模板v1后续须保留解析和表现语义，新增模板使用新版本，不静默重抽旧任务。

五种阶段动作分别绑定到两位人物，仍经过 `executeSpatialStoryTurn` 和 canonical DomainEffect。规则负责事实和一次关系事件；投射门禁额外拒绝观察改内容、身份变更和未验证激活。主线目标与求援结局条件不依赖此支线。`reception-ui.tsx` 显示当前阶段动作，菜单“一路上的约定”仅显示已激活记录，人物页解释已发生的传话关系。

测试包括两语言×两发起人、拒绝不影响主线、未登场人物隐藏、居民缺失/通路阻断、失败重试身份稳定、提交重放与实例重建、远程转达拒绝、错误参数/问句不接受，以及模板结构生成的模拟提供者测试。本轮没有向真实模型追加新测试输入；不能将这些测试称为真实LLM内容品质验收。新人物、地图、头像/特写素材生成和通用创建入口仍待后续接入。

本轮共126项回归已有通过记录；主站前端、Worker、Pages、预发布构建通过。CUA在5280新建合成旅程，正常完成维修/介绍→周雨提出委托→接受→刷新→返回客厢向林转达→回周雨处用明确自由输入报告→人物关系→完成后刷新。320×568接受/婉拒按钮均44px且无横溢出，390×844英文完成记录检查通过。实际发现并修复可达性依赖的模块初始化顺序，以及重开周雨对白仍只显示主线提示的问题；复验显示保存的传话阶段。浏览器错误日志为空。此次仍为开发分支，未宣称新版本生产或平台全程验收完成。

### 发布前旧档与备份兼容保护（2026-09-10）

`src/journey-compatibility.ts` 明确允许 carriage-1、carriage-ortho-1/2、carriage-narrow-1、train-scenes-1/2 和当前 train-scenes-3，且要求 StorySave v10 / carriage-07。`upgradeHead` 在任何修改前检查，不把未知地图、未来 save schema 或其他 cartridge 当成旧档升级。ProductionAuthority 在异步叙述返回后的提交事务中再次检查，防止相同 cursor 的版本替换被旧请求覆盖。此检查不等于完整内容版本/规则版本握手，后者仍需发布前验证。

备份导出使用数据库原始 head 的 mapVersion，而非当前构建常量。离线恢复允许上述明确支持的旧版本，校验 envelope 与 head 一致；先原样恢复到空数据库，首次权威读取再升级地图。历史 journal/receipt 不重写；升级不增加 cursor，旧请求重放返回原回执，客户端随后读取最新 head。未知版本仍拒绝恢复，校验和仍仅用于完整性检查；没有添加 HTTP 存档导入接口。

新增5项回归：旧格式合成备份完整恢复及一次升级/回执重放，未来地图/schema和错误cartridge不修改存档，备份外层版本错配拒绝，延迟回合不能覆盖同cursor未来版本，客户端遇到版本错误跨刷新保留同一pending ID并在兼容服务恢复后提交一次。全量131项测试通过；cloud/Worker构建、秘密与API base审计通过。本轮没有读取真实玩家存档，没有执行生产数据库迁移或发布。测试用旧格式合成数据，不代表真实线上备份/PITR演练。

### 客户端与服务版本核对（2026-09-10）

`runtime-contract.ts` 显式登记协议/地图/StorySave/模板的兼容ID，前端与Worker引用同一常量。cloudTransport先读取no-store health，确认runtimeContract后才发送旅程请求；同页共享握手。每个请求携带X-Carriage-Runtime，Worker与Durable Object路由在访问旅程前检查，每个成功响应也须带匹配header。握手失败允许重试；部署切换后的版本拒绝会清除握手缓存。兼容ID须在破坏性内容/规则/地图变化时更新，不是自动源码hash，也不替代存档升级检查。

未更新的旧页面被新Worker拒绝，原pending/身份不清除；新版页面检测到不匹配显示“刷新并继续”。历史回执不要求改成当前地图，但读取最新head与渲染资源仍服从当前合同。不能把此协议保证扩展到没有实现协议的旧Worker回滚；仍禁止用旧二进制覆盖已升级数据。

134项回归通过。`check-cloud.ts` 已扩展为电台/照明两条完整主线（41/46次行动），包含完整传话支线、一次关系后果、接应、步道报平安和往返、逐行动回执重放、隔离、空库备份恢复；固定按钮测试不调用在线模型。脚本只在显式allow-new-test-journeys时写入新合成旅程；HTTP仅允许显式loopback选项，正式地址仍要求HTTPS。本地真实Worker路由全部通过。320px实际页面版本不匹配提示无横溢出、按钮44px，点击刷新恢复；正常开柜操作通过。预发布故障开关仅存在loopback插件，不进入cloud构建。正式上线结果另记。

### 慢资源准备预算与诊断（2026-09-10）

平台内两个新场景均出现首次准备失败、手动重试成功，与先前Chrome冷启动现象相似。旧诊断无法区分根因，因此本次是针对严格12秒总预算的缓解与可观测性改进，不宣称网络根因已完全定位。SceneReadiness默认总预算改为30秒，仍包含地图、图片、SHA和解码，超时仍中止且禁止晚完成激活。HTTP/字节数/摘要/解码错误保留白名单原因，其余异常统一RESOURCE_UNAVAILABLE；UI catch仅向开发控制台输出固定scene id/原因，不输出URL、登录参数、输入或存档。

135项测试通过。独立loopback预发布插件可明确配置一张首次请求图片的延迟（最大35秒），cloud/Pages不包含该插件。实际CUA访问5292，对客厢PNG故意延迟14秒，首次等待后自动显示地图、无重试提示且警告/错误日志为空。仍需线上/平台继续复验；30秒不能被描述成所有网络条件下不再失败。

### RPG-JS地图切换超时恢复（2026-09-10，开发分支）

renderer-transition.ts 分开保存引擎已进入的房间与客户端完成加载的场景，两者吻合才提交可操作位置。调用者等待预算30秒，超时只结束该次UI等待，保留实际引擎操作；同目标重试复用在途操作，不能再等待已离开的旧地图或重复changeMap。不同目标在未完成切换时明确BUSY。地图拒绝可重试，实例销毁后禁止迟到提交；这不是完整引擎实例销毁能力的验收。

scene-readiness仍独立验证背景与TMX内容，不能以资源下载完成替代RPG-JS renderer ready。两阶段日志只保留受控原因，不输出异常中的URL或玩家数据。回环preflight增加CARRIAGE_QA_DELAY_ENGINE_MAP=1，对指定普通地图请求延迟一次，区别于scene_asset摘要检查；故障注入不进入正式部署。

### 旅途画页：预发布接入，正式功能关闭（2026-09-10）

同一权威Head新增可选journalImage附件，不改变StorySave剧情或gameplay cursor。server/journal-image.ts保存完整媒体请求、永久游戏UUID、固定commit公开步道参考图、源图SHA256、768×1024尺寸、参考版本与来源回合；超时重试保持requestId和已获taskId，避免代码升级后悄悄换提示词。每旅程最多2个独立请求，结构化终止后才允许显式新尝试；未知结果恢复原请求。120秒持久lease防止重复启动，迟到结果以requestId+lease双重核验。异步剧情提交保留数据库最新附件，备份与恢复包含同一Head。不是全局成本预算或平台用户身份配额。

Worker在现有认证旅程下提供image状态/开始及image/file二进制读取；不接受客户端prompt或图片URL，身份隔离不变。后台SDK复制自内部alteru-media-service，来源摘要见src/vendor/media/SOURCE.json。只走平台公开媒体API，没有访问供应商或部署媒体后台。PNG仅允许限定HTTPS域名，拒绝跳转，8MiB上限，检查PNG分块边界、尺寸、数据块/终止块与SHA256；浏览器再次验证字节摘要、真实解码、原生尺寸后显示。结构检查不包含CRC/完整解压，也不能判定透视或叙事语义。图片目前引用服务CDN并校验固定内容，没有宣称长期对象存储归档；失效只影响画页。

UI轮询不快于8秒，关闭面板取消观察，重新打开恢复。超过两分钟的服务重试提示仍能按实际截止时间重新启用。失败只显示受控文案，不显示上游原始异常。320×568实际DOM无横溢出、正文独立滚动、主要按钮44px以上；390×844结局和失败状态截图已检查。真实浏览器执行新合成旅程的33条作者行动后进入结局，制作期间正常从步道回客厢；刷新后失败和两次上限保留。合成完成入口仅存在显式CARRIAGE_QA_COMPLETED_JOURNEY=1的loopback插件，不修改完成事实，不是新的玩家全流程理解测试。

本轮两次真实图片请求均返回PROVIDER_REJECTED，没有成功图片可做解码和透视验收，没有追加第三次请求。失败由真实界面观察；尚未定位到服务内部原因，不推断参考图或提示词必然不合法。固定公开参考图已实际下载并匹配f96e5ba15ed9e0c6603ea5bda66da31506b7e397ed97e4af9e9a10656809dd0c。未外发自由对白、玩家头像、真实存档或额外在线叙事输入。

发布门禁：src/journal-image-release.ts将正式开关设为false，只有cloud-preflight可展示；正式Worker公开image路由返回404。153项测试、cloud/Worker/preflight构建、媒体集成/秘密/API base审计通过。测试包含请求冻结、重复点击、lease跨实例、迟到覆盖、服务限流、终止重试上限、权限隔离、并发回合、备份、二进制传输和关闭发布入口。模拟成功不代表真实图片验收。本轮不部署正式主站或Pages，线上仍为c063c79。重新开放前必须取得真实成功任务、检查实际画面及刷新后加载，再双部署验证。新人物/地图/碰撞准入与通用创建入口继续属于总规划未完成部分。

### StoryCartridge 与空间绑定的可执行合同（2026-09-10）

新增src/spatial-binding.ts，结构类型独立于车厢、React、RPG-JS、存储和网络。输入是实际StoryCartridge的ID/地图/人物/作者规则，加空间场景、实体/状态/接近点/动作、门户落点、物理/媒介人物绑定和可行走检查函数。编译时拒绝缺失/重复身份、无规则动作、未绑定规则、地图集合错配、不可走出生/接近/到达点、超出互动距离的接近点、规则map效果与门户目的地不一致、未绑定角色。只允许一个作者动作对应一个实体，不用Object.fromEntries静默覆盖重复项。

carriage-spatial-binding.ts从正在运行的scene-layout.ts和contract.ts导出数据；没有为测试另抄坐标。空间回合在调用canonical executeStoryTurn前验证动作绑定，候选结果经绑定的assertTransition核对唯一当前场景、角色目录和真实来源/目的地；prepareAction直接使用该验证返回的门户落点提交Head，不再另查一份门户结果。剧情、物件状态、首次介绍、关系与模型语义检查仍由现有模块负责。此绑定不是素材解码器，也不是新地图自动创作器，不保证路径连通或语义画风，相关检查仍走已有资源/寻路/renderer门禁。

新增npm run check:spatial，在cloud、Pages和preflight构建前自动执行，比较中英文动作ID并输出当前实际绑定数量。运行时动态支线Cartridge也经过同一检查。通用模块以独立书库几何的纯数据反例测试非车厢ID、不同尺寸、远程媒介、错绑/重复/越界/外来存档及不可变返回值；这不算第二个真实游戏消费者或新游戏上线。通用create-rpg-game仍未新增可宣称生产验证的spatial模板入口，需在已计划的原有世界映射和不同消费者实证之后完成。

158项测试通过；本机真实Worker路由完成两条全主线、传话支线、身份隔离、逐行动回执重放、完整备份到空库恢复。未新增真实模型或媒体请求。该代码仍在开发分支，线上版本未更新。

实际CUA在独立本机新旅程复验：地图走近柜子→按钮开柜→预设模式自由输入“取出保险丝”→柜内变空→林的可见首次介绍→配电箱消耗保险丝并恢复照明→连接门进入真实行李车。390×844行李车实际renderer截图与当前场景热点一致；此操作没有调用在线模型。
刷新后实际行李车与目标保持，浏览器warn/error日志为空。cloud/Worker、Pages和preflight构建全部通过，秘密/API base审计通过。

### 原作存档与区域/房间两级空间（2026-09-10）

实际原作last-train-to-dawn仍为StorySave v8并有独立finale，主游戏为v10；原作指标/角色/地点和车厢不同。只读演练读取原源码、调用离线作者回退生成8份中英文新快照，均未改动源快照，明确拒绝当作carriage-07直接导入。源文件摘要、当前目录与细项报告见original-rpg-mapping-audit.json；具体边界与下一步见original-rpg-spatial-mapping.md。没有访问真实玩家存档或生产API。

空间绑定增加可选storyLocationId（默认scene.id，保持主游戏兼容），分开剧情区域与引擎房间。同区域门户不必修改map；跨区域必须匹配作者map效果。多房间区域恢复要求显式sceneId。dryRunSpatialAttachment只产出独立空间附件草案，完整深拷贝原引擎数据，保留v8 finale等额外字段；不执行schema转换、不替换权威服务。161项回归通过，包含旧v8状态保留、缺少落点/素材拒绝、同区域房间与跨区域规则；多房间数据测试不等于原作RPG-JS运行验收。
本轮本机真实Worker两条主线及支线/终章/备份共204请求通过；cloud/Worker、Pages、preflight构建及秘密/API base审计通过。未部署正式站点，未提供HTTP导入入口。

### 较早交谈的可核验回忆（2026-09-10）

conversation-context.ts在新增可见交谈上标记实际说话者、输入类型和结果类型；recalledStatements只从同一已介绍且当前可联络人物的自由对白中检索原话，排除行动、回忆请求、无回应回合和无法判断类型的旧记录。中英文词项匹配，最多2段、每段220字符；明确问最早时改变同分排序。不是通用语义记忆，也不迁移猜测历史标签。

contract.ts的recollectionReply把引用再次通过协议解析和现有表现准入，不能让旧指令产生奖励或改写外观。server/model.ts命中时直接返回authored-recollection，不发送更早历史到模型；最近4轮外发合同保持。新回忆本身保存为正常故事回合，剧情事实、物品、关系和地图不变。

166项测试通过，包含超过4轮的检索、后来修正、人物隔离、中英文、协议和衣着反例。真实浏览器以新合成旅程完成首次认识林、担心停电、6轮其他对白后准确引用；刷新后再次准确引用。390×844和320×568实际截图已检查，320无横溢出，对白按钮44px；仅浏览器手机尺寸，不等于iPhone硬件验收。

scripts/check-recollection.ts只创建新合成旅程，固定mode=local，23次HTTP请求覆盖原话检索、同ID回执重放、权威重读和无机械效果。本地真实Worker通过；另有两条完整主线/支线/终章及备份恢复204请求通过。脚本能力令牌只在内存中，不输出或保存。前置脚本最初错误地把对白accepted当成行动成功，已按接口语义改为验证dialogue、cursor增长与真实存档内容；不是生产逻辑故障。

当前待发布标识carriage-single-player-20260910-4，旅途画页正式开关仍为false。发布结果按实际线上证据另记。

### 97734e7正式发布核验（2026-09-10）

主站与Pages发布同一提交97734e78c602464686708d79b0130e88ed83c740，实际入口均assets/index-_WYUh1uX.js，SHA256均32f1b56a95e5a83b310cb0d9d806c354ec857ef3d1cd834a77e337f8d75fdc52；实际bundle包含回忆与类型标记。Pages Actions 34493910466成功。主站53个文件使用既有KV，首次上传HeadersTimeout、尚未上传Worker；原部署器同提交重试成功，没有使用临时分批传输候选。2378719字节步道PNG与准入hash一致，原UUID/DO权威链路保留，公开源码ZIP与入口/health检查通过。

新版生产health标识carriage-single-player-20260910-4。线上新增合成旅程23请求验证较早回忆、同ID回执、重读、无机械后果；另204请求验证两完整主线、支线、关系、终章、场景往返及空库备份恢复。全部mode=local，无新增真实模型调用，不读取真实玩家存档。166本地回归、cloud/Worker/Pages构建、源码/暂存/dist秘密扫描、API base、UUID和相对路径检查通过；存储脚本限本项目幂等同步0变化，项目及全局只读隔离审计通过。摇杆的PointerDown属于持续地图输入，不是可滚动列表行。

本次浏览器手机尺寸UI和刷新为本机预发布证据，线上证据为实际HTTP权威路径及构建文件；没有把它们合称新一轮Telegram平台内或iPhone硬件验收。已关闭的生成画页仍关闭；原作正向探索模式装配、动态个性化素材与通用生产入口仍是后续目标。

### 共用空间回合适配与原作正向执行（2026-09-10，开发分支）

bound-story-turn.ts接收任意同版本StorySave、编译绑定、当前房间/目标/位置、原引擎execute和必选表现核验函数。目标/距离在调用引擎前核验；引擎只能通过注入admitAction声明当前目标动作，未声明的成功动作、跨schema返回及无许可转场拒绝。入参、引擎候选和表现检查参数均隔离，异步执行结束后关闭admit入口。原引擎仍负责规则、正文、危险和结局，外层ProductionAuthority仍负责幂等/版本/事务；这个适配层没有自己的reducer或数据库。journey-runtime.ts已实际使用该入口，保留现有车厢内容/语义准入与持久化合同。

spatial-binding默认仍拒绝同一动作多实体。原作可显式配置actionScope=scene，每个场景一个唯一目标；无场景查询多个目标时拒绝，门户按actionId+fromScene匹配，重复绑定的动作必须指定门户来源。physical角色只有显式travels=true才允许跨房间登记候选实体，每个房间最多一个；characterEntities只返回表现候选，并不判断同行、可见或自动生成角色。旧车厢默认合同不变。

original-train-spatial-plan.ts登记原作8区域的车外检修空间草案、8作者动作、三条出站门户和原人物跨场景候选位置。它不被生产主入口加载，不带已准入素材；碰撞目前只有外框与车体矩形，不能称已完成renderer或家具碰撞。没有把原物品或角色改成车厢同名对象。

scripts/check-original-spatial-turns.ts从指定原作源码目录加载真正的v8Cartridge/engine/reducer，用原作者失败回退生成六份中英合成旅程，共48回合经同一个bound-story-turn入口执行：无前置换管拒绝→检查→消费换管→修启动机→重复修理拒绝→燃料回收→三种出站路线→异地钥匙无危险时拒绝。原初始正文、已知阿达/未登场人物、finale字段和schema保留；三线燃料分别76/77/78、车况97，序列化后房间位置恢复正确。这里保留的是原作当前finale字段，尚未执行其后续危险和最终结局管线。报告original-spatial-turns-audit.json含原源码摘要，不读玩家档案、不联网、不创建第二游戏。

173项回归、cloud/Worker/Pages/preflight构建通过；本机真实Worker两完整主线204请求和较早对白23请求通过。实际CUA在新版地图通过按钮开柜→自由输入取保险丝→柜空/库存×1→刷新库存×1。未新增在线叙事或平台媒体请求。尚未发布本轮代码，线上仍97734e7。

北岬站背景用内置imagegen生成非覆盖候选，图及完整提示词/参考/尺寸/hash位于original-train-candidates/20260910。已检查正交边线与暗石/暖灯风格；右上角多生成了固定控制盒，违反可变设备独立约束，标记未准入。没有把此图加入public或运行资源清单，也没有用现有林的角色图冒充阿达。

### 原作实际地图与共用渲染器（2026-09-11，预发布）

src/rpg-renderer.ts从当前space.ts提取真实RPG-JS启动、显示分辨率、距离驱动步态、路径移动、碰撞、转场与输入清理；space.ts保留车厢物件和人物配置。src/grid-path.ts复用原四像素网格寻路，两种地图都调用它。保持30秒RendererTransition及迟到恢复合同。当前beta使用页面级providers，明确限制一页一个实例；destroy清理本模块监听/帧循环，不宣称完整引擎销毁和无刷新切换已通过。

原作北岬站在同工程cloud-preflight的?scene_preview=north-cape入口运行同一renderer。server/original-scene-preview.ts只在该构建发出背景和TMX；背景下载后核对SHA256、解码和1024×1536尺寸。src/original-train-spatial-plan.ts的车体、棚屋、边界矩形同时生成TMX与全9×15角色占位碰撞。其他七个区域仍为作者草案，没有已验收背景。此入口不挂载主App，不创建StorySave或新权威会话，位置刷新回起点；还未接原作人物、设备状态、故事和存档，不是另一个发布游戏。

175项测试通过，包括真实几何下各检修点可达和绕车体路径；原作真实源码48回合及本机Worker两完整路线204请求回归通过。cloud/Worker、Pages、preflight构建通过；生产两份构建不包含原作预览代码、CSS或候选背景。

CUA实际原作390×844：左右检修位可达，车体点击被拒且位置不变；左右到达逻辑/画面分别112,184与260,196。界面位置探针改为独立读取renderer，避免在投影前读取造成一帧旧坐标。无横向溢出、六按钮44px。尝试切换320×568后实际DOM仍报告390×844，因此本轮不记320通过，也不视为iPhone硬件验收。原有车厢实际开柜/取物/介绍/维修/转场后显示真实行李车和对应角色物件，截图为1280×720，浏览器warn/error为空。未新增在线叙事调用，未部署，本轮生产仍97734e7。

内置imagegen生成的北岬v2去除多余控制盒，作为预发布背景；阿达v1为RGB假棋盘格，未准入NPC。原图、提示词、参考和hash见original-train-candidates/20260911/generation.json。已询问是否明确允许本地脚本去背景，尚未收到答复时不执行；此单项不阻塞其他开发。

补充实际CUA：燃料棚前到达96,384，逻辑与画面一致，原作页面warn/error为空；原车厢刷新后仍在行李车并保留寻找电台电池目标。临时视口覆盖已执行reset。

### 共用持久会话提交层与原作v8（2026-09-11，开发分支）

server/session-authority.ts提取当前ProductionAuthority的同一SQLite表、enrollment/行动回执、in-flight合并、版本复核、事件cursor、checkpoint与叙事限流事务。ProductionAuthority现在安装车厢策略，保留原Head、旧档upgrade、备份格式和媒体附件并发保留；原Worker路由/UUID不变。提交层独立拒绝候选篡改会话ID或跳版本，首次插入与现存行世界核验在同一事务中，避免不同策略向同一存储混入v8/v10记录。

server/original-train-runtime.ts安装原作策略，使用src/vendor/original-train中11份原源码的逐字副本（SOURCE.json记录原repo、commit与逐文件SHA256），包括原Cartridge、v8类型、executeTurn、reducer、规则、危险与结局判定依赖。复制范围不含玩家存档、UUID、前端、媒体、网络适配器或结局HTTP生成器；它是既有世界兼容副本，不能晋升为新游戏默认内核模板。未修改原作工程。实际对照原源码11份hash一致。

原作Head保留整个v8 StorySave，位置/房间与mapVersion在同一Head。按钮使用原规则文本；自由输入先走原resolveDomainAction，再经同一个bound-story-turn与原executeStoryTurn。每步检查目标/当前房间/合法落点/接近距离/作者动作；原始字段不按车厢重命名或升为v10。未知自由对白和live模式目前明确拒绝，无在线叙事调用。原作入口没有接生产HTTP或地图检查UI；默认表现门禁拒绝创建，必须接上同步、显式返回true的实际素材/表现核验后才能激活，Promise/空返回/false不能默认为通过。此门禁是接入接口，不是已完成的素材验证器。

190项回归通过。新增原作中文/英文×三路线六个合成旅程48回合，交替按钮/自由输入，覆盖前置拒绝、软管消费、柴油增加、入队、重复修理、路线代价、异地钥匙拒绝，每步重放并实际关闭/重开磁盘SQLite。验证原开场块、v8/finale字段和稳定人物、恢复后位置及拒绝旧checkpoint。另覆盖跨目标/跨场景/不可走输入、未知剧情/live拒绝无写入，下一物件状态未准入导致整体不提交、并行权威实例版本冲突、回执写失败事务回滚与同ID恢复、混用世界拒绝。原作测试采用明确合成表现许可，不是阿达/其他七区域美术已准入，也未执行原作后续危险/最终结局。

车厢实际本机Worker两条完整路线204请求通过（41/46行动），含传话/关系、终章、回执重放、备份到空SQLite恢复。cloud/Worker、Pages、preflight构建及秘密/API base审计通过。本轮不发布，线上仍97734e7。原作正式会话HTTP、客户端pending恢复、人物/设备表现、后续章节和结局事务仍需继续接入。

实际CUA补验：新版5304通过按钮开柜、预设自由输入“取出保险丝”、刷新后库存×1与询问修理工目标保持；1280×720实际库存截图已检查，浏览器warn/error为空。本轮没有新的手机尺寸或平台内试玩证据。


### 原作客户端恢复与双地图检查（2026-09-11，开发分支）

`recoverable-session-client.ts`提取车厢现有 enrollment、待提交请求日志、跨页锁、同 ID 重试、隔离坏日志和恢复流程。`session-client.ts`保留车厢原键名和请求格式；`original-session-client.ts`用同一实现校验原 v8 世界、线路地点、空间房间、地图版本与合法落点。响应身份不符、最新状态倒退或同版本房间不符时保留请求，不清空待提交记录。终止拒绝保留 rejectionCode，素材暂未就绪仍可重试。原作客户端尚未接生产 HTTP 或剧情界面，测试传输连接真实 SQLite 权威实例并显式使用合成表现许可，不冒充真实资产准入。

原作检查入口现在装载北岬与河谷近岸两份真实 TMX 和背景。每份地图/图片从实际内容生成字节数与 SHA256，图片还需真实解码及尺寸核验；同一 SceneReadiness 通过后，RPG-JS 房间与画面均确认才切换背景并开放输入。选择框仅是同项目检查工具，不是剧情门户；刷新仍从北岬检查开始。河谷只开放近岸石台，水面、断桥和远岸不可走；空间版本为 original-train-authoring-2，其他区域仍为未准入草案。

真实截图发现默认 RPG-JS 玩家跟随相机会在转场时把人物层独立移到视口中央，尽管原始坐标探针仍正确。`fixed-map-camera.ts`禁用独立跟随并清除残留 viewport 平移，DOM 背景与引擎层统一由外部地图相机取景。beta.34 没有公开 viewport getter，适配器局部沿用该固定版本的 canvasApp.stage 遍历方式并缓存 viewport，销毁后重找；升级 RPG-JS 必须重新验证此边界。不能仅凭 renderedPosition 数值证明显示落点正确。

预发布检查页桌面地图位于检查栏上方，手机双向取景按扣除检查栏后的可见高度计算，避免人物被底栏遮住或在宽阔场景横向走出画面。正式车厢 UI 样式不变。新增河谷不含人物或可变设备；阿达假透明候选仍未准入。当前工作不开放原作生产会话，也没有新在线叙事调用。

本轮 197 回归、原作源代码 48 回合及三种构建通过。本地 CUA 在实际 1280×720、320×568、390×844 尺寸检查静止出生点、场景切换、桥头/岸边行走与碰撞；原车厢既有合成档恢复保险丝 ×1、介绍林、维修消耗、进入实际行李车并刷新恢复通过。证据与边界记于 original-map-client-review-20260911.json；关闭外部访客栏后观察构图，不称真实平台登录或 iPhone 硬件验收。本轮没有发布，线上仍 97734e7。

### 浏览器素材准备模块（2026-09-11，未接生产入口）

`src/sprite-preparation.ts` 是无网络/文件/Canvas依赖的 RGBA 数组处理器。显式背景模式区分浅中性连通去底与原生alpha保持；限制输入输出单边1536、总像素1572864，保存源bbox、源接地点与目标偏移。所有帧只平移，无逐帧缩放；设备状态要求显式接地点。浅中性模式保留内部颜色并限制边缘采样在本帧，不能据此保证语义分割正确。算法版本 `neutral-matte-unmix-1`。

`sprite-preparation-client.ts` 复制输入后转移副本到同源模块Worker，支持AbortSignal，15秒限时后终止Worker；结果/异常/取消/克隆失败均清理定时器及监听。Worker只执行纯处理器，返回候选像素和处理元数据，没有素材自动准入或存档写入。

`_qa/sprite-preparation.test.ts` 仅用构造像素测试八类合同；`_qa/sprite-worker.html`、`sprite-worker-browser.ts`、`sprite-worker.vite.ts` 将真实模块Worker构建到临时目录，以普通浏览器按钮测试传输、取消和失败恢复。该页面不属于Vite正式入口，不创建新游戏。桌面121ms的单次合成图测试不能代替真实图质量、iPhone硬件和压力验收。接下来在制作页集成时仍需PNG编码/真实解码、源与输出摘要、版本化参数、候选持久保存及同地图检查；当前没有宣称这些部分完成。

### 素材准备页与候选版本（2026-09-11，开发分支）

`creator.html?create_art=sprite` 由同一制作入口装载 `sprite-creator.tsx`，背景制作页可进入/返回。原图支持用户选PNG或读取已固定摘要的平台人物/设备样本。读取样本不调用生成或处理接口；处理须点击明确按钮。页面使用已有UI色彩/间距与中英文文案，提供源/结果切换、深浅检查底、PNG导出链接、历史记录与参数/错误恢复，不改变正式游戏的图形、碰撞或存档。

`sprite-draft.ts` 将源PNG字节/摘要/尺寸、来源名/类型、父记录ID、处理参数、输出PNG及算法/偏移记录保存在独立的 `alteru:<session UUID>:creator-sprite-drafts-v1` IndexedDB。每次处理新建记录，保留原图和旧候选；写入在同一事务检查当前ID和revision，配合跨页Web Lock拒绝迟到覆盖。刷新时保留中断的processing记录，明确允许从源图重新处理。没有云端保存或自动发布。

`sprite-browser-io.ts` 检查PNG头、最大8MiB/1536边长/1572864像素、SHA256及原生Image.decode，再通过Canvas读写像素；重建PNG再次摘要与解码，blobURL按生命周期释放。处理本体仍在模块Worker，取消/失败保留源记录，元数据成功响应不等于质量准入。输入PNG头测试与真实浏览器PNG编码测试分开记录。

本轮220项回归通过。合成图经过真实页面的编码、处理、保存、刷新、故意错误参数失败与旧候选恢复；320/390中英文无横向溢出，控件至少48px。生产构建入口另行验证真实设备样本只读加载、摘要、类型刷新保持和往返导航；外部guest栏曾遮住顶部返回链接，关闭其已有Close按钮后通过，未为外部栏移动平台内布局。未点击真实样本处理按钮、未下载导出链接到用户磁盘、未做真实素材质量或iPhone硬件验收；完整游戏地图试用仍待后续接入。该开发版本未部署，生产保持05db41c。

### 已保存人物候选进入真实地图（2026-09-11，开发分支）

`sprite-map-candidate.ts` 检查指定sprite-draft版本/ID、candidate状态、actor类型、3×4布局、源与输出摘要、真实解码尺寸、12帧顺序/锚点一致性、透明边界/非空主体/脚点及跨帧高度变化，返回统一缩放和四向脚点配置。至少20%透明并且各帧边界透明只是机械条件，不识别假棋盘格孔洞、角色身份或画对的方向。高度目标由当前B主角只读alpha测量得到33.04世界像素；参考SHA为7d07b1e22e9ccbae89ec6da2291fa3898b118f1896330430299d9955ee791793，变更参考时必须重新测量。

`original-scene-preview.tsx` 从 `actor_draft=<id>` 读取独立候选，调用现有actorSheet和同一createRpgRenderer。实测发现Pixi默认parser按扩展名/数据URI选择，blob URL被忽略，导致逻辑位置正常但人物不可见；现在显式用`Assets.load({src,parser:'loadTextures'})`并核对纹理尺寸后才创建角色。失败不回退到默认人物冒充成功。退出清理候选blob和texture缓存。原RPG-JS移动、9×15碰撞、距离步态及StorySession不修改。

准备页增加试走链接；背景对照保留候选ID，明确“退回基准人物”才移除它。刷新仍返回检查页北岬出生点并读取同一候选；这不是剧情位置续玩或新存档。北岬/河谷两个检查场景可共用候选，实际剧情人物阿达等尚未准入。`_qa/sprite-map.vite.ts` 把正常生产入口和合成制作fixture一起构建到临时目录，常规生产构建不包含fixture。

浏览器已实际完成合成PNG→处理→保存→地图试走，四色标记验证四方向，运动帧标记与停步可见；北岬左检修/燃料/出站/返程、车体拒绝，320河谷桥头/水面拒绝、刷新同候选、基准人物回退通过。新增4个准入反例/正例测试，全套224项通过。该证据不是实际人物四向美术、设备状态、iPhone硬件或原作完整游戏通过；真实代码去底授权仍待回应，生产未更新。

### 原作结局事务与客户端恢复（2026-09-11，开发分支）

`server/original-ending.ts` 用原作 v8 endingDirector 在服务器重建快照，复核原作终章条件、已取得能力、必付代价、已登场人物后日谈及结构，再允许提交。默认使用原作作者结局锚点；注入的生成器只接收快照和cartridge副本，返回候选而非StorySave。未接实际模型调用。额外结构检查拒绝非文本场景/后日谈等原校验未覆盖的异常形状；不修改11份冻结原作源码，也不宣称结构验证能证明自由文案语义一致。

共用 `SessionAuthority.ending()` 复用当前SQLite head/receipt事务：稳定ending_id与普通action_id分开命名，绑定完整请求、旅程和owner；完成后version增加1，普通cursor和journal不增加。网络等待在事务外；提交时复核version、mapVersion、整个原作save和房间。并发位置checkpoint保留，其他同版本故事变化拒绝，避免覆盖快照未包含的danger等字段。回执写失败连同head一起回滚；精确重放可在磁盘重开后返回已提交结局。普通行动回执摘要/键名保持兼容。

`RecoverableSessionClient` 的可选结局策略共用原有存储、锁和恢复循环。结局请求在POST前持久化于同一pending-v2前缀的独立ending键，调用 `/sessions/<id>/ending`；普通行动仍保持旧格式/路径。结局待确认期间不能另发行动、结局或重开旅程。`OriginalSessionClient` 从当前head构造snapshot_id，校验回执ID/快照/版本/房间/完成状态及同版本最新head；异常响应或暂时失败保留请求，永久冲突取得最新权威head后才清理。当前只是可注入transport的客户端，原作HTTP路由与剧情界面尚未开放。

新增结局事务9项、客户端恢复3项，全套236项测试通过。结局测试明确构造独立SQLite终章状态，覆盖中英作者结局、磁盘重开、重放、不同owner、能力/代价/人物/结构拒绝、生成/表现/磁盘失败、并发版本与事实/danger改变、checkpoint，以及客户端丢回执/错误响应/原请求恢复。它们不是完整原作从开场到终章的路线证据。共用层另经本机真实Worker HTTP 204请求复验现有车厢两条完整路线（41/46行动）、支线/关系/结局/备份恢复；cloud前端与Worker构建、秘密及API base审计通过。没有新模型/媒体请求、真实存档访问或部署，生产保持05db41c。

### 原作河谷作者章节（2026-09-11，开发分支）

`original-river-chapter.ts` 在保留冻结原作v8内核的前提下，定义七个明确作者行动：断桥检查、绞盘/人工两种救援、任医生治疗、有限补油、严重车损加固、驶向隧道。不是把原作demo文本按关键词直接放行：原demo含未登记地点和未介绍人物，不能作为权威事务复用。新行动仅从固定ID或当前语言的完整行动句（代价括号可省略）解析；问句、否定句及夹带协议的输入不匹配。它是有限作者行动支持，不等于自由语义理解。

这些行动的前置检查在服务器完成，只有本地作者定义可以构造类型化ParsedCommand；玩家文本不会进入协议解析器或生成器。事实、数值、物品、人物、同行、关系、危险和地图由原作`applyParsedScene`一次结算，外层仍是同一`executeBoundStoryTurn`和SessionAuthority。正文用可见event块，避免原作narration物品推断重复制造道具；结果选项从结算后可执行行动推导，不将未来人物预载到选项中。原作八项domain规则和十一份冻结源文件不改动。新章主动管理已描述的断桥/隧道危险，不调用普通随机叙述生成器；开放剧情仍未接入。

`originalTrainChapterSpatialPlan()`在原v2房间上增加河谷桥、油柜、回接线及阿达/任医生行动绑定，跨场景动作对应唯一tunnel门户。版本为original-train-authoring-3；v2房间、障碍和落点未变，读取v2只更新空间版本，完整StorySave、位置、cursor和历史回执保留。基础地图检查页仍使用v2几何，不自动渲染本章设备。原作表现许可仍默认拒绝，医生/氧气/设备或隧道未准入时整回合不能提交。

八项新增测试使用实际SQLite：中英×人工/绞盘四条路线从新建原作开场，经修理、出站、断桥、救援、治疗到隧道，混合按钮/自由输入，每步重放并磁盘重开；检查精确代价、单次物品与关系、可见介绍晚于未揭示人物状态、连续同行和章节完成。低资源测试另明确构造燃料/车况同时0，验证一次12燃料储备与一次20车况加固后可以继续，不能反复刷取。缺素材、重复/跨目标/协议输入和v2升级反例通过。全套244项、最终匹配调整后的8项定向复验、cloud/Worker构建、秘密/API base扫描及现有车厢Worker双主线204请求通过。

这一步不是实际河谷地图试玩通过：本章原作HTTP/UI尚未开放，人物设备/隧道素材未准入；灰石与黑松两条支线、隧道后续及完整终章路线尚待接通。没有真实模型/媒体请求、真实玩家数据或生产部署；主站与Pages保持05db41c。

### 原作白石隧道与跨章选项（2026-09-11，开发分支）

`original-tunnel-chapter.ts`增加8项作者行动，覆盖烟源检查、任医生/玩家两种分组、耗油排烟/清空后车厢两种物资政策、有限补油/加固及货场转场。只有同行且状态为companion的任医生可以执行医生方案；不会因提及姓名创建新人物。保留物资消耗8燃料；放弃方案只删除实际持有的sealed-diesel和spare-hose，按当前数量记录`tunnel-discarded-items`，不删除钥匙、电台或其他物品。无这两类道具时正文明确说明损失的是乘客散装行李，不伪造玩家道具损失。错误顺序、相反政策和重复执行在候选结算前被拒绝。

`original-chapters.ts`汇总已接入章节的行动、空间效果、匹配与拒绝码。匹配仍是当前语言的完整行动句，可省略代价括号；不宣称自然语言泛化。原作者规则转入河谷、新章节转入隧道时，选项从实际目的地可执行行动推导，并在表现准入之前进入候选；不会显示上一章行动或不可用医生方案。没有为原作其他区域编造可执行选项。

章节空间版本增至original-train-authoring-4，新增隧道风机/过道/货物/储备/出口及两名既有人物的行动绑定。v2、v3是明确兼容的旧版，读取时只升级绑定版本，保持当前StorySave、历史、位置和回执；几何仍是作者草案，不冒充已通过隧道美术验收。v2基础地图检查页保持原合同。

新增12项测试：中英×两种组织者×两种物资政策，共8条从原作新开场、补油、河谷救援到灰石货场的11行动路线；每步真实SQLite保存并重建authority读取/回执重放。它不是新进程磁盘重启测试，磁盘重开仍由既有河谷/会话测试覆盖。精确数值、原角色/关系保留、单次物资消耗、无医生回退、零燃料/车况的有限恢复、缺资产拒绝及v3兼容检查通过。全套256项、cloud/Worker构建、秘密/API base审计通过；本轮未新增HTTP、浏览器、iPhone或AlterU实测，也没有模型/媒体请求或发布。

平台媒体公开文档本轮重新读取，仍未提供alpha或去底参数；该结论来自当前本地公开接口合同，不代表一次新的服务端能力探测。真实图代码处理授权仍待回应。原作灰石/黑松后续、完整终章路径、实际人物设备与生产HTTP/UI继续推进；正式主站和Pages仍05db41c。

### 原作灰石货场、重访与人物在场（2026-09-11，开发分支）

`original-yard-chapter.ts`新增11项作者行动：栅门介绍、诊疗/修泵/强取三种互斥协议、有限加固/起步储备、首次出场进入隧道、线路交接、同行/留守和山口转场。三种协议分别增加16/12/20燃料；诊疗增加6人心，修泵消耗6车况并增加2人心，强取消耗12车况及8人心。协议前正文说明强取将失去玛柯同行机会；协议事实和一次关系事件持久化，强取不会被重访洗成合作。任医生必须实际同行才可执行诊疗，不伪造药品库存。

采石场路线先到货场、完成一次协议，消耗4燃料进入隧道；隧道结束后返回同一货场，保留油账和关系、不重复奖励。河谷路线经过隧道才首次到货场。完成隧道和线路交接后，合作方可邀请玛柯或让其留守，强取方仅可留守；决定后消耗6燃料进入山口。零资源恢复依赖各一次的20车况加固（车况<20）和12燃料独立起步储备（协议完成且燃料<6），不重复发放同一协议收益。原稳定人物ID `mara-raider`、现有同伴、隧道物资损失与原路线事实保持。

`original-character-presence.ts`将“认识”和“在场”分开：companion且属于实际队伍者随行，其他已知人物只在lastKnownLocation与当前地点一致时可交谈。原v8开场阿达没有地点字段，保留仅限北岬、源cartridge初始可见人物的兼容例外。`original-train-runtime.ts`在验证人物实体目标时使用此判断；这尚不是实际原作NPC renderer的接入证据。

空间版本为`original-train-authoring-5`，增加货场栅门/泵台/出口、玛柯与阿达的行动绑定，以及货场→隧道、货场→山口两条门户。明确兼容v2/v3/v4；历史StorySave、位置和回执不重写。货场及山口空间仍是未准入作者草案，默认表现门禁继续拒绝原作生产行动。

新增18项测试全部通过：中英两种语言、采石场/河谷两条入场路线、三种协议和两种同行决策共14条新开场到山口路线，以及低资源恢复、缺素材原子拒绝、恶意/否定/问句拒绝、v4升级与人物地点检查。路线执行真实SQLite事务；协议回执通过新authority实例重放、最终head重新读取。未声称每步重开数据库或新进程持久化；那些场景由既有会话/河谷测试独立覆盖。全套274项、cloud前端/Worker构建、秘密与API base审计通过。没有新增HTTP、浏览器、iPhone、AlterU实测、模型/媒体调用或生产部署；正式主站与Pages仍05db41c。黑松、山口、小镇、终站完整路径及实际原作HTTP/UI与美术准入继续推进。

### 原作黑松林线与原钥匙规则联动（2026-09-11，开发分支）

`original-pine-chapter.ts`新增10项作者行动：信号检查、紧急倒车、侧线确认、救援车介绍、路册核对、林澈同行/留守、有限补油/加固和隧道转场。倒车消耗12车况和2人心；侧线方案直接调用冻结原作`use-master-switch-key`规则扣除8燃料及一次覆盖，章节确认只记录安全位置、不再次收费。`pine-key-uses-before`在检查时记录原有次数；只有检查后新增的钥匙覆盖、原hidden-route-open与已解除危险共同成立，才允许确认当前侧线，防止复用别处打开过道岔的全局事实。

`assertPineSourceAction`只给黑松当前已接受的原钥匙行动增加空间章节与实际牵引代价检查，燃料不足8或车况为0时不能利用原stat钳位免费开线。已拒绝的原规则行动仍走原回执合同。钥匙仍由原规则检查库存、路线、三次使用上限与危险状态；原源文件不变。侧线打开后不能再倒车刷另一份结果；确认没有第二份代价。

林澈保持原`lin-scout`身份，先由救援车敲门声作为匿名线索，在安全开门后通过巡检服/线路簿、名字来源和当前意图可见介绍，再生成具名互动。核对路册只增加一次专业信任与`timber-route-known`；不冒充`hidden-route-open`，不替玩家补出医生、氧气或河谷救援。同行使用原party_change；留守保留已知人物与关系，后续在场判断不把他当作同行。进入隧道消耗4燃料，之后复用现有隧道→货场→山口路径。

章节空间v6增加林线信号、救援车、储备、出口与人物行动，兼容v2至v5，旧StorySave和位置不改写。`original-chapters.ts`跨章投射当前林线行动及原钥匙行动选项；按钮、完整句自由输入走同一绑定和权威事务。林线地图及人物/物件仍是未准入草案，未开放原作生产HTTP/UI。

新增14项测试：中英×两种避让×两种同行，共8条新开场到山口的17/18行动SQLite路线；钥匙缺失/用尽/可用的零资源恢复；旧全局钥匙事实隔离与v5升级；钥匙/人物介绍/转场表现失败原子拒绝；问句/否定/协议追加拒绝。检查确切资源、一次钥匙消耗、原角色关系、缺席医生、原路线事实和稳定回执；用同SQLite库重建authority重放并读取，不声称新增磁盘重启或浏览器证据。全套288项、cloud前端/Worker构建、秘密/API base审计通过。首次类型检查发现选项数组推导过窄，已改为原StorySave choices类型并通过重建。没有新模型/媒体请求、真实图处理、HTTP/手机/平台实测或生产部署；正式仍05db41c。后续继续山口、小镇、枢纽完整收束及原作实际表现和入口。

### 原作山口岗位、实际库存与后果（2026-09-11，开发分支）

`original-pass-chapter.ts`新增13项作者行动，复用原钥匙作为第4种处置。先检查、分配测距及车厢岗位，再处置险情、核对乘客、转入小城。林澈必须实际同行且有黑松路册核对事实，才可承担测距；玛柯必须实际同行才可承担车厢岗位。原v8身份、队伍、资源和关系仍是唯一数据来源，角色名字不是能力开关。分配岗位不增加关系；成功处置后才为实际承担岗位者各记一次专业信任。

气路制动真实消耗1个`spare-hose`及4燃料/4车况；动力制动消耗12燃料/6车况；砂石道消耗16车况/6人心。林澈测距使前两者减少2燃料，玛柯岗位使前两者少损2车况、砂石道少损4车况。按存档计算成本并生成可见选项，完整带代价的当前选项可作为自由输入，伪造价格或协议追加不匹配。没有软管就不显示也不能执行气路方案，隧道实际丢弃库存不会在这里补回。

原钥匙继续由冻结作者规则扣除8燃料和一次覆盖，山口检查记录`pass-key-uses-before`，确认仅接受本次检查后新增覆盖；全局旧开线事实不足以证明山口安全。`assertPassSourceAction`要求当前检查、两个岗位及至少14燃料、正车况，保留6燃料供离站，确认不二次收费。其他耗油处置也要求当前燃料≥自身代价+6，避免有限补油用尽后软锁。山口储备仅一次12燃料，加固仅一次20车况且车况<20；零资源可加固后走砂石道、补油并离站。

险情解除后的核对使用已有乘客记录，不制造伤亡或医生。同行任医生增加4人心及一次医疗信任；没有他则由玩家核对、增加2人心。同行玛柯在正文中表示愿意继续下一段。核对完成后消耗6燃料驶入沉睡小城、记录`chapter-pass-complete`与04:18时刻，保持当前队伍、关系、路线、物品损失和原结局idle。

空间版本v7增加坡度标、岗位点、制动控制、储备、出口及人物绑定，兼容v2至v6。未改变原作冻结11份源文件或原车厢生产数据。28项新增测试包括中英×12种真实开场路线/角色/处置组合，共24条新开场经原章节抵达小城的SQLite路线；另覆盖隧道弃物后的零资源恢复、保留离站燃料、源钥匙前置/旧开线隔离、留守角色拒绝、带代价输入与伪价格拒绝、v6升级及表现失败原子拒绝。回执通过同库新authority实例重放、最终head重新读取；不是新浏览器或每步磁盘重启验证。全套316项、cloud前端/Worker构建、秘密及API base审计通过。

当前仍是章节与会话层实现，山口/小城实际背景、角色物件及原作HTTP/UI未准入；没有新HTTP、浏览器、iPhone、原生AlterU测试，也没有新模型/媒体调用、真实图处理或部署。正式主站/Pages保持05db41c。继续小城、桥梁/枢纽及完整终章，素材准入与实际游玩仍属总目标必需工作。

### 原作小城停靠与洪水桥近岸房间（2026-09-11，开发分支）

`original-town-chapter.ts`新增12项作者行动：站台检查、广播供油/保留燃料的互斥援助选择、公开规则/紧急指挥的互斥议事选择、一次修复/补油、消耗实际柴油桶、领取桥检箱、休息、线路板核对和离站。供油广播消耗6燃料、增加8人心并设置原`aid-network-known`；保留燃料损失3人心，不抹去此前救援。公开规则首次增加8人心并设置原`passenger-rules-public`，旧承诺重申只加2；已承诺公开的旅程不能改成紧急指挥。紧急指挥加2人心，也明确保留乘客离站权利，不提前确定最终列车归属。

小城检修件一次增加20车况，登记燃料一次增加16；原实际`sealed-diesel`每消耗1桶增加20燃料，仅燃料≤80时可用。消耗源库存，不能恢复隧道中丢掉的桶。原`bridge-kit`以原稳定ID加入一次，有现存工具或已领取标记时拒绝；目前只携带，下一章明确使用才消耗。休息增加6人心一次并记录`town-rested`，到桥时刻从04:28变为04:48、危险预警从2升至3；没有真实墙钟计时或不可见随机扣费。

离站要求援助、议事和线路板三项完成，且燃料≥6、车况>0；消耗6燃料设置`chapter-town-complete`和`bridge-approach-reached`。空间v8新增`train-at-flood-bridge`，映射原`dawn-junction`区域的近岸部分；原StorySave地图仍8节点，空间由8变9房间。现有枢纽内部房间保留，未被这次离站选中。不会设置`chapter-bridge-complete`或真结局状态，正文明确仍隔水望见枢纽。所有原角色在新房间补共享实体绑定，在场仍由当前队伍/地点决定；原作bridge后续操作与资产尚未实现/准入。

共享SpatialBinding定位、服务器head和OriginalSessionClient校验均消费同一房间定义；兼容v2至v7，旧数据只升级空间版本，完整StorySave和位置保留。53项新增测试包括中英×三首发路线×援助/规则/休息各两种共48条新开场到桥前的SQLite路线，验证资源、原承诺、伙伴、时间/危险和未触发结局；另测实际保留/丢弃柴油、一次桥检箱、零资源有限恢复、丢离站回执后客户端重建恢复同ID同近岸房间、旧v7、缺表现原子拒绝和异常输入。新房间声明为作者几何，不冒充地图/美术准入。

全套369项、cloud前端/Worker构建、秘密与API base审计通过。最初类型检查发现角色实体数组只读，改为复制追加后重建通过。新增客户端恢复为注入transport连接真实SQLite authority的测试，不是HTTP/浏览器/平台实测；本轮没有新模型/媒体请求、真实图处理、真实存档访问或部署。正式主站/Pages保持05db41c，完整桥梁/枢纽收束与实际原作表现/游玩入口继续推进。

### 原作洪水桥与不可逆列车状态（2026-09-11，开发分支）

`original-bridge-chapter.ts`新增9项作者行动，近岸检查后使用实际桥检箱或人工勘测，再按既有名单安排人员，最后通过主桥、钥匙维修线或永久固定列车的步行通道。主桥代价为未休息6燃料/8车况、休息后8燃料/12车况；实际同行且有黑松核对事实的林澈减2燃料，已消耗桥检箱减4车况。箱子只消费一次，不以字符串提及代替库存。零资源可各一次补12燃料/加固20车况，或车况≤65时固定列车、损失最多20车况并永久结束整列行驶能力，结算后符合原牺牲列车能力的≤45条件。

钥匙方案通过原`resolveDomainAction`取得冻结`use-master-switch-key`的真实条件和效果，将限定的stat/fact/fact-add/danger效果转为可信作者ParsedCommand，在同一次原reducer调用中完成8燃料/一次覆盖与过桥事实。玩家文本不参与协议解析；未知效果类型明确失败，不静默丢弃。通用钥匙原句只在当前桥前阶段映射到这一动作；额外检查燃料≥8和正车况。没有再添加一次仅确认的剧情回合，原剩余覆盖指标仍由原`syncDomainDerivedState`更新。

实际过桥才记录`chapter-bridge-complete`、`junction-arrived`和`bridge-train-fate=preserved|anchored`，通过同storyLocationId下的门户，从`train-at-flood-bridge`进入`train-at-dawn-junction`。空间v9兼容v2至v8；原8地图节点、完整人物/队伍/关系和物资历史保持。普通桥回合不发true_ending，抵达后仍是idle，归属决定尚未接通。

专项测试暴露了原结局只看车况时会把已固定列车判为可继续远行的问题。`original-ending-capabilities.ts`为有实际桥状态的旅程收窄原cartridge能力：anchored排除继续远行、将列车停成街道和仍需运行列车的权力选项；preserved排除回溯牺牲列车。无该事实的旧旅程完全保留原合同。服务器结局策略与OriginalSessionClient均使用同一适配cartridge构造快照；只过滤已有能力，不新增能力、不更改原阈值或冻结源文件。不能把物理约束当作结局文案已经正确：原锚点含未登场任医生等固定描述，下一步必须修正实际归属选择与后日谈。

54项新增测试通过：中英×三路线×休息/不休息×工具主桥/人工主桥/钥匙/固定列车，共48条新开场到枢纽内部的SQLite路线；零资源/用尽钥匙、第三次覆盖单次扣费、实际工具、恶意价格输入、缺表现原子拒绝和旧v8近岸兼容；额外验证原cartridge不变、物理状态收窄能力，以及客户端/服务端同快照拒绝伪造远行候选。最后一项明确注入synthetic ready状态来测策略，不是最终归属流程完成。全套423项、cloud前端/Worker构建、秘密/API base审计通过。没有新HTTP/浏览器/手机/平台测试、模型或媒体调用、真实图处理与部署。原作实际美术、生产HTTP/UI、最终归属和完整结局仍待完成，正式主站/Pages保持05db41c。

### 原作枢纽选择与完整作者结局（2026-09-11，开发分支）

`original-junction-chapter.ts`把实际过桥后的枢纽内部接到最终归属：先查看旅程记录，再从当前资源、关系、公开规则、援助与列车物理状态真正允许的方案中选择。10个归属方案包含原8个锚点及2个最低能力收束：仅使用原`settle-junction`的安顿、仅使用原`sacrifice-train`的步行抵达；没有降低原能力阈值或新增救援网络。依赖继续行驶的方案另要求正车况。选项在选择前列出原能力强制代价和锚点不可逆代价，选择以事实及原`true_ending`命令在一次原reducer中提交，原资源/队伍/关系/历史不重写。

`original-ending-options.ts`按选择生成对应原锚点的结局，并为所有已知人物和实际访问地区生成后日谈。未同行任医生不会被固定锚点文案补成在场医生；留守林澈、强取油后的玛柯敌意、实际弃物、广播援助、停留与列车固定结果保留。服务端拒绝不同归属、缺失任何强制或锚点代价、人物/地区集合不符以及未认识固定角色出现在候选文案。该校验不等于通用自然语言语义验证；默认结局是确定性作者内容，本轮未调用模型。

空间v10增加枢纽路册实体，兼容v2至v9。49项新增测试中，40条中英×是否遇见医生×10归属路线从原新开场执行实际章节到选择ready和结局complete，不注入终局状态；逐项检查选择可见代价、同ID回执、原资源与完整存档保持。另测无援助且敌对的固定列车低能力结局、显式低资源fixture、表现缺失原子拒绝、旧v9升级、错误候选拒绝，以及真实文件SQLite关闭/重开与客户端丢失结局响应后的同ID恢复。结束事务仍只增加version，普通行动cursor不增加。

另4条中英文黑松新开场路线到完整结局，验证林澈同行/留守产生相应后日谈，未访问河谷不出现在地区结果中。全套472项与cloud前端/Worker构建通过。测试中的表现准入为显式测试gate，不能证明原作地图和美术已准入；原作生产HTTP、实际UI/renderer、其余场景与人物设备素材仍需接入。没有新增模型/媒体请求、真实图处理、真实玩家存档读取、浏览器/平台测试或部署。正式主站/Pages保持05db41c。规则与会话层的整段原作现在可到完整结局，但完整可玩的单人总目标尚未完成。

### 原作真实HTTP与现有Worker并存（2026-09-11，开发分支）

现有`CarriageJourneyAuthority`保留原类名、绑定、车厢路径与owner命名。原作新增`/api/original`协议，继续经过原256-bit capability边界：外层验证并散列持有人凭据，剥离Authorization，转发到同一`CARRIAGE_JOURNEYS`命名空间内`original-v8:<owner hash>`对象。车厢仍用原`<owner hash>`对象，数据不搬迁、不合并；同一capability与登记ID分别创建两种旅程时不会解释对方存档。没有新增Worker类、绑定、迁移或第二套部署。匿名能力隔离仍不等于平台实名登录或账号找回。

`server/original-http.ts`连接原作登记/目录、快照、行动、位置、事件和独立结局事务；严格原作语言和登记字段、6000字节请求上限沿用外层JSON边界，版本和原子提交仍由原authority负责。`original-runtime-contract.ts`提供独立原作协议头和版本，原车厢协议不变。`cloudTransport`参数化额外协议，默认车厢行为保持；`originalSessionHttp`从`getGameApiBase()`推导UUID路径，用调用方已有作用域Storage与Web Locks、独立`original-story-1-`日志前缀实例化原作客户端。没有前端私有凭据、硬编码生产后台或本地写入回退。

`createHandler`原作发布开关默认false；即使在测试代码显式打开，实际`originalPresentationUnavailable`仍拒绝创建，没有素材就不能靠开放HTTP绕过准入。当前尚未把真实原作UI接入这个transport，也未部署或启用正式路由。没有测试query、客户端上传存档或环境变量可以打开准入。

新增8项真实本机HTTP测试，Node服务器通过实际Worker handler→原Durable Object适配→文件SQLite执行。6条中英×三路线从开场走到完整结局，混合按钮/完整句自由输入；每条都故意在成功提交后丢弃登记、首次行动、结局响应，并关闭/重开SQLite、重建客户端，从持久日志恢复同ID，没有重复场景、资源或结局。另测原作/车厢同持有人隔离与原车厢真实开柜、其他持有人拒绝、旧协议、JSON/体积/语言/方法拒绝、默认发布关闭和真实素材gate拒绝且无登记。HTTP测试需要本机监听权限；初次沙箱EPERM后在授权本机监听下运行，测试适配器SQL惰性执行错误已修正。

全套480测试及cloud前端/Worker构建通过。该证据为真实HTTP及本机SQLite，不是线上Cloudflare、真实renderer、iPhone或AlterU实测；测试完整路线显式使用合成表现gate。原作实际素材/表现/UI、媒体链及生产发布仍继续，正式主站/Pages保持05db41c；无新模型/媒体外发、真实图处理或真实玩家数据访问。


### 原作会话接入实际地图界面（2026-09-11，开发分支）

`src/original-game.tsx`在同一游戏的cloud-preflight构建中，以`?story=original`启用。沿用`originalSessionHttp`、作用域Storage和Web Locks，地图点击与完整句自由输入提交同一原作HTTP权威；UI不执行本地剧情reducer。RPG-JS使用现有B主角、共享碰撞/路径和九房间清单；点击实体先走到approach，服务回执统一刷新地图、资源、人物、选项。累计日志、库存、关系和最终结局从当前head读取。当前自由输入仅支持作者目录的完整句，不宣称开放语义理解。

转场前准备目标资源，收到权威head后验证资源摘要并restore真实renderer；失败保留权威head及客户端pending供重新连接恢复。位置每2秒及页面隐藏时checkpoint。preflight复用现有Worker类及原作隔离对象，显式本机draft gate只接受登记房间。默认SQLite仍是进程内存，页面刷新可续玩，服务器重启不保留；显式磁盘预演与实际重启证据见后文，旧内存旅程不自动迁移。

`original-scene-preview.ts`为preflight生成九房间TMX和资源摘要：两个只读背景候选，七个由共享碰撞几何生成的诊断PNG。后者只处理合成SVG，不编辑真实图像。原作人物/设备目前仅SVG名牌/编号，无NPC独立碰撞，不能视为已准入角色美术。cloud和Pages构建不包含original-game入口chunk或七张诊断地图素材；正式原作HTTP仍默认关闭。

`original-game-projection.ts`只读筛选当前实际在场人物/可用行动，并修正原v8开场目标在首段分支沿用的问题；正文中仅去除同回合逐字重复段落与带factIds的内部facts回执。原存档和冻结源文件不改写，资源增减、对白、后续回合重复叙述保留。

本机浏览器使用先前新建的合成旅程续接：北岬搜油/修启动机/走河谷/查桥后，实际点击完成耗车况人工救援、医生可见介绍、氧气救治/同行、走回出口并转入隧道、检查烟流。刷新保留河谷76/79/64及隧道70/79/64、版本7/8；地图实际从河谷背景变成隧道几何占位，未仅靠标题判断。320 CSS宽下通过附近列表实际寻路并提交隧道检查；最终日志内部facts回执为0。

最终486项回归、cloud/Pages/preflight构建、秘密/API base审计通过。最初8个HTTP测试因沙箱回环监听EPERM失败，授权本机监听后全套通过。390×844与320×568以DOM实际CSS尺寸记录；截图工具与浏览器130%缩放组合存在尺寸/合成偏差，保留原始截图，不据此宣布移动端视觉全面通过，尚需独立复验。当前仅跑到隧道，未宣称实际浏览器完整终局、故障注入恢复或iPhone/AlterU平台通过。无新增模型/媒体请求、真实图处理、生产存档访问或正式部署；线上仍05db41c。


### 原作实际地图走到完整终局与桥前地点修复（2026-09-11）

在既有本机合成旅程（隧道version 8）继续真实CUA操作，完成医生组织转移/供油排烟、货场诊疗合作与玛柯同行、山口测距/玛柯岗位/软管制动、小城广播援助/公开规则/领取桥检箱、桥检/按名单过主桥、枢纽公开行车簿选择与独立结局事务。每次从“附近”选择后实际寻路到approach再提交，未调用前端隐藏状态或HTTP捷径；山口事后核对通过可见输入框提交完整句。普通回合到version 34，结局事务到35，最终燃料40/车况73/人心92。刷新后scene、version、资源及完整可见结局逐字一致。库存只余钥匙、电台和两桶柴油；氧气、制动软管、桥检箱没有复活。实际人物为阿达、任医生、玛柯，未登场林澈不进入人物页或结局。

这次真实试玩发现：原v8将桥前与枢纽内部映射到同一dawn-junction区域，导致自动transition和arrived回执提前宣称抵达枢纽，HUD也只读区域名。新增`original-place-presentation.ts`按实际sceneId显示近岸名称；只定位`town-N-town-depart`对应回合的自动transition与抵达effect，移除错误重复过场并改成近岸回执。新town-depart在原reducer之后、权威提交之前修正本回合新块，历史前缀不改；旧保存内容只在阅读投影中修正，不写回旧存档。原八个区域、人物、资源、事实、位置及结局能力保持。到枢纽内部后显示原黎明枢纽名称，不能把真实后续抵达也隐藏。

同一桥前旧旅程version 28刷新复验：标题“洪水桥·近岸检修台”、最后回执近岸、46/77/92和version保持；再实际过桥到version32，标题成为黎明枢纽、40/73/92。新的canonical回执另由48条中英三路线小城测试验证，每条检查新回执和历史前缀；中英旧显示修复/后续真正抵达/原存档不变两项新增回归。全套488项通过。浏览器仍是同一运行中的loopback preflight进程，没有重启或导入存档；服务器重启持久化与另一条完整浏览器分支尚未实测。

原始运行证据保存在本机`_qa/original-browser-route-20260911.json`、`_qa/ui/original-bridge-platform-layout-fixed.png`和`_qa/ui/original-ending-platform-layout.png`。它们是合成旅程可见UI记录，不含capability、登录或真实玩家数据。该完整路线属于中文本机作者流程，地图和NPC仍有明确占位，不等于正式美术、开放语义、iPhone或AlterU生产全流程通过。正式主站/Pages仍05db41c，无新增媒体/模型请求或正式部署；完整单人与平台生产链目标保持。

本轮最终cloud前端/Worker、Pages、preflight构建均通过，秘密/API base审计与diff检查通过；只推送开发分支，不触发正式部署。


### 原作固定背景准入与旅程版本绑定（2026-09-11，开发分支）

`original-asset-releases.ts`登记两个不可变北岬背景版本：旧e8e36bba基准与平台8fc11a96候选。后者对应公共媒体任务mt_1a1c4492493eaf68a32331d43d91c207、原始1024×1536/2811504字节及完整SHA，沿用已完成的固定布局实景评审；本次只读复查并原字节接入，没有重新生图、去底或编辑真实图片。此目录是工程审核过的资源登记，尚不是创作者账号云端发布服务。其他地图、人物和设备不因背景通过而获准入。

新建原作Head增加`assets:{version:1,backgrounds:{train-at-dead-station:releaseId}}`，服务选择已登记的平台背景；已有不带assets的Head保持旧基准，upgrade不偷偷补新绑定。原v8 StorySave不变。服务与客户端同时拒绝未知版本、任意URL、不匹配场景、空或额外绑定；当前行动/结局没有切换资源入口，保存和回执通过原Head保留绑定。独立原作协议升级为original-session-2.assets-1.story-8，防止不理解绑定的旧客户端继续写入；线上车厢协议不变，原作正式发布门仍关闭。

原作地图界面按权威绑定选择`SceneReadiness`，只替换北岬background描述，TMX/碰撞与其他房间不变；旧基准仍可加载。构建在读取两份源PNG时核对固定摘要、尺寸和字节数；新平台图输出到preflight的`art/approved/north-cape-8fc11a96.png`。下载仍核对大小、SHA和真实解码，失败不尝试另一版本。当前并未给全部九地图、人物或道具做完整版本发布系统，也没有改变已有生产旅程。

新增六项测试覆盖真实源文件摘要、旧档升级/行动不换图、资源清单只改背景、双端拒绝伪造绑定、合成错误字节拒绝且不回退、SQLite实例重建/回执重放保留绑定。原有六条中英三路线实际HTTP测试另逐回合及结局检查同绑定，并覆盖登记/行动/结局丢回执与文件SQLite重开。494全套回归通过；补充断言后8项HTTP测试再次通过，cloud前端/Worker、Pages、preflight构建及秘密/API base/媒体集成审计通过。

保留原5316进程，另在同游戏5317端口创建新合成旅程。实际北岬读到platform背景，走到左侧启动机、维修车况82→87、刷新后版本1和绑定保持；Network响应确认请求的是带8fc11a96完整SHA的已登记相对资源，HTTP200。390×844截图与实际CSS尺寸一致、车体点击无穿越；320×568从附近列表走到右侧制动点、面板按钮44px、无横向溢出。此轮新隐藏测试页的尺寸截图正常，不沿用此前另一页的缩放偏差结论。尚不是物理iPhone性能或正式平台试玩。

证据：`doc/platform-art-candidates/20260911/background-binding-review.json`和`_qa/ui/original-platform-background-{390,320}.png`。这证明一张已审查平台背景进入原作Story Session并按旅程固定，不等于用户任意生成图自动合格、创作者跨设备云草稿/发布或游玩动态激活已完成。生成计数仍7次意向/6张图片，无新增外发；正式主站与Pages保持05db41c。


### 原作资源故障与分支隔离（2026-09-11，开发分支）

实际浏览器故障注入发现：旧UI按实体枚举全部出口预加载，点击河谷也会下载未选择的货场背景，因此货场失败会错误阻断河谷。`originalActionDestinations`现在根据所选行动ID，或与权威相同的作者/领域解析器解析自由输入，只准备该行动在当前实体/场景的目标；不改变权威准入、资源哈希或原始存档。中英回归覆盖三个首段分支、完整句输入、错误实体与非转场行动。

恢复错误改为单个`alertdialog`，隐藏原操作面板、暂停地图输入并禁用背景操作，焦点落到恢复按钮；Tab和反向Tab不会被旧面板困住。场景资源错误明确提示素材无法加载，网络请求未确认仍保留原pending语义。恢复仍经enroll/recover与资源验证，不以换背景或新建旅程处理失败。

本机5317同一合成旅程：北岬平台背景失败→恢复保持v1/68燃料87车况58人心；修复前复现河谷被货场背景阻断；修复后所选河谷背景失败仍停在北岬且不扣费，随后只解除河谷阻断、保持货场失败，成功到河谷v2/62燃料87车况58人心。河谷刷新时再次阻断当前背景，320×568和390×844实测单一恢复弹层、44px按钮、无横向溢出，Tab/Shift+Tab聚焦恢复、Return恢复同v2与同资源。故障注入仅限本机新建测试旅程，无生产数据、模型或媒体外发。

证据在`_qa/original-route-recovery-20260911.json`及`_qa/ui/original-route-{failure,recovered}-platform-layout-*`。最初直接CDP尺寸覆盖的截图比例错误，已改用浏览器viewport能力复拍；以320-fixed和390截图为准，不修改产品布局补偿工具偏差。此轮不等于物理iPhone、服务器重启或正式平台验收；正式主站/Pages仍05db41c，原作完整美术与发布门继续保持。

恢复后继续通过附近列表实际走到断桥，用可见完整句输入“检查断桥承重”提交成功至v3，燃料62/车况87/人心58保持并出现真实承重检查结果。496项全套回归、cloud/Worker/Pages/preflight构建、公开秘密与API base审计通过。


### 原作持久预演存储（2026-09-11，开发分支）

`server/preflight-storage.ts`统一了原作HTTP回归和实际Vite预演使用的SQLite适配器。默认仍为内存；显式配置`CARRIAGE_QA_DATABASE_DIR`时，为每个DO对象名以SHA-256文件名保存独立数据库，包括原车厢与original-v8的隔离。事务使用BEGIN IMMEDIATE/COMMIT/ROLLBACK，关闭时释放连接，无法使用目录时明确失败，不退回丢失数据的内存。它只被本机preflight插件导入，生产Worker仍使用既有Durable Object SQLite，Pages不承载另一套后台。

后续长流程的本机启动方式：

```sh
CARRIAGE_QA_DATABASE_DIR=.data/original-persistence-20260911 npm run preview:preflight -- --port 5318
```

目录位于已忽略的`.data/`，只存本机新建合成旅程；不复制正式玩家存档。保持同端口、同目录和浏览器已有测试身份，重启后可由相同服务协议读取。旧5316/5317内存旅程未改动，不隐式导出或迁移。两个适配器测试覆盖对象隔离、回滚、重开、默认内存及无效目录；六条完整原作HTTP路线现在复用此真实适配器，继续覆盖登记/行动/结局丢响应和磁盘重开。

实际浏览器在5318新建旅程，完成维修、搜油、选择黑松林线与信号检查，至v4/78燃料87车况58人心、位置112,184。只读核验本轮新建SQLite后停止进程90484（已确认退出143），同目录同端口启动新进程91079，再刷新既有浏览器页。唯一旅程的整个head与重启前深度相等，未新建另一条旅程；UI场景/版本/背景绑定/相机位置一致，日志与库存逐字相同。随后实际提交紧急倒车到v5，车况75、人心56，确认恢复后仍能执行真实后果。截图保留390×844下重启前后同一位置；林线仍是明确几何占位，不作美术准入证据。

证据：`_qa/original-restart-disk-proof.json`、`_qa/original-restart-browser-proof.json`与`_qa/ui/original-restart-{before,after}-platform-layout.png`。498项回归与preflight/cloud/Worker构建通过。该实证是本机服务进程终止/重启与浏览器重载，不是断电损坏恢复、云端PITR或正式平台长流程；原作正式发布开关仍关闭。本轮无模型或媒体生成调用、无真实图处理、无生产玩家数据访问。

### 原作语义行动适配（2026-09-11，尚未启用真实模型）

`server/original-action-interpreter.ts`提供显式注入的模型边界：输入只有当前物件可用行动ID/文案、当前场景与目标，不向识别器开放存档写入。候选必须是严格的单行动或unsupported JSON；第二次语义核对必须明确通过。未知ID、额外effects、错误核对均拒绝。两次请求共用最长20秒期限；即使提供者忽略abort，过期结果也不能进入事务。没有默认网络提供者，Worker仅增加测试可注入参数，原作health仍报告liveModelAvailable=false，生产入口和实际地图UI没有打开live模式。

`src/original-action-intent.ts`先拒绝明确疑问、否定、计划、过去报告和复合指令，修复冻结原作关键词匹配把“不要检修启动机”解释为维修的问题。精确作者文案及省略末尾费用的同一句可直接执行，英文作者单一行动中的and不误拒绝。live模式的非精确输入必须经过识别，不能因为含原作关键词而跳过核对。只允许映射到当前目标可用的行动，然后仍走相同作者/原v8 reducer、角色存在、距离、资源、转场和前后表现准入。生成器无权新增动作、角色或地图。解释前原句与选择ID保存在同一持久回执的interpretation字段；既有叙事历史继续记录实际执行的作者行动。这不是持久对话记忆，开放对话/记忆仍待接入。

本机真实HTTP验证：新旅程语义改述映射维修并结算+5车况，响应丢失后重开SQLite，重放同一请求不再调用合成识别器、不重复结算，原句回执保留。另一新旅程通过真实客户端验证拒绝会清除待确认请求并保持原head，下一次明确维修正常成功。测试同时覆盖跨物件ID、伪造新地点/效果、核对拒绝、超时、并发新版本和素材未准入；所有模型响应均由测试注入，未向真实模型发送内容。

504项全套回归通过；随后新增客户端恢复测试并运行整个original-http文件，10项通过，共覆盖505项。preflight、cloud/Worker和Pages构建通过；构建仍有上游音频引用及包体大小提示。实际浏览器复用5318合成黑松旅程：输入“不要抽取林线检修点的最后一份柴油”保持v5/78燃料75车况56人心、日志无新回合；接着输入相同的肯定行动，到v6/90燃料75车况56人心。证据`_qa/original-intent-browser-proof.json`。本机进程已重启加载修复，同一持久目录继续；没有重建玩家旅程。

真实语义质量、开放对话、完整角色/设备与七张地区美术、创作者云版本及玩家动态激活、正式原作双部署和AlterU全流程仍未完成。此次只提交开发分支，不变更已发布05db41c，不将合成识别测试当正式游戏完成。

### 原作交谈事务与人物记忆（2026-09-11，开发分支）

同一OriginalTrainAuthority的actions端点新增`type: dialogue`，只接受当前已登场且实际在场人物的空间实体，距离与前后表现准入照常核验。适配层仅向原v8存档的blocks追加一对带稳定请求ID、人物ID和角色标记的dialogue块；不调用会推进剧情的普通回合reducer，不改冻结的原作源码。会话version/cursor增加一，save.scene、danger、stats、choices、inventory、relationships、map、finale等完整保持。请求摘要、重放、事务回滚和并发版本拒绝仍共用SessionAuthority。局部交谈不会另建聊天存档或第二写入端。

`src/original-conversation.ts`仅从显式成对的交谈块提取当前人物最近4段上下文；旧正文、按钮行动、不完整配对以及其他人物私聊不推断为记忆。档案保留全部已提交交谈，但当前输入上下文只取最近4对，不宣称通用长期语义记忆。`server/original-dialogue.ts`默认本机作者回应支持问候、担忧、当前目标和最近原话回忆；未知内容返回ORIGINAL_DIALOGUE_UNSUPPORTED，客户端清除已确认拒绝的待处理请求并提示改述，世界零写入。它是明确有限的本机回退，不能视为任意自然语言理解。

可注入的在线对白生成器只接收当前说话者、实际在场人物、当前目标、最近4段本人物交谈及最多3段已有叙述，不发送完整存档、隐藏角色名册或隐藏facts。候选只允许text/characters两字段，最长900字，未知人物ID、额外效果和协议片段拒绝；二次语义核对检查未提交行动、虚构外观/设备、把玩家说法当事实及记忆错误。生成/核对共享20秒期限，过期候选不提交。该语义核对不等于形式化事实证明，真实质量仍待验收；Worker默认没有注入真实提供者，health仍为不可用，UI没有开启在线对白。

实际界面沿用人物局部面板：默认交谈，可切换行动；普通物件没有交谈入口，固定行动按钮仍直接提交作者ID。512项回归通过，包含中英配对记忆、保存重开、未知/异地/远处人物拒绝、阿达与任医生私聊隔离、后续维修兼容、合成候选审查/超时/并发/素材拒绝，以及真实本机HTTP客户端丢回复后重开SQLite并回忆原话。preflight、cloud/Worker和Pages构建与秘密/API审计通过。

本机5318原合成黑松旅程从v6继续：与阿达说“我担心乘客们今晚会冷。”至v7；实际刷新再询问回忆至v8，引用原句，90燃料75车况56人心全部不变。再说“把发电机给我”明确未理解，保持v8与原日志。390×844、320×568截图检查输入、模式选中态、记录阅读，无横向溢出；320记录可正常滚到底。证据`_qa/original-dialogue-browser-proof.json`、`_qa/ui/original-dialogue-{input,recall}-platform-layout-*.png`；这是桌面浏览器视口验证，未验证iPhone原生键盘。本机预演进程重启仍保留同一合成SQLite目录。

当时提出的最多8次真实对白请求等待后来已撤回：用户此前的自主开发与自行测试授权涵盖新建合成旅程，不应每批再确认。真实人物/设备的替代工具图像处理仍遵守独立工具约束。该交谈实现轮没有外发，后续真实接口批次见下文。正式版本继续05db41c，完整单人与平台媒体生产链目标保持。

交谈上下文复验发现林线完成避让后目标仍指向旧决策。已在只读目标投影中按避让完成、认识林澈、核对线路与同行决定显示实际下一步；原v8历史不重写、尚未登场不预先提名。新增林线目标测试与交谈/目标投影共17项通过，累计覆盖513项；三种构建重新通过。

实际同一浏览器旅程重载后，地图目标已改为“去打开仍传来敲门声的救援车”；询问阿达“现在应该做什么？”得到相同当前目标，到v9仍为90/75/56。证据`_qa/original-dialogue-objective-browser-proof.json`，预演进程98003。该修正没有倒改旧objective字段或历史正文。

### 原作对白首次真实服务批次（2026-09-11）

依据已有自主开发/测试授权，通过现有game-chat接口对全新合成原作旅程执行4条输入，最多且实际8次请求（生成与核对各4次），全部HTTP 200，单请求约0.88–3.33秒。没有读取真实玩家身份、存档或凭据，没有连接或迁移新Prolog服务。`_qa/original-dialogue-live.ts`为显式预算开关控制的人工运行工具，不进入npm test；本轮原始报告留在忽略目录，可公开的精简证据为`doc/original-dialogue-live-20260911.json`。

担忧得到目标内回应；下一句能回忆洪水担忧；改变阿达衣服的要求被人物拒绝。这3段对白分别提交到合成SQLite，除了2块交谈记录和会话版本之外，原作世界状态逐次完全不变。第4条发电机请求没有获得物品：生成回复却建议玩家自行寻找，核对返回valid=true加非空正向说明；严格协议将它拒绝，head完整保持。不能称这条证明了语义审查正确，因为拒绝直接原因是核对格式不一致。

据此给人物上下文增加当前可用的稳定行动ID/文案/目标（不传未来章节），禁止建议去寻找未制作设备或不存在的地点，核对提示明确要求成功为valid=true/issues=[]、失败为valid=false/具体违规。保持程序严格拒绝相互矛盾的返回，不把正向说明自动当成空issues。实际第4条响应已进入离线回放回归，验证拒绝零写入与当前行动许可范围。修正提示未在本批追加真实调用；这批8次已用完，后续有界测试可在已有授权下继续，只有新增真实权限或外部支持才需要用户处理。

真实模型生产入口仍关闭，本批仅证明4条特定输入的结果，不等于完整对白质量、实际平台登录、长期记忆或完整游戏验收。媒体生产链仍是下一优先事项，未因本批对白测试改变三类素材分别准入的规划。

### 设备候选的实际地图检查（2026-09-11）

`device-map-candidate.ts` 对浏览器已保存的三状态候选检查 ID、源/结果摘要、帧数量、透明边界、脚点和偏移；三个状态固定为关柜、有物、空置。以关柜主体高度计算一次统一缩放，所有帧共用落地点。门扇最大展开宽度决定固定占地，状态切换不新增会卡住玩家的障碍。该设备位于与人物相同的 RPG-JS 排序层，1×1 穿透事件只负责画面，实际阻挡和寻路共用 `deviceCandidateBlocks`。

`creator.html?scene_preview=north-cape&device_draft=<id>` 读取当前浏览器的候选，显式用 Pixi texture parser 加载 PNG；在北岬/河谷检查状态、前后遮挡、绕行与阻挡。状态仅是预览选择，转场保持当前选择，刷新回到关柜但仍使用 URL 指定的候选。无 StorySave 修改、无设备剧情或云端发布；语义正确与美术质量不由此检查器自动认证。

合成测试入口复用 `_qa/sprite-creator-browser.tsx?device=1` 与 `_qa/sprite-map.vite.ts`，普通构建不包含合成入口。实际操作发现柜后点被 4 单位寻路网格向障碍取整，增加网格余量后复验通过；测试样本包含落地点下方一个不透明像素，以覆盖占地深度进位。真实平台图未在本轮处理。

### 原作在线交谈与实际回忆反例（2026-09-11）

`server/model.ts` 导出既有平台 JSON 请求适配。仅本机 preflight 的 `original-preflight-model.ts` 显式配置 2–12 次实际请求预算时装配原作解释器/对话生成器；生成与审查都计费到该预算，失败也计数。`CARRIAGE_QA_ORIGINAL_MODEL_USED` 可显式恢复已用计数。本轮以 6/6 重启，不重置实际外发配额；这是测试预算，不是平台正式玩家额度或跨进程自动记账。

原作 health 分开报告 `liveDialogueAvailable` 和仍关闭的 `liveModelAvailable`，默认均关闭。预演交谈开关默认关闭，刷新不自动开启；已有按钮行动保持原管线。在线请求仍用原作 owner/SessionAuthority、pending 信封、速率限制和条件事务。额度耗尽为可结束的拒绝，清当前 pending、不增旅程版本；拒绝时保留输入与当前面板，显示可见说明。

真实测试共 10 次请求。自然维修表达被解析为原规则且幂等，修正后的发电机反例拒绝成功。但浏览器中的虚构共同修桥回忆被生成和审查双双放过。修复为 `originalRecollectionReply`：明确的回忆请求在本地/在线模式均优先只引用最近四对交谈中实际非回忆的玩家话语，不把玩家报告或生成回复提升为真实共同经历，不调用模型。回执标注 `source:author`、`guard:recorded-conversation`。中文真实浏览器同输入复验通过、模型总数不增；具体数值和失败文本见 `original-online-trial-20260911.json`。

限制：该保护覆盖已识别的回忆提问，不能保证其他开放表达全部可靠，也不是完整长期事件回忆系统。本次最初只开放在线交谈；后续自然行动准备与转场实现见下一节。正式原作开关、生产素材门与原车厢存档保持；未把本次预演等同生产发布。

### 自然行动准备、地图就绪与单次提交（2026-09-11）

`SessionAuthority.prepareAction` 使用原 `runtime.prepare` 生成通过规则的完整候选，但只保存到 owner/action 绑定的 `prepared_actions`，不写旅程、不增版本或 cursor。每个 owner 最多 32 条待执行候选；同 ID/同信封重放复用候选，不同信封拒绝。候选包含当时的原作规则结果、素材版本和玩家原句，不接受浏览器给出的状态效果。

原作 `/prepare-action` 仅返回目标场景、已解析行动、版本与素材绑定等准备元数据；`OriginalSessionClient.sendPrepared` 先持久化原信封，再经 `assertOriginalActionPlan` 校验元数据、调用当前场景资源加载器，只准备选中目标。加载失败保留 pending 和候选，刷新/服务器重启后使用同一信封恢复，不重新花费模型请求。`/commit-action` 复查旅程版本、素材准入，复用原事务写入旅程/日志/回执并清理当前旅程待执行候选。已提交的丢响应恢复直接重放回执，不因过期目的地图片故障阻断确认。

新增 `prepared-action` pending 类型不改变原按钮、普通自由输入和结局的记录格式；原作 wire 升为 `original-session-3.assets-1.story-8.original-train-authoring-10`，原车厢协议和原v8存档语义保持。只有显式配置本机模型预算时，health 才开放在线行动理解；制作期正式原作入口仍受现有发布门控制。

验证包含真实本机 HTTP 的理解丢响应、素材失败、SQLite 重开、结算后丢响应、元数据错地图、过期候选和并发行动；529 项全套回归通过，随后新增的并发模型等待反例与其余四项准备测试全部通过。浏览器用新建旅程实际输入“现在把列车开上河谷支线”，两次真实模型请求完成理解/审查；背景失败时保持v1与完整StorySave不变，重启保留2/2已用预算再注入一次背景失败，最终恢复到河谷v2，燃料68→62且只扣一次。证据见 `original-prepared-route-20260911.json` 与 `_qa/ui/original-prepared-*.png`，320/390可操作、实际地图行走与刷新保持。

这证明已登记行动的自然语言转场链路，不证明任意自由意图都可执行。美术完整性、创作者云端资产发布、正式原作全流程与多人仍是后续工作；本次没有媒体请求、真实玩家存档读取或正式部署。

### 平台背景原图的在线草稿（2026-09-11）

`server/creator-art.ts` 在现有DO绑定内使用独立 `creator-art-v1:<owner hash>` 对象保存背景候选，不创建玩家旅程。`/api/creator` 复用256位制作凭据与服务端hash边界，使用独立 `creator-background-1` 协议。制作页仅在用户点击时读取/写入；当前默认正式开关关闭，preflight开启，Pages制作页明确引导主站，不以固定跨站API访问正式存储。

保存输入包含原请求、任务ID、SHA和光照；服务端只查询已完成的平台任务，校验请求/任务关系、类型/尺寸及下载域名，再下载原始PNG验证SHA。这里的提示词是创作者原始记录；媒体查询没有提供提示词回显，不能宣称服务端独立证明了提示内容。服务不接受客户端任意下载URL、不发起生成或重新生成。每身份6个不可变候选，处理中也占用数量，重复同信封合并，冲突拒绝。

原图按64KiB BLOB分块，元数据与所有分块在同一个SQLite事务提交；失败无半成品。SQL绑定使用ArrayBuffer，符合[Cloudflare SQL值类型](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/)，本机适配层转换为Node SQLite支持的Uint8Array。下载从私有SQLite读取，复验分块长度与整体SHA，不依赖原媒体CDN继续可用；HTTP失去保存响应后可重放原ID。浏览器取回时再次校验元数据/字节/解码，成功后才写入原BrowserArtDrafts并沿用地图入口。

535项全套测试通过；后续原请求持久化调整的5项专项测试通过，三个构建通过。真实浏览器使用既有environment-edit-01：2221448字节、34块，服务端SHA与原图一致，原提示保持；停止并重启同一测试服务后取回成功，实际地图行走至112,184且车体拒绝。新建制作身份下journeys表为0，未读取真实玩家数据，没有新生成请求。证据见creator-cloud-trial-20260911.json。320×568/390×844按实际DOM尺寸检查，无横向溢出、按钮48px；IAB当前1.3倍缩放导致截图二次缩放留边，截图不作为完整手机构图通过的证据。UI扫描只发现旧构建依赖内容，本次源码无发现。

边界：本轮是可部署服务在本机的真实HTTP/SQLite与平台任务读取实证，尚未云端部署；制作身份不是平台账户绑定，清除身份后不能靠公开草稿ID取回私有记录。在线保存不表示视觉准入、发布版本或玩家存档激活。后续继续账户绑定/发布、真实角色设备准入和完整原作上线。


### 背景检查、不可变发布与新旅程绑定（2026-09-11）

`background-publication.ts` 定义背景版本与五项检查：四个实际接近点和一次车体碰撞。预览页读取真实引擎位置和画面位置，完成后由创作者明确确认视觉一致；服务验证该确认记录与原图SHA、布局版本绑定。这个记录属于创作者声明，不是服务端自动审美评判，也不能证明任意生成图与碰撞都匹配。实际测试发现4单位寻路网格会落在112,184而不是作者110,185，原1.5单位判定漏记，已将作者点容差改为3并保留画面/逻辑位置1.5单位一致检查；五项实际复验通过。

在线草稿新增显式`POST /drafts/:id/publish`，先复验全部原图字节，再将不可变发布记录写入`creator_art_publications`。只有显式发布后，`GET /api/creator/releases/:publisherHash.:draftId`及其`/file`可公开读取；私有草稿路径仍需制作身份。公开版本不包含原提示词或制作凭据，原图使用immutable缓存，重复发布和丢响应恢复返回同一版本。背景原图仍为平台已生成PNG，没有编辑或重生成。

新旅程入口携带`background_release`，服务端通过现有DO绑定读取已发布记录后才创建原作旅程；浏览器不能直接提交素材URL/完整head。绑定写在原作外层`assets.version=2`，固定发布元数据；后续行动和续玩沿用同一绑定。原作协议升至`original-session-4.assets-2.story-8.original-train-authoring-10`，原v8保存内容、原车厢协议及旧素材绑定保持。新版本旅程使用独立客户端请求/续玩记录，制作与玩家身份各自隔离；默认旅程登记摘要保持原算法，错误或未发布版本提供返回默认旅程入口。

537项回归通过，新增真实HTTP测试覆盖未检查/错误SHA拒绝、私有与公开边界、丢发布响应、服务重开、丢登记响应、旧旅程不变及未发布版本拒绝。真实浏览器使用environment-edit-02发布记录进入原作，维修82→87、刷新、行走至发车点、进入实际河谷68→62燃料并再次刷新；数据库只读检查原图2811504字节/43块/SHA一致，journey保存同一发布绑定。证据为`background-publication-trial-20260911.json`及`_qa/ui/published-background-*`。320×568实际DOM无横向溢出且可完成转场；390×844曾测得，但IAB视口切换存在缩放变化，相关截图仅作为布局观察，不宣称iPhone实机验收。

此链路当前在本机preflight开放，正式原作与在线草稿开关继续关闭。本次未部署正式主站/Pages、未调用新媒体生成或模型、未读取真实玩家数据。平台账户身份绑定、真实角色/设备准入、其他背景、生产发布和平台完整游玩仍待完成；本次功能不是完整单人目标的终点。


### 组合设备原图复用（2026-09-11）

`sprite-source-library.ts` 从独立设备原图及两状态组合的保留输入生成轻量选择项。选项携带源记录版本、输入槽位、原选帧列和生成来源签名，不复制PNG字节；相同原图、选列和生成任务的处理分支只显示一次，不同任务即使像素相同仍各自保留。选取时重新读取记录并验证版本、签名、PNG摘要和生成来源，再复制该输入供新组合使用。结果图不被冒充原图，修改新组合不会改变历史记录。

`sprite-creator.tsx` 的现有设备选择器接入此来源库，显示原图身份和原先使用列。`sprite-composition.test.ts` 验证关闭重开库后的复用、重新处理输出摘要一致、源记录隔离、过期/损坏记录拒绝及同图不同任务来源区分；完整测试568项通过。后续独立localhost浏览器在320中文和390英文完成旧启动机原图第2/3列与第1/1列选择、重新组合、处理和刷新，输出均保持`35be79d5…9b7d7`。实际截图与机器结果见`actor-sheet-review-browser-20260911.json`。此本地测试没有操作待授权的生产来源，也不代表线上生成配对/归档流程完成。

### 人物图集检查记录（2026-09-11）

`actor-sheet-review-panel.tsx` 在同一制作页按下/左/右/上顺序展示原始候选的每行三帧，默认查看背向。CSS只裁切展示现有候选URL，未生成或修改图像。创作者分别记录朝向、交替迈步和配件三项观察，共12项；未检查、通过、不通过均为显式选择。全部通过的状态为`sheet-reviewed`，只表示作者填完图集检查，不是实际地图、美术认证或正式准入。

`actor-sheet-review.ts` 将观察绑定候选ID、源/输出摘要及规范化处理参数、帧映射和算法。保存前复核当前记录和PNG摘要；旧页面不能覆盖新观察。记录写入本浏览器`SpriteDraft.actorReview`；重新处理删除新候选检查，旧候选记录保持。检查元数据不改变不可变在线归档的revision，也不进入`spriteManifest`；在线取回后无此本地结论，界面明确说明需要重检。未增加后台审批、发布、故事事实或自动替换人物。

五项新增回归覆盖拒绝记录重开、12项状态归约、重新处理失效、候选/参数/帧变更和损坏字节拒绝、旧页冲突，以及已有归档签名保持和恢复后无本地结论。573项全套及前端/Worker构建通过。Mac锁屏后改用全新临时无头浏览器，仅允许localhost请求，不连接用户现有浏览器、生产来源或登录态。320×568中文与390×844英文均通过正常控件保存拒绝、刷新恢复、重新处理后清空、找回旧拒绝记录；控件48px，无横向溢出、页面异常或外部请求。已目视检查深底背向/浅底右向/保存状态和选列截图。原生option可见性等待和处理后历史列表刷新等待两处QA脚本问题修正后完成全程；这些测试不代表iPhone真机、线上链路或新人物合格图集。详见`_qa/actor-review-browser.ts`和`actor-sheet-review-browser-20260911.json`，尚未正式部署。

### 基准背向步态、真实素材准备与人物占位（2026-09-11）

用户指出B黄色主角背向两张迈步帧同腿领先。原图只读拆帧确认背向两帧的低位鞋像素均偏右，而正向、灰衣机修师和蓝衣乘务员正/背向能交替。一次平台定点重生成改坏了其他方向和背包，不采用。`repair-hero-back-gait.ts`只使用现有依赖的PNG编解码器，不启动浏览器；固定原图SHA后调用`repairHeroBackStride`，在第三列第四行y266以下反转腿部像素，保持包/上半身/另11帧/脚点不变，并另写`hero-gait-v2.png`。`art-catalog.ts`的B主角路径切到新文件；视角、分辨率、行走速度和路程驱动周期保持。该处理只适用于此源图的已测边界，不是通用骨骼动画或其他人物的自动修复。

像素回归验证了原输入不变、所有区域外像素相同、低位鞋从右侧反到左侧及实际输出一致。真实RPG-JS点击寻路采集8帧，包含侧向转背向和背向两步，图像见`hero-back-gait-review-20260911.json`与`_qa/ui/hero-gait-runtime-*`。浏览器证据不等于iPhone实机体验，未正式部署。

用户已明确授权制作页代码处理真实人物/设备原图，旧的待授权问题解除。第三个阿达平台候选用了1次生成，17.347秒、688319字节；四向与灯具仍未合格。制作页新增该固定源入口，通过已有Web Worker去底、脚点300对齐、保存独立候选并加载到同一地图，源SHA保持，白底被去除；源图与输出摘要见`ada-preparation-trial-20260911.json`。这证明首次真实素材经过现有浏览器处理链，不是阿达完整图集或NPC正式准入。后续可以评估合格静止帧，但不能把错误右向/背向动画带入正式人物。

`original-character-space.ts`从同一场景实体与`originalCharacterPresent`计算9×15脚下占地；客户端寻路/移动和服务端行动位置校验共用。原作Head读取时仅将与人物占位冲突的旧位置移到邻近可走点，资源/关系/版本/剧情不变。未来人物、离开人物和别处留守人物无碰撞；同行人物随当前区域占位。两项新测试包含归属变化、旧位置恢复和全部开场实体接近点可达；当前人物仍是开发标记，不能将占位规则称为实体美术完成。

完整540项回归通过。整体目标继续保留真实角色/设备美术、其余场景、平台制作/游玩与正式双部署，未因为本次修复缩小。

### 原作阿达站姿实体（2026-09-11）

`original-character-art.ts` 固定单帧资源摘要、320×320裁切、160/300脚点、0.16尺度及`front-standing-only`能力；源actor-edit-03整张方向图集仍未准入。`scripts/prepare-ada-standing.ts`调用制作页同一`prepareSpritePixels`函数复现去底/脚点对齐，再原样裁出第0行第1列。原图摘要保持，未通过方向不进入静态资源；这是已审查固定素材的工程接入，不等于创作者人物云端发布已完成。

原作客户端在创建renderer前核验人物PNG大小/SHA/解码，显式加载blob纹理。九个地图的阿达节点从原作共享实体站位派生；使用1×1穿透事件作为图形节点，以`y+1`回到同一脚底深度，实际9×15身体碰撞继续读取`original-character-space.ts`。固定graphic只切换stand/hidden透明帧，每次权威head恢复后投影当前人物是否在场，不新增独立NPC存档或关系。按钮改为透明人物触控区，保持原接近点/交谈动作。

缺图中止场景准备、保留权威旅程并用既有恢复入口重试。完整四向动作、其他角色、创作者自助人物版本发布/激活及正式视觉验收仍未完成，原作生产开关保持关闭。浏览器实证与尺寸偏差见`ada-standing-review-20260911.json`。

### 原作启动继电器实体（2026-09-11）

`scripts/prepare-starter-states.ts`固定两张平台原图SHA，选择02第1列与03单帧，调用制作页同一`prepareSpritePixels`去底和显式脚点平移，输出640×640的`starter-states-v1.png`。未修改输入，也未采用02的错误保险丝状态。该脚本是固定候选的可复现装配；多来源状态组合尚未做成创作者自助UI，不称为设备云发布完成。

`original-equipment-art.ts`从原场景实体starter派生脚点和固定40×18占地，提供两帧纹理、资源摘要及`starter-repaired`事实投影。原作renderer创建独立1×1穿透图形节点，实体动作消失后设备仍存在；每次权威Head恢复后更新图形，故事不由画面驱动。`original-world-space.ts`组合原场景、在场人物与设备占位，客户端寻路和服务端位置校验共用；旧Head仍先按原静态地图校验，再在组合占位下恢复合法点，不改动StorySave。PNG在renderer前验证摘要/解码，缺图使用既有恢复界面。

本轮545项测试、preflight/cloud+worker/Pages构建、公开秘密与API base扫描通过。真实新建浏览器旅程完成检修、82→87车况、刷新版本1、390×844与320×568布局及柜后行走；缺少设备PNG时明确恢复提示，恢复正常加载后继续。详见`starter-entity-review-20260911.json`。未正式部署，不等于完整原作发布完成。

### 浏览器两来源设备组合（2026-09-11）

`composeRepairFrames`仅选择两张PNG横向图集中的声明列，拒绝越界、不整除、不同帧尺寸和超大结果；像素不缩放。`SpriteDraft.composition`可选保存version1、两张完整原始PNG/SHA、文件名和选帧列，`deviceStateSet: repair`明确两帧语义；旧记录无这些字段时保持原三状态合同。处理与地图载入都会验证原图SHA，并重建组合像素与组合源对照，迟到/失败沿用原版本锁和独立历史。

制作页可手动选择两份PNG，也可载入已生成starter-edit-02第1列与starter-repair-03；后者预置已审查的接地点并明确不发起生图。固定样本和手工输入共用浏览器组合函数、原生PNG编码、IndexedDB保存、Web Worker去底和地图检查。组合前的文件选择只在页面内暂存，组合成功后才保存完整来源。设备预览按states长度选择两帧或三帧，同一图集比例和落地深度；占地将门尖超出脚点的部分放到真实前方，所有状态预留相同范围。仍未提供两来源的在线生成/云端版本发布，不宣称完整自助制作链已经通过。

此轮549项回归、preflight/cloud+worker/Pages构建及媒体/秘密/API审计通过。真实浏览器组合候选07f75a8a-d1e3-411b-a486-ac710b555cbd经保存、刷新、北岬/河谷加载与两状态切换通过，具体原图/候选摘要及截图限制见`sprite-composition-review-20260911.json`。最后返场截图受宿主缩放影响，不能当作完整手机视觉验收；此前390×844和320×568场景截图与DOM尺寸相符。

### 人物与设备的私有在线归档（2026-09-11）

`sprite-archive-contract.ts`将候选分成有界JSON清单及source/candidate/input-0/input-1最多4份PNG，保留原图摘要、来源列、处理算法、脚点和逐帧结果。`SpriteCloudArchive`通过现有creator身份和同UUID API上传，49,152字节一段；单条分段JSON上限70,000字节，其他请求仍为6,000字节。每个制作身份最多6条，每条全部文件合计24MiB。`creator_sprites`与`creator_sprite_parts`位于原有creator DO SQLite命名空间，不创建外部对象存储、后台或长期上传密钥。

开始上传时锁定清单，同编号不同内容拒绝；分段同内容可重试、不同内容拒绝。完成时核验所有分段连续、长度、PNG头尺寸和SHA，在事务内再次比对已验证字节后才成为ready，防止异步摘要期间取消/重建引起错置。未完成上传可明确清除回收名额，完成记录保持不可变。丢分段回执后客户端读取已收到分段，继续同候选；服务进程重启也可恢复。所有原图与结果读取必须经过同制作身份，响应private/no-store，无公开素材路由。

`sprite-cloud-panel.tsx`提供保存、列出、取回、清除未完成上传；取回前验证摘要与真实浏览器解码，组合素材重建像素核对来源列，之后才用既有IndexedDB版本锁切换本地候选。可继续既有设备地图检查。Pages明确只提供主站入口，不偷偷连接另一套身份/数据库；原作和creator正式生产开关保持关闭。

归档ready只证明文件完整，不证明透明边缘、姿态语义、左右脚交替或可入场。人物12帧阿达候选仍方向不合格，允许私有保存但不准入。设备公开版本、地图检查记录和新旅程固定设备版本尚未实现；本轮不宣称整套制作/发布流程完成。真实浏览器操作与截图见`sprite-archive-review-20260911.json`。

### 设备版本发布与原作旅程绑定（2026-09-11）

`device-publication.ts`固定starter-slot-1、broken/repaired两状态、40世界单位主体高度和最多48宽/12前伸的几何合同。检查页使用原作启动装置110/160脚点；旧三状态柜体仍保持旧检查尺度与位置。真实renderer位置与逻辑位置一致且到达柜前/柜后才记入检查，状态观察与柜体阻挡合计5项；最后由创作者显式确认画面，保存绑定PNG摘要与几何的`deviceReview`。这是创作者观察声明，不是服务端自动审美识别。重新处理时删除确认，原候选记录保留。

`CreatorSpriteArchive.publish`要求归档ready、修复设备类别、同PNG摘要和处理脚点、完整检查与有界几何，再核验已保存候选字节，写入不可变`creator_sprite_releases`。私有原图继续鉴权；只有显式发布的candidate PNG经`/<GAME_ID>/api/creator/device-releases/<owner-hash>.<candidate-id>/file`公开，按摘要固定并设immutable缓存，不公开组合源或来源文件名。发布重试/丢回执返回原版本，不重新生成或复制素材。在线列表可读取已发布状态并进入/续玩独立旅程。

原作wire升级为original-session-5/assets-3，车厢及creator旧合同保持。新绑定版本3包含原背景绑定与已发布starter；旧版本1、2和无绑定Head继续原语义。新开户只接收release ID，服务端从creator authority解析发布记录，不信任前端传来的图片URL/占地。device_release使用独立待提交/续玩key，仍共享原作身份；既有默认/背景旅程key保持。SessionAuthority的enrollment digest拒绝同开户编号换素材版本。

`originalEquipmentBodies`从同一固定几何生成服务端和客户端碰撞；状态改变不改变占地。原作renderer在载入候选前核验PNG摘要/尺寸/实际alpha像素、重新计算bbox与几何并和发布记录比较，然后使用相同脚点/尺度创建两帧事件。repair-starter仍由原作规则改变事实和车况，图形只读取starter-repaired，不授予新物品；刷新与后续章节保留asset绑定。缺图沿用可恢复错误，不退回另一张图。已有Head仍先做静态地图校验再恢复合法站位，避免新增碰撞破坏旧旅程读取。

新HTTP测试覆盖显式发布、私有来源、不可变/错误几何、未发布引用拒绝、丢发布/开户/维修回执及SQLite重开；中英文两条完整河谷路线到结局逐回合保持设备绑定与旧默认旅程。生产creator/原作开关仍关闭，完整人物图集、其他场景素材、平台账户绑定和正式全流程继续属于大目标。


### 人物/设备在线生成原图（2026-09-11）
- `sprite-generation-recipe.ts` 定义不可变v1配方：Ada 960×1280四向图集、启动机修复前/后320×640单帧。前者固定引用已修正背向步态的完整commit PNG，后两者引用铜线圈启动机原图。每条英文提示词低于2400字符，只有一个公开HTTPS参考。配方调整必须另建版本，不能修改已发布配方导致旧记录无法复原。
- `sprite-generation.ts` 经现有公开媒体客户端请求/轮询；IndexedDB按部署UUID隔离，生成历史与SpriteDraft、玩家存档分别保存。一次意向固定requestId，任务ID先落盘，刷新后先GET旧任务。8秒最短重试等待，限流遵守服务retryAfter，ORIGIN_NOT_ALLOWED关闭继续按钮，不伪造Origin或换服务绕过。下载限8MiB、指定平台CDN、HTTPS/无凭据/拒绝跳转，PNG头/尺寸/SHA和浏览器真实解码通过才保存ready。
- `sprite-generation-panel.tsx` 与准备页共用Web Lock，尚有不明确结果的任务只能续接，成功不会自动改当前原图。明确导入时以生成ID幂等保存新的source草稿；重复导入取回同一原图，旧候选仍在历史。原图尚未处理时只保存在本浏览器；处理候选可沿用现有在线归档。
- `generation` 紧凑来源字段为version/recipe/requestId/sessionId/taskId。配方可复原完整请求；该记录是创作者提交的来源声明，服务未独立查询媒体任务证明其真实性。来源随子候选和两帧组合中的每个input保留，在线清单仍在5500字符/6000字节HTTP限制内，仍是2或4个PNG，不公开原图或生成记录。
- 两张设备单帧通过已保存素材选择器进入同尺寸组合，不经下载再上传；单帧禁止直接按三状态图集处理。去背景结果不等于方向/步态准入；人物发布与完整四方向质量仍未完成。
- `_qa/sprite-creator.html?generation=resume` 仅独立QA构建存在：合成媒体响应回放既有PNG，首次下载503，刷新后续接GET；`generation=origin`模拟明确来源拒绝。正常creator入口不传替身，不识别这些QA参数。QA页已补齐与生产相同的显式存储adapter，修复最初在线归档因测试页缺adapter失败。没有新增真实生图。


### 地图超时后的有效恢复（2026-09-11）
`RendererTransition` 原有逻辑会保留超时后的引擎Promise，避免重复转场；迟到加载通知可完成同一操作，这部分继续保留。但如果完成通知永远不来，重复调用restore只会再次等待同一Promise，重连叙事服务不能重建当前RPG-JS实例。
`rendererNeedsPageReload`将MAP_TRANSFER_TIMEOUT、MAP_RUNTIME_DISPOSED与RPG_RENDERER_ALREADY_CREATED映射为显式页面重载；原作、旧车厢、制作页分别复用该判断。网络/资产/规则错误仍使用原页恢复，绝不自动新建旅程或后台重试刷新。权威请求ID与旅程选择沿原持久客户端合同恢复。
`RendererTransition.status()`提供当前scene/joined/loaded/pending/disposed，`rpg-renderer`只把有限的地图握手阶段投射到自有host的data-renderer-*属性，不包含玩家资料、凭据或完整存档。这是排错数据，不能替代真实像素验收。
独立`_qa/renderer-recovery.vite.ts`构建可在明确query下丢弃一次onAfterLoading通知，测试标记写入该QA页面的scoped sessionStorage；正式三种构建不包含故障query、标记或修改。上一轮自然偶发超时的最初触发原因尚未确定；本轮修复的是无法完成加载时恢复按钮无效的问题，不宣称所有启动故障已消失。


### 创作者在线归档正式开启（2026-09-11）
正式handleApi沿用CarriageJourneyAuthority/CARRIAGE_JOURNEYS绑定，开启creator路由，原作及旅途画页开关保持关闭。creator-art-v1前缀隔离制作数据，车厢owner对象名和wire不变；发布标识改为carriage-creator-storage-20260911-2。正式制作页发布后的链接指向同源不可变图片，preflight继续指向原作绑定旅程。没有第二套后台、长期客户端凭据或平台账号身份假设。线上执行结果在发布检查记录中另记。

正式Worker首次上传拒绝：冻结原作cartridge五个浏览器图片/音频地址在模块顶层使用import.meta.url，Cloudflare模块URL不是可用于相对资源解析的文件URL。本机源码测试未覆盖此边界。build-worker.mjs现只在后台编译中将这五个显示地址置空，冻结源文件和前端媒体解析保持不变，故事/规则字段不改；新增opaque data URL模块启动与creator health检查，构建期即捕捉该类错误。71c50ed上传失败，不能登记为主站发布成功。

### 人物检查的私有在线版本（2026-09-11）

`actor-review-archive.ts` 将图集检查绑定到草稿编号、原图/候选SHA、处理参数和帧信息。在线保存先完成不可变PNG归档，再把检查追加到同一creator DO的`creator_actor_reviews`表；原素材清单和像素不变。`GET/POST /api/creator/sprites/:id/actor-reviews`沿用制作身份鉴权和private/no-store，仅ready人物素材可用，每份最多64版。检查内容是创作者观察声明，保存不代表姿态合格或自动准入。

检查内容的固定字段摘要作为请求编号；丢失回执、刷新及服务器重启后重试返回原版号。旧请求晚到也不会成为最新记录；到达64版上限后仍允许原请求重试。服务端在异步摘要前复制并验证输入，事务内复核素材绑定。取回人物时客户端验证检查内容摘要、绑定及连续版本顺序，再恢复最新版；失败时不覆盖本地记录。重新处理仍清空新候选检查，旧素材记录保留。

`SpriteCloudArchive.saveWithReview`保留分段上传进度，区分“文件已保存但检查回执未确认”与文件上传失败。原图归档与检查不是同一事务，界面明确允许同一检查重试。没有平台账号跨设备身份、新的公开人物图片接口或人物发布功能。

`_qa/actor-review-cloud.test.ts`覆盖真实HTTP/SQLite重开、丢回执、旧重试、64版上限、篡改/跨素材绑定和私有访问；`_qa/actor-review-cloud-browser.ts`用新建无登录态的本机浏览器实际点击保存、刷新、重试、二次检查、重新处理及在线取回。320×568中文与390×844英文均得到版本序列1/1/2，无页面错误及横向溢出。这里只验证记录流程，所用阿达旧图集仍因背向同腿和右向错误拒绝；不等于iPhone硬件或生产平台内试玩。
### 人物地图试走绑定（2026-09-11）

`ActorMapTrial`读取现有RPG-JS实例的逻辑/画面位置、朝向、动作和暂停状态，每50ms只在人物候选页面采样。四向分别要求同一方向的连续55世界单位行走并观察到三个stride姿态；四个方向停步都必须实际回到各自朝向的stand。画面不同步、对角位移、传送大跳、超过250ms的采样间隔、后台页或暂停不会积累通过。北岬车体阻挡来自实际walkTo拒绝和同一walkable判定；河谷移动后返回北岬重新行走停步才计往返完成。读取动作名证明引擎投影一致，不证明图中确实画对左右脚。

当前候选的12项图集判断全部pass，且8项实际检查齐全，才允许创作者显式确认画面。保存时重新验证原PNG、处理结果、实际alpha主体范围和统一缩放，绑定到既有ActorSheetReview的可选map字段；布局固定north-cape-river-actor-1。该字段随现有私有在线检查版本保存、摘要校验和取回；旧无map记录的内容ID算法逐字保持。修改图集判断会移除map，重新处理仍清空整份新候选检查。旧图/旧检查继续保留，不改变SpriteArchiveManifest或StorySave，也不自动发布人物。

本轮582项回归和正式前端/Worker构建通过。`_qa/actor-map-browser.ts`使用无人体语义的合成诊断图通过静态表单后，在真正RPG-JS中按键走完四向、停步、阻挡、北岬/河谷往返，再在线保存、处理新图、取回和刷新；同时用真实阿达旧候选验证图集未通过不能保存地图通过。320×568中文与390×844英文均完成。本机新建无登录态浏览器只连接localhost，远程访客扩展请求被QA网络规则阻止；这不是生产平台浏览器或iPhone硬件证据，更不把诊断图登记为合格美术。

### 已审人物发布与原作版本绑定（2026-09-11）

`actor-publication.ts`定义阿达固定槽位的公开人物版本：候选PNG摘要/尺寸/字节数、统一脚点与已审地图几何。公开数据不包含原图、来源文件名或生成记录。`CreatorSpriteArchive`在原creator DO增加`creator_actor_releases`表；私有`publish-actor`必须引用该素材最新检查的内容ID，12项图集判断和8项地图检查齐全后才可发布。异步PNG核验后的事务再次检查最新记录，避免新的拒绝被旧通过覆盖。已发布的同一意向丢回执后重试返回原版本，另一个检查不能覆盖它。公开`actor-releases/:id`及`/file`只返回已发布的不可变候选；原图路径仍需制作身份。机械检查不能证明图片姿态或阿达身份正确。

原作资产合同新增v4，在保留v1/v2背景或v3背景+设备的base上绑定阿达；旧默认旅程和旧存档不迁移素材。创建旅程只接收发布ID，由服务端从已发布记录解析，不能传入任意图片URL或自报素材对象。新人物/背景/设备组合分别使用自己的继续游戏与待确认请求键，共用原作身份和单一Story Session。原作wire升级至`original-session-6.assets-4.story-8.original-train-authoring-10`，旧车厢wire、冻结原作规则和DO绑定不改。

玩家加载所选人物时核验PNG摘要、大小、实际透明边界、脚点、12帧主体范围和统一缩放；宽度不得超40世界单位，脚点必须落在主体横向范围内，脚点前方突出不得超过4世界单位。图缺失或不符时进入恢复流程，不能默换人物。阿达在已登场且物理在场时，用第2列的四个站姿朝向玩家，两者按地面脚点计算方向；NPC行走和跟随行为尚未实现，试走页验证完整走路图集不能替代NPC行为验收。既有正面单帧阿达继续作为无人物发布绑定的开发基线。

本轮同时修复地图观察器的停步时序：连续采样可能看到重复走路帧，零位移重复帧不增加距离或姿态，也不清空已经完成的步态周期；随后真实stand才能记录该方向停步。暂停、不同步、超时采样和传送仍清空连续证据，静止切换姿态不能获得行走通过。原作正式入口继续关闭，正式制作页仅提供公开图集查看，preflight才提供绑定旅程入口。

### 原作多场景背景版本与真实TMX（2026-09-12）

`original-asset-releases.ts`的v1背景字典支持已登记的多个房间，必须含北岬，最多9项且每个版本只能用于其登记场景。v2创作者北岬背景增加可选additional，最多8个其他固定背景；旧v1/v2、v3设备与v4人物外层都能读取。只有新建旅程复制当前版本清单，旧快照不会自动加入新场景图。`originalEnvironmentVersion`按全部房间版本生成资源缓存键，避免北岬相同而货场不同的旅程共享错误加载器。原作wire变为original-session-7.assets-5；StorySave、地图逻辑ID和旧车厢wire不改。

灰石货场使用平台yard-edit-02完整PNG（78f22e9b…），不裁切、不重画或拉伸。既有白盒和北岬地图文件继续留存。`original-environment-layouts.ts`为此背景记录棚屋上缘与下缘的额外矩形，输出固定摘要TMX；`originalWorldWalkable`在同一资产绑定下验证同样几何。原作资源准备同时选中该图片和TMX，缺少地图槽位会拒绝；没有新图片的隧道等房间继续白盒。

RPG-JS默认按房间ID请求同名TMX。渲染器新增可选mapIds，将稳定剧情场景ID映射至实际版本文件名，并在地图加入、加载完成、恢复与转场时映射回稳定ID。灰石新旅程实际请求map/graystone-yard-78f22e9b.tmx，旧旅程继续请求map/train-at-graystone-yard.tmx。未配置映射的旧车厢和制作地图保持原行为。资源准备、真实renderer和权威碰撞不再各用一份不同几何。

`_qa/original-environments-browser.ts`使用专用QA构建的只读motion引用，正常按钮推进剧情；没有teleport、直接改存档或代替行动的接口。网络仅允许localhost，阻止远程访客扩展。实际覆盖缺图不转场/不扣费、图像blob摘要、栅门介绍、键盘走到屋檐停止、修泵合作、刷新同旅程、离站及真实TMX请求。`_qa/original-environments.vite.ts`只在显式QA构建插入该引用，正式和普通preflight无此引用。测试最初的鼠标落点碰到了阿达透明触控区而触发走近，已改为键盘碰撞观察；未把那次角色位移误判为碰撞失效。

### 2026-09-12 林线、隧道、小城环境扩展

`original-environment-layouts.ts` 增加三个图片版本对应的保守轮廓及不可变 TMX 元数据；`original-asset-releases.ts` 用实际平台任务、SHA-256、尺寸和字节数注册原图，仅新旅程绑定新版房间。`original-scene-preview.ts` 在 authoring/preflight 输出版本图片与地图并逐项验证字节；普通 cloud 的完整原作发布门禁继续关闭。原作 wire 更新为 `original-session-8.assets-6.story-8.original-train-authoring-10`，避免开发服务器与旧前端混用；旧存档素材字典及原车厢协议不变。

`_qa/environment-story-route.ts` 记录林线至结局的 39 个真实作者动作；专项测试用实际角色/设备/地图占地进行可达性搜索，并验证固定素材和恢复。`_qa/environment-story-browser.ts` 只连接独立 localhost，调用真实 UI 行走/互动，观察合成旅程响应，检查三幅背景像素摘要、引擎实际 TMX 请求、屋檐碰撞与手机尺寸构图；QA 只读 renderer 插桩仅在显式 `_qa/original-environments.vite.ts` 构建存在。

### 2026-09-12 完整素材版本布局

`original-environment-layouts.ts` 的注册布局现在是该图片的完整地形，并可包含 `entities` 的位置/接近点覆盖，不能在已有注册版本上原地改写。未知/未绑定布局仍使用原地图；角色、设备碰撞仍独立叠加。洪桥新版本移除小屋并按实图护栏限定平台边界，岔站新版本以调度楼包络替换车体占地。

`original-world-plan.ts` 在稳定实体ID、行为与剧情规则不变的前提下，投射版本站位。权威空间绑定、UI实体、人物占地及RPG-JS人物槽都使用同一覆盖。客户端读档验证当前版本地形；服务端读取兼容原白盒可读位置与当前地形，随后用原安全恢复逻辑修正占用点，动作/位置写入仍严格检查当前完整地形。素材字典不自动补入旧旅程，新 wire 为 `original-session-9.assets-7.story-8.original-train-authoring-10`。

新增回归检查：已消失小屋的地面可保存/恢复而旧图仍阻挡；护栏点及越界/非数值坐标拒绝；岔站新旧人物位置独立、UI与占地一致；保车和永久留桥分别只能使用其真实后果允许的结局。测试路线纠正为留桥后选择“彼岸的人”，没有降低原作结局门槛。

实跑同时复现旧寻路拐角停步：从北岬维修位走向出发控制时，逐步累加留下 `y=247.99999999999986`，在本应沿 `y=248` 的切线拐弯时被车体阻挡。`vendor/space-motion/distance-motion.ts` 在到达已验证节点后精确落到节点，依然检查实际碰撞，不放大容差或穿墙。20–240fps中14个帧率的切线拐角、距离守恒及极近非法目标拒绝均已加入回归；共享技能源尚未同步，此处为当前游戏副本的修正。

后续贴墙起步还复现 `x=59.99999999999999` 导致最后子步被拒绝。运动核按每轴已接受的子步数从帧起点计算位置；被阻挡的轴不累计位移，因此仍不会穿墙或在滑动后补跳。抵达完整节点时直接使用剩余向量并精确落点；25种贴墙起点×30/60/120fps共75组回归通过，原30/60/120fps速度/步态与薄墙拒绝继续通过。

2026-09-12 人物动作检查：新增 actor-gait-preview.tsx，通过 walking-motion.ts 的 walkingPose/STRIDE_DISTANCE 取同一0/1/2/1列序列，时间驱动仅供静止预览，不替换距离驱动的RPG-JS运行时。默认暂停；换图/换方向回第2帧，关闭details、busy和页面hidden停止；下一帧及查看站立均暂停。现有逐方向观察、候选摘要绑定、独立云评审和地图准入协议不变。_qa/actor-gait-browser.ts在全新隔离本机浏览器用已通过黄色主角作预览输入，320中文/390英文检查四向逐帧、播放暂停、换方向、关闭重开、不自动通过及拒绝记录刷新恢复。真实新生成两张背向三帧均拒绝，见actor-direction-experiment-20260912.json。

2026-09-12 原作旅程续玩：记录页增加服务器目录、切回旧旅程和保留旧旅程重新出发。使用既有GET /sessions及POST /sessions，不增加第二套存档或客户端导入。OriginalSessionClient校验目录ID、唯一性、版本/游标、时间和已制作房间。RecoverableSessionClient.selectSession先取回并校验目标Head，在bootstrap及当前session锁内更新续玩指针；任何待确认请求或开户阻止切换。restart也取得当前session锁，明确SESSION_LIMIT拒绝清理该开户意向但保留旧旅程，含糊网络失败仍保留原意向并同ID重试。普通/在线准备/结局提交均拒绝旧窗口的非当前旅程，新页从所选Head的素材/地图版本重建renderer。切换前checkpoint当前位置；失败不覆盖服务端故事或重置存档。所有者边界继续由现有HTTP capability承担，未实现平台账户找回。

验证补充：开发服务器不运行generateBundle，因此原作生成的TMX/背景不存在，返回RESOURCE_SIZE；未因此放松摘要/尺寸门禁。使用npm run build:preflight后的实际预览服务继续验证。测试浏览器均为新建localhost隔离身份，外部请求阻断；不代表正式AlterU或iPhone硬件验收。任医生站姿新候选虽然包含急救箱，但相机过于正面、比例变长，拒绝接入，无后续同批角色生成。

2026-09-12 原作在线对白新增当前美术合同：original-art-identities.ts保存已人工看过的阿达基准PNG摘要和可见服装/配件，原renderer继续引用同一资源声明；server/original-visual-context.ts按Head素材绑定投射当前说话人、背景版本和本场景启动机状态。非基准阿达发布图集没有语义注释时appearance为空，不沿用基准；其他仅有开发标记的角色同样不推断外貌。离开北岬不带出启动机，事实修复后状态改为repaired。上下文不包含原图字节、URL、身份凭据或未来人物，生成和复审读取相同visuals，提示禁止打印内部ID/摘要。此为人工声明的已知外观合同，不是自动看图、发布素材语义注释系统或通用视觉认证。

真实合成模型4请求/2案例记录于original-visual-dialogue-live-20260912.json：正常回复颜色/灯具身份一致，但“放在包里”来源措辞不精确，因此将灯的说明收窄为袋口上方可见上部、固定方式未知；这次精化没有再请求模型。第二个篡改请求被管线拒绝且没有状态变化，未保存生成/复审原始输出，不能据此断言具体拒绝理由一定正确。脚本使用新建原作状态，不读取真实存档；两案例不等同完整平台或开放对白验收。
# 2026-09-12 固定站姿的逐旅程绑定

通风机分层（2026-09-12）：新增`original-fan-art.ts`登记两个PNG、锚点、同一26×15占地与36个旋转姿态。新背景绑定v1/v2可选`fixedEquipment`，v3/v4外层仍保留；缺字段保持旧标记与旧占地，不升级旧档。原作wire为`original-session-12.assets-10`。`OriginalGame`准备并校验两份资源后，建立同地面深度的机壳与叶轮两个RPG-JS事件；叶轮增加0.01深度偏移以排在机壳前，实际碰撞只有一个机座。机壳一直stand，叶轮依据`retained`事实选择运行姿态，`abandoned`/未决定保持stopped。

运行时用RAF实际时间累计，完整一转1200ms、36姿态，不以RAF帧数计速；单采样超过250ms不补跳，页面隐藏、菜单、请求等待和恢复期间停止累计。旋转通过引擎sprite的rotation属性实现，源PNG不逐帧改写。状态源与在线对白共用`originalFanState`。`scripts/prepare-fan-parts.ts`保留固定原图，分别处理两格；仅在已审轮毂孔的明确小范围以浅中性色连通去底，不全图删白。原图/两份结果的摘要和真实半径检查进入回归。

同日新增林澈与玛柯：沿用上一增量的固定资源登记与`standingCast`合同；新开户复制三个站姿版本，旧只有任医生或无该字段的快照保持原样。角色身份与素材版本须一一匹配，不能以玛柯PNG绑定林澈。原作wire升为`original-session-11.assets-9`，服务器与客户端必须同时认识新增登记。通用RPG-JS人物事件、加载恢复和站位逻辑不改；`scripts/prepare-cast-standing.ts`只接受两份明确原图摘要并重现已授权透明处理。游戏不依赖开发工具的图像能力生成这些正式候选，两张均来自平台公共媒体接口。

`original-art-identities.ts`新增固定站姿登记：任医生640×640、SHA、脚点、0.08缩放及实际外貌说明。`scripts/prepare-ren-standing.ts`从固定平台原图重现已授权透明处理，不改变原图。背景绑定v1/v2新增可选`standingCast`，v3设备/v4阿达包装仍完整保留它；新开户复制当前登记，旧字段缺失始终表示旧标记，不自动升级旧存档。校验拒绝未知版本或把任医生图绑定给其他身份。原作wire升级为`original-session-10.assets-8`，冻结StorySave与旧车厢协议不改。

`original-character-art.ts`按绑定扩展真实RPG-JS事件和spritesheet，`OriginalGame`校验下载摘要和解码尺寸后加载，失败进入原恢复入口；离开时清理额外纹理。人物是否出现仍来自`originalCharacterPresent`，站位仍来自版本布局，身体碰撞规则不变。任医生外貌上下文只从当前绑定投射，旧无绑定旅程仍不推断服装。发布阿达图集与任医生固定站姿可同时使用；没有新增NPC行走AI或任医生自助发布槽。

### 2026-09-12 分层设备本地制作与真实地图检查

`layered-device.ts`固化两等宽列原图、机壳接地点、叶轮局部轴心、机壳安装轴心、两层独立等比显示尺寸、一转400–10000ms及固定占地的合同；不支持任意骨骼或多活动部件。纯像素整理与原通风机脚本共用实现，固定样本的轮毂孔去底必须匹配原图SHA，上传其他图不沿用专用遮罩。原图不改写，透明结果不重采样。运行纹理36姿态、一转按时间累计；机壳/叶轮分开的RPG-JS事件只有一个实体占地。

`layered-draft.ts`使用独立、按部署隔离的IndexedDB，保留原图、参数、候选及父记录。处理前保存processing，成功另存两张PNG，失败保留可重试记录；每次重做产生新ID并清空新候选review。Navigator Locks与当前ID/revision的事务比较阻止竞争写入。地图载入重新校验PNG摘要并从保留原图重演整理，使用同一编码/解码归一化后逐像素比较结果，避免不同PNG编码器或Canvas半透明量化造成虚假通过或误报。检查签名包含原图、两份结果摘要与完整参数。

`layered-creator.tsx`在creator.html?create_art=layers提供载入既有平台样本/上传、参数、处理、历史恢复、PNG导出和地图链接；SpriteCreator提供入口。`layered-map-trial.tsx`接入现有OriginalScenePreview，在北岬与河谷加载两层真实spritesheet，实际walkable叠加机座并保留原碰撞。机械记录在北岬观察停止、完整一转、前后抵达且逻辑/画面一致、真实walkTo阻挡；转场、暂停或重新运行后完整一转的观察时长重新累计。最后确认重新验证候选签名与revision才写review。本地草稿不创建Story Session，不进入设备云发布合同，未声称平台账户恢复或分层设备线上准入。

`_qa/layered-device.test.ts`重现两份正式PNG、检查源像素未改动、状态纹理与原游戏一致、无效参数/错误遮罩拒绝、失败保留、历史检查及过期写入。`_qa/layered-creator-browser.ts`用独立localhost身份执行320中文/390英文全制作流程、刷新恢复、实际角色碰撞、叶轮静止/转动像素差、机壳不变、河谷切换和改参数检查失效；测试显式点击的画面确认只属于隔离测试草稿，真实截图另行复核。QA只读renderer观察器仅由单独Vite配置注入，普通构建没有观察器。

### 2026-09-12 分层设备在线档案、发布与原作旅程

`layered-archive-contract.ts`定义三文件manifest（source/housing/rotor）、严格参数白名单、原图与结果尺寸关系、SHA和独立地图确认签名。上传源快照不含会随地图确认改变的本地revision，因此先保存、后检查、再保存不会误报原图版本冲突。每份确认绑定完整参数和三个摘要；已保存确认固定，不把再次重放排成新版本。源图、参数或图像变化必须用新候选ID。

`CreatorLayerArchive`在现有creator-art-v1所有者对象与同一个DO命名空间内增加分层档案/分块/确认/发布表，不新建故事数据库。沿用49152字节分块，三文件合计24MiB、每身份6份，支持进度查询、相同分块重放、完成校验与未完成上传清除。异步digest后再次比对事务内分块；完成记录不可覆盖/删除。`/layers/:id/review`私有保存已确认记录；`publish`同时要求已保存且完全匹配的确认与ready文件，公开固定两层PNG和运行元数据。原始上传文件仅经有身份的私有路径取回；制作页内置演示样本原本就是公开素材，不属于保密上传。

`layered-cloud.ts`与`LayeredCloudPanel`使用同一creatorCloudTransport和浏览器制作身份，处理续传、恢复、显式发布以及返回固定版本。取回时复验原始PNG、两层结果和像素重演，再保存到本地；同ID与本地内容冲突时拒绝覆盖，保留本地旧历史。发布后生产制作页显示固定版本信息，preflight另提供选用新旅程的入口。平台账户跨浏览器身份仍未实现，Pages只引导到主站，不伪造另一套API。

背景绑定v1/v2新增可选fan固定发布记录，既有v3设备与v4人物包装可组合，不给旧旅程补字段。开户只从公开发布解析器取固定版本，不能直接提供任意图像或参数；fan_release使用独立续玩/待确认键，保留原故事身份与历史目录。原作wire变为original-session-13.assets-11，旧车厢及creator主wire保持。`originalFanResources`、`originalBoundFanSheets`和权威机座占地读取同一发布记录，时间步态读取其中periodMs；剧情事实继续独立决定运行/停止。自定义发布没有外观语义注释时对白上下文appearance为空，不沿用原始机壳颜色或叶片描述。

617项回归与cloud/Worker/preflight构建通过。新增真实HTTP测试覆盖分块、确认、发布、开户、关键行动和结局丢回执，后台重启后恢复，zh排烟/en卸物两完整原作路线、旧旅程保持、匿名外人隔离与私有源图拒绝。浏览器320中文/390英文从真实PNG制作页完成地图确认、上传断线续传、发布丢回执重试、取回，再进入同一原作游戏走到隧道，实际加载公开版本两张PNG（含scene_asset摘要参数），1.6秒转速保存、排烟/卸物与刷新状态保持。截图另行复核，不将测试草稿的确认点击当作自动语义鉴定。该增量尚未部署正式主站/Pages，不代表完整游戏生产准入或AlterU平台验收完成。

### 2026-09-12 完整单人首次正式接入结果

主站与Pages现为同一76acd54，实际各52文件与本机测试构建逐项SHA一致，Pages运行34654237184成功。正式新建中文林线40版本/英文河谷37版本旅程均完成settle-basic结局，开户、行动、结局模拟丢回执恢复成功，172次合成HTTP请求、零模型请求、不读既有存档。源码与可用构建不再只包含旧车厢：主入口为原作，旧车厢显式入口保留。

620项回归、原样cloud构建和已编译Worker的320中文同行/390英文留守39行动两条完整浏览器路线、切旧车厢再回原作、入口chunk失败重载恢复通过。上述是新建本机浏览器与线上合成HTTP证据，实际AlterU原作全程尚未完成：生产来源浏览器权限仍待此前问题回复。发布详单见original-production-release-20260912.json；完整生产工作流、设备美术与账号恢复仍继续，未关闭整体目标。

### 2026-09-12 制动设备状态与旧故障防回退

`original-fixed-equipment.ts`统一固定设备版本，新增可选brakes绑定；原风机字段/旧旅程保持。`original-brake-art.ts`用一幅912×640三格RGBA定义固定托盘、裂纹/新软管，两RPG-JS事件共享脚点，只有软管帧变化；`original-equipment-art.ts`提供唯一机座，`BrakeDetail`以相同锚点显示当前图。新旅程预加载并核验真实PNG摘要；旧无绑定档不新增物体或碰撞。

`original-equipment-state.ts`把已换管/山口安装事实投影为持续物理状态。冻结原规则在清除warning后会重新接受旧裂纹检查，因此空间runtime与UI统一挡住已安装后的旧检查/更换；不改vendored源码，拒绝不写回合、消耗或资源。客户端把拒绝作为确定结果清除本次pending，不困在恢复循环。新图仍可作为只读检修点打开，隐藏空行动的在线理解开关和输入框。

原作wire升original-session-15.assets-12，旧carriage/creator wire不变；发布标识carriage-brake-state-20260912-1。`prepare-brake-parts.ts`保留原图，仅分帧去边界分隔线、背景处理与脚点对齐；第二图的四装配位是实际输出，两个下方位用于软管，不能声称严格实现原提示的两接口。320×568中文与390×844英文浏览器已复验图形状态、一次扣除、碰撞、无棋盘/分隔线残留、刷新和离站持久化。两条39行动完整浏览器路线均完成40版本结局，同行/留守、结局刷新、切换旧车厢后返回原作保持，零页面错误。625项测试、构建、27份采用资源SHA及发布审计通过。详见brake-review-20260912.json；这些是本机正式构建证据，非iPhone或AlterU实机。

`server/original-spatial-turn.ts`编排已绑定的原规则行动：保留原始resolveDomainAction、协议解析、applyParsedScene、明确encounter命令和domain danger效果，不调用无空间绑定的buildDangerDirective。章节仍使用原reducer处理显式险情，维修钥匙仍能解决合法险情；不修改冻结vendor、不重写历史、不返还旧档已扣资源。此修正来自390英文浏览器实测：检查/换管/修启动器/选河谷后车况意外从预期97变成85；通用导演在检修回合中插入险情并执行−12兜底代价，中文与英文输入哈希又使结果不同。新增双语测试覆盖正常检修精确资源、无自动插曲，以及河谷显式预警、救援消耗与解除。

本轮双部署已完成：8d765e5主站与Pages实际各53份文件和本机测试构建逐项SHA一致，Pages运行34656888493成功。线上新建中文42版本/英文39版本旅程均完成settle-basic结局，180次合成HTTP请求、零模型调用，换管及开场资源精确、开户/行动/结局丢回执恢复通过。没有读取真实玩家存档。此结果不代替真实iPhone/AlterU全程验收；整体目标保持推进。

### 2026-09-12 正式制作页发布后游玩入口

背景、人物/设备、分层设备三个在线面板统一调用originalEntry(mode, hostname, ?story=original)判断是否可进入原作；不再只允许cloud-preflight。四种固定发布ID通过既有query交给原Session开户/续玩，不新建客户端权威，不替换当前或其他版本的旅程。Pages仍返回主站制作入口，本地未发布模式仍可查看文件。原作/creator协议与数据库均不变，本轮发布标识carriage-creator-play-20260912-1。

17项针对性回归通过；四类publication HTTP fixture改为真实生产准入，保留必要的合成媒体下载适配，没有使用总是放行函数。原样cloud+编译Worker在320中文/390英文完成保留平台风机原图→透明分层→真实地图5项检查→显式确认→保存→发布丢回执重试→链接进入→隧道排烟/卸物→刷新→原旅程→同版本续玩的全过程。使用普通生产renderer，无QA观察器，零外部连接；这不是新生图或正式来源浏览器实测。详见creator-play-review-20260912.json。

制作入口修复已正式双部署b472da3：主站与Pages各53份实际文件逐项SHA匹配，Pages34660472435构建/测试/部署成功，UUID入口与Remix检查通过。未新增线上模型/媒体请求，未读取生产玩家资料或存档；完整平台验收仍待此前浏览器来源权限。

### 2026-09-12 已发布素材组合

creator.html?create_art=assembly提供四槽组合，沿用原制作页样式和当前制作capability。creator-assembly.ts并行读取背景/图集/分层档案，仅收集已公开发布的固定版本；任一类失败使整次刷新失败，不把不完整目录作为可玩组合。selection仅保存到UUID隔离的creator-assembly-1；进入链接按固定顺序生成四种release参数。原originalSessionHttp已经按四槽组合隔离续玩/待确认键，服务仍解析公开版本并使用生产表现准入，不新增存档模型或第二套结算。

GET /api/creator/drafts/:id/release补上背景的私有发布查询，与人物、设备、风机一致：先确认该owner的草稿存在，未发布返回null，其他身份不可查。只读新增，不改creator/original wire或数据库schema。本轮发布标识carriage-assembly-20260912-1。三类现有在线素材面板均链接到组合页；Pages不读取在线目录。

626回归通过；新增实际HTTP测试覆盖四槽同时采用、完整元数据、错误槽位、目录失败、身份隔离、丢开户回执、查询参数顺序无关、改选新旅程与默认/原组合保留。320中文/390英文普通正式构建实际选取四槽、刷新、目录网络失败、缺失版本、五文件加载、启动器维修、默认旅程返回与同组合续玩通过，无横向溢出和页面错误。角色使用合成诊断图，仅验证机制，其他样本为保留平台资源；不声称新美术或平台实机通过。详见assembly-review-20260912.json。

组合页已正式双部署8c4ebb1：主站与Pages各53文件逐项SHA匹配，Pages34661607417构建/626回归/部署成功。线上使用全新合成制作身份完成6次请求，确认当前release、空私有目录和未知草稿拒绝，没有读取既有身份或调用模型/媒体；真实平台内完整验收仍待此前浏览器来源权限。

### 2026-09-12 原作画页候选决定与回退

`OriginalIllustrations`在现有原作DO里保存独立媒体行，不写StorySave、资源或场景绑定。生成成功进入candidate；`POST /sessions/:id/illustrations/:scene/decision`校验scene/attempt/sha256/keep-or-discard，在事务中保存首个决定。同意保留后active，不保留后discarded；相同决定重试返回回执，相反决定拒绝。响应始终读取当前候选列表，旧尝试的迟到回执不能把UI换回旧图。开发旧active记录无匹配keep回执时只读投影为candidate，不伪造历史决定。

末次重试先把旧请求、plan、任务和PNG分块归档到`original_illustration_attempts`与`original_illustration_attempt_parts`，再新建requestId。离开原地点后仍可使用当前head版本申请重试，plan完整复用首次场景/素材/配方快照；首次申请仍要求当前地点。历史及原图经原capability的`attempts`与`attempts/:n/file`读取，私有且no-store，摘要逐次核验。普通file路径隐藏discarded图；两次额度与原每日18次上限不变，重连不新增意向。

原作日志画页面板显式显示候选、已保留和不保留状态。PNG摘要、尺寸和原生解码通过后才能保留，无法读取仍可不保留；不保留提供返回文字记录。决定回执丢失后重新读取服务端记录，关闭/刷新不自动决定。异步文件绑定scene/SHA/state，旧文件不能覆盖换场景或已放弃状态。生产开关`ORIGINAL_ILLUSTRATION_RELEASED`仍为false；保留只是个人回忆选择，不是自动美术验收，不改变正式地图和基准人物。


### 2026-09-12 按实测能力开放制作配方

`SPRITE_RECIPES`仍保留全部历史配方，`spriteGenerationRequest`输出不变，供来源核验、任务恢复和原图导入。新增`spriteRecipeAvailable`只控制新意向，`planSpriteGeneration`拒绝当前未通过的ada-walk-v1，默认starter-broken-v1。已有prepared/generating/retryable-failed记录继续原ID/任务，完成或终止后选择器回到可用配方，不删除旧记录、图片或检查；不以更改配方解决旧任务。UI禁选与意向函数共同阻止新建，已有素材组合入口继续提供默认人物。此为当前产品能力选择，并非公共媒体服务的访问控制。

本轮一次hero-side-pairs-01定点公共媒体请求在53778ms后返回PROVIDER_REJECTED/retryable=false，没有taskId或PNG，未重发；原主角及平台站姿资源未改。正式发布标识carriage-art-availability-20260912-1；旧车厢、原作、creator wire不变，画页生产开关继续关闭。


配方能力更新已正式双部署bc0d378：主站/Pages各53份实际文件与本机一致，Pages34666270937成功。第一次CI因两项测试写死macOS临时目录失败，修复为系统tmpdir后Linux完整流程通过，未跳过测试。640项本机全套通过；11项持久化在/tmp复验通过。原作线上新建1个合成旅程、7次请求确认原作运行/画页门关闭/读取不改故事，无模型或媒体调用。最终修复提交仅改变测试目录，运行字节保持并在两站再次核对。详见art-availability-release-20260912.json；未宣称侧向步态、画页质量或完整AlterU实机验收通过。


### 2026-09-12 原作主角素材版本绑定

`original-hero-release.ts`登记首次正式B主角的固定ID、PNG摘要/尺寸、四向裁切/脚点/比例和有限可见外观，每次读取返回独立对象。新建背景绑定（含各发布素材组合）保存hero字段，旧未写字段的旅程只读回退到该固定版本，不写回或升级。未知版本拒绝；原作wire升16/assets13，StorySave v8与旧车厢wire保持。

原作从`originalHeroSheet`构造已验证blob的动作表，不再使用由URL决定的全局heroSheet。共享`actorSheet`提为无浏览器全局依赖的纯函数，旧车厢继续通过原sprite-config导出使用。`prepareHero`在RPG-JS启动前进行30秒有界下载、SHA/尺寸/原生解码与Pixi纹理核验，异常不创建替身或提交动作；同旅程若版本变化拒绝复用旧纹理，卸载时释放blob。构建资源检查也从同一版本记录取主角元数据。

`originalVisualContext`新增独立protagonist说明及固定版本/摘要；生成和复查提示明确主角与NPC外观不可互换。此处只向模型提供已知外观，不新增玩家姓名、头像或其他个人资料，不等于通用语义保证。生产后续仍须保留该版本原文件，不能原路径覆盖。当前只有这个已认可版本；任意创作者主角发布、头像转换和侧向步态量产仍未完成。

本轮已双部署b5bbc4a，Pages34667494139成功，主站与镜像各54份实际文件与本机构建SHA一致。643项回归及最终提示词3项复验通过；本地320中文/390英文各39次行动完成结局，另验证损坏主角PNG拒绝、原旅程恢复和比较参数无法替换绑定。正式主站以两个全新合成旅程完成180次请求，验证两条路线与开户/行动/结局丢回执恢复，无模型调用。临时测试服务已关闭。详见original-hero-binding-review-20260912.json及original-hero-binding-release-20260912.json。

### 2026-09-12 正式版本变化恢复

原作页面将RUNTIME_VERSION_MISMATCH与一般连接失败分开处理：首次握手、行动/结局回执、旅程目录与切换、自动位置保存遇到版本不匹配时进入同一恢复提示。按钮重新加载整个文档以取得新客户端，保留原UUID隔离身份和待确认请求；不清理存档或新建替代旅程。自动位置保存读取当前错误引用，错误提示期间不继续每2秒发请求。普通网络错误仍按原恢复方式处理，未修改服务协议、reducer或旧车厢。此改动可供本版本之后的更新恢复使用，不能自动修改已经缓存的更早客户端。

已双部署3c585a5，Pages34668249777成功；主站/镜像各54份实际资源SHA匹配。643回归通过，320中文/390英文五类版本变化故障分别完成文档重载与同旅程恢复，已提交行动重放同一ID且后果只结算一次。正式主站1个新建合成旅程、7次请求通过，零模型/媒体调用；本地测试服务已关闭。独立河谷背景测试一次返回PROVIDER_REJECTED/retryable=false，没有任务或PNG，未重发，原背景保持。

### 2026-09-12 原作完整旅程备份与结局续玩

`inspectOriginalDirectory`原来要求cursor等于version，错误拒绝完成结局后的目录。现在允许严格非负整数游标与版本相等，或结局产生的单个版本差；不篡改服务保存的真实游标。

`server/original-backup.ts`按owner和旅程ID在同一事务快照中导出原作v8、不可变素材绑定、行动日志、普通/结局回执、准备行动及该owner配额；同时保存当前和历史画页任务/分块。只使用固定表/列清单，跨旅程和跨owner数据不进入导出。原表可没有媒体表，此时其部分为空。UTF-8原始大小预检、10000行限制及最终16MiB规范化JSON校验限制导出；超限明确失败，不截断历史。SHA256只检测损坏，不构成签名或可信导入授权。

原作`GET /sessions/:id/backup`经现有capability和版本边界读取，响应private/no-store；没有POST恢复接口。游戏旅程列表可准备并下载备份，包含剧情/自由输入，系统不导出capability。下载链接对应完成准备时的版本，释放旧blob；有待确认操作时先恢复。

`scripts/restore-original-backup.ts`仅用于可信操作者离线演练：校验原作cartridge/schema、完整回执/游标/版本和owner边界，以0600权限独占创建目标SQLite，拒绝已有路径和非空表。插入全部行处于单个事务，失败回滚。它不是平台账号找回、浏览器上传导入或生产数据库迁移流程；不自动应用到在线Worker。

本轮已双部署c934955，Pages34669500976成功；主站与镜像各54份实际文件SHA匹配。651回归通过，本机中英完整39行动到结局、下载校验、新开旅程再续旧结局通过；最终下载样式与503重试分别在320/390复验，链接44px。正式主站182请求、两个新合成旅程完成结局并校验完整备份，无模型/媒体调用，无真实存档读取或恢复。所有本轮临时服务已关闭；详情见original-backup-review-20260912.json与original-backup-release-20260912.json。


2026-09-12 外观未知细节：真实game-chat共16请求发现两次复查漏检：虚构小灯带子固定，以及将画面右侧改成人物右侧。当前绑定的阿达基准新增unestablishedDetails，明确灯固定方式和身体侧别未核验；针对相关提问走保守作者回答、source=author/guard=unestablished-visual-detail，不消耗模型配额。已知英中文身体侧别断言在模型复查前拒绝；正常衣色问题保留生成/复查链。替换人物图集不继承基准未知细节或固定回答。原v8存档、动作、资源和人物关系不变；两种语言回执/重开恢复已测。最终身体侧别守卫仅用保留的真实失败做本地回归，未第三次外发；不宣称任意自然语言均已一致。

外观未知细节修复正式发布f0b1da9：655全套测试，320中文/390英文实际编译生产页面交谈与刷新通过；主站/Pages各54份文件SHA相同，Pages34670710099成功。线上13请求、新建中英两合成旅程验证source=author、同ID回执、存档与素材保持、模型配额行为空；无模型/媒体新调用。完整AlterU验收和账号恢复缺口仍保留。


2026-09-12 弃车结局承诺修复：originalEndingCartridge只在bridge-train-fate=anchored时将rescue-network的长期义务转换为维护步行通道、预留人员/物资/剩余燃料；资格、其他能力与行驶路线不变，不修改冻结vendor。结局代价集合与已选方案完全相等，拒绝额外义务。枢纽UI只读重新投射当前choices，避免旧未选择菜单继续显示错误车厢代价；不改历史正文和已完成结局。原作wire17强制旧前端重载，存档schema8与assets13不变。

弃车结局修复d9962ed已正式双部署，Pages34672060673成功；两站各54份文件一致。线上40请求、新建一份英文合成旅程，32作者行动+结局到v33，选择时与结局均使用步行通道义务；强取代价、回执重放、重读与资产保持，配额行为空。未读取真实玩家，未新增模型/媒体调用。


### 玩家主角的不可变发布（2026-09-12）
`actor-publication.ts` 共享图集结构校验，但 `PublishedHero.slot=protagonist` 与 `PublishedActor.slot=ada-mechanic` 分别严格检查。`CreatorSpriteArchive` 使用独立的 `creator_hero_releases` 表；`/sprites/:id/publish-hero` 必须引用已归档最新合格图集/地图检查，回执丢失可重试同一发布，后续检查不能覆盖已发布版本。原图接口继续要求制作身份，公开 `/hero-releases/:id/file` 只提供不可变结果 PNG。
`originalEnrollmentAssets` 将可选 `protagonist` 元数据复制进原有背景绑定层，与 v3 启动器、v4 阿达及通风机组合；未带字段的存档仍使用原 B 主角，不迁移或重写。`originalBoundHero` 统一提供 renderer 和模型上下文所需版本；自定义图集在入场前核验 SHA、尺寸、alpha、脚点与全部主体边界，外形描述设为 not-described。
`hero_release` 追加到原有组合续玩 key，空值保持历史 key。组合页兼容旧四槽选择，并增加玩家主角槽。原作线协议更新至 original-session-18.assets-14；制作档案既有版本保持不变。主体资源仍来自同一游戏 UUID、同一权威旅程，未新增账号认证或另一套后台。


### 腿部重复风险提示（2026-09-12）
`actor-stride-comparison.ts` 只读比较每方向第1/3帧：alpha>200定位主体，取主体下方36%，容许最多2源像素的平移差，计算不透明区域交并比及 RGB 差异。交并比≥0.90且归一化差异≤0.15仅提示重复风险，透明区RGB不参与。阈值在当前基准/平台候选观察上校准，不能证明解剖腿身份，也不拒绝或通过存档。
制作检查展开时解码一次候选，切换方向复用结果；关闭或候选变更使旧异步结果失效。只读CSS裁切并排放大腿部，不改PNG、历史检查或地图准入。未比较/读取失败保持人工检查，不默认为成功。


### 完整分支抽样复验（2026-09-12）
`node --import tsx scripts/check-original-branches.ts` 使用固定种子 1–120，从真实原作 initial 状态开始，仅选择 `originalGameEntities` 当前实际提供的动作，每条最多 90 步。每步以同一前置状态分别调用按钮和原样文字输入，比较资源、事实、库存、同行、关系、角色、地图、危险与结局字段；随后真正执行结局策略。禁用模型配额入口，不注入资源、不读生产存档。
本轮 120 条均完成，合计 5,073 次选定行动、82 个行动 ID、全部 10 种结局；三起始路线分别 49/22/49 条，主桥/钥匙/弃车分别 78/38/4 条。失败会保存可复现种子和完整动作路径并以非零状态退出。它是有界抽样与输入一致性证据，不是穷尽可达状态、SQLite 持久性、真实寻路或 AlterU 平台试玩证明。完整结果见 `original-branch-exploration-review-20260912.json`。


### 手机视图与渐进背景（2026-09-12）

- `movement-joystick.tsx` 为完整版补充单指捕获摇杆；失焦、取消、面板和点击路线会释放旧输入。两种方式共用 RPG-JS runtime 与距离驱动步态。
- `original-game.css` 的手机地图宽度从 520 改为 650，短横屏保留 520；`camera()` 按同一父容器比例跟随脚点，命中坐标继续反算地图矩形。公开 DOM 的脚点与就绪 data 属性用于测试，不包含旅程凭据。
- `progressive-scene-readiness.ts` 仅用于完整版，将地图硬门槛与背景软门槛分离：地图字节及 SHA 仍先验证，背景随后独立校验、解码。背景失败不取消已经提交的状态；重试只重试同一不可变图片。旧车厢的 `SceneReadiness` 保持原合同。
- `original-scene-silhouette.tsx` 读取当前旅程绑定的环境碰撞布局和设备 footprint，作为背景等待期的暗色通路。人物和设备仍须通过原有准入后才启用移动，未制作地图仍拒绝进入。
- `journey-loading.tsx` 为首次准备与行动等待提供阶段提示；入口 HTML 在 bundle 下载前已有深色提示。背景渐显 450ms，减少动态效果时取消。画页生成使用独立状态并可返回记录；质量未通过的画页生产功能仍未开启。
- 用户确认加号与编号属于临时交互占位，当前无需改造标记；后续由具象物件素材承载交互。
- 验证：6 项渐进加载单测通过；完整测试 673/673、生产构建通过。390×844 与 320×568 已通过原生浏览器窗口观察到近景与控件布局。本机故障注入已验证背景首次 503 时可进入暗色布局、点击走到燃料棚并打开行动面板；重试景物后背景恢复且脚点保持。原生拖动确认指针捕获；补充 390/320 合成持续输入，经真实 React handlers 与 RPG-JS 验证连续移动、松手停止、点击路线接管、面板/失焦停止，568×320 横屏构图已复验。合成指针仅替代 OS capture lookup，不等于 iPhone 实机体验。记录见 `mobile-presence-review-20260912.json`，同提交双部署待下述发布记录确认。

本轮已正式双部署 `d22a87953958a7b85424f5c03a950e5b32ac5142`，发布标识 `original-mobile-presence-20260912-1`。Pages 运行 `34678867131` 的 673 项测试及构建成功；两站各 58 份实际文件与本机构建逐项 SHA 一致，本次明确包含 CSS，覆盖镜头与控件样式。主站 health 返回相同 release。发布未改变存档协议、未读取既有玩家数据、未调用模型或媒体；Pages 仍仅为静态镜像。详细记录见 `original-mobile-presence-release-20260912.json`，本地 QA 原证据保留其原始 scope，不改写为真实 iPhone 或登录 AlterU 验收。

### 林澈获救后的当前人物说明（2026-09-12）
真实 320×568 地图试玩发现 `pine-meet` 仅提交人物 ID/名字，reducer 因而继承冻结 Cartridge 的登场前“失联”说明，人物已站在场景中仍显示为失联。首次介绍现在通过同一 `character_update` 提交基于本回合可见救援的说明，保持原人物 ID、角色技能与关系规则。
`original-character-detail.ts` 为旧快照与历史回执提供只读投射：仅 `lin-scout`、已存在 `pine-met=true` 且 detail 精确匹配两条冻结旧说明时更新当前展示。地图交谈面板、人物列表与服务端交谈上下文共用此函数；自定义说明、其他人物、未获救状态均不覆盖。不升级存档 schema、不重写历史正文或动作回执，也不补造同行决定。
675 项完整回归通过，含中英实际作者路线新介绍、SQLite 重开，以及精确旧描述/回执复现；两个新测试同时确认原始数据库记录、资源、历史与同行不变。生产构建与 27 个场景资源 SHA 检查通过；发布与修复后浏览器实证另记，不把此段自动测试当作完整九场景或 AlterU 验收。

修复后的编译 Worker + 正式前端已实际从新旅程通过6个行动到林澈线路核对：320/390人物列表和地图交谈说明一致，获救后刷新、文字输入核对线路后再次刷新均保持，信任只+1、资源64/75/56不重复扣减。原图/镜头与碰撞未变。记录见 `original-character-detail-review-20260912.json`；完整九场景镜头复验在发现问题后中途修复，仍需继续后半程，不计作本轮已经通关。


### 2026-09-12 旅途画页曝光配方 v3

`originalIllustrationPlan` 的新意向改用 v3：匹配参考曝光、中间调和局部对比；已知北岬夜景使用已实测通过的 exposure-03 完整提示词，其余场景保留参考时段与天气，不强加夜色。旧 v1/v2 JSON 计划仍原样恢复；再次生成沿用原计划，仅产生新的请求 ID。数据库重开和放弃后重试的兼容测试覆盖 v2，既有 v1 恢复测试保持。

单个合格夜景样本不能证明其他场景或任意自定义背景已通过质量检查，`ORIGINAL_ILLUSTRATION_RELEASED` 仍为 false。主地图、角色、剧情和资源没有改变；当前正式部署仍为 64b5c37。新增 `--exposure-illustration-fixture` 仅用于本机测试服务回放原 PNG，不增加生产 query 或外部请求。

### 画页原图对照数据合同（2026-09-12）

画页列表及尝试历史新增可选 `reference: {url, sha256}`，由该任务已保存的 plan 提供，不能从当前场景或最新素材版本重新推导。旧服务未返回此字段时仍可读取记录。客户端拒绝非 HTTPS、带凭据、query/hash 或非法摘要的参考信息。任务 requestId、媒体 taskId、lease 与完整提示词仍不对外返回。

本轮完成数据合同和回归检查：13 个画页测试通过、TypeScript 检查通过，包括 v2 任务磁盘恢复及丢弃重试保留原始参考。原图加载、摘要校验、对照界面及手机视觉验收仍待实现；正式画页开关仍关闭，未发布本轮改动。

### 原场景对照界面（2026-09-12）

画页候选及已保留记录可展开生成时的原场景，原图按需下载，省略凭据和 Referer，20 秒超时、8 MiB 流式上限，SHA-256 与持久任务记录一致且图片解码成功后才显示。收起或离开面板中止下载并释放 blob URL；错误提供重读入口。旧记录没有 reference 时不显示此入口。

构建及13项画页回归通过。本地5380为编译产物+编译Worker+新合成旅程，使用已保留 exposure-03 图片夹具，没有模型/媒体新请求；浏览器从固定公开地址读取真实原图并成功校验，390×844与320×568外部访客布局检查、展开/收起/返回旅程通过，资源仍68/82/58。证据位于 `_qa/ui/journal-reference-20260912/`。本轮并非平台内验收；读取失败/摘要错误故障注入及平台布局复验仍待补齐。正式画页门禁仍关闭，未部署。

### 原图下载故障检查（2026-09-12）

原图流读取与SHA校验抽为 `original-reference-download.ts`，UI使用同一函数。下载流异常/超限/取消时主动取消并释放reader，完成摘要计算后再次检查取消状态；解码失败立即回收blob URL。

6项新增故障/恢复测试加13项画页合同测试全部通过，TypeScript通过。覆盖内容变更、503/空响应、断网后重试、无Content-Length的8MiB超限取消、读取前与读取中退出、部分响应断流，以及省略凭据/Referer。测试模拟fetch响应，不访问外部服务，也不代表浏览器故障提示或平台内全程验收已完成。

### 原图摘要错误的真实界面复验（2026-09-12）

测试服务新增仅本地 `--mismatched-reference-fixture`，只替换画页列表响应的参考摘要，不改SQLite、图片、主剧情或生产handler。`--platform-layout`仅在QA HTML响应隐藏外部访客栏。编译前端+Worker在5382通过320/390真实按钮路径：展示候选→展开→摘要错误提示→重新读取仍拒绝→关闭→实际走到启动机→检修保存，车况82到87，燃料68及人心58不变。无新媒体请求。证据与限制见 `original-reference-fault-review-20260912.json`；正式画页开关未开，未发布。

### 正式站自然语言行动复验（2026-09-12）

通过原作正式客户端/HTTP传输创建全新匿名合成旅程，正式health报告liveModelAvailable与liveDialogueAvailable为true。一句“我现在和阿达一起修好启动机。”以live free-input提交，返回interpretation.actionId=repair-starter，版本0→1，资源68/87/58；重建客户端连接后enroll恢复的完整head与提交结果deepEqual。无真实玩家/账号数据读取，无媒体请求。临时续玩能力保存在仓库外0600文件，公开报告不含能力令牌。证据 `original-live-action-review-20260912.json`；这一条不等于完整模型路线或已登录AlterU验证。

### 正式站完整河谷路线与自然语言穿插（2026-09-12）

延续前述新建合成旅程，通过正式客户端走完36个行动及结局，恢复后完整head一致，事件数36。初始启动机、隧道通风机检视、近岸桥台/水位检视采用live自然语言，其余使用作者行动。保留一次未提交的桥梁试句：桥面/承重结构不等同当前近岸桥台/水位，读回仍版本30、资源52/87/92；修正试句后完成检视。最初验收脚本未保存该次rejectionCode，不能据此声称具体拒绝码或模型理由；之后脚本已补记拒绝字段。

完整结果 `original-live-valley-review-20260912.json`。该证据验证正式后台持续故事及恢复，不代表同路线真实renderer、物理iPhone或已登录AlterU完成；不改变正式美术与画页开关。

### 洪水桥转场的旧图片建议修正（2026-09-12）

正式河谷合成测试发现：底层八地区地图使用dawn-junction同时表示桥边和枢纽内部，旧电影式director在town-depart附加的new-location图片错误描绘枢纽。`originalPlaceBlocks`现在只过滤同回合、精确枢纽标题、source=director/reason=new-location/status=queued、无URL或视频任务的自动图片建议。新town-depart保存时采用该过滤；旧档仅在既有显示投射处处理，原始历史和回执不迁移。完成图片、生成中、自定义来源及其他回合保持。`playerVisible`表示图片中的主角是否出镜，不能用它推断UI可见性；本修正不依赖该字段。

55项定向测试通过（含中英三路线/各选择的实际转场，以及不变历史与已完成媒体保留）；全套685测试通过，构建、9场景27资源SHA、Worker启动通过。未改地图/角色像素或B镜头，未发起媒体请求。本轮代码尚未双部署，生产画页开关仍关闭。

### 原图一致性修正双部署（2026-09-12）

acf2510 / original-reference-grounding-20260912-1 已发布原UUID正式主站与Pages，Pages运行34686525847成功。两站各58份真实HTML/JS/CSS/地图/美术/许可证文件与同一本地构建SHA一致，页面/API/源码ZIP检查通过。此前正式河谷合成旅程发布后保持版本37、资源和完整结局不变。画页开关仍false；已登录AlterU、可信账号恢复和全部平台素材质量仍未完成。详细证据见 `original-reference-grounding-release-20260912.json`。

### 侧面补帧说明的相位纠正（2026-09-12）

hero-left-single-03仅裁出平台人物左侧站姿作为参考并生成一次320×320单帧。输出仍近侧手臂向屏幕左方前摆，与已有侧面外帧同相位；回查hero-side-contact-02请求也明确要求近侧手臂前摆，所以不能把这一重复单纯归因于模型不听指令。缺失相位应先要求近侧手臂后摆到屏幕右方，再用腿遮挡关系与交替播放核对对应落脚，不能仅从两只鞋端点推断前后腿。该候选头位/整体比例也漂移，未准入。原始图、固定请求、任务和裁片来源均保存；本批一次已结束，正式美术不变。

### 修正相位后的单帧结果（2026-09-12）

hero-left-opposite-04使用同一平台站姿裁片，一次edit要求近侧手臂后摆、近侧腿前伸。结果姿态与旧帧不同，但后摆臂读作远侧，近侧臂仍向下/前；头顶约y47偏离参考y80，不能作为替换帧。已记录为未准入，未更换基准、未合成正式图集。后续质量判断需同时看成对肢体遮挡、反向摆臂及头脚锚点，不能以像素差异代替解剖动作验证。

### 无损单帧拼接验证（2026-09-12）

`sprite-composition.ts`新增replaceActorFrame，仅接受3×4已处理图集和同尺寸单帧；复制指定格，不推断缩放、镜像或重绘。`scripts/check-actor-frame-replacement.ts`实际用平台hero-reproduce-01和hero-left-opposite-04，经已有去底/脚点处理后替换左侧第3帧，其他11格字节差异为0。两项测试覆盖12个格位及尺寸/索引错误，TypeScript通过。

候选源框高度236，原帧215，脚点对齐后仍有头部跳变；合成图已检查且保持未准入。此为制作流程的受控处理基础，尚未接入制作页持久化或连续播放；不能把拼接成功当作步态、角度、缩放通过。详情 `actor-frame-replacement-review-20260912.json`。

### 单帧替换草稿与归档（2026-09-12）

newActorFrameSource把原图集与单帧组成新的source草稿，记录parentId及actorPatch（版本、行列、两份原PNG和名称），不复制旧审核或整体生图来源。处理与恢复调用verifySpriteComposition重建指定格，摘要有效但拼接像素/格位不一致仍拒绝。归档沿用现有4文件角色source/candidate/input-0/input-1及24MiB上限，增加受限actorPatch字段，不影响旧repair composition。

13项相关测试通过：12格位底层替换另有既有测试；本轮覆盖IndexedDB重开、归档序列化往返、真实平台两PNG通过现有SQL归档后重开、异主读取拒绝、格位篡改拒绝，以及旧设备归档/HTTP丢包恢复兼容。首次HTTP测试因沙箱监听EPERM未运行，启用本机监听后重跑全部通过。TypeScript通过。制作页入口/连续播放尚未接入，不宣称完整补帧流程或素材已准入；正式站保持acf2510。

### 制作页单帧替换入口（2026-09-12）

`actor-frame-patch-panel.tsx` 在人物原图下提供方向、列和单帧PNG选择；`sprite-creator.tsx` 在现有浏览器锁内验证8MiB上限、解码并调用newActorFrameSource，以当前草稿id/revision执行CAS保存。错误尺寸不生成记录；成功另存原图，随后使用现有去背景、脚点对齐及ActorGaitPreview。替换后的图集类型锁定为人物，所有审核重新填写。文件选择在另存前只存在内存，刷新后的已保存替换来源从actorPatch恢复。

已通过真实制作页导入hero-reproduce-01、替换左向第三帧、刷新恢复、处理、步态播放/暂停/站立和错误尺寸拒绝。使用hero-left-opposite-04仅验证流程；该单帧比例仍不合格，未发布或替换正式人物。320×568和390×844控件检查通过；当前工作尚未部署。

### 制作接口版本与持久记录分离（2026-09-12）

单帧来源扩展使旧制作页不能解析新归档清单，因此制作接口握手升级为`creator-runtime-2`，继续使用`X-Creator-Runtime`。背景持久记录仍为`creator-background-1`，由独立`CREATOR_BACKGROUND_RECORD_VERSION`约束；已有creator owner命名空间、浏览器能力身份和Story Session存档均未变更。旧接口请求在访问归档对象前返回409，客户端版本不匹配提示刷新；公开素材GET仍由服务器转发当前版本，不要求旧游戏画面携带新头。

单帧入口版本54829a6的完整回归689项通过；接口升级后creator-cloud/sprite-cloud共12项通过，覆盖旧接口拒绝、背景原图恢复、人物与设备归档和新单帧来源恢复。接口升级后的完整回归同样689项通过，构建、Worker启动及9场景27资源哈希验证通过。接口升级仍待随前后端同提交正式部署。

### 单帧制作流程正式发布（2026-09-12）

539774a已部署到原UUID主站和Pages静态镜像；两站各58份实际文件与同一本地构建逐一SHA相同，Pages任务34688585823成功。制作后台health确认creator-runtime-2，公开源码ZIP与主站API验证通过。已创建的合成河谷旅程恢复为原version37，结局及资源不变；插画开关保持关闭，未准入人物素材未进入游戏。完整登录态AlterU验收仍未完成，不能由这次部署与恢复检查替代。证据：actor-patch-release-20260912.json。

### 游玩画页按参考版本准入（2026-09-12）

`original-illustration-admission.ts` 为新画页请求提供共享许可：仅平台北岬8fc11a96和隧道b084000a两个已有v3实测样本的参考版本符合条件，绑定完整SHA与scene。不能因同场景换了背景或存在任意参考就开放生成；基线北岬、自定义发布背景、洪水桥和其他未实测版本暂不符合条件。此许可仅允许请求候选，不自动批准输出。服务在新任务计次和写入前拒绝不符场景；界面使用同一许可隐藏无效创建入口。已有不可变任务的恢复、保留决定与跨场景重试合同保持不变。

14项插画专项测试通过，包括7个未准入场景请求不写入、不扣次数、不改变故事，合格参考可创建；旧配方、任务恢复、隔离和决定测试仍通过。全局正式开关继续false，尚未把此能力宣称为完整游玩期生产验证。下一步需通过真实部署任务完成生成、取回、保留、离开再恢复，再考虑开放限定场景。

### 真实媒体生产组件与故事并行实测（2026-09-12）

`journal-live-chain-01`使用生产OriginalTrainAuthority、OriginalIllustrations及originalIllustrationProducer，新的本机SQLite合成旅程，实际调用平台公共媒体接口一次。请求先入库，再于生成期间完成repair-starter与commit-valley-route；真实结果以原北岬scene存储，而故事已在河谷version2（fuel62/condition87/morale58）。数据库关闭重开后原始PNG完全一致，旧请求恢复返回同一意图且总次数1。人工查看原参考与结果后保留为非关键回忆样本，决定在再次重开后仍为active；重复相同决定幂等，故事未变。

任务mt_f92320f351ad85a072508e8db34be3d6，PNG SHA e99f176df19aabc3f686c7efbdfb2d6e6c5374f748a94286fa5557790d4ef0db。结果雨线/青色反光较强，原结构可辨，未替换地图。此实证是本机生产组件调用真实平台媒体，不是部署Worker或AlterU宿主内操作；浏览器呈现和正式后台链路仍需验证。全局开关未改。请求、任务、候选和恢复结果见doc/platform-art-candidates/20260912/journal-live-chain-01/。

### 限定画页开放与立即反馈候选（2026-09-12）

开发版本将全局画页入口打开，仍由参考版本准入控制新请求，仅北岬平台参考和隧道参考可新建。生成按钮按下立即设置generating，不等待HTTP返回才显示JourneyLoading；“继续旅程”使用独立onContinue直接关闭面板回地图，保留onReadJournal用于明确阅读操作。390等待画面、候选保留刷新恢复，以及320直接回图/摇杆恢复已用冻结前端和Worker的15秒固定候选测试复验，未新增媒体调用。

最终690项完整回归通过，构建、资源哈希、源码UI扫描及凭据扫描通过。线上仍为539774a、画页关闭；本改动尚未部署。待核查走向物件时打开记录被抵达面板覆盖的时序边界，再进行正式运行验证。详见illustration-open-ui-review-20260912.json。


### 原作键盘附近交互（2026-09-12）

`original-game.tsx` 的 E 键入口从当前权威 head 的 `originalGameEntities` 投影选择交互距离内最近目标，复用地图点击的接近/面板流程，不提交行动。`nearby-interaction.ts` 保持等距目标顺序稳定，排除重复键、组合输入、浏览器修饰键及已消费事件；文字编辑、打开面板、加载/请求或错误期间不触发。两项单元测试和类型检查通过；真实浏览器键盘操作仍待复验，未发布。


### 正式画页分阶段错误（2026-09-12）

真实主站两次恢复同一画页任务均返回 `ILLUSTRATION_UNAVAILABLE`，剧情仍可修理并恢复。`original-illustration.ts` 新增有限错误码，区分媒体连接、任务 JSON 响应、非预期服务 HTTP 状态、素材下载连接/HTTP/流中断；仅记录阶段与三位状态码，不公开异常文本、URL 或凭据。原请求、任务租约、尝试限额及故事状态不变。16 项相关回归及类型检查通过；该诊断尚需正式运行才能判断实际根因。

### 2026-09-12 服务端图片下载兼容性

正式诊断将原画页任务失败定位为 `ILLUSTRATION_ASSET_NETWORK`；任务与剧情版本未变。三个服务端图片下载入口移除 workerd 不支持的 `credentials` RequestInit 字段。服务端不持有浏览器 cookie jar，也不转发调用者请求头；继续保留 HTTPS/域名准入及 `redirect: error`。相关 27 项测试通过，正式环境恢复原任务的因果验证仍待执行。参见 `media-download-compatibility-20260912.json`。

线上恢复表明仅移除 credentials 未解决下载失败。主游戏画页改用 manual 重定向模式并拒绝所有非 2xx 响应：仍不跟随 Location，但能区分重定向与网络异常。新增测试检查 302 只执行原地址请求，不访问目标地址。

### 正式画页闭环实测

4bfad43 发布后原失败任务恢复为 candidate；attempt 仍为 1，剧情版本/完整状态不变。实际读取 PNG 与服务端 SHA 一致，合成测试旅程保留画页后以新客户端重读，active/kept 状态与原图片字节保持一致。图像可作为非关键旅途插画，雨线与青色更强，不作为地图替换。证据见 `platform-art-candidates/20260912/live-retained-journal/review.json`。未观察到成功请求的 3xx，不能将先前失败确认为 CDN 重定向；完整 AlterU 平台内验收仍未完成。

### 活跃地图视口

相机适配器从当前 canvas stage 查找 viewport，与固定 RPG-JS 版本的查找方式一致，不再跨地图持有 viewport 缓存。场景树已脱离但未销毁的旧 viewport 会使新地图偏移漏清；新增回归先复现再修复。此缺陷已获单元实证，但尚不能认定它就是 Telegram 平台角色缺失的原因，仍需实际平台复验。

### 当前画面诊断增量（2026-09-12）
`src/render-diagnostics.ts` 对当前显示树只采集有限数值和布尔值，最多遍历 2048 节点/32 层，最多显示 32 项视口或纹理几何。排除纹理地址、节点标识及任意附加属性；循环引用不会递归。`RpgRendererRuntime.diagnostics()` 同时读取当前地图握手、玩家坐标、isConnected、graphics/graphicsSignals 数量和画布尺寸。原作记录面板用折叠的“画面显示帮助”按需呈现；无网络、存档写入或自动恢复动作。该读数只帮助定位连续转场人物缺失，不能证明实际像素可见。

### 背景失败阶段诊断（2026-09-12，待平台复验）
`loadBrowserSceneResource` 通过可选阶段回调报告 download/body/hash/decode/ready，并将底层网络与正文读取异常转换为固定错误码。`ProgressiveSceneReadiness.diagnostics` 返回资源类型、声明大小、阶段、耗时、允许列表中的错误码与 HTTP 状态，不返回 URL 或原始异常。超时、迟到响应、显式重试和地图准入合同不变。记录面板诊断拆为短行，避免原生 AX 截断单个长文本。实际失败原因仍需部署后的平台读数，不能用本机测试推断。


### 绘图上下文丢失恢复（2026-09-13）

`renderer-context-loss.ts` 在 renderer host 捕获 canvas 的非冒泡 `webglcontextlost` 事件，不拦截 Pixi 自身事件处理。一次故障锁定当前页面的空间输入和转场，原作界面单独保存 `RENDERER_CONTEXT_LOST`，避免被稍后返回的普通请求清除。玩家显式重新载入后，沿现有 Story Session 恢复同一旅程和待确认请求；不创建第二个 renderer，也不删除存档。`_qa/original-production-server.ts --context-loss-control` 只在本机响应注入可见按钮，通过 `WEBGL_lose_context` 扩展验证实际故障与恢复，按钮不进入 dist。该恢复能力不证明此前偶发角色消失就是 GPU 上下文丢失。

### 图片解码等待的超时恢复（2026-09-13）

`src/abortable-art-load.ts` 将不原生接收 AbortSignal 的图片解码及 Pixi 纹理载入纳入现有资源等待预算。`scene-readiness.ts` 的 `Image.decode()` 在中止时立即结束等待并清理图片 URL；`original-game.tsx` 的六类图集载入在相同信号中止时返回已有可重试错误，迟到的纹理单独卸载，不覆盖重试结果。下载的 SHA、尺寸与素材准入检查保持原样。成功载入后清理定时器所发出的 abort 不会卸载正在使用的纹理。

这是对可确定的“下载已结束而解码 Promise 不返回”漏洞的修复，不将此前原生平台人物偶发消失的原因推断为解码挂起。`_qa/abortable-art-load.test.ts` 覆盖挂起、超时后旧结果、重试、晚到错误及真实资源加载函数；本地生产测试服务的 `--stall-image-decode` 只在测试 HTML 响应注入故障，不进入正式构建。

### 完整单人游戏的构建期空间检查（2026-09-13）

`npm run check:spatial` 仍保留早期切片验证，并额外调用正式 Story Session 使用的 `compileOriginalSpatialBinding`，检查完整原作的中英文规则及实际 `originalBoundWorldPlan`。检查覆盖旧档默认布局与当前新建旅程布局：每组9场景、8个故事地点、78实体、89行动、13转场和4角色。两种语言必须具有相同的行动、角色、地点及逐场景行动目标。

每组78个实体从该场景出生点到接近点均运行实际寻路，并逐像素检查路径段，防止网格端点跨越薄障碍。这证明静态布局可达，不证明人物动态占位下的路径、任意剧情状态都能通关，或美术与实际 renderer 显示正确。玩家发布的素材布局仍由其独立准入流程检查，不能据本检查自动发布。

### 2026-09-13 发布素材像素解码取消

`decodeSpritePixels` 和 `spritePreviewUrl` 接受可选 AbortSignal。正式原作主角、NPC、启动设备的已发布素材像素校验使用当前加载尝试的同一信号，涵盖预览解码与 Canvas 读取前的第二次解码；超时沿既有素材错误与重试路径返回。中止时清空 Image.src 并释放内部 Blob URL，迟到解码不会继续读像素。未传信号的制作页调用合同保持兼容。专项测试覆盖两次解码分别停滞、资源释放、迟到完成、已取消输入及成功重试；此故障注入不证明真实 iPhone 曾出现同一种故障。

### 完整故事与真实碰撞联合检查

`npm run check:spatial-story` 使用正式表现准入、游戏实际 `findGridPath` 与 `originalWorldWalkable`，在每次抽样剧情行动前，从当前落点检查到交互接近点的路线。碰撞包括当时的人物、已绑定设备及地形；每条线段再按不超过1世界像素的间隔检查，防止网格端点跨过薄障碍。随后按钮和作者文字分别执行同一行动，比较资源、事实、道具、队伍、关系、人物、地图、危险与结局状态。默认120个固定种子，`ORIGINAL_BRANCH_SAMPLES=1` 可作快速诊断，失败输出可复现的种子与行动序列。

报告另存系统临时目录 `original-spatial-branch-exploration.json`，不会覆盖旧的纯规则抽样报告。此项为离线规则/碰撞联合验证，不提交线上存档、不调用模型或媒体；不证明真实渲染帧、手机性能、所有自由表达或穷尽所有故事状态。

### 场景响应读取上限

场景读取补充（2026-09-14，开发分支）：`loadBrowserSceneResource` 按清单字节数读取响应流，超过预算立即取消，不再先缓存完整异常响应。取消可打断停滞的 reader，释放读取锁；完整大小、SHA及解码尺寸验证顺序保持。独立重试可以重新读取正确资源，不修改场景事实或已绑定版本。20项资源/取消/绑定专项和TypeScript通过；尚未作为新正式版本发布，也不代表真实手机网络问题已全部解决。

### 显式封闭背景点

`SpritePreparationSpec.matteSeeds` 可记录原图中人工确认的浅中性背景点（最多64个、源图绝对像素坐标），用于处理腿间等不与图片外缘连通的白色背景。算法只扩展相同阈值的连通区，并沿用原边缘去污染逻辑；不能把它当语义分割或自动删除浅色服装。坐标越界、颜色不合阈值、alpha模式混用都会拒绝。无背景点时输出保持既有行为。

制作页现已提供原图点选和坐标输入：预览点击按原图宽高换算坐标，最多64点；切换草稿恢复各自的 `spec.matteSeeds`。仅浅色去底模式使用选点，透明保持模式不携带这些参数。结果仍另存候选，越界或点中非浅中性物件时拒绝处理，旧候选与原图保留。设备合成像素经实际处理、IndexedDB关闭重开、错误选点重试的专项检查已通过；实际浏览器已观察点选写入原图坐标，保存后刷新复验尚因桌面锁屏未完成。此制作页改动尚未正式发布。

历史 neutral-09 的确认点为153/150，处理另存candidate-alpha-gap.png；旧候选和原图均保留。静态比较确认只改变第一格678个像素，第二格完全不变；这一记录不代表正式主角准入。

归档兼容复查发现旧 `assertSpriteManifest` 会拒绝 `matteSeeds` 字段，导致本地处理成功但云端保存失败。现有版本1归档合同增加可选选点，严格限制原图范围、整数坐标、字段集合、64点上限及浅色去底模式；不放宽其他字段或访问权限。实际平台设备候选经本机私有归档分块上传、完成、SQLite重开与还原后，原图、处理图和选点保持一致；错误坐标与其他用户读取被拒绝。7项云归档专项和TypeScript通过，线上尚未更新。

解锁后实际浏览器补验：同一来源重新打开制作页恢复 `5,5` 与候选；正式构建地图中完成修复前后、柜前柜后与阻挡五项检查，保存并返回后发布入口启用。实际CSS320×568，scrollWidth320；不是物理iPhone实测。最初开发服务未提供仅在构建时生成的地图文件，触发RESOURCE_SIZE；切换同来源到正式构建后恢复，没有放宽资源校验或覆盖草稿。完整回归747/747、正式构建、9场景27资源摘要及Worker启动已通过，线上仍为23568b7。

### 原作空间行动与短对白（2026-09-13）

`original-game.tsx` 的右下角入口与 E 共用 `activateNearby`，重新核对最近实体；单一普通物件直接提交，人物、多选与制动特写保留面板。`story-beats.ts` 只提取本次新增原文，跳过玩家输入，按句分页（中文72字、英文180字符，每页最多两句），保留原有完整记录和权威存档。对白使用固定底部圆角卡片，不附人物头顶、不绘制三角或箭头；关闭和完整记录随时可用。

本地5403版本通过 TypeScript 检查、5项对白/附近交互测试及 QA 构建。实际浏览器360×687验证右下角交谈入口、阿达回应不重复输入，以及底部无尖角卡片；此次尚未正式部署。

后续回归：715/715测试与完整生产构建通过。受限环境首跑35项本机HTTP监听EPERM，获准本机监听后原样重跑全部通过。实际320×568页面对白可见、边界正常；390×844 DOM边界为left35/right355/top647.9/bottom828.6，但浏览器截图缩放不稳定，保留截图限制，不将该截图宣称为物理iPhone验收。附近交谈按钮与E均打开阿达交谈；键盘关闭对白恢复探索。

### 单次寻路碰撞快照

`originalWorldWalkabilitySnapshot` 在每次同步寻路开始时读取当前场景、准入背景、在场人物和设备范围，供这一次网格搜索使用。下一次寻路重新创建，不跨权威状态保留；实际逐步移动继续调用实时 `originalWorldWalkable`。本机基线10次相同寻路约899ms，预读取范围原型约45ms；这是本机算法计时，不能当作iPhone帧率提升证明。

寻路优化验证：TypeScript、13项碰撞/角色/附近交互/转场专项测试和独立QA构建通过；5403同一合成旅程由燃料棚走到启动机，实际人物抵达并打开交互面板，资源82/82/58保持。尚未发布优化，也未据此宣称物理iPhone性能验收通过。

### 画页与对照图等待恢复

`decode-browser-picture.ts` 对不接收AbortSignal的浏览器PNG解码提供取消等待，失败时回收本次Blob URL并清理Image引用；成功URL交还组件管理。旅途画页对下载/解码设20秒总等待上限，对照图沿用20秒下载上限并纳入解码取消。关闭、换地点或重试会终止旧等待；迟到结果不会替换新一次读取。原图SHA、尺寸及候选保留门禁继续生效；没有新增模型、媒体生成或存档写入。

`_qa/picture-recovery.html` 是生产组件故障测试页，使用已有PNG和只读假API，拒绝提交，不是独立游戏。画页与对照图分别强制Image.decode停滞，验证超时提示和重试。正式构建不包含此测试入口和故障开关。

### 结局后的交谈（2026-09-13）

`original-train-runtime.ts` 对已完成结局只开放 `dialogue`：沿用当前人物在场、空间接近、素材准入和对白审查，追加成对交谈记录。结局快照、资源、关系与剧情事实不变；`action` / `free-input` 仍冻结，结局准备或生成期间也不放行。回执重放不能重复追加。平台发现与验证范围见 `native-ending-dialogue-review-20260913.json`；主站已发布 f34c4eb，原有合成 API 旅程的结局后对白与精确重载通过；主站与 Pages 的同提交 114 个实际文件均已逐一核对通过；2026-09-14 已在 Telegram AlterU 的原有结局旅程验证预设对白卡片、无尾巴底部布局和关闭回图；此次对白之后的退出重进仍受原生返回按钮工具错误影响。

### 2026-09-14 地图焦点滚动修复（待正式复验）
原作 `.og-world` 与 `.og-game` 使用 `overflow:clip`，地图位移仅由相机 transform 控制；`overflow:hidden` 会允许离屏热点获得焦点时额外滚动地图。日志 `.og-scroll` 继续使用 overflow:auto。浏览器回归页 `_qa/map-focus.html` 直接加载正式 CSS，比较焦点前后与程序滚动后的地图矩形及滚动量，并单独检查日志滚动。该最小复现证明焦点偏移机制，尚不等于已完成 Telegram 灰石货场同场景复验。

### 2026-09-14 隧道返回货场的叙事连续性
`tunnel-depart` 按 yard-met / yard-agreement 区分首次到达与返回：已交易时提示找玛柯核对山路，不再要求首次说明来意或重新交换燃料。仅修正新回合正文和目标，不改交易、关系、资源、历史或已有存档。原线路未锁死，推进动作位于玛柯面板；浏览器实测已核对线路、邀请同行并解锁山口。中英文回归覆盖真实采石场路线、返回正文、仅扣通行燃料、关系保留、重新读取与可执行线路核对。此项待下一次构建发布，当前已上线的镜头修复仍为378b765。

### 2026-09-14 开发中：主角身份来源记录
`src/protagonist-identity.ts` 定义私有候选的参考摘要与源图摘要绑定，不携带头像 URL 或账号。`SpriteDraft` 与现有云素材 manifest 保存并恢复可选 `protagonistIdentity`；摘要不符、未知字段、物件槽误用均拒绝。补帧保留参考来源、更新源图摘要，并沿用新草稿清空评审的流程。服务端拒绝将这些候选发布为阿达；`ActorSheetReview.identity` 记录轮廓、遮挡、服装和比例的观察，绑定参考摘要并参与评审内容 ID；保存新身份观察会清除旧地图评审。服务端要求四项通过且现有图集/地图评审有效后才允许主角发布，复用原有不可变发布和丢响应恢复。身份检查的制作页入口尚未接入。旧无身份记录素材发布合同不变。这是个性化链路的开发增量，尚无头像读取、生图入口或身份质量通过结论，未部署。

### 2026-09-14 主角参考导入入口
`src/protagonist-source-import.tsx` 接入素材制作页：两个本地PNG均通过摘要与浏览器解码后才能显式保存，图集需可按3列4行分格。调用现有 `newProtagonistSource`，只持久保存图集与参考摘要，不上传参考图片，不赋予身份、动作或地图通过状态。主角草稿禁止在参数栏改为设备。替换选择及卸载释放预览URL，失败选择清空对应旧素材；保存失败允许重试。

本地浏览器实测：既有960×1280测试图可导入，刷新恢复原图草稿且参考选择清空，JSON文件被拒绝并禁用保存。实际CSS视口320×568及390×844无页面横向溢出，分别为单列与双列导入布局（外部guest-shell状态）。TypeScript检查通过。尚未完成参考身份检查面板、真实头像生成准入和正式部署；不代表个性化生产链已完成。

### 主角身份检查面板（2026-09-14）
`protagonist-identity-panel.tsx` 为带参考摘要的处理后主角提供比对入口，要求重新选择摘要一致且可解码的原PNG。四项观察分别记录轮廓/物种、遮盖、衣装/单侧配件、比例/视角；不会自动判断。现有图集检查保存后才允许保存身份观察，沿用 `saveProtagonistIdentityReview` 的并发校验与地图确认失效机制。重新保存图集检查会清空身份观察，界面明确说明顺序。未加载参考时仍可查看已保存判断，但不能修改或保存。

验证：TypeScript通过，既有主角身份回归4/4通过；浏览器实测错误参考拒绝、正确参考解锁、未通过判断保存。测试使用已有非玩家素材，不发起模型生成、不发布、不代表视觉准入。
刷新实测：轮廓项“不通过”恢复，其余仍为“未检查”；参考图片消失，选择与保存禁用，直到重新选中同一参考。前端发布按钮同步约束：主角身份未全部通过不能发布主角；带主角参考标记的候选不能发布成阿达。后台既有强制校验保留。

### 在线限流后继续行动（2026-09-14，开发分支）

原作正式请求按 `NARRATION_POLICY` 每60秒6次限流，不使用本地preflight的进程终身测试额度。`NARRATION_RATE_LIMIT` 在原作runtime调用模型及提交之前抛出，因此 `OriginalSessionClient` 将其作为明确拒绝收束：读取最新权威状态后只清理对应待确认请求，保留输入并提示稍后再试，预设交谈和行动可立即继续。不会永久关闭在线能力，也没有提高额度。超时和结果未知仍保留原幂等请求，不按限流处理。真实authority的直接与预备提交路径均以合成限流窗口验证：无模型调用、状态不变、待确认清理、作者行动可执行、窗口过后在线请求成功。共享/原作客户端30项测试通过；未调用真实模型或修改线上配额。

### 玩家下载备份的完整性（2026-09-14，c93230c之后的开发改动）

`original-backup-integrity.ts` 复用原v1备份的规范化SHA-256算法与16MiB负载上限，供服务端导出及浏览器下载共用，不改变旧备份格式。`inspectOriginalBackupDownload` 在生成Blob下载链接之前校验游戏UUID、旅程ID、唯一旅程行、真实摘要和不低于当前已见进度的版本；损坏、错旅程或退步响应进入原有重试提示。此校验只保证收到的导出内容完整，不赋予导入权限。恢复仍使用受信任运维流程，不开放浏览器任意状态写入，不替代平台账号绑定。

### 多窗口恢复与旅程切换（2026-09-14，开发分支）

`RecoverableSessionClient.recover()` 在取得旅程锁后重新验证当前选择。此前恢复读取了旅程A的ID并排队，另一窗口可在持锁期间完成切换到B；轮到恢复时仍会返回A的旧画面。现在这种情况在发送读取请求前以 `SESSION_SELECTION_CHANGED` 结束，由已有重新载入提示处理；下一次恢复读取B，不改写任何旅程或待确认日志。`_qa/original-client.test.ts` 通过共享串行锁、暂停B的读取实际复现该顺序，修改前失败，修改后通过。原作与共享客户端相关28项测试通过；这不是跨设备账号恢复的证据。

### 素材预览解码超时（2026-09-14，846e2ad发布之后的开发改动）
`spritePreviewUrl` 与 `decodeSpritePixels` 的第二次浏览器解码现在共享 `decodeImage`：每次 `Image.decode()` 最多等待15秒，并转接调用方取消信号。失败释放对象URL，完成清理计时器和监听器；迟到解码不恢复旧预览，也不继续绘制或读像素。没有调用方整体预算时两次解码各自计时，不能宣称整个处理只需15秒。专项测试3/3通过，覆盖首次挂起、第二次挂起的超时与主动取消、对象释放、迟到完成不绘制及后续成功重试。这不为 Canvas 编码或整条生成任务提供总超时保证，也不是物理iPhone故障复现。

### 非人形滑行检查（2026-09-14，开发中）
主角来源v1保留行走语义，v2严格携带motion=glide。来源工厂、补帧新原图、归档恢复保留类型；滑行类型加入actorReview的preparation绑定，旧行走检查无法复用，反向改型亦拒绝。渲染仍使用既有0/1/2/1周期，本次新增的是滑行姿态的验收语义，不支持任意骨骼动画。导入界面可选类型，滑行检查不运行人形腿部比较。
5项身份/归档测试通过，TypeScript通过。实际浏览器选择滑行并导入平台非人形失败样本，处理被SPRITE_PREPARATION_CLIPPED_FRAME拒绝；未放入地图、未批准素材。合格滑行候选的真实地图运行仍待完成，不将失败样本的拦截当作视觉质量验收。
完整回归729/729通过（`/private/tmp/rpg-glide-full-tests.log`）。新增测试的动态断言导入引发TS2775，改用静态导入后TypeScript复验通过；正式部署仍为846e2ad，本轮移动类型扩展未发布。


### 应急柴油储罐候选接入（2026-09-14，未默认启用）

`original-diesel-art.ts` 固定平台素材的 SHA、满／空图集、脚点与五个实体对应的既有事实。`original-fixed-equipment.ts` 注册按实体区分的不可变版本；`currentFixedEquipment()` 未添加这些版本，因此已有存档与正式新旅程均不自动升级。设备投影、寻路和后台碰撞共用 `originalEquipmentSlots/Bodies`，位置读取当前背景的 `originalEntityLayout`。满／空只改变图集帧，不移除物理储罐或另发资源。

两次平台生成的整张状态图均不合格；采用第一次左帧（满）与第二次左帧（空），通过现有制作页算法去底和脚点对齐，保留原图及准备参数。真实 renderer 初检发现 0.1 比例过大，改为 0.065；对应占地 16×10 世界单位。河谷完整操作验证：修启动机 → 走河谷 → 点击储罐寻路 → 抽油，燃料 62→74，空罐留存、行动消失，刷新仍为 74。旧河谷文字中的油柜/标牌改为储罐/液位窗，新行动使用新文案，不迁移历史正文。

五处合成章节测试检查实际 refuel 权威动作、只领取一次、序列化恢复、占地与接近点；其他四处实际画面、手机构图和正式发布仍待完成。候选记录见 `doc/platform-art-candidates/20260914/diesel-reserve-assembled-03/review.json`，不能将这一局部检查当作整套美术准入或完整游戏验收。


### 柴油储罐新旅程准入补充（2026-09-14）

在上节候选检查之后，已复验林线、隧道、山口、洪桥的 390×844 iframe 内实际地图物件区域，以及洪桥 320×568 的完整界面和上下文行动。小屏洪桥抽油使燃料 72→84，储罐切为空状态且保持落点。390×844 的外层截图高度为 720，不能据此宣称整屏 HUD 完整；这些是桌面浏览器内的视口验证，不是物理 iPhone 性能测试。

`currentFixedEquipment()` 现为新旅程绑定五处柴油储罐 v1。旧快照缺少这些绑定时，升级不补写，仍使用旧表现与碰撞。`scripts/check-diesel-journeys.ts` 在两条实际规则推进的旅程中完成 82 次动作，逐像素验证动作寻路并获取全部五个场景；报告随候选目录保存，不包含真实存档。新增回归还逐项比较五个场景原有入口到互动点的可达性。正式主站与 Pages 尚未发布这次变更。


### 固定设备碰撞查询开销（2026-09-14，开发分支）

`original-equipment-art.ts` 将作者定义的设备实体表在模块初始化时构造一次；只保存静态定义，不缓存旅程绑定、场景状态或最终碰撞结果。每次储罐查询仍读取传入的绑定和 `originalEntityLayout`，旧档无绑定时返回空列表。此前每次碰撞查询会重复建立整张章节配置，现已移除这部分分配。

本机 `scripts/benchmark-original-collision.ts` 每轮 3000 次、共 6 轮，忽略首轮后的中位耗时从约 95.46ms 降到 47.33ms；两次共 18000 查询的可走计数均为 16260。该数字只是同机合成 CPU 查询对比，不代表物理 iPhone 帧率。16 项设备/碰撞/恢复测试通过。此优化晚于正式 `7ff4d4d`，未包含在正在验证的双部署中。


### 空间路线检查快照（2026-09-14，开发分支）

`check-original-branches.ts` 为每次行动的同步寻路重新建立 `originalWorldWalkabilitySnapshot`，与 renderer 的搜索方式一致；路线每个像素仍独立经过 `originalWorldWalkable` 验证，不复用过期快照。120 条确定性抽样旅程全部完成，覆盖 82 种行动；地图行动与对应文字输入的状态逐项相等。详细计数见 `doc/spatial-route-snapshot-20260914.json`。这不是穷举、持久化或手机实机验收，也不改变正在运行的 7ff4d4d 发布任务。


### 泵站候选接入（2026-09-14）

`original-yard-pump-art.ts` 定义三帧固定图集与 `yard-agreement` 到图形的映射：诊疗或未达成协议保持停机，work 修复，forced 打开护栏且泵轴断开。`yard-pump-v1` 仅支持显式候选绑定，不进入 `currentFixedEquipment()`，旧档不会自动升级。实际 renderer 验证资源 SHA 和尺寸并使用相同世界布局/碰撞。三条真实作者路线共 36 次行动通过；320×568 修泵与刷新恢复已观察，另外两条路线与 390×844 待实际画面验收。详细证据见候选目录 runtime-review.json。


### 柴油储罐版本双部署完成（2026-09-14）

在前述发布待验之后，主站与 Pages 的 115 个实际文件现均与冻结提交 `7ff4d4d1351947820c2f7c53bee2fabfd3427248` 的字节数和 SHA-256 一致，Pages run `34818701686` 成功。柴油储罐已进入正式新旅程；泵站候选仍仅开发分支。证据见 `doc/diesel-release-20260914.json`。不代表平台账号跨设备恢复或完整游戏全部验收完成。


### 泵站新旅程准入（2026-09-14）

在候选测试后补完强开与诊疗的实际 renderer 行动及刷新：强开 38/87/66→58/75/58，诊疗→54/87/72；前者显示无链条且断轴，后者保留停机护栏。修泵 320×568、强开 390×844 物件区域、诊疗 320×568 均已检查，均为桌面 iframe，非物理 iPhone。新旅程现默认绑定 `yard-pump-v1`；旧档缺少该绑定时继续旧表现与碰撞。尚未正式部署。


### 透明物件加载页（2026-09-14）

`journey-loading-art.ts` 从启动柜、储油罐、泵站已准入图集选择初始帧，CSS 仅裁切展示，不改源像素。章节已知时选对应设备，未知时避免与上一次随机选择重复；`JourneyLoading` 在挂载时固定选择，进度更新不换图。物件可独立下载失败，失败时保留等待文字，游戏加载不等待该图。原有紧凑行动确认不增加图片。主游戏和画页生成传入当前场景。320×568 组件容器内三种物件已浏览器检查；预览是独立本机组件 harness，非真实网络延迟或物理手机实证。

### 三状态原图组合（2026-09-14，开发分支）
`SpriteCreator` 支持修复两状态与柜体三状态；`verifySpriteComposition` 从每份原始 PNG 的指定列重算组合并逐像素比较。`sprite-source-library` 枚举三份保留来源，避免把处理后的结果当原图。私有归档新增限定 `input-2` 文件角色及 Worker 文件路由；三状态必须恰有五份文件（源组合、候选、三份输入），原有两状态四文件和人物两文件合同保持，24MiB总额及元数据上限不变。两状态设备发布合同不扩张；三状态组合不自动获得正式游戏准入。

验证：749项全套回归通过，16项组合/归档专项通过，TypeScript与cloud前端构建通过，九场景27份资源SHA检查通过。实际浏览器完成平台旧设备样本的三列选帧、组合、处理、刷新恢复及真实地图三状态切换与阻挡。初次测试接地点位于柜下空白被地图拒绝，按实际柜底修正后载入；未修改准入校验或替换正式素材。

### 未发布设备检查的私有恢复（2026-09-14，开发分支）
设备PNG档案保持不可变。新增按制作身份和候选ID隔离的 `creator_device_reviews` 表与 `/api/creator/sprites/:id/device-review` GET/POST；只接受已完成上传的两状态启动机、五项完整检查及与候选摘要/尺寸/脚点一致的几何。重复保存相同几何返回原记录，冲突不覆盖。`SpriteCloudArchive.saveWithReview` 在素材完成后另存检查，丢回执可独立重试；restore 取回检查并校验摘要和几何，不自动发布。旧未检查候选返回空记录；已发布设备仍可从既有发布记录恢复检查。修改/重新处理的候选仍清空检查。

751项全套回归及14项设备发布/归档专项通过，含真实本机HTTP响应丢失、数据库重开、私有访问和恢复后显式发布；TypeScript及预览构建通过。此项不代表三状态柜体/油泵已支持发布，也不代表平台账号恢复。

实际浏览器验证：在独立本机测试库、390×844视口下，用保留的平台启动机两状态原图生成候选 `80e7d7e8-70ad-4912-8dbe-2faf2a4e3b77`，完成五项地图检查并在线保存；随后载入另一份平台设备原图，再在线取回该候选。取回后的候选ID、白底选点 `5,5`、两帧接地点 `173,463; 173,468` 与目标落点高度 `544` 一致；界面确认地图检查已恢复，发布按钮可用。未点击发布，未改正式旅程，也未调用新素材生成。此验证为本机浏览器，不冒充实体iPhone或线上发布验证。

### 干净交互试玩版（2026-09-14，本地）
`originalTalkTopics` 让界面选项与服务端预设回应共用当前人物/地点/可用行动/对话历史合同。阿达开场提供三项具体话题，修理完成后撤下旧故障话题；问答只写配对对白，不修改资源、人物关系或地图事实。按钮直接传入选定文本，避免依赖 React 输入状态刷新；自定义输入仍走原路径。人物回应留在人物面板，输入折叠；自由表达设置移至日志里的设置，显示诊断与实体序号只在 `?debug=1` 可见。普通无独立素材的交互暂显示调查图标，实际素材补齐仍未完成。

验证：14项对白专项、753项完整回归、TypeScript及编译预览构建通过。真实浏览器完成点选阿达话题→同面板短答→回地图→选择修理，车况82变87而燃料68、人心58保持；普通日志无开发测试入口。纠正浏览器130%缩放后实测320×568 CSS视口无横向溢出，对话可滚动；不把名义390视口的截图冒充390 CSS验收。另开新本地旅程供用户从头测试，旧本地测试旅程和线上存档保留。入口 localhost:5438，独立测试库 `/private/tmp/rpg-clean-play-db`，无外部模型/生图请求。此版未正式部署；人物选项广度、全部物件表现和完整体验仍待后续试玩，不能据局部验证宣布全游戏交互验收通过。

### 后续人物情境话题（2026-09-14，开发分支）
新增货场合作/邀请、河谷诊疗、林线巡检、隧道排烟、山口制动与洪水桥固定列车的话题。每条按当前实际可用行动及说话者筛选，不提前显示已被资源条件或剧情前提排除的方案；问题不自动承担后果，行动完成后旧问题撤下。回忆选项跳过自己的记忆问句，避免连续点击变成自我引用。21项对白专项通过，包含中英三条真实权威路线的问答零资源/事实变化与事后话题撤下，TypeScript通过。当前用户试玩入口5438保持先前构建，未热替换。

### 从交谈前往行动点（2026-09-14，开发分支）
情境话题可带稳定 actionId；界面用当前投影再次定位实际实体，只在刚谈过的话题仍有可用行动时显示“去看看”。导航复用地图 walkTo 和抵达后的行动面板，不直接 submit；当前人物自身已有的行动不重复加导航入口。原动作消耗和权限保持，完成后的过期话题不再指向已完成行动。人物对话不再显示重复的“进度已保存”提示，内部错误码只在开发开关下显示。

验证：22项对白专项与761项完整回归通过，TypeScript和独立编译预览通过。本机真实地图走通附近列表→阿达→故障话题→去看看→启动机行动面板；导航后燃料68/车况82/人心58保持，明确选择修理后车况变87。测试库 `/private/tmp/rpg-talk-action-db`，端口5439；用户5438试玩构建保持。初次定位点击了镜头外的阿达，未计为有效交互，改用真实可见附近列表后完成；不把这项测试宣称为全部场景或实体iPhone验证。

后续真实复验发现：再次找阿达时旧故障回答仍被当作当前对白。新增 `originalCurrentConversation`：配对对白后若发生新的非对白剧情记录，不再直接展示旧回答，但完整历史和回忆仍保留。修复后23项对白专项及TypeScript通过，重新编译后在同一5439旅程（车况87）重进，阿达不再显示旧故障；点击当前目标话题实际回答“列车已经点火；检查补给与制动，再选择第一条支线”。761项全套是此显示修复之前的结果，不混写为新增修复后的全套数量。

### 干净试玩：减少转场点击（2026-09-14）
`storyReceipts` 将 change/check 与 effect 回执从分页分离，放在剧情下方；`storyBeats` 排除带 transitionAnchor 的自动转场段，保留真实叙述、开场 event 和危险 event。只调整展示，不改权威历史、消耗或存档。27项对白/分页专项与 TypeScript 通过。浏览器工具报告锁屏且自动解锁失败，因此本次修改尚未完成画面和完整路线复验；此前真实路线走到灰石货场，不宣称全游戏可玩性验收完成。

### 物件名称与行动分离（2026-09-14）
新增 `original-entity-labels.ts`，为当前章节计划所有非人物交互点提供中英名称。地图可访问名称、附近列表及面板标题使用该名称；真正执行的行动仍使用当前权威选项。投影先检查可用行动/角色/既有制动设备保留规则，再附加名称，防止未来或已消失对象因有名字而被错误显示。40项投影、对白、分页专项以及TypeScript通过，覆盖双语三路线选择与修理后旧物件隐藏。5440用户试玩构建保持9343014，本次开发变化不热替换；工具复查仍锁屏，实际画面未复验。

### 主线点选与目标恢复（2026-09-14）
成功保存提示在非忙碌状态显示3秒，随后恢复当前目标；定时器随提示、旅程版本和语言变化清理，避免旧定时器抹掉新错误。HTTP完整路线新增buttons/mixed两种输入方式，中英×货场/河谷/林线×两种方式共12条流程，每一步先断言当前游戏投影包含可选择的动作，再经正式HTTP处理器提交；保留创建、首个动作和结局响应丢失后的磁盘重开恢复。17项HTTP专项全部通过，TypeScript通过。证据证明规则和投影闭环，不替代真实地图点击、镜头和玩家理解验收；5440构建保持不变。

### 干净交互整合回归与焦点（2026-09-14）
当前整合版本全套772项回归通过（日志 `/private/tmp/rpg-clean-full-regression.log`，80.5秒）；此回归用于叙事/资源/恢复/投影等程序合同，不能证明浏览器焦点行为。源代码检查发现旧焦点列表包含折叠区隐藏输入且遗漏summary；现在焦点候选包含summary、select和textarea，过滤不可见、disabled、负tabIndex和inert元素，关闭时只恢复仍在文档内的原焦点。TypeScript通过；真实Tab/Shift+Tab、折叠展开和软键盘操作尚待解锁后验证。用户5440继续使用固定构建，不被开发编译覆盖。

### 同行者运动基础（2026-09-15，尚未接入正式渲染）
`companion-motion.ts`实现本地路径轨迹跟随、碰撞寻路、34单位间距/16单位净距、实际距离步态、暂停交谈转向，以及转场等待显式reset。重寻路时略去紧邻自身的网格起点，避免倒退并堵住跟随队列。5项单元测试涵盖绕墙、停步/转向、恢复隔离、队列间距及30/60/120fps，TypeScript通过。该模块尚未连接当前固定人物渲染或权威互动位置；不宣称游戏已支持同行跟随。当前正式角色大多只有单张站立图。平台首次整套行走候选返回九格且方向错误，已拒绝；证据在companion-motion-20260915/ada-whole-sheet-rejection.json。后续先拆方向验证图集，再同时接入渲染、点击/接近点及单人交谈校验，随后扩展乘客。

拆成左向三帧后，平台返回第一帧左向迈步、中帧左向站立，但第三帧转为背斜方向；因此仅证明单方向请求有所改善，仍未得到可用步态，未发布、未冒充跟随演示。该证据记录为ada-left-cycle-rejection.json。

### 同行者共享位置合同（2026-09-15，接入准备）
`original-companion-context.ts`校验当前位置快照，仅允许当前已同行且物理在场的四个已定义角色，拒绝设备、未来角色、无效坐标和障碍内站位；复制输入，不改原存档。`originalCharacterBodies`可读取同一快照，`originalBoundWorldPlan`只在指定当前场景把命中盒左上角转为人物脚点，其他场景与非角色物件保持原位。22项运动/位置/投影检查及TypeScript通过。尚未修改HTTP运行合同、接入主游戏renderer或持久化移动队形，不能据此声称移动后交谈已实际可用。接入时必须同步保存/恢复队形、动态approach点以及固定站位碰撞的替换；不得仅放宽距离校验。

素材核对：旧试验public/art/overhead/attendant.png与mechanic.png为1086×1448图集，蓝绿衣女乘务员与灰发男工人具备可见多方向姿态，可作为乘客候选重新评审，不能替换已确定身份的阿达/玛柯；步态和alpha仍需复验。没有新增到当前试玩场景。


### 2026-09-15：环境乘客
`src/original-passengers.ts` 提供小城安全检查后的确定性站位、资源校验信息、碰撞脚点和本地短话题。`original-game.tsx` 将真实 NPC 图集注册到 RPG-JS，接入走近、面对、附近列表、E 快捷键与上下文按钮；`original-world-space.ts` 将乘客纳入服务端/客户端同源碰撞。运行合同提升为 original-session-19，防止旧客户端在新增乘客的脚点内行走却收到服务端拒绝。此对白不调用模型，不写叙事回合，不修改队伍或资源；不宣称拥有对话记忆。素材首载增加约 1.4 MB，目前与角色资源一起预加载。


### 2026-09-15：同行位置权威接入
OriginalHead 新增可选 companionPositions（角色 id → 碰撞左上角）。位置 checkpoint 的可选 spatialContext 钩子在同一事务中验证并保存主角和同行位置；其他游戏 runtime 不使用该钩子，行为不变。行动/对白也验证同一快照，动态 spatial binding 与 UI 投影读取它。仅已登场且当前在队的实体允许移动；场景切换清空队形，离队移除对应位置。旧存档没有该字段时保持原站位。已验证 SQLite 恢复、账号隔离、过期请求拒绝、移动后对白、幂等重放、真实发布准入检查及原路线/HTTP 恢复回归。此轮仍未接 renderer 的逐帧跟随，也未上线。下一步需要把运动快照接到位置 checkpoint 与行动 body，处理设备工作驻留、队形与碰撞一致性，并补齐正式角色走动帧。


### 跟随 renderer 试运行
`?companion_motion=1` 在当前主游戏启用 CompanionMotion，保持默认产品入口关闭直到行走素材验收。移动快照同步 RPG-JS 实体、DOM 人物热点、寻路碰撞、位置 checkpoint 和行动请求；交谈/菜单暂停队形。已在合成小城旅程真实跨站台移动并成功向移动后的阿达提交对白，保存成功。当前使用站立图，仅证明位置链路，不能作为行走动画验收；工作驻留和狭窄通道避让仍未完成。


### 山口工作驻留
`original-companion-duties.ts` 从当前场景、显式岗位事实和实际在队状态派生工作目的地；CompanionMotion 的 workPosts 覆盖跟随目的地，抵达后停步，删除岗位目标即恢复跟随。不会新增岗位事实或更改队伍。13 项运动/岗位/互动位置测试通过，画面仍待验证。一次单帧平台生成返回 PROVIDER_REJECTED、retryable=false，无图片；失败证据保留在 companion-motion-20260915，未纳入资产。


### 同行让路（内部试验）
Renderer 暴露当前移动意图，CompanionMotion 在玩家前进方向受队员阻挡时优先选侧边可达点；单人宽度通道侧边不可达则沿行进方向退至开阔处。让路仍受地面和身体碰撞约束，允许已靠近的队员逐步扩大距离，避免安全间距反而锁死第一步。玩家经过或停止输入后恢复原跟随/岗位目标。点击寻路在同行者临时阻挡时保留路线等候；只对跟随试验启用，其余 renderer 消费者保留旧行为。18 项相关测试通过，包括模拟单人走廊退让和通过；实际车厢内掉头及 iPhone 操作仍待验证。


### 试玩后的叙事文案修订
`original-player-prose.ts` 对已确认的作者文本做精确替换：旧桥段仅匹配桥段块 id，结局只调整展示，玩家对白和存档原文不变；新桥段与结局生成同时采用修订文本。`original-choice-label.ts` 拆开中英终局标题和完整代价，提交 action id/原始 choice 不变。洪水桥已安排人员且尚未完成过桥时，当前在队角色使用本场景岗位；过桥后解除。59 项桥段/结局/岗位/旧文本测试及 2 项标签合同测试通过，真实小屏验收未完成。

### 同伴交谈落脚点碰撞修复（2026-09-15）

动态同伴的交谈候选点由 `originalBoundWorldPlan` 选择。玩家实体投射和正式 Session 绑定都传入当前 `originalWorldWalkabilitySnapshot`，因此候选点同时避开环境、设备、固定人物、其他同伴和已出现的普通乘客。无动态同伴坐标的旧存档维持原布局。该回调避免在底层地图模块反向导入完整人物/设备投射。

复现用例：初始站台 Ada 移到 `(242,100)`，原候选 `(242,128)` 与启动机重叠；修复后选择可行走点，并通过真实 production presentation gate 的合成交谈请求。10 项同伴测试和相邻模块回归通过，TypeScript 检查通过。四个候选点全部受阻时仍需要后续完善不可达交互的反馈；本次不能证明所有拥挤布局可达。新代码尚未部署，未替代站姿行走素材问题。

### Ada 单帧候选预处理（2026-09-15）

`scripts/prepare-ada-front-candidates.mjs` 只消费已经人工查看过的两张洋红底候选，沿图像边界连通去底，使用最近邻按原站姿总高度作临时缩放，并将脚点落在 320×320 单元的 `(160,300)`。原始 PNG 保持不变，输出与 hash/边界/缩放记录保存在 `doc/companion-motion-20260915/ada-front-candidates/`，不修改生产素材绑定。

实际并排检查发现新帧头部较窄、头发和黄铜颜色更亮，不能仅凭去底和脚点通过就接入。`front-cycle.png` 是四帧检查图，尚不是准入的角色动画；后续需要修正体型和调色一致性，检查深浅底边缘以及真实 renderer 播放。该脚本仅用于当前已审查洋红底素材，不能自动应用于包含洋红衣物的新角色。

### 点击同伴时的让路死锁修复（2026-09-15）

实际 5439 测试旅程在黎明枢纽点击阿达后，玛柯挡在主角前方，界面持续“正在走近”。原因是 `frozenCompanion` 同时充当全队暂停条件：寻路等待同伴让路，同伴却全部被冻结。

现在靠近阶段只通过 `CompanionMotion.talkingTo` 停住目标人物并朝向主角，其他同伴仍按主角移动意图让路。对话面板打开、网络操作、错误、隐藏页面仍暂停全体。新增阻挡队列用例证明目标不移动、非目标横向让路、打开面板后两者均停止。9 项 motion 回归与 TypeScript 通过；构建和同一真实场景复验另行记录。

同场景复验：玛柯已实际侧移，但靠近仍未完成。进一步定位到寻路把交谈目标也从障碍中排除，可能规划穿过已暂停的目标。已改为保留 `frozenCompanion` 的实体碰撞，只允许其他同行者让路。该第二处修正尚待新构建与同场景复验；5439 当前构建只包含第一处暂停修正。

第二处修正已在构建 `4543c03` 的 5439 同一合成旅程完成复验：重载后结局与 43/81/75 资源保留，关闭结局点击阿达能到达并打开交谈，目标话题返回已结束的旅程状态；再关闭面板点击玛柯，也能移动并打开其交谈面板。此证据证明原枢纽卡住路径已修复，不覆盖狭窄车厢与 iPhone。结局后仍显示“接下来的路”等旧话题，需要按终局状态调整文案。

### 终局交谈与最终选择一致（2026-09-15）

`originalEndingTalkContext` 仅在 `finale.status === complete` 且存在已存结局时，投射结局标题、主旨和不可逆代价。客户端话题与服务端本地答复共用这份投射，每项代价单独选择阅读，避免继续提供修车、赶路等过期目标。生成式对话上下文同样获得已完成结局的有限信息。该投射不包含未来剧本、不增删任何资源/关系、不改变结局；ready/failed 状态不会暴露候选结局。

25 项对话回归通过，包括中英文最终选择/全部代价、无动作链接、未完成不泄露、存档不变与原有对话规则。TypeScript 检查通过。新终局话题尚未更新到 5439 实际页面及正式部署，视觉复验待完成。

### 探索供电谜题候选规则（2026-09-15）

`exploration-circuit-rules.ts` 使用现有 original Story Core 的 `DomainActionRule`/库存/事实命令，提供两槽插入取回、照明下观察止挡、放置门撑和仅门内可用的机械释放。`explorationCircuitState` 从同一事实导出灯、锁、门和保险丝位置，未新增 reducer 或存储后端。测试直接走现有 `resolveDomainAction` 和 `applyDomainResolution`，覆盖中英文取放/门撑、重复取物拒绝、错误顺序、序列化恢复和 20 次换槽不复制物品。

该模块尚未装入任何生产 Cartridge 或 Session，未改旧存档；它不等于谜题已在游戏里出现。机械释放带地图内侧前置，正式接入还需实体、距离与门两侧空间检查。实际房间/碰撞、道具来源、线索和工具的两种探索顺序、故事版本路由、生成素材与完整通关仍待完成。测试中预置一枚保险丝和门撑只验证供电规则，不能算取得物品和空间探索路径已经通过。

### 供电谜题空间绑定候选（2026-09-15）

`exploration-circuit-space.ts` 将七个供电/门撑动作逐项绑定到两个候选房间的四个实际布局实体，使用现有 `compileSpatialBinding` 检查对象、房间、距离与脚底碰撞。规则自身也要求对应地图位置；内侧释放不能从外侧执行。布局中的可行走边界和设备占地供同一寻路函数读取。5 项合成测试覆盖全部动作绑定、各物件从入口可达、远处与跨房间拒绝，以及原供电规则；TypeScript 通过。

这仍是主项目内待装配内容，不是新游戏或新运行时。`explorationCircuitAdmission.ready` 明确为 false：两房间目前没有连接门户、合格背景或正式故事版本入口，未改变真实 renderer 的地图，也没有证明门状态碰撞或整个探索路径已完成。后续必须接门户、取物链、门两侧状态、完整 Cartridge/Session 和素材后再做真实试玩。

### 供电房间往返规则（2026-09-15）

候选空间现已有配电间→信号室及返回的显式门户、落点和 map 命令。`explorationCircuitRules(locale, save)` 从当前权威事实选择门的通行依据（锁通电、门撑固定、内侧释放），每次裁决前必须按当前 save 重建规则，禁止缓存先前开门时的规则集合。关门不能进入，进入后无法跨房间操作外面的保险丝；返回取回保险丝后，未撑住的门重新不可进入。机械释放仍仅限门内。

7 项规则/空间测试与类型检查通过，新增中英文开锁进入、返回、取回后再进入被拒绝路径。现仍未安装到主入口或 Session；地图门户存在不等于已有真实门动画、门洞碰撞、素材或可操作完整新版。

### 空背包取物候选验证（2026-09-15）

供电规则候选初态改为保险丝仍在柜内、柜门未开、门撑未取走。开柜/取保险丝/取门撑均为现有 Core 的事实及库存命令，空间投射提供柜内保险丝和架上门撑的可见性。空背包路径覆盖先取工具和先读亮灯线索，重复取得被拒绝，序列化后仍只有一枚保险丝。尚不是完整地图两条探索路线：候选工具架仍在供电布局内；需要按需求中的自然出入口空间方案重新装配。

## 2026-09-15：新故事前的普通出入口适配

`src/spatial-door-travel.ts` 从站区候选中提取普通过门准备逻辑，输入为当前 `StorySave`、实际 `StoryCartridge`、已编译空间绑定和 action/target/scene/position。它检查故事身份、距离、动作唯一性与门的当前条件，只允许零个或一个 map 效果；同一故事地点内的两个房间可用零 map 效果配显式 portal。使用已有 Core resolver/reducer，不调用 AI，不创建数据库。返回新的 save/scene/position，由后续正式 Session 在版本检查下原子提交。

普通移动不重算无关的回合道具指标，也不替换当前 choices、追加到达正文或推进场次。缺失 portal、伪造目标、非移动副作用或当前落点不可行走均拒绝，原 save 不变。旧 `prepareStationTravel` 保留为薄包装，站区内容仍处于暂停候选状态。

验证：`node --import tsx --test _qa/spatial-door-travel.test.ts _qa/exploration-station-plan.test.ts` 共 10 项通过，其中 7 项覆盖通用准备函数，包括同地点 20 次往返、JSON 序列化后的房间恢复、跨地点返回、锁状态/落点变化及拒绝副作用。JSON 回读不是正式持久化验证。这一函数尚未接新故事的 Session/UI；没有新美术、浏览器通关或部署完成的含义。完整旧街设计假设在 `doc/requirements.md`，题材尚非用户最终选择。


### 空指标故事类型适配（2026-09-15）
本项目 `src/vendor/original-train/types.ts` 将 `statDefinitions` 从恰好三项放宽为 `StatDefinition[]`。现有初始化、规则更新与危险计算使用遍历/查找，可接受空列表；未修改原作三条定义或已有存档。`_qa/spatial-core-resources.test.ts` 4 项覆盖中英空指标初始化、物件/事实规则执行、未定义数值不被创建，以及原列车 68/82/58 初值保持。与出入口测试合计 14 项通过。这是本地 vendor 适配，不声称其他项目或冻结模板已同步；正式空间入口、电影式开场图片和新故事 renderer 仍待接入。


## 2026-09-15：旧街故事规则草稿

`src/old-street-cartridge.ts` 为本工程新增双语独立内容定义，使用 `old-street-letter` cartridge ID，不继承列车故事、人物、数值、音乐或图片。主题 token 只是未接界面的草稿值，不是已验收的电影式 UI。定义 8 地点与 10 对出入口，23 个物件/人物/结束动作以及 20 个定向过门规则，仍由已有 Domain resolver/reducer 执行。物品借出状态、唯一取物与结果读取来自 StorySave。`oldStreetOutcome` 是事实投射，不是正式结局提交；`oldStreetAdmission.ready=false` 列出尚未接通环节。

`opening.imageMode` 为可选 `generated | none`，只控制初始化自动开场图块；未配置保持原作行为，none 不创建该图块，因此 enterStory 不会为它排队。不改变已有档，也不宣称后续图片调度已全面关闭。

`_qa/old-street-routes.test.ts` 9 项通过：中英各自两条取信路径、完整可选帮助/撤回记录、错误地点和重复借还恢复，以及旧列车开场图仍排队。加 `_qa/spatial-core-resources.test.ts` 合计 13 项通过，TypeScript 检查通过。脚本只调用实际 Core 和当前草稿，JSON 恢复仅证明序列化后规则可继续；不包含 renderer 距离、真实数据库、模型、手机或平台验证。未改生产路由/UUID/存档，未部署。

## 2026-09-15：旧街空间布局与实际寻路绑定

`src/old-street-space.ts` 把草稿的 8 地点、10 对连接及 43 个领域动作编译为同一 `SpatialBindingDefinition`。门的朝向与两端接近点来自配对布局；23 个非过门动作绑定到抽屉、小格、记录册、推车、旧箱、人物待准入位置等目标。`lift-latch` 仅绑定工作棚侧院门。地面矩形、物件占地、9×15 脚底、出生点和 54 单位接近距离供后续 renderer 与服务器共用；此为白盒坐标，未冒用旧背景。

`oldStreetWalkable` 检查地面边界与实体碰撞，`oldStreetPath` 调用现有游戏的 `findGridPath`。清理前旧箱留在台阶附近；清理后箱体移动到院内空地，碰撞同源改变。关闭的出口仍可走近，但由当前规则拒绝穿越；不能仅靠装饰性的门图判断权限。

`_qa/old-street-space.test.ts` 5 项通过：清箱前后所有行动目标从出生点可达；屋顶/地下两条路线逐门运行真实路径搜索、接近准入及 `prepareDoorTravel`，通过捷径回店取信并离开；关闭台阶拒绝，清理箱子不消耗推车且实际碰撞位置改变。每次过门 JSON 回读保存准备结果，不等于服务器事务或真实存储验收。类型检查通过。

仍未挂到实际 RPG-JS 页面：当前无渲染截图、人物动画、触控手感或正式部署证据。下一步使用现有 `createRpgRenderer` 和独立开发入口接此同源布局，不能另建一个只为演示的地图真源，也不能把规则测试当作可操作画面完成。


## 2026-09-15：旧街实际 renderer 装配与清障复验

本节更新上节“尚未挂到页面”的阶段状态。`src/old-street-dev.tsx` 在现有工程内使用 `createRpgRenderer`，仅 `oldstreet-dev` 构建模式、本机 hostname 与 `?debug=1` 同时满足时从 `src/main.tsx` 进入。未新增游戏 UUID、公开入口或后端。当前旅程仅保存在组件内存，刷新重开；不能用于正式续玩。

8 张 `public/map/oldstreet-*.tmx` 由 `scripts/export-old-street-maps.ts` 从 `oldStreetTmx` 导出，边界与空间路径共享 floor 定义。可变箱子的绘图占地、目标标签、接近点和碰撞统一读取 `oldStreetProjectedProps(save)`，清箱后一起移到院墙空地。UI 按钮先由 RPG-JS 寻路走近，再用既有 Core 执行动作；过门调用 `prepareDoorTravel`。这仍是客户端准备过程，不能冒充服务器原子提交。

启动实测中，仅浏览器 `Image.decode()` 成功时角色仍不可见；显式 `Assets.load({src, parser:'loadTextures'})` 预载同一图集后，实际 RPG-JS 人物正常显示。宿主固定为 384×576，再由已有 renderer 缩放；避免宿主百分比尺寸与引擎重复缩放。未修改第三方引擎，也未使用 DOM 人物替代。

CUA 实际点击记录：屋顶路线已完成借钥匙、打开院门捷径、返回取信并确认回家；地下路线已完成先被旧箱阻止、去洗衣店借推车、清箱、下楼并进入工作棚。随后发现清箱标签滞留旧位置，修复后在 5452 构建页新建内存旅程复验：箱子与标签同时移到院墙，地下储物室可进入，背包仍保留推车。截图观察为约 365×676 的 in-app 浏览器 external-guest 状态，非真实 iPhone、非 AlterU 内完整验收，不能据此判定手机构图通过。

本轮自动检查：路线、空间与零资源兼容共 19 项通过。地图文件一致性检查覆盖实际导出的 TMX。仍缺正式 Session 接入、断线/刷新恢复、实体角色及关系、照片比对输入、自由输入适配、新场景美术和正式结局提交；`oldStreetAdmission.ready` 继续为 false。人物位置按钮与白盒矩形仅属于这个隔离开发入口。


## 2026-09-15：旧街接入既有 Session 事务内核

`server/old-street-runtime.ts` 新增 `SessionRuntime<OldStreetHead>` 策略及薄 `OldStreetAuthority` 包装，复用 `SessionAuthority` 的事务、回执、journal、checkpoint 和 prepare/commit。内容策略只负责当前地图/目标/距离准入、Core 规则及 `prepareDoorTravel`；保存的 head 同时包含 StorySave、sceneId、position、mapVersion 和 version。默认展示准入拒绝创建；未接任何生产 HTTP 路由，没有另建公开后台。测试显式使用 synthetic admission，不能用于声明美术已准入。

`_qa/old-street-session.test.ts` 六项通过：中英各自 15 次行动的磁盘 SQLite 关闭/重开与丢回执重放；旧 checkpoint 拒绝；跨 owner 读取拒绝；旧列车数据库不被重新解释；回执写入失败时房间/故事/journal 一起回滚；跨场景/目标/非法坐标拒绝；准备后的展示准入撤销与后续版本提交不会被旧候选覆盖。末尾保存的是 `departed` 事实，仍不是正式 Finale 生成/展示合同。真实模型输入暂不开放，free-input 明确拒绝，不能把 authored action ID 的执行称为自由输入接通。

当前浏览器白盒仍使用组件内存。后续需在同一工程接 HTTP、持久身份与 pending 回执恢复，再把客户端直接 reducer 调用移到该权威边界；还需设计同一部署内旧列车与新内容的显式存储路由，禁止将现有列车表交给旧街策略。尚无浏览器刷新续玩或生产 Worker 证据。


## 2026-09-15：浏览器接入本机持久 Session

本节更新上一阶段“组件内存”的限制。`src/old-street-session.ts` 使用既有 `RecoverableSessionClient`，借用 UUID 隔离的 `alteruLocalStorage` 仅保存旅程指针和 pending 请求；动作结果、背包、地图事实及位置来自服务器。`src/old-street-head.ts` 提供共用 head 校验。页面启动依次 enrollment/recover，再按服务端房间和落点启动 RPG-JS。UI 不再直接执行 reducer；动作确认后等待 renderer.restore 完成再开放输入。每秒保存可走位置，旧版本 checkpoint 由服务端拒绝；网络失败暂停并提供重新连接入口，pending 不清除。

`server/old-street-dev-plugin.ts` 仅在 `oldstreet-dev` 模式启用，路径为当前 GAME_ID 下 `/api/oldstreet-dev`。限定 loopback host、同源请求及 JSON body，16 KB 请求上限。HttpOnly/SameSite 本机身份 cookie 不代表 AlterU 可信账号；不把该开发身份方案用于生产。数据库默认 `.data/oldstreet-dev/journeys.sqlite`（已被 gitignore 排除），可用 `OLDSTREET_DEV_DATA` 指定本机位置。它与旧列车库分离，未新增公开游戏/UUID/云数据库。生产 Worker 仍需内容路由及真实展示准入。

实际 CUA 5453 开发页面：街口→院落→洗衣店借推车，刷新后仍在洗衣店、持有推车、可归还；继续过门返回院落成功；清箱后再次刷新，地下储物室入口仍开放、推车仍保留。这是浏览器经 HTTP 到 SQLite 的刷新续玩实证；不是跨设备登录、云端 Worker、完整故事或最终美术验收。旧街 Session 六项与现有客户端三十项回归通过，TypeScript 与 oldstreet-dev 构建通过。


## 2026-09-15：人物首次介绍、连续记录与状态对白

`src/old-street-characters.ts` 定义三位固定隐藏角色和实体绑定。Cartridge 初态不加入 roster，服务端在实际人物互动时将可见介绍、回应和稳定角色 ID 一起写入同一次 Session。`recordOldStreetInteraction` 仅处理 authored 成功动作，既有 Domain reducer 继续负责物品/事实；不靠名字预载、未来剧本或模型猜测加入角色。普通过门不介绍人物。角色保持 known，不自动加入同行。归还钥匙、旧钟、照片各生成唯一轴的关系事件，反复借还不刷分，不新增常驻指标。

增加三个人物问候动作，空间规则从 43 增至 46。客户端目标标签在当前权威 roster 已介绍后采用姓名，刷新仍保留。人物仍只有开发位置标记，没有声称实体图集准入。所有成功物件动作及人物回应追加到 StorySave.blocks，唯一 block ID 使用 action receipt，重复请求由 Session 回执重放。

CUA 同一已有旅程实测：在洗衣店向“店主位置”打招呼后可见阿岚介绍，按钮变为阿岚；刷新后名字保留，再次交谈不重复介绍。实测发现清箱后旧问候仍说台阶受阻，修复为读取 crates-cleared/trolley-borrowed/letter-taken/yard-unlatched/photos-returned 后续事实；复验显示“推车用完放回来就行。院里的台阶已经通了，谢谢你。”。先前已归档的旧对白作为历史不重写。

路线/空间/Session 共 23 项检查通过，后续状态对白及 Session 共 10 项通过，TypeScript 通过。检查覆盖中英初态隐藏、到场未交谈仍隐藏、介绍一次、重读保持、重复归还不刷关系、清障后不说旧状态。没有真实模型调用、生产部署或完整人物视觉验收。


## 2026-09-15：文字行动进入同一 Session

`src/old-street-action-input.ts` 将按钮动作名称移为共享定义，增加完整句匹配的有限中英别名。只规范大小写、空白、NFKC 及句尾标点，不使用子串匹配或从句中截取动作。`OldStreetRuntime.prepare` 对 free-input 先检查场景/位置/实体距离，在当前目标动作集合中解析，然后与按钮共用 binding、Domain resolver、人物记录及事务；未识别输入返回 OLD_STREET_INPUT_UNSUPPORTED，不生成故事或物品。客户端将该确定拒绝纳入 pending 收束，显示可理解的重述提示。未知网络结果仍保留 pending。

开发 UI 增加目标关联输入框与发送按钮；执行前寻路走近，恢复输入后采用最新服务端 head。回家与出入口不从自由文本触发，原有可见按钮保持；这些文本场景是当前功能边界而非完整自然语言能力。没有调用真实模型。

Session 套件 10 项通过，其中新增中英文字借推车、同回执重放、否定/能力询问/复合意图/内部编号拒绝、对店主输入还推车不能跨目标执行。CUA 5453 实际输入“还推车”，库存变为无，按钮恢复“借推车”。


## 2026-09-15：安静探索结局进入 Core Finale

`src/old-street-ending.ts` 使用既有 `buildEndingSnapshot`/`finalizeEnding` 保存确定性的 authored 结果。leave 动作在同一 Session 写入中设置 `sessionEnded` 与 `finale.status=complete`，保留快照与稳定 ending/snapshot ID。没有额外模型或图像任务。探索题材不复用列车候选校验中“必须有损失、4–6 幕及结尾图片”的叙事限制；结果由当前事实直接构造，不接受外部候选写入。

只展示实际交付、归还和获准记录，未认识人物不进入 epilogue，借出未还物件如实列出。客户端结果页读取保存的 ending，不依赖最后一条临时 notice。旧街已 departed 的早期本机档由 runtime.upgrade 补齐结果，保留原 inventory/facts/blocks/characters/relationships；不迁移旧列车。完成后既有动作拒绝规则仍阻止继续写剧情。

结局与 Session 13 项通过：中英完整路径磁盘恢复含 complete Finale；相同请求只结算一次；无提前完成、无虚构人物、未授权照片不进 preserved、无强制损失或图像生成；旧草稿补齐不改原状态。结果页小屏可滚动。真实平台发布尚未进行。

实际通关暴露的修复：关闭院门只选择目标并显示拒绝原因，不提交必定失败的过门请求；这样“抬起插销”动作仍可见。服务端拒绝其他动作时，同场景保留原目标选择，避免错误提示后把玩家操作对象清掉。

实际 CUA 在 5453 同一本机旅程完成：洗衣店→合住院→地下储物室→工作棚，借钥匙、打开插销、经院落回修表铺开格拿信，回街口确认回家。结果显示信件已交付，并准确显示未归还的小格钥匙；未列出未完成的钟/照片支线。oldstreet-dev 构建通过。

结局刷新实证：同一页面 reload 后仍显示同一标题、交付结果及未还钥匙，未回到开场，也未生成第二份信。截图为 external-guest 开发白盒，不能作为平台内最终视觉验收。


## 2026-09-15：受限意图解释器接线

`oldStreetRuntime` 可注入既有 `OriginalActionInterpreter`。free-input 先执行完整短句匹配；仅未匹配且显式 mode=live 时调用解释器。候选只包含当前实体、当前位置已经可做的动作，排除离开确认和未支持的过门文字动作；上下文仅含 locale/sceneId/target/objective/actions，不包含未来人物、地图或整份存档。位置、距离和展示准入在模型调用前检查，调用后再走同一 binding/Core/事务版本验证。所有效果仍为 author 规则，回执附已采用的 interpretation，不将模型答案当作故事正文。

本机 plugin 使用既有 `originalPreflightModels` 的双请求解释/复核 provider，需显式 `OLDSTREET_MODEL_TEST_BUDGET`（2–12 次上游调用）启用，重启时可传 `OLDSTREET_MODEL_TEST_USED`；未配置默认禁用。开发 URL `interpret=live` 仅选择调用模式，不能自行获得服务端预算。未进行真实网络调用，未改平台生产 provider。进程内预算不是云端计费限额，正式接入仍需平台验收。

Session 12 项通过，新增注入式合成模型实证：只收到借推车动作；丢回执不重复解释；返回拿信等外部动作拒绝；模型返回前已有新操作时旧结果版本冲突；模型抛错不更改状态。原有 provider 包含独立语义复核和 20 秒超时，但这些测试不证明真实模型语义质量。


## 2026-09-15：照片比对输入与平台图片候选

`src/old-street-photo-puzzle.ts` 定义 laundry-print-1 的候选与方向合同。`old-street-photo-view.tsx` 在放大台显示左半图、三片候选、半圈旋转及确认；`OldStreetRuntime` 在执行 match-photos 前校验 photoMatch。错误、缺失或旋转错误均不更新照片事实/库存；文字及模型选中动作也不能绕过。候选是同一图的左右裁切和镜像，CSS 展示不修改原文件。临时选择未完成时可退出；结果仍由同一 Session 保存。

通过平台媒体 API 发起一次 text 请求，沿用本游戏 UUID，request_id/task_id/源 URL/原 PNG SHA 记于 doc/oldstreet-photo-candidate。原始生成文件保存在 public/assets/oldstreet/laundry-print-v1.png。只读视觉检查确认窗沿、绳线和台阶可供比对；中心白缝和边框未遵守完整照片提示，当前仅候选，未提升为最终美术准入。没有生成额外人物或更改场景 B 视角。

结局页“重新探索”调用既有 enrollment(restart=true)，保留旧旅程，在新服务端 head 装载完成后恢复输入，pending 未清时由恢复客户端禁止重开。

Session 套件 13 项通过，新增实际规则路线取照片、缺失/错误/反向配对不改档、正确配对后才可归还；TypeScript 通过。真实拼图视觉与交互另行记录，不以规则测试替代。

CUA 5453：从结局点击重新探索，走完整清障取照片路线到照相馆；特写显示左片与三候选。候选 1 提交后面板内显示不匹配，照片夹保留，可继续选择；候选 2 正向拼合提交成功。图片为无人店面，成功文案已从“合照”修正为店面旧照；此图未提供钟底燕子刻痕，不宣称已完成那条视觉线索。

配对后 reload 仍可交还照片；实际交还后照片夹从背包移除，许青可见介绍、稳定姓名及“询问可留下哪张照片”出现。新旅程实际操作未清除之前结局，未进行正式平台部署。


## 2026-09-15：角色尺度、脚底与旧街地图版本

只读检查 hero-gait-v2 的正面站立帧 alpha bbox 为 (114,102)-(249,330)，主体高度 228 原图像素。原 .14 缩放仅 31.92 世界像素；旧街改 .24 后为 54.72。`oldStreetBody` 改为 16×26，图集脚锚偏移同步 8,26；距离步幅从 55 按相同比例变为约 94.29，行走速度仍为 110 世界单位/秒。B 图集本身未编辑。

共享 `createRpgRenderer` 新增可选 heroBody/strideLength，默认仍 9×15/55，其他游戏消费者保持原行为；actorSheet 新增可选 foot，默认仍 4.5,15。服务器两处 setHitbox、寻路、步态及目的地标记同步使用相应配置。新占地检查发现院落台阶接近点与旧箱相交，把该台阶落点移至离北边 16 的上方平台，其他门布局不变。

旧街 mapVersion 升为 oldstreet-blockout-2。旧版本先按 9×15 验证，再使用新占地保留可用原点，必要时在附近 64 单位内寻安全点；仅无近点时使用当前房间出生点。原 story/库存/人物/关系/旅程 ID 与故事 version 保持，不解释旧列车存档。迁移重复读取稳定。

空间/Session 19 项与 Session/步态/图集 29 项检查通过；迁移包含旧版靠墙落点在原房间就近调整且整个 StorySave 不变。CUA 5453 旧旅程恢复后，许青与推车仍在，角色可继续行走；实际显示角色放大。当前约 365px 宽 external-guest 白盒仍有标签遮挡，非最终平台视觉或 iPhone 步态验收。

### 旧街地面纹理装配（2026-09-15）
`src/old-street-floor.tsx` 从 `oldStreetFloors` / `oldStreetDoors` 绘制底层地板与门槛。店铺使用通过 Vite import 打包的 `src/assets/oldstreet/watch-shop-surface-v2.png` 干净内部纹理，缺图仍有木色底层；其他房间沿用共享坐标白盒。裁切仅发生于 SVG 显示，完整原图与来源 SHA 保留。此组件只接本机 oldstreet-dev 入口，不改变正式原作旅程或生产素材准入。

### 物件状态与占地同步（2026-09-15）

`old-street-prop-state.ts` 负责物件状态文字投射；`oldStreetObstacleBodies` 在 trolley-borrowed 时移除推车占地，保留停放点的交互绑定供归还使用。`OldStreetAuthority` 在非转场行动提交新状态时调用 oldStreetSafePosition，处理物件归还后新增碰撞。SQLite 测试覆盖站在空停放点归还、库存移除、碰撞恢复、合法邻近脚点、同请求重放与恢复；不改变原列车存档。

### 旧街正式服务合同接入（2026-09-15）

新增 `/api/oldstreet` Worker 路由、`old-street-http.ts` 与 `old-street-runtime-contract.ts`。前端 `oldStreetSessionHttp` 复用 cloudTransport 的私有凭证、健康握手与 RecoverableSessionClient；默认 API 来自 getGameApiBase，存储使用调用方提供的 UUID scope，内部 key 为 oldstreet-story-1:。Worker 只从 Bearer 凭证散列得到 owner，转发时覆盖客户端身份头；新故事路由到现有 Durable Object namespace 的 oldstreet-v1:<owner>，旧 original-v8 对象保持不变。目录、读档、行动、位置检查点与事件均经同一个 SessionAuthority。OLD_STREET_RELEASED=false，且默认 OldStreetGate 仍拒绝未准入画面；测试注入 gate 不能作为发布依据。本机 cookie 开发连接保留，未静默迁移它的存档到云端。账号绑定及清除浏览器身份后的恢复不是这套私有凭证合同自动提供的功能。

### 浏览器装配 Worker 通信（2026-09-15）

在同一个 oldstreet-dev 页面使用 `?debug=1&session=worker` 选择 oldStreetSessionHttp；无该参数仍恢复原本 cookie 开发旅程，不迁移或清除旧档。`old-street-worker-preview.ts` 仅在 oldstreet-dev 的 Vite 开发/预览服务器安装，将带游戏 UUID 前缀的 HTTP 请求按正式宿主合同剥去前缀，然后交给实际 createHandler/CarriageJourneyAuthority；底层使用 .data/oldstreet-worker-preview 的本地 SQLite。接口仅允许回环 host、同源请求、JSON 与有界 body，凭证及运行版本检查由正式 Worker 执行。测试用美术 gate 只在此本机适配器注入；正式 OLD_STREET_RELEASED 仍关闭。

### 旧街解释器注入与调用边界（2026-09-15）

CarriageJourneyAuthority 接受独立 oldStreetInterpreter 注入，传入 OldStreetAuthority；正式 release 为 false 时不默认创建旧街在线解释器。本机 Worker 预检复用 originalPreflightModels 的显式 2–12 请求额度，所有预检对象共享本进程预算。src/old-street-action-input.ts 在规范化及别名匹配前运行 originalActionIntentIssues。scripts/test-oldstreet-live-actions.ts 新建内存旅程，真实模型调用上限 6，逐例保存不含玩家身份的结果与用量；不作为日常单测执行。

### 人物短交谈与分别记忆（2026-09-15）

src/old-street-conversation.ts 从权威 facts 生成短话题，按 oldStreetSpeakerId/oldStreetConversationId 配对保存玩家输入与回复，只读取该人物最近四轮完整记录。OldStreetAuthority 新增 dialogue 请求类型，先校验当前场景、距离、人物身份与可见介绍，随后只追加 blocks 并增加旅程版本，沿用 SessionAuthority 的事务和幂等回执。回忆只引用历史玩家原话，不把玩家声称发生的事变成权威事实。前端话题按钮及输入通过同一 execute/send 入口走近后提交。

### 旧街在线短对白（2026-09-15）

server/old-street-dialogue.ts 构建当前人物的最小已知上下文，createOldStreetDialogueGenerator 用同一截止时间执行生成与语义复核。只接受 text/knowledgeIds，最多300字符，不返回动作命令；未准入外貌显式标记为未知。OldStreetAuthority 先检查场景/距离/介绍/美术，再选作者回答或在线生成，最终只追加成对 blocks。超时、拒绝及未开启均为可恢复终止错误。Worker 和两种本机适配器支持独立对白注入，本机请求与行动理解共享原有进程额度；额度未开启不联网。scripts/test-oldstreet-live-dialogue.ts 需显式开关，最多四次真实请求，普通测试不调用。

### 修表师实体候选（2026-09-15）

old-street-dev 在启动前显式 Assets.load 灰发图集纹理，通过 actorSheet 注册 oldstreet-watchmaker。在工作棚 mapEvents 创建 RPG-JS 事件，through=true 只避免引擎重复碰撞，实际碰撞仍由 oldStreetProjectedProps/oldStreetWalkable 权威数据处理。近处玩家位置变化时更新站姿朝向，其他场景不更新该引用；跨场景重新 onInit 绑定事件。NPC图集对象URL在卸载时释放。

### 旧街第二实体角色候选（2026-09-15）

`old-street-dev.tsx` 在洗衣店装配平台生成的阿岚四向静态候选，工作棚仍用 B 视角修表师。`actor-sheet.ts` 的 `standingActorSheet` 接受4×1帧格、源脚点、缩放和碰撞脚点，只暴露stand；它与旧3×4步态图集独立。两位NPC的实际RPG事件和透明触控入口共用空间实体坐标，靠近时转向，不增加独立剧情状态。候选原图、失败记录与去底脚本位于 `doc/oldstreet-lan-candidate`、`scripts/prepare-oldstreet-lan.mjs`；正面站姿与部分原走动帧仍不合格，当前开发入口使用静态候选，正式发布准入保持关闭。

### 洗衣店地面与几何参考（2026-09-15）

`export-old-street-art-guide.ts [room]` 从真实floor/door导出对应PNG/SVG几何参考；不传参数仍生成原修表铺路径，未知room直接拒绝。`old-street-floor.tsx` 把修表铺/洗衣店表面作为独立配置，按审阅后的源图区域显示到对应floor矩形；墙边与门口全部从空间布局生成，没有导入生成图的门宽、机器或通行边界。其余房间仍为白盒地面。类型检查、oldstreet-dev构建及真实浏览器洗衣店→院子往返检查完成，正式视觉准入和平台发布仍未完成。

### 推车实体状态图（2026-09-15）

`old-street-prop-art.ts` 从StorySave事实投射推车stand/hidden两种明确opacity状态；`old-street-dev.tsx` 在laundry安装固定事件并在每次head更新后同步，不动态删除图形节点。碰撞、接近点继续读取空间布局。执行与重开先设置新权威视图再调用renderer.restore，地图事件重建时不会读取旧借出事实。素材处理脚本及限制见 `doc/oldstreet-trolley-candidate/review.md`。尚未实现推车随行/推动动画，当前借出物件进入背包。

### 已发现街区地图（2026-09-15）

`old-street-map.ts` 从既有StorySave.map的visited/current筛出地点，连接复用oldStreetConnections；两端均已到访才可显示。BFS只穿越已知且gate为true的通道，读取不写存档。`old-street-map-view.tsx` 为原生modal dialog，查看地点只改变面板选择；主角暂停，关闭恢复原地操作与入口焦点。数据无需新增字段或迁移。地图是拓扑连接示意，不宣称符合实际距离或方向。

两个针对性测试验证未来区域不泄露、路线不穿过未探索区域、门闩/旧箱影响路线以及JSON回读与不改存档。实际CUA已验证现有旅程不显示未到访屋顶，洗衣店到工作棚路线经院子和地下室，门闩保持关闭；关闭后仍在洗衣店，焦点回到街区按钮。类型检查与开发构建通过。约365px开发视口截图可读，320×568/390×844精确尺寸与英文长标签尚待实机复验。全仓UI扫描仍含历史构建包等既有告警；本次新地图组件未出现在报告中，不将这视为全仓UI通过。

### 随身与发现回看（2026-09-15）

`old-street-journal.ts` 只读投射既有inventory/facts：物品短说明、取信主线目的与亲自确认的发现。未观察的刻记和未拼合照片不输出；物品归还不删除既有知识；记录册当前公开状态随recorded事实改变，撤下后不会保留过时“已入册”说法。不摘要模型历史，不新增存储。

`old-street-journal-view.tsx` 复用纸色原生dialog，随身/发现分开，打开暂停、关闭继续并恢复入口焦点。中英两项真实领域动作序列测试覆盖观察、归还、JSON回读、同意、入册、撤回；已修复union条目count类型收窄，类型检查通过。实际CUA约365px开发视口验证：仅放大镜在背包，已拼/归还照片和清障结果在发现，未出现未发现钟底刻记；关闭仍在洗衣店，焦点正确。精确320/390手机尺寸、英文长列表及平台内验收仍待完成。仓库UI扫描仍报告历史构建包等既有项，本次新增journal组件没有命中；不宣称全仓UI已通过。

### 钟底刻记观察（2026-09-15）

`old-street-clock-view.tsx` 显示平台生成的实际钟底图，全貌点区域后放大2.8倍，辨认结果连同`clock-underside-1`版本、区域和倍率提交。`old-street-clock-puzzle.ts` 的合法区域来自图像审阅；`old-street-runtime.ts` 对按钮和自由输入解析出的inspect-clock统一检查clockInspection，再执行原领域规则。错误不改变事实/版本，成功沿用clock-mark-known和日志，不新增第二份存档。客户端将缺少观察结果视为可恢复拒绝，错误提示留在特写，正确结果回到地图。旧发现保留，已完成动作不重复奖励。该协议验证游戏输入，不声称具有防作弊或视线追踪能力。

类型检查、开发前端构建、Worker构建、18项Session和5项Worker检查通过。具体图源和视觉限制见doc/oldstreet-clock-inspection/review.md。

### 自由输入与特写衔接修正（2026-09-15）

旧实现的自由输入检查/比对请求只收到“需要观察”提示，未打开可操作界面。现由 `old-street-inspection.ts` 对恢复后的最新head重新确认当前场景、目标及领域前提，收到CLOCK_INSPECTION_REQUIRED或PHOTO_ALIGNMENT_REQUIRED时打开相同特写并保持暂停。规则条件检查移到观察结果校验之前，缺少旧钟/放大镜/照片时返回ACTION_UNAVAILABLE，不泄露提前观察机会。完成后的线索、跨场景恢复、目标不匹配均不开图。可恢复拒绝显示正常玩家提示，不直接打印该内部代码。

19项相关测试通过，包括真实Session中无物品的自由输入拒绝、具备物品的自由输入要求观察，以及最新head已完成/物品已归还/场景变化时前端辅助函数拒绝开图。此前真实浏览器已验证两个特写本身；本次自由输入自动开图的浏览器端到端路径尚待新测试旅程复验。

浏览器补验：在已完成刻记的现有旅程中再次输入“检查钟底”，没有重复开图/结算，仍可继续操作。拒绝提示优先读取可解析行动的领域原因（例如已处理过），不是一律暗示缺物品。正向自动开图仍需未完成该节点的浏览器旅程验证；不重置现有测试进度来伪造新状态。

### 旧街行动拒绝的站位连续性（2026-09-15）

`old-street-dev.tsx` 到达互动点后暂停移动，并在与周期 checkpoint 相同的 Web Lock 中写入当前位置，再调用原有可恢复 Session 行动。拒绝后恢复到实际到达点；位置写入不改变剧情版本。`STALE_POSITION` 交由随后行动的版本冲突恢复获取最新 head，其他保存失败暂停并保留错误，不能伪装成功。事务测试覆盖拒绝不改剧情和旧 checkpoint 无法覆盖新场景。

### 照片特写对话框（2026-09-15）

`old-street-photo-view.tsx` 使用 `HTMLDialogElement.showModal()` 和卸载时 close，cancel 事件统一到受 busy 保护的 dismiss。继续由父组件暂停/恢复 RPG renderer，证明输入仍经 Story Session 验证，不在组件内修改库存或发现。

### 摄影师实体候选（2026-09-15）

old-street-dev 加载 xu standing 图集并创建摄影师 RPG event，共享 NPC 靠近转向、深度排序和销毁资源流程；old-street-space 将其接近点统一到+44。prepare-oldstreet-xu.mjs 输出来源锁定的去底、分帧及镜像记录。叙事介绍仍由原有 Session 提交，修改介绍只影响未来首次登场。

### 人物交往投射（2026-09-15）

oldStreetJournal 新增 people，读取 save.characters 已介绍状态和 save.relationships。当前三条 authored encounter 文案同时校验 characterId 与 axis，防止跨人物误归因；不从全局 fact 推断人物已见，不修改存档。OldStreetJournalView 增加人物页，旧数据结构和原作保持兼容。中英回归覆盖未登场、首次介绍、关系事件、JSON回读和跨人物错误事件。

实际 Worker 测试旅程刷新后，人物页显示老周（修表师）、许青（摄影师，已找回并交还旧照片），未认识的阿岚不出现。约365px external-guest 截图三个页签、姓名和短句无溢出；不代替精确320/390或平台内验收。4项 journal 中英测试、类型与开发构建通过。

### 已提交对白投射（2026-09-15）

old-street-turn.ts 比对同旅程、同场景、恰好增加一版的 head，按 block id 提取新 narration/dialogue，且只在包含真实对白时启用气泡。拒绝、恢复较新版本或转场不展示错误的旧回合。原有 notice 继续承担普通操作/错误反馈，并清除旧 turn；完整正文仍在 StorySave，不从 result.text 切句或生成重复摘要。

实际浏览器通过“这座楼梯通到哪里？”验证两条署名气泡（你/许青），无正文复制或旧回合混入。选择不同实体清除前一人物气泡。当前外部访客窄屏仍可纵向滚动，整页视口布局尚未作为正式手机体验通过。新增投射测试、类型检查与开发构建通过。

### 视口分配（2026-09-15）

old-street-dev 的 os-world 使用 ResizeObserver 测量实际剩余宽高，stage宽为min(width,height×2/3)、高为宽×1.5；沿用点击坐标转换和真实renderer host缩放。固定主容器限制页面外溢，os-actions自行滚动；os-turn移除第二层滚动，避免嵌套滚动。observer卸载时disconnect，世界布局/碰撞坐标不修改。

浏览器复验发现点击低位话题会保留行动区旧滚动位置而遮住新回复；新 turn/notice/error 到达时将该区scrollTop归零，复拍后提问、回答和底部摇杆/行动按钮同时可见。测试中手动关闭外部guest banner检查构图，不修改生产shell；仍未宣称精确320/390与软键盘设备验收。

### 旧街旅程目录（2026-09-15）

OldStreetAuthority.directory 在原 owner 隔离目录上增加 complete；Worker已有GET /sessions，cookie开发桥补同合同。旧街上限本为每身份100旅程，列表覆盖全部；不读取跨身份数据。OldStreetJourneysView使用原生modal，空/载入/失败重试状态分离。selectJourney调用原RecoverableSessionClient.selectSession，沿用pending门禁，再恢复权威head、renderer和完成状态。

周期位置保存跳过已完成或位置未变的旅程；成功后更新serverHead中的确认位置，避免原地重复写入不断刷新目录时间。切换失败关闭列表并显示恢复错误，不在modal背后隐藏错误。

实际本机Worker浏览器从含照片/旧钟结果的新旅程切换到较早只取信的旅程，后者库存只有钥匙、结局不含支线结果；新旅程仍在目录中。25项Session/Worker测试（含新目录身份隔离与重开保留）、类型检查、开发构建通过。不是平台账号跨设备自动识别验收。

### 抽屉图形状态（2026-09-15）

oldStreetDrawerPose读取drawer-open/lens-taken，oldStreetDrawerSheet三格纹理锚定台脚；独立RPG固定事件共享原drawer身份，恢复head后更新animationName，卸载释放blob。没有新增图形专属存档。prepare-oldstreet-drawer保存原图，以指定区域/纸片轮廓修复第三帧，再连通去底，所有操作可追溯。


### 2026-09-15 默认入口调整：新版探索试玩

同一个 UUID 默认进入旧街探索，并在场景标题旁标注「试玩」。旅程菜单底部「旧版参考」展开后进入 `?story=original`；旧版设置可返回新版。两版 Worker 命名空间及浏览器存储前缀继续隔离，不迁移或覆盖旧进度。默认页面不显示 renderer diagnostics，只有 `?debug=1` 显示。

本次是公开试玩开放，`OLD_STREET_PREVIEW_RELEASED=true` 与正式验收 `OLD_STREET_RELEASED=false` 分开。候选素材与尚未完成的场景美术仍未正式准入，在线模型默认不因试玩开放而开启。主站使用原有私有 capability 会话；Pages 只提供前往主站的静态入口，不连接源游戏后台。

用户随后决定优先本地验证玩法，线上同步、网络延迟和平台内测试延后。用户最终确认本轮发布一次新版试玩；此后停止频繁线上发版，在本地完成玩法、内容和画面打磨后统一发布大版本，再集中验收网络功能。`npm run dev:playtest` 在 5455 提供新版默认试玩和旧版参考，两个本机持久化服务共用页面入口并保留各自数据库。

发布节奏补充：优先本地迭代；阶段交付或必须在线验证才能继续时允许发版。减少频率，不把必要网络验证机械推迟到最后。本轮提交 2b855e2 的主站已发布，镜像验证另记结果。

测试方式补充：目的是减少对用户远程解锁和保持 Telegram/AlterU 前台的依赖。地图、碰撞、解谜、角色关系、分支、旅程恢复优先通过本地可重复测试；接口可直接验证，不把所有网络测试等同于必须解锁。只有真实宿主桥接、平台内画面/触控、登录窗口等测试需要可操作的真实应用时才集中执行。无法绕过的平台问题正常线上验证，其余任务并行继续。

本次双部署核验完成：main/Pages 均为 2b855e2，实际入口及旧街模块文件名一致，主站大图 SHA256 与本地构建一致；Pages run 34927596731 成功。后续 e3fb300 起的本地工作流改动未再次发布。


### 本地地图出入口提示（2026-09-15，未发布）

`src/old-street-door-view.tsx` 从 `oldStreetDoors()` 投射门槛、巷道与步级，旋转来自 endpoint.side，关闭提示来自同一 gate/facts。`old-street-dev.tsx` 保留原有 44px 可操作按钮、名称和转场逻辑，点击层透明；`old-street-floor.tsx` 移除独立方向无关的门补丁。未改变地图尺寸、碰撞、接近点、出入落点或权威规则。小屏上下边缘的标签裁切在真实画面发现后修正。

本地真实 renderer 实际走完街口→修表铺→合住院→街口；点击未清障的地下储物室出口仍留在院落，并显示旧箱挡住台阶。刷新恢复当前场景。57 项探索回归与 TypeScript 通过。本轮仅验证当前浏览器约 365px 窗口，尚未做精确 320/390 尺寸或 iPhone 实机复验；程序绘制空间提示不等于最终美术准入。


### 本地沉浸镜头与就近行动（未发布）

`old-street-camera.ts` 只返回地图显示尺寸和平移，不更改地图坐标或 Session。默认世界铺底，镜头跟随脚点并避让标题及实际行动区高度；Canvas、背景和热点仍共享 stage，地面点击从 stage.getBoundingClientRect 反算。调试 `?debug=1&camera=overview` 可查看整图。实际本地约 365px 窗口已看到放大角色、从街口点击门进入修表铺以及镜头移动。纯函数分别验证 320×568、390×844、844×390 的边界与反换算；这些断言不是相应尺寸的实际设备画面验收。

`old-street-context-action.ts` 从同一权威规则取可做动作，未认识人物仍先介绍，认识后不重复置顶问候，交还物件优先；无可做动作的已知人物进入已有话题，其他实体查看当前阻碍。结果只用于展示和排序，发送行动仍经原 Session 校验。中英文介绍/交还/交谈及关闭出口不变更存档的测试通过。探索回归共 63 项通过。

### 修表铺像素候选入口（2026-09-15）

`?shop_art=pixel` 选择 `doc/oldstreet-pixel-study/` 平台候选；无参数沿用旧素材。`old-street-floor.tsx` 负责候选地板，`old-street-prop-art.ts` 提供小格三态和记录册图集，`old-street-dev.tsx` 接入同一个 renderer event 与 save facts。候选开关不改变地图、碰撞、步态、权限或存档命名空间。去底/分帧来源脚本为 `scripts/prepare-oldstreet-pixel-study.mjs`。尚未生产准入，具体缺陷及实测边界见候选 review.md。

像素候选现通过 `layered-state-sheet.ts` 和 RPG-JS 同事件多 graphic 复用固定桌面/柜顶，前部区域才随同一权威 animationName 变化。所有取图通过源 PNG 的纹理区域完成；原版仍使用整帧图集。分层原点、接缝和裁剪范围在 `_qa/old-street-layered-props.test.ts` 验证，避免把固定家具烘焙回背景或脱离脚点深度排序。

修表铺像素候选的墙面由 `old-street-shop-environment-layout.ts` 从实际北门坐标计算两侧显示矩形；`old-street-shop-environment.tsx` 仅采样平台墙面图的两个无品红区域。背景位于 floor 之外，不新增碰撞或剧情实体。测试检查真实源像素及门口空隙；这是环境候选，细节见 `doc/oldstreet-pixel-study/workshop-wall/review.md`。

`spatial-art-texture.ts` 在旧街图片预加载阶段显式配置 Pixi TextureSource 的采样方式；`?shop_art=pixel` 使用 nearest，原版 linear，避免更改全局 TextureStyle 影响其他页面。后续生成素材接入时需将其显示采样与实际美术类型一起配置；PNG 分辨率、Canvas antialias 与源纹理 sampler 是不同层。`render-diagnostics.ts` 的调试树仅输出白名单采样枚举，可用于确认引擎实际切帧继承了所选 source。

### 已完成帮助的后续对白（2026-09-15）

`old-street-conversation.ts` 复用已有的角色关系事件，在人物已介绍且当前事实/借物状态吻合时追加一个短话题。没有新增关系存储或奖励；既有 authored dialogue 提交和 `oldStreetDialogueContext` 共用这些话题。`old-street-letter-guidance.ts` 统一取信指路，优先检查已取信、已开锁、持有钥匙，避免玩家开锁后先还钥匙时被要求再借一次。

70 项探索回归、TypeScript 与 cloud 构建通过。新增检查覆盖中英文真实 Authority 动作、幂等重放、数据库实例重建后恢复、对话提交、模型知识投射及重新借钥匙后的话题撤下。5456 独立本地旅程实际经修表铺→合住院→河边工作棚，归还钥匙后第三话题出现，点击后显示玩家与老周两张短对白卡；测试没有改动 5455 用户旅程。当前窄屏对话区内部仍需滚动，这次不代表 UI 最终验收，也未调用真实模型或发布线上版本。

### 工作棚人物活动（2026-09-15）

`OldStreetResidentMotion` 让有真实行走图集的老周以 24 世界单位/秒在工作位置左右各 24 单位内活动，端点休息 3 秒；100/120 单位的靠近/离开滞回避免反复启停。步态按实际位移使用 .22 尺度的步幅。renderer 新增可选 `onFrame`，统一提供当前场景、玩家位置与暂停状态；隐藏页面、转场和游戏面板期间不推进活动。其他两个只有站姿的角色未启用移动。

旧街客户端用同一 resident position 投射 NPC 事件位置、碰撞体、点击区域和接近点；寻路及逐帧碰撞都使用该投射。正式 Session 仍校验永久地图和原有 54 单位交互范围，不把 NPC 旧站位当作永久墙；左右极限处的接近点仍在该范围内。人物位置是单人局部活动，不写入 StorySave，不改变模型知识中的所在房间，也不作为多人权威运动。刷新/进入场景时选择不重叠当前玩家的初始位置，避免重放旧 NPC 站位压住玩家。

74 项探索回归通过；其中新增 30/60/120 Hz 位移与步态、暂停/靠近/阻挡、活动区和动态碰撞、恢复不重叠检查。既有中英文 Authority 归还钥匙/取信指路测试现从活动区左右极限提交，均通过。真实 5456 独立旅程看见老周左右移动，靠近后朝向主角；点击移动后的角色并选“信在哪里？”成功走近、提交并显示持有信件的回应。刷新保留物品和关系。没有生产发布或 iPhone 实机验收。

### 制作流程的洋红底处理（2026-09-15）

共享 sprite-preparation 增加显式 magenta 模式：连接背景要求 R/B 最小值≥100 且比 G 高至少80；核心保留和源图保存沿用旧流程，边沿从近邻背景及内侧颜色估计覆盖率，不做语义补画。封闭区域仅在明确 matteSeeds 下清理，主体本身含洋红时不适用。结果使用 magenta-matte-unmix-1，原浅底/alpha 算法标识保持；归档、人物/设备地图解析按 mode 严格核对 algorithm，防止错误混用。UI 支持模式切换及对应错误提示。

相关37项机械检查中，首轮36项通过、1项被沙箱禁止监听本机端口；该素材云存储测试文件随后在获准的本机 HTTP 环境8项全部通过。另有真实阿岚失败候选的共享处理→归档→恢复→地图几何检查1项通过，未生成视觉通过记录。类型和 cloud 构建通过。CUA 在5456制作页加载内置样本，确认洋红选项、封闭区域选点及选错模式时保留原图、候选不生成、发布按钮不可用；系统文件选择窗口无法由当前工具操作，因此未把真实阿岚PNG的浏览器导入流程记作已验收。当前未发布线上版本。

### 自然输入与按钮路径一致（2026-09-15）

old-street-action-input 补充常规物品操作的中英文完整句式：拿取放大镜、开小格、插销、旧钟、照片夹、归还、记录与撤下。仍是整句匹配且受当前目标 actions 限制；疑问/否定/过去式/延期/复合意图的 veto 保持，离开结局不通过输入绕过确认。没有引入模糊子串匹配或自动跨目标操作。

新增两条真实 SQLite Authority 旅程对照（中/英），一条使用按钮 action，一条使用常见说法 free-input，经过取放大镜、借推车、清障、借钥匙、开格取信、归还借物再结束；最终事实、库存、关系与版本一致，每步拒绝的疑问/否定/已完成声称/复合输入不推进版本，重试回执幂等。77 项探索回归和类型检查通过。进一步扩展原有钟底检查测试，三个同义说法在没有观察证据时都返回特写要求，版本和刻记事实不变；Session/inspection 文件21项通过。本轮无 UI 布局改动、无真实模型调用、无生产发布。

### 工作棚地面接入同密度像素材质（2026-09-15）

`old-street-floor-material.ts` 从实际 room floor 得到源图裁切，校验范围并固定2:1源像素/世界单位。`OldStreetFloor` 用嵌套SVG viewBox裁切，不重新编辑PNG或拉伸源图。像素候选覆盖shop/shed；只有shop绘制原工作墙。其他房间保持原表现，没有把所有房间强行换成木地板。

78项探索回归、类型检查和cloud构建通过。新增检查读取真实PNG头确认大小、两轴密度一致、裁切不越界、像素对齐、门口可行走及shop原取样范围未变。CUA在1280×720的5456独立旅程检查工作棚地板，点击行走后角色落脚正常，经院门前往修表铺；外部访客栏通过其关闭按钮收起。未新增游戏、未发布线上；工作棚家具与墙面仍未完成，窄屏与平台实机并未在本轮重新验收。

### 工作棚北墙候选（2026-09-15）

old-street-shed-environment-layout 从真实 north stairs 与 floor 生成墙面区域；old-street-shed-environment 只显示两个已检查的原图裁切，固定等比.25。像素候选 OldStreetFloor 在地板外加这一装饰层，未添加碰撞、热点、事件或剧情知识。79项探索回归、类型和cloud构建通过；实际窄屏靠近观察见 doc/oldstreet-shed-wall/review.md。原图生成间隔错误被明确丢弃，游戏通口保持48世界单位。未发布线上。

### 旧街初次素材加载（2026-09-15）

`spatial-art-download.ts` 并行获取角色、设备与候选物件（基础6份、像素候选7份），完成全部下载后才创建Blob URL；任一失败取消同批请求，下载阶段25秒超时。组件卸载取消请求并清理URL。纹理解码与地图onReady独立于下载进度，25秒不代表整个启动流程的总时限。Session恢复、地图解码和后续动态媒体生成不在本次超时范围。

`OldStreetLoading` 同时用于页面模块启动和地图初始化，以现有透明抽屉图集首帧作画面，显示恢复旅程、文件下载计数、纹理准备、地图准备四个阶段。初始化失败保留覆盖层和重新连接按钮，重载使用原有Session恢复机制，不新建旅程。没有修改存档或生产网络合同。

验证：下载单元测试3项通过，类型检查通过。CUA通过临时本机代理让主角图片首个请求延迟30秒，实际看到6/7文件、25秒下载超时覆盖层，点击恢复后回到原修表铺且按钮恢复可用；测试代理已停止。此次截图为1280×720外部访客状态，未冒充iPhone或AlterU内弱网验收。

### 地下室照片夹的分层地图候选（2026-09-15）

`old-street-photo-shelf.ts`在像素候选入口提供固定搁架和可拿取照片夹两层，读取photos-taken，归还后原处仍为空架。保留现有碰撞与动作位置，素材同一共享去底算法处理；初次候选下载增加到8份，原入口仍6份。80项探索测试及类型检查通过。地图渲染、尺寸和边缘视觉复验因Mac锁定未完成，不能以测试代替美术准入；详见doc/oldstreet-photo-shelf/review.md。

### 在线交谈的当前物件状态（2026-09-15）

`old-street-scene-knowledge.ts`从共享空间物件与`oldStreetPropState`投射当前房间语义状态，作为`visible:<entity>`条目加入人物对话knowledge。只包含已有状态标签，不复制库存、历史、其他房间、未知人物或未准入外观；当前房间不存在状态标签的静态物件不臆造描述。原有话题与私有最近4组交谈合同保持。提示同时明确物件材质/颜色也不属于已准入知识。

中英文测试通过规则执行借/还推车、取照片和JSON恢复检查上下文；闭柜不透露内部信件，未知场景为空，投射不改存档。结合原有对话形状/知识ID/语义审查/超时测试共5项通过。没有真实模型调用、平台发布或画面变更；此证据只证明上下文范围，不能证明模型一定遵守。

### 照片支线落盘与回执恢复（2026-09-15）

原有照片拼合内存测试扩展为临时磁盘SQLite真实Authority旅程：从街口经推车清箱进地下室，取照片、去照相馆验证拼图、归还，再回地下室。每个接受行动后关闭数据库重开，取回head并重放同一action_id，检查完整head一致。photos-taken同时投射为空架图层状态及当前场景知识；归还后库存无照片，摄影师关系仅一条，回原地再次拿取拒绝且head不变。错误拼图仍不推进。

Session专项20项通过。该验证覆盖持久权威、幂等和投射输入，未实际启动renderer，不替代锁屏期间暂缓的地图截图与触控复验。未更改生产代码、存档格式或线上版本。

### 启动等待与迟到回调（2026-09-15）

`startup-guard.ts`为单次旧街初始化设置90秒总等待上限，覆盖恢复旅程、下载、解码和创建地图。原文件下载25秒超时保持。失败显示已有恢复覆盖层，不自动重建RPG-JS全局实例，用户重连通过整页刷新恢复原Session。超时/卸载后的迟到runtime会被dispose，不写入当前runtime或setReady。

代码检查发现createRpgRenderer的onReady发生在服务端changeMap返回后，不保证客户端onAfterLoading已经确认。旧街现在在onReady保持暂停，调用已有runtime.restore等待joined+loaded双确认和脚点恢复后才开启操作；沿用RendererTransition的30秒等待及dispose合同。没有改动原列车、共享引擎API或存档。引擎已创建的全局底层实例仍需整页刷新彻底释放，不宣称可在同页无限重建。

专项15项覆盖下载、延迟地图确认、正常就绪、总超时、迟到回调、卸载和恢复失败，类型检查通过。电脑仍锁屏，已请求方便时解锁；本轮浏览器与真机启动复验未完成，不把函数测试当作完整画面就绪证据。

### 局部观察的可选三级提示（2026-09-15）

`OldStreetPuzzleHints`用于钟底与照片特写，三个逐级具体化的短提示，初始不展开，当前仅显示一条。图片载入后才出现入口，提交中禁用；按钮继承当前特写的视觉与触控规则，没有新增常驻HUD。关闭后重开会重置提示显示。组件不持有submit回调，不写Session或解谜状态；玩家仍须执行原观察/拼合步骤。中英文内容已接入，类型检查通过，真实尺寸/操作复验仍待电脑解锁，未发布。

### 环境图片与启动衔接（2026-09-15）

环境图片现在由old-street-environment-art.ts集中列出：窄板地板、洗衣店底图，以及候选模式的修表铺/工作棚墙面。它们与人物道具共用downloadSpatialArt，DOM环境图片用Image.decode，角色继续走Pixi纹理解码；解码完成后把同一blob URL交给SVG，不依赖二次网络请求。正常入口8份、像素候选12份，进度由实际条目计数。环境blob在卸载时回收，失败沿用启动恢复路径；不修改Session或地图碰撞。

### 照相馆工作台候选（2026-09-15）

像素候选入口将viewing-table占位替换为平台生成的去底桌子，原动作与碰撞保持。单帧512×512、脚点256/448、等比0.125；与人物道具共用启动加载，候选文件总数13。实景及准入边界见doc/oldstreet-photo-table/review.md。

### 地板素材目录（2026-09-15）

src/material-library/catalog.json开始统一登记地板素材，source相对该目录解析，保留PNG尺寸、SHA256、分类、投影、拼接验证状态、显示参数和审查原因。index.ts默认只返回approved；当前旧街显式allowCandidate读取wood-narrow-01。rejected永远不能被选择，未知ID明确失败。old-street-floor-material从目录读取板宽/透明度，图片仍由Vite静态import打包，候选与否决图片没有被复制成第二份原图。现阶段不是平台数据库或完整制作页素材选择器。

### 照片归还的空间后果（2026-09-15）

old-street-photo-table.ts将固定桌子与独立合拢照片夹作为同一事件的两个图层，仅photos-returned为真显示夹子；匹配、拿取或同意展示均不能单独触发。共享物件标签同时进入当前场景对话知识。无新增素材下载或存档字段，原碰撞不变。5456独立旅程亲自向摄影师归还后，背包移除、桌面蓝色夹子出现，刷新保持；本轮未复验跨房间往返。Session/场景知识22项及新增图层状态1项通过。

### 洗衣店归还旧钟的实体表现（2026-09-15）

新增clock-display固定柜台，复用木搁架并叠加平台生成座钟；仅clock-returned时显示座钟，物件标签同步当前场景知识。像素候选共14份资源，原规则/存档字段不变；柜台碰撞已纳入共享布局。细节与实证见doc/oldstreet-mantel-clock/review.md。

### 本地试玩请求超时（2026-09-15）

`old-street-session.ts` 的本地 cookie transport 现在与生产 action 请求一样使用30秒 AbortSignal，且禁用HTTP缓存。超时不属于领域终止错误，RecoverableSessionClient 保留原 action_id，重新连接后读取服务端权威状态并重放原请求获取幂等回执。不会因为超时创建新旅程或清空存档。

`_qa/old-street-local-recovery.test.ts` 使用真实内存SQLite Authority，注入服务端提交后丢回执的超时：过门与拿放大镜均恢复至原提交版本，物品仅一份，事件不重复，待确认队列清空。该测试是合成网络故障证据，不是线上断网实机验收。

### 旧箱可见清路后果（2026-09-15）

像素候选入口新增独立木箱事件，old-street-crates.ts 定义单帧脚点与缩放；old-street-dev.tsx 在启动阶段下载/解码并回收blob，清路与续玩均从 oldStreetProjectedProps 的同一碰撞投射更新位置。素材不定义路线，不新增事实。真实本地借推车、搬箱、过台阶、返回、刷新路线已验证；正式人物与整套场景美术仍未准入。

### 合住院地面候选（2026-09-15）

old-street-environment-art.ts 纳入yard图并复用启动下载/解码；仅pixel候选模式请求。old-street-floor.tsx 按catalog的courtyard-stone-01重复纹理，尺寸由old-street-floor-material.ts读取，世界坐标锚定，不改变地图或碰撞。候选准入/拒绝由现有素材库查询门禁约束，源图及审核记录在doc/oldstreet-yard-floor。

### 人物称呼与已完成事项（2026-09-15）

角色定义新增appearance双语外形称呼，地图优先显示已介绍角色的存档姓名，未介绍才显示外形，不使用“人物位置”占位文字。oldStreetTalkTopics 在清箱后提供确认完成的选项；未取得旧钟/照片时提供开放式询问，避免假定玩家已经知道物件。介绍、对话与关系仍通过原Session提交，不修改历史正文。

### 玩家恢复说明与错误暂停（2026-09-15）

old-street-recovery-message.ts 将错误映射为双语恢复说明，普通界面不回显接口正文、URL或内部代码；调试入口才显示原错误。加载页复用同一说明。特写中出现错误会关闭照片/钟底面板、暂停空间模拟并露出恢复入口；关闭特写不再无条件解除错误暂停，地图点击与输入框也受错误状态约束。超时仍保留原Session待确认动作，不自动清档或重开。

恢复消息与本地丢回执3项测试、类型检查通过；正常浏览器恢复到同一洗衣店、人物姓名与推车保持。此轮未在真实特写内再次注入网络失败，不能将控制代码检查当作该异常交互的实景验收。

### 环境混合候选与入口表现（2026-09-15）

old-street-environment-art.ts统一列出地面、北墙和杂物候选，按像素/整图开关选择下载，仍走现有下载超时和blob释放流程。old-street-ground-detail.tsx按房间放置低对比地面贴花，避开门中心，不添加碰撞；old-street-photo-environment-layout.ts从现有北门定义墙面裁切区。old-street-door-view.tsx按door/alley/stairs渲染门扇插销、连续铺地和踏步，地下/屋顶高度只影响踏步表现，不改权威连接。

shop_environment=whole显式开启修表铺整图分区候选，并启用pixel互动家具；缺省仍保留原入口。old-street-floor.tsx从同一生成图片裁取完整地面与北墙两段，后门留空依旧来自oldStreetShopWallRegions。只整图候选下载shopComposite；所有物品、动作、寻路、碰撞、存档语义保持原合同。原图没有精确遵守布局，不能直接用其门位或墙边作为引擎边界。后续若统一家具光照应在同一游戏镜头复验，不把背景烘焙光误认作完整动态光照。

整图候选北墙追加比例修正：源裁切高度=源宽×目标墙高/目标墙宽，使viewBox与渲染矩形等比，避免壁钟变椭圆。365×677北门同状态截图复验圆形与通行开口；没有改地面裁切或存档。

照相馆SVG墙饰使用meet时，overflow:hidden仅裁视口，不能阻止viewBox外原图进入等比留白。现对image再加源坐标crop clipPath；365×677真实楼梯落点修复前后截图确认洋红漏底消除。

照相馆像素入口地面改为photoFloor单张候选的0 180 640 844裁区，一次映射原240×384地面，不重复拼接。顶部生成椅子被排除；环境下载沿用既有列表与超时处理，地图几何/物件/存档不变。

### 地下室楼梯的阻挡反面（2026-09-15）

OldStreetDoorways接收已下载的crates blob。只有cellar房间、crates-cleared门且事实未成立时，在楼梯上画同一旧箱素材，反向抵消入口旋转以保持箱子朝向正常；事实成立即不渲染。不创建第二个实体、不新增道具或状态，仍由原通路规则阻挡。非像素入口使用简化箱形回退。图像复用现有下载与释放，不增加素材请求。

同组件本地状态对照页已真实截图检查堵住/清开，箱子覆盖踏步且清开后消失；类型检查与6项空间规则测试通过。该检查不替代从新旅程走完整反向路线的引擎验证，后者待续。

### 石阶局部材质复用（2026-09-15）

OldStreetDoorways新增stoneImage，像素入口从environmentArt统一下载石阶修正版。整图透视未准入，仅选三个石踏面区域绘制在原40×6踏步矩形，五级踏步/侧墙/方向仍由原SVG几何定义。riverside-stairs金属外梯不使用石材。不是新碰撞或新路线，不改变出入口脚点、档案或清箱事实。

地下室像素入口增加cellarFloor，统一下载/释放；old-street-floor.tsx以源0 256 512 832裁区映射原房间地面，使用none充满且overflow裁切，排除意外生成的人物。该图只作底层环境，不改变碰撞或角色名单。

### 街口与工作棚材质复用（2026-09-15）

old-street-floor.tsx将现有院子铺石pattern用于street，保持相同世界单位纹理尺度；shed改用现有cellarFloor中0 272 360 640干燥区域，仍显示原北墙。没有新增资源导入、网络请求或素材生成，不改变碰撞、门、物件及存档。类型检查通过，工作棚实际365×677南楼梯落点地面与人物显示已检查。

街口365×677实际从院子巷口返回，铺石尺度与院子一致，人物、两侧店门和北巷口仍可辨；未新增转场门槛。当前街道缺建筑立面与街边环境，不能仅凭铺地替换认定完整街景达标。

old-street-boundary-layout.ts按street现有东西侧门坐标裁分墙段，所有段严格在walkable floor之外；old-street-boundaries.tsx只渲染低矮砌体与窗格，不添加交互或碰撞。仅像素候选street启用。边界/门净空测试与类型检查通过。

从新增墙体旁的照相馆店门实际转场成功，未改变房间或物件状态。画面边界测试不等于全立面美术验收。

### 动态扩展请求起点（2026-09-16）

OldStreetHead新增可选expansions，旧存档无需填充。首个模板photo-darkroom-v1仅接收当前照相馆的玩家意向；通过现有SessionAuthority action事务写入requested记录，包含原始意向、action id和请求时版本。它不改变StorySave、空间清单或碰撞，不调用媒体/模型。相同请求复用现有回执，离开原房间仍保存意向。

本轮仅新增一项核心测试：真实SQLite提交、关闭重开、同请求重放、继续回街口且意向保留、未出现新房间。该项及类型检查通过。模型计划、素材任务、地图激活及玩家输入入口尚未接通；不得将此起点宣称为动态支线闭环完成。下一步从该记录生成结构化计划，再绑定必要素材清单与新地图版本。

### 扩展计划任务存储（2026-09-16）

server/old-street-expansion-jobs.ts使用现有AuthorityStorage保存每旅程/请求的queued、planning、candidate或failed记录。生成器注入，22秒信号预算；完成后保存计划候选，读取或重复run不重复生成。中断超时保留失败，需要显式retry，最多2次；不会激活地图或推进StorySave。当前尚未接HTTP/调度/游戏UI。

针对新增核心机制的一项SQLite测试通过：入队→生成→重建任务服务→取回同一候选，模型调用计数保持1，原旅程不变。首次测试发现旅程读取的内部事务与任务事务嵌套，已将授权读取和事务内行读取分开；同项复验通过。该测试重建服务对象，未模拟进程重启或真实网络任务，不能扩大证据范围。类型检查通过。

扩展任务新增GET/POST sessions/:id/expansion处理，POST先入队并交给background执行，GET只读状态。old-street-dev-plugin在已有显式模型预算配置存在时装配计划生成器，共用模型预算；未配置时明确返回EXPANSION_PLANNER_NOT_READY，不伪造模型结果。公共HTTP处理器支持注入同一任务服务，但Worker尚未装配，生产不启用。玩家UI与新房间仍待接入。

新增一项核心测试（调用HTTP操作处理函数，非真实网络）：延迟模型Promise保持未完成，POST已返回queued、GET为planning，旧地图实际Session转场可提交；释放模型后candidate保存，玩家仍在新位置。类型检查通过。未进行新模型调用或旧路线全链回归。

### 扩展玩家入口接线（2026-09-16）

显式?expansion=1在照相馆行动区显示OldStreetExpansionView，默认隐藏，避免未完成实验混入试玩。意向通过RecoverableSessionClient保存；之后POST扩展任务，queued/planning每8秒读取一次。离开房间卸载并停止读取，返回时依据旅程expansions恢复查询；candidate只显示方案已保存/入口准备中，不开放尚未接通的地图。无模型配置或网络错误显示可继续原探索，不全屏阻塞。

新界面在真实浏览器的320px容器检查了展开、输入区域、空输入禁用，无横向溢出；这是独立组件显示检查，未提交假请求或触发模型，不能替代游戏内提交/恢复全链。真实地图接入仍待完成。

### 暗房基础地图接入（2026-09-16）

在现有oldStreetRooms/Connections/Floors中预注册darkroom模板与studio-darkroom双向门；TMX仍从共享地面生成，主体208×320，工作台112×48碰撞，入口位于照相馆东侧。未有darkroom-ready时门图形及热点隐藏，通行规则拒绝；已访问地图才显示暗房。它是受限的扩展模板，不能宣称模型已能任意生成几何。

expansion-activate由现有SessionAuthority提交，只接受服务端任务表中与本旅程请求相符的candidate计划；客户端不能提交任意计划。开启标志与旧档缺少的暗房地图节点一起保存，不强行转场，不发物品，不采用候选发现文案。测试入口随后显露实际门。仅本地装配候选查询，生产未启用。

基础层复用照相馆地面及工作台图，查看显影台先使用固定等待描述；精细环境、照片生成、谜题就绪仍未接通。新增核心测试通过准备前拒绝→生成候选→开放→实际空间绑定转场→观察→工作台碰撞→返回。6项原空间机制自动化及类型检查通过；未做新房间真实renderer验收，不把服务层路线等同可见画面完成。


### 扩展照片任务接入（2026-09-16）

OldStreetExpansionMedia在原旅程数据库内按owner/journey/扩展请求ID保存任务，持久requestId/taskId与原始PNG分片。恢复时沿用平台任务，不重生成；主动重做才新建requestId，旧任务与PNG转入history表。临时错误8秒后可恢复，120秒租约隔离旧进程迟到结果。照片任务不修改StorySave、场景几何、库存或回执。

本地开发接口expansion-photo读状态/启动恢复，expansion-photo-file读取已保存字节。仅oldstreet-dev且expansion=1的暗房测试入口显示显影控件与候选。平台正式Worker尚未装配此接口；候选尚未绑定拼图或准入发现文案。图片结构检查采用inspectSizedPng的768×576合同，原journal保留768×1024合同。

已完成真实平台生成，并在暗房页面实际显示。最初提示中的two-half puzzle导致分隔线；去掉玩法指令后连续画面恢复，但摄影颗粒与像素美术不匹配，继续按用户反馈修正。数据库重开、下载失败后同任务恢复、PNG持久读取的合成核心测试已通过；不将其称为完整动态解谜闭环。

扩展照片现复用OldStreetPhotoView，传入当前旅程图片URL和hash，保留原固定照片合同。expansion-photo-match通过Session事务检查暗房/接近工作台/当前候选hash及拼合参数，写darkroom-photo-matched并追加可见记录；随身与发现显示此记录，已完成照片停止重生成。本地浏览器已实际选片并成功提交，生产接口仍未装配。

照片去向由expansion-photo-decision走同一Session事务，只在暗房工作台旁且拼合完成/未选择时接受keep或leave。keep增加darkroom-print一次，leave不增加物品；事实用于发现页和阶段结局。请求回执重放不会重复领取；两分支的核心测试通过。本地真实旅程选择keep后，随身显示旧街照片，发现页显示“你把拼好的照片带在身上”。不采用候选中未经画面支持的放大机/显影槽描述；此分支不是任意动态剧情推演。

Worker装配新增可注入扩展model/photo providers，复用当前authority数据库、owner和background生命周期。正式OLD_STREET_RELEASED保持false，未自动开启线上模型生成；本地Worker预览仅在明确模型配置下装配。handleOldStreetSession提供expansion-photo与私有PNG读取；浏览器改由现有api传输取得字节、校验hash并创建blob URL，卸载后释放。针对性Worker测试以受控producer和真实生成PNG验证路由、任务完成、数据库重开读取及旅程隔离；不是线上/真实Worker媒体生成实证。本地实际renderer通过新读取方式解码768×576照片，未新增生成。

后续实证：worker-live/result.json记录正式handler/authority加本地SQLite实际调用叙事与媒体服务，完成拼合/leave并关闭重建后恢复图片和事实。真实输出图已检查，不复用合成producer。线上Durable Object执行、平台身份和移动网络恢复仍待集中验收。

扩展入口不再依赖expansion=1：每个旅程读取一次expansion-capabilities，由后台报告planning/media，缺接口或不可用时不显示新扩展入口；默认不触发生成。debug保留候选重生成。Worker与loopback接口同合同。真实5460去掉expansion参数后，原暗房、照片选择、随身物品和PNG仍恢复；两项Worker测试分别覆盖能力可用/不可用。不等于线上已开放：正式服务仍受原发布开关控制。

暗房free-input按当前完成/选择/图片就绪状态构造动作许可，别名与可选live interpreter均仅返回已有动作ID，转到expansion-photo-match/decision原提交分支。匹配意图缺实际拼合参数时返回原ALIGNMENT_REQUIRED，客户端请求同一照片局部界面，不直接写完成事实。查看/领取/留下同按钮共用版本和回执。新增规则测试覆盖文字拼合需操作、文字领取、否定不领取及回执；真实5460输入“看看显影台”后走近并显示照片在行囊里的当前状态。新文字触发拼合界面的浏览器分支仍未单独试玩，不扩大本次证据。

## 交谈朝向衔接（2026-09-16）

空间 renderer 新增可选 face(point)，只更新朝向与站立姿态，不改变位置或 StorySave。旧街的按钮/自由输入在到达后、提交动作前朝向实际目标；暂停移动不再跳过居民对附近主角的朝向更新。两位只有四方向站立素材的居民仍不冒充可行走角色。

验证：居民运动 5 项测试通过，含暂停期间四方向面对、零位移、原碰撞与帧率步态；TypeScript 通过。CUA 在 5460 的已有合成旅程，从暗房返回照相馆，初次介绍后选择“这座楼梯通到哪里？”，实景确认主角向上、摄影师向下，短对白正常。仅验证这一代表性交谈，不重新跑全部剧情路线；其他两位角色实景未在本次重复验证。

## 旧街基础声音（2026-09-16）

`old-street-audio.ts` 提供距离采样与最多4声部的短合成音。每16世界单位、至少120ms发一步，铺内/照相馆/暗房/工作棚为木质，其余为石质；静止、暂停、跨场景和大幅位置恢复不补发。成功新增库存发120ms轻音，非人物且同场景事实改变发160ms物件音；对话不发成功提示。首个真实 pointer/key 手势才创建 AudioContext，异常不阻塞游戏，页面隐藏停止声部，卸载释放。旅程面板开关存入 scoped storage 的 oldstreet-sound，关闭不创建声音上下文。

距离/30、60、120Hz/静止/转场/暂停自动化已通过；声音听感及iPhone后台恢复尚未实测，不能据此宣称音画验收完成。无新增背景音乐或素材下载。

发布准备：旧街试玩标识更新为 oldstreet-preview-audio-expansion-20260916；独立 OLD_STREET_EXPANSION_RELEASED 开放已实证的暗房规划/媒体生产，未打开 OLD_STREET_RELEASED，也未假装账号绑定完成。旅程声音开关在实际浏览器可由开切为关，刷新检查遇到 CUA 连接超时，听感验收仍保留边界。

## 续玩目标提示（2026-09-16，本地未发布）

oldStreetCurrentPurpose 从权威库存、已介绍人物与取信事实派生随身面板目标。未认识修表师不泄露位置；持钥匙提示回铺开格，提前还钥匙恢复借用提示，小格已开则直接提示收信，取信后保留继续探索选择。无新增存档字段，不重复抄对白。中英文6项随身与发现测试通过，含序列化恢复；本次未做锁屏状态下的浏览器实景验收。

## 自由输入自动选择后台能力（2026-09-16，本地未发布）

客户端不再把未带 interpret 参数的输入强制发为 local。Session 在 mode 缺省时，先匹配确定动作/固定话题，再按实际注入的 interpreter/dialogue 决定是否使用模型；未配置仍走本地规则。显式 interpret=local/live 保留调试语义，live 而服务未配置仍报不可用。暗房自由动作沿用同一选择规则。28项 Session/对白测试通过，覆盖默认调用、固定话题不调用、显式local、回执去重及拒绝无部分提交。线上普通叙事默认provider仍由 OLD_STREET_RELEASED 控制且尚未开放，不将这次接线修复误报为完整线上模型交谈通过。

## 正式入口缺图修复（2026-09-16）

用户发现线上缺图，根因是 pixelShop/compositeShop 仍要求试验query；根地址因此关闭了部分环境下载和独立物件列表。默认改为完整像素物件与整图修表铺背景；仅 shop_environment=layered / shop_art=legacy 显式退回对照。已在不带任何参数的5460根地址恢复原合成旅程，进入照相馆、街口、修表铺确认当前环境与记录册显示。不是上传缺失的先验结论；发布后另对dist全资源进行HTTP/字节一致性检查。

## 手机步态修正（2026-09-16）

用户反馈线上滑步。旧街全左右脚循环从55×.24/.14≈94.29世界单位改为56，不再把展示比例直接乘进步幅；行走速度与实际碰撞位移不变，动画频率提高约68%。四姿态每14单位换一次，脚步声每28单位落脚一次。仅旧街主角调整，不修改旧列车或尚待准入的居民动作素材。实际iPhone观感需继续观察，不能由帧率模拟宣称实机已通过。

## 真实对白相关性复测（2026-09-16，本地未发布）

三轮每轮4次真实模型请求，使用独立合成取信旅程、两次自由问答及一次固定记忆回复。第一轮把钥匙问题导向送钟；补充钥匙用途和可选任务后，第二轮错误声称在修表铺；补充可读当前位置与实际持钥匙状态后，第三轮地点/借用指导正确，但仍臆造“其他人也能用钥匙取信”。报告中的机械pass不等于语义通过，三份报告均追加明确未通过审查。普通模型叙事release保持关闭，不能把相关性修复当作正式完成。

上下文新增current-place、key-status、key-use、optional-help，生成/审查提示要求直接回答、区分目的地/所在地、不附加无关跑腿、第一人称。脚本保留默认mode验证、状态不变与同回执不重复调用。

## 普通叙事试玩与最终验收分离（2026-09-16，本地未发布）

新增 OLD_STREET_NARRATION_PREVIEW=true，仅默认生产预览 gate 组装 interpreter/dialogue；显式测试/本地 gate 不自动获得远程模型，继续使用注入能力。OLD_STREET_RELEASED 仍false，不表示完整内容、语义或账号绑定验收通过。新Worker用例通过默认gate和受控transport验证：无测试mode的普通交谈两次模型请求、招呼零请求、落盘刷新零追加请求。旧街8项Worker用例通过。

此前真实模型无关理由仍属已知质量问题；不能声称语义完全正确。该开关准备进入下一次集中试玩，当前线上42b2262未因此重发；上线前还需真实默认Worker模型链路与等待恢复验证。

### 普通交谈失败与回执恢复（2026-09-16，本地）

默认试玩模型路径增加 Worker → HTTP 客户端恢复实证：模拟一次回答超时，客户端确认拒绝并清除待办，存档完全不变；重新提问成功后丢弃 HTTP 响应，再重建客户端和 Worker 实例，按原请求恢复已提交对白。模型只经历一次失败调用和一次成功生成/审核（共 3 次），恢复未增加调用，存档仅新增一轮对白，物品与剧情事实不变。`_qa/old-street-worker.test.ts` 覆盖此链路；这是受控故障测试，不是真实网络中断或手机证据。

已确认的行动拒绝通过 `oldStreetActionFailureMessage` 显示简短双语提示，回答超时、内容拒绝和暂未接入分别提示重问、换说法或选择现有话题，不再直接显示内部错误码。未知结果仍走原有重新连接/核对进度流程，不能当成明确拒绝。新增提示尚未在真实游戏画面复验（当前 CUA 检测到锁屏）；本次未发布线上。

### 自由输入到关系对白的真实闭环（2026-09-16）

`scripts/test-oldstreet-live-relationship.ts` 在新建内存旅程中，通过现有平台模型解释两句不命中作者别名的自然输入，先借出再归还钥匙。物品增加/移除及一次 `kept-promise` 关系由原领域规则与 Session 提交；第三句询问以后是否能再来请修表师帮忙，真实对白使用当前知识回应，不改变背包、事实或关系。每轮原请求重放均复用回执，没有额外模型调用。三轮共 6 次请求，耗时分别 3728 / 2475 / 2036 ms。证据：`doc/oldstreet-live-relationship-20260916.json`。此结果补上自然表达、权威行动、关系后果与后续对白之间的真实模型验证，不代表生产 Worker、手机体验或所有表达通过。当前未追加发布。

### 模型服务故障不阻塞作者玩法（2026-09-16，本地）

`oldStreetRuntime` 仅在提交前的模型调用边界捕获提供方失败，返回明确的 `OLD_STREET_MODEL_UNAVAILABLE`，不修改旅程。客户端把该明确拒绝及叙事频率限制视为已确认未执行，清除该请求待办并显示可继续选择现有行动的简短提示。对白内容拒绝和对白超时保留各自提示。此处理不包裹 Session 提交或 HTTP 传输；提交后的丢响应继续保留待办、重放同一回执，不能误清除。

Worker/对白组合测试 15 项通过，其中新增两例分别模拟自然行动与交谈的提供方 503：原存档完全不变、待办清除、随后点击作者借钥匙行动仍成功且不调用模型、服务重开后可恢复。已有丢响应测试同时保持通过。类型检查通过。未进行新的真实模型请求，未发布；画面验证仍待可用窗口。

### 编译后默认叙事入口实证（2026-09-16，本地）

`scripts/test-oldstreet-bundled-narration.ts` 读取 `worker/index.js`，以 opaque data module 导入正式导出，用 `handleApi` 与未注入模型参数的 `CarriageJourneyAuthority` 跑当前旧街预览。唯一测试替代是内存 SQLite Durable Context；请求走真实平台模型，显式最多 6 次。本轮借还钥匙及后续关系对白三轮执行成功，单轮 3250 / 1710 / 2002 ms，原请求回放不再调用模型。证据及 bundle SHA256 在 `doc/oldstreet-bundled-narration-20260916.json`。最后回复“像这次一样”有暗示已发生修理的歧义，未造成状态变化，记录为未解决的措辞质量问题，不宣称所有对白语义完美。

此测试证明编译产物与默认提供方装配可以执行，不冒充真正 workerd / Durable Object 部署或平台 UI 验收。CUA 当次仍报告锁屏。线上保持 `42b2262`，本地普通模型能力尚未随正式集中更新发布。

### 居民动作继续推进（2026-09-16，本地）

阿岚单格朝左迈步试验仍未通过镜头/摆臂检查，记录见 `doc/oldstreet-lan-single-west/review.md`；原输出保留，没有进入运行素材。阿岚和许青的可用行走图集仍是未完成项，不用平移站姿冒充走路。

已有老周动作改为读取主角 `oldStreetStride`，按 `.22/.24` 人物比例得到完整步幅约 51.33 世界单位，取代旧 86.43。巡走速度 24 世界单位/秒、活动范围、碰撞和接近停止不变，避免只调整主角而留下居民滑步。30/60/120 fps 的已有位移/姿态与接近停止用例和主角步态测试继续通过；需要解锁后的真实画面复验，本次未发布。

### 交谈发送与等待衔接（2026-09-16，本地）

自由交谈或话题发送后，立即用现有对白气泡展示玩家刚说的话，清掉上一轮显示；接近途中提示“正在走近”，到达并提交后提示“等候回应”。自由行动显示对应的行动等待提示。等待内容只存在于客户端展示，实际成对对白仍由 Session 成功回执产生，不提前写存档。明确拒绝或异常时恢复输入文本，成功后由真实回执替换等待内容。沿用现有面板高度限制和滚动，不新增覆盖地图的全屏等待页。类型检查通过，锁屏期间尚未完成真实画面验收；本次未发布。

本地 `oldstreet-dev` 的真实模型仍使用显式进程预算，普通作者玩法不依赖该预算；`session=worker` 使用独立本地 Worker 旅程。没有为了对齐体验自动更换入口或迁移已有存档，也没有静默开启不限量本地请求。

### 互动面板不再推动镜头（2026-09-16）

移除 `old-street-dev.tsx` 对互动面板高度的 ResizeObserver，以及相机接口的动态 `actionHeight` 参数。镜头使用由视口确定的固定 HUD 预留带，继续跟随人物和实际视口变化，不因可用行动、话题或对白长度改变构图。行动按钮程序聚焦使用 `preventScroll`。

在现有 5460 修表铺旅程中，原地选择抽屉 → 锁着的小格 → 抽屉，面板实测高度 175.5228 → 131.5264 → 175.5228 px，场景始终保持 width 500.036、height 750.054、translate(-15.6261px,-138.737px)。真实截图确认场景保持原位；本次没有拾取物品或改动剧情。320×568、390×844、844×390 相机边界/指针反变换测试通过，类型检查通过。仅本地更新，未发布线上；尚无 iPhone 实机证据。

### 摇杆视觉反馈（2026-09-16）

`OldStreetJoystick` 使用原有 `/28` 输入向量控制移动，同时把圆点按该向量投射到摇杆边框内，按下高亮，松手以 110 ms 回中；减少动效偏好下直接回中。只接管一个 pointer，释放、取消、失去捕获、窗口失焦、切后台或禁用时停止并回中。面板/特写打开期间禁用摇杆。视觉状态封装在组件内部，不修改移动速度或世界坐标。

5455 现有试玩中普通拖动后，DOM 确认 `data-active=false`、圆点 `translate(0px,0px)`；类型检查通过。浏览器工具不支持 `Input.dispatchTouchEvent`，未取得 iPhone 或按住过程的截图证据，不把普通拖动后的回中检查当作全部触屏状态验证。本次仅本地更新，未发布。

### 修复普通本地试玩未接模型（2026-09-16，用户实测反馈）

此前 5455 的 `oldStreetWorkerPreviewPlugin` 以及 5460 的本地适配器只有显式设置模型测试预算才装配解释器。默认没有模型时，自由输入只能完整匹配作者别名，导致玩家换种说法就被拒绝。此前注入模型的测试不覆盖该默认装配，是实际验收遗漏。

两种本地适配器现在默认使用平台 `chatModel` 及同一解释/对白生成器，保留 Session 频率限制与领域准入。明确设置预算继续使用受控预算，`OLDSTREET_MODEL_TEST_BUDGET=0` 仍可显式关闭；不是取消所有执行约束。5455 现有修表铺旅程中，通过界面输入“我把挡住抽屉的那个盒子挪到一边。”并发送，真实执行移开空盒，抽屉状态变为放大镜可取；没有使用按钮原文或直接写存档。此证据修复并覆盖实际默认页面路径，不代表未实现的任意动作都能执行。

同一 5455 页面完成本地整合构建并刷新恢复后，再输入“我收起收据旁边的那把放大镜。”：显示“正在行动…”，随后抽屉变为仅收据，物品从桌面移除并出现在随身列表。两句均从 UI 输入发送，无别名新增、无直接状态注入。未发布线上。

### 自由行动的短文字承接（2026-09-16）

`server/old-street-attempt.ts` 将普通场景自由输入解析为已有领域行动，或 1–3 句临场尝试。输入上下文包含当前场景可见知识、可执行行动、行囊及该对象最近 4 次尝试；模型建议经过第二次语义校验。临场尝试只追加叙事块和版本，不改物品、关系、门锁或谜题状态。至多两个已知事实可作为观察记录保存，发现页去重展示；文字结果和记录随同一 Story Session 恢复。暗房扩展的专用行动分支暂沿用原处理。

模型提案不合格时返回“尝试尚无可确认结果”的短反馈及当前可执行选择，不虚构成功或障碍；真正的网络/模型服务失败仍走可重试错误。两次模型请求共享 20 秒上限。实现已接入本地适配器、Worker 预览及正式 Worker 源码，本次未发布。

验证：19 项针对性测试通过，覆盖记录恢复、幂等重放、物理状态不变及不合格提案降级；完整构建和 Worker 启动检查通过。5455 实际 UI 使用真实模型输入“我仔细看看小格现在是开着还是锁着。”，返回小格锁着的短反馈；重新打开同一旅程后，发现页仍显示观察记录。此验证不代表任意物理机制已实现。

同页复验“我拆掉小格的门，直接拿走信。”，真实返回“小格是锁着的，拆掉门的尝试尚未成功”，并建议观察或找钥匙；画面仍为锁着的小格，行囊仍只有放大镜。

### 暗房自由尝试与照片连续性（2026-09-16）

后续补齐动态暗房分支：显影台与普通房间现在共用自由尝试的生成、短文本提交和观察记录流程。上下文仅描述照片未准备、待手动拼合、已拼好、已带走等权威状态，不臆造生成照片的具体画面。拼合意图仍进入原有 proof 校验；带走和留下仍使用既有领域分支，不能通过叙述增加物品。

28 项针对性测试通过：包含扩展规划激活与进暗房、准备前后观察、缺少拼图操作证据时不得完成、完成后自然输入带走、再次观察台面、同 action_id 重放不再次调用模型，以及已有会话恢复测试。此次使用注入 provider 验证核心串联，不能据此声称暗房真实模型回应或平台试玩已通过。完整构建、资源 hash 与 Worker 启动检查通过。

真实暗房合成输入试验在发送前被自动审批拒绝：审批判定之前授权仅覆盖六条列车输入。已向用户请求这次明确的暗房测试范围；未绕过拒绝、未发送该新输入。当前改动仅本地，未发布线上。

### 自由尝试与人物对话共用近期记忆（2026-09-16）

`oldStreetAttemptHistory` 从现有叙事块提取当前目标最近 4 条有效尝试；对白上下文读取该人物的尝试，人物尝试上下文读取同一 speaker 的最近 4 轮对白。未知人物不获得人物对白历史，物件不获得人物历史。生成与校验提示明确区分言语/尝试记录和当前权威事实；不新增存档格式或迁移旧旅程。

8 项针对性测试通过，覆盖两种输入方式共享记忆、其他对象隔离、最近记录截取、序列化恢复及玩家宣称不进入事实知识。此项为本地上下文与核心行为验证，尚未取得新增真实模型回忆对话证据；此前暗房联网授权问题仍单独待回复。

本轮完整构建、资源 hash 检查、Worker 启动检查和公开凭据扫描均通过；未部署线上。

### 自由行动承接已确认线索（2026-09-16）

玩家行动上下文从 `oldStreetJournal` 读取已由事实解锁的规范发现，以 `learned:` 标识提供给叙事模型，并附带当前随身物件的既有用途说明。没有对应事实时，钟底刻记和照片拼合答案不会出现；历史观察快照不当作当前事实重新注入。旧线索可被回忆，但提交层不将 `learned:` 重复写为新发现。NPC 对白的知识构造未扩大，玩家发现不会自动变成其他角色已知的内容。

9 项针对性测试及类型检查通过，涵盖谜题前后知识准入、物件用途、旧观察隔离、NPC 知识隔离及序列化恢复。本轮未调用外部模型；真实回应质量仍待相应授权和实测，不以构造出的上下文代替真实叙事验收。

本轮完整构建、资源 hash 与 Worker 启动检查通过，公开凭据扫描通过；仅本地更新。

### 浏览器核心操作补验（2026-09-16）

在既有 5455 修表铺旅程中，页面先显示地图未就绪；点击实际“重新连接并恢复”后回到修表铺，随身放大镜保留。没有重置存档或直接注入状态。

390×844 浏览器视口，关闭外部访客栏后通过 CDP 真实鼠标按下/移动/释放驱动现有摇杆（非合成 DOM 事件）：按住时 `data-active=true`、圆点 `translate(11.5px,-7px)`；释放后 `false`、`translate(0px,0px)`。人物离开原交互范围，行动按钮变为“走近物件”。这是桌面 Pointer 路径证据，不等于 iPhone touch/pointercancel 真机验收。

320×568 时 DOM viewport 与页面 scrollWidth 均为 320，顶部三个按钮均高 44px，摇杆为 64×64 且 bottom=560，主行动为 90×44 且 bottom=550。地图热点可能随镜头位于可视区域外，未将其误判为 HUD 溢出。工具截图与 CSS 视口缩放不一致（390×844 输出中内容约半尺寸），故不以这份截图宣称手机像素构图通过。临时 viewport 已 reset，鼠标已释放。本轮仅补实证，无代码/线上变更。

### 居民步姿换装实测（2026-09-16）

平台单参考 edit 以公开 hero-gait-v2 第二行第一格作步姿参考，生成阿岚单帧换装候选。任务约9.9秒成功返回，但实际朝右、近于平视、比例细长、粗线平涂，未保留 B 视角和原步姿。已拒绝且未替换运行素材；请求、任务、原图与检查见 `doc/oldstreet-lan-pose-transfer/`。下一步需有真实姿势控制或分层素材制作方式的证据，不能继续无约束文本重试。两位居民行走素材仍未完成，本轮未发布。

### 观察记录与物件变化一致（2026-09-16）

发现页按知识 ID 展示最近一项观察；已知实体的 `visible:` 记录通过 `oldStreetPropState` 从当前事实更新文字，不再把旧的“当前锁着”作为现状。一般观察明确标为先前记录；旧 `learned:` 重复条目不显示，暗房照片完成后由既有照片去向条目统一展示。叙事块原文保留，没有存档迁移或历史删除。

12 项针对性测试通过，覆盖中英小格锁住/开锁/取空、同物件重复记录、旧历史不变、序列化恢复以及暗房照片从准备到带走的说明去重。实际 5455 原旅程恢复后，发现页显示“观察记录 锁着的小格”，行囊仍有放大镜；没有为界面测试改写原进度。完整开锁变化以对应规则测试为证据，本轮未重复主线全程。

### 地图聚焦滚动修复（2026-09-16）

沉浸模式地图容器改用 `overflow:clip`，由相机唯一控制地图平移。原 `overflow:hidden` 容器会被离屏热点的浏览器聚焦自动滚动；实际街口转场曾出现 scrollTop=587，叠加相机造成主角离开画面。修复后同一旅程街口→修表铺实际点击验证 scrollTop=0，stage 的实际位置与相机 transform 一致，截图中主角可见，放大镜与原进度保留。此验证针对容器滚动，不代表 iPhone 全流程验收。

### 受阻物件的探索提示（2026-09-16）

实际 5455 既有旅程发现：选中旧箱后没有可执行按钮，但当前行动区仍写通用行走提示。`old-street-dev.tsx` 现在复用 `oldStreetContextAction`，在无 notice 且 primary 为 inspect 时显示其规则原因；保留输入和原先动作，未新增状态或模型调用。浏览器实测：未带推车显示“需要随身带着推车”；经洗衣店借推车、返回旧箱，出现“移开旧箱”；执行后旧箱移到墙边、地下储物室入口不再关闭，放大镜和推车仍在行囊。构建通过；仅代表本段连续探索与反馈，未宣称整部游戏或手机验收完成。

### 连续探索与取信恢复实证（2026-09-16）

在 d2089f9 的 5455 真实浏览器和上一轮既有旅程中继续操作，未注入位置/事实、未重置存档、未调用新的模型测试：从开放台阶进入地下储物室，取得印有照相馆标记的照片夹；走到工作棚选择“问候并借钥匙”，可见首次介绍先出现，随后老周递钥匙，人物标签由灰发老人变成老周。打开棚侧插销后直接回合住院，再回修表铺开小格、拿信。

实际刷新仍在修表铺，小格为空，放大镜、推车、照片夹、钥匙与密封信全部保留。发现页同时显示露出的台阶、院门捷径，以及原观察记录更新后的“小格 · 空”，不再显示旧锁定状态。当前目标提示可从街口回家或继续探索。下一步保留这个存档继续照片解谜、归还借物与结局检查；本轮未结束旅程，未验证平台账号跨设备、iPhone 或全部结局。工作棚截图也仍显得空旷，不能据机制通过宣称场景美术完成。

### 照片支线的连续探索实证（2026-09-16）

继续同一 5455 旅程，从修表铺经街口到照相馆，实际点击放大台和“比对照片”。图片加载成功；选择窗沿、晾衣绳连续的第二张并提交后谜题关闭，显示洗衣店旧店面的发现。随后交还照片，许青的可见介绍先出现，照片夹从行囊移除，放大台标签变为已归还的照片夹。询问可留下哪张照片获得明确许可后，返回修表铺的记录册出现收录照片；收录成功后出现撤下记录的选项。

发现页显示拼合的旧照、照片物归原主、获准旧照已收录三项结果；人物页显示许青及“你帮她找回并交还了旧照片”，未把尚未认识的阿岚预载到人物页。本轮未触发自由交谈/扩展生成，不新增网络模型授权；只检查一次代表性解谜到人物/记录后果链。原旅程及尚待归还的推车、钥匙保留，结局尚未执行。照片谜题在 1280×720 下需滚动查看底部操作，移动端构图仍需后续集中检查。

### 归还与结局闭环（2026-09-16）

同一既有旅程实际归还洗衣店推车和老周钥匙：行囊分别移除，推车回到停放处，老周显示履约对白。通过街口“带信回家”及确认完成旅程；结局只有送信、归还照片、获准旧照收录，未虚构未完成的送钟支线。刷新仍恢复同一完成结果，未新建或删除旅程。

修复结局展示遗漏：原存档已有 characterEpilogues，但结果面板没有渲染。现从这份结局快照读取，置于默认折叠的“街上的人 / People on the street”；实际展开显示归还老周钥匙、许青收好照片，未出现未认识的阿岚。不迁移或重算历史结局。真实画面核对、完整 build、secret audit 通过。当前代表性本地路线已覆盖探索、道具、解谜、介绍/关系、可逆记录选择、结束与刷新；不等同 iPhone、真实模型新用例、平台账号续玩或正式发布完成。

### 工作棚地面独立化（2026-09-16）

新增环境资源 shedFloor，经统一预加载进入 OldStreetFloor，替代工作棚对 cellarFloor 的裁切复用；地图和碰撞不变。平台首图误带人物已拒绝，一次修正后实际沿照相馆—屋顶—工作棚检查比例与入口。细节见 `doc/oldstreet-shed-floor/review.md`。构建和 secret audit 通过，旧旅程保留，未发布。

### 固定家具与旧地图落点升级（2026-09-16）

`old-street-furniture.ts` 同时提供静态家具碰撞footprint和图集元数据，工作台由RPG-JS事件渲染而非纯地面贴图。新增素材进入启动下载、texture加载和销毁释放。地图升级到oldstreet-furniture-3，旧blockout-1/2允许按原几何读取，再恢复到新几何附近安全位置；新增测试证明故事、物品与旅程版本保持。7项家具/通路测试与25项会话测试、完整构建通过；实际地图检查人物绕桌以及前后画面。详见 `doc/oldstreet-shed-bench/review.md`，未发布。

### 归还后的钥匙知识与固定陈设（2026-09-16）

修正 oldStreetDialogueContext 的 key-status：此前“没有钥匙”一律附加“需要先借用”，与已开小格/已取信/已归还后的进度冲突。现由 oldStreetKeyStatus 根据实际行囊、履约关系、开锁/取信事实分别描述持有、已归还、仍需开锁、已可直接取信和无需再借；既有对白历史保留。

固定家具描述与 footprint 同列在 oldStreetFurniture 中；oldStreetSceneKnowledge 仅投射当前房间的 scenery 知识，工作棚模型上下文可知道画面里有固定维修台，不将台面工具变为可领取物品或新增行动。中英共9项上下文/对白检查通过，覆盖先还后借、开锁后还、取信后还及存档恢复，包含场景隔离与无存档写入；不是新增真实联网模型实证。

### 照片谜题小屏操作区（2026-09-16）

OldStreetPhotoView 将图片/提示放入独立滚动内容区，旋转与提交放在不收缩的底部操作区，标题和关闭保持独立。拼图和候选按dvh限制大小，保留原比例；主线和动态照片共用同一组件，proof及提交规则不变。本地 `_qa/photo-layout.local.*` 只挂载生产组件，无Story Session/网络模型请求，不进入构建入口。

CUA实际DOM尺寸：中文320×568下按钮底边523.8、高约44；390×844下底边719.1、高约44。英文320×568展开提示后按钮底边535、高66（文字换行），scrollWidth320，无横向溢出。实际选择第二张、转半圈、提交回传piece-river/rotation180，确认回调未被布局改动破坏。工具截图有缩放偏差，以读取的实际CSS尺寸为准，不宣称iPhone验收；临时viewport已reset。完整build通过。

### 按房间准备固定环境（2026-09-16）

oldStreetEnvironmentKeys 提供各房间实际环境依赖，oldStreetEnvironmentDownloads 可按房间选取。首次恢复只下载当前环境与共享角色/物件，街口环境4项、工作棚5项。转场、选旅程及重新探索在 renderer.restore 前准备目标环境并完成decode；原场景保留到准备完成，显示简短等待提示。每个资源使用已载集合/进行中Promise复用，成功的blob只在本页面复用，组件销毁时统一释放；失败走现有恢复提示，已提交故事不回滚。角色与可变物件尚未按房间拆分，不宣称已实现全资源流式加载。

两项依赖检查覆盖默认/旧模式、暗房与未知房间；完整构建通过。实际5455工作棚首次恢复后、首次转入地下室后，所有可见SVG环境图均使用下载解码后的blob，截图没有空白地面。断网及慢网的等待长度未在本轮模拟，不能据局域网速度宣称移动网络性能改善幅度。

返回工作棚后进一步核对可见环境图href数组与离开前完全一致，证明此次往返复用了原解码资源，没有替换成另一批blob。

自由尝试生成器 `server/old-street-attempt.ts` 在格式或语义拒绝后最多重新生成并检查一次；两轮共享原有 20 秒 AbortController 预算，网络错误不自动重发。审查区分事实依据与新发现记录，空 discoveryIds 不再意味着短暂动作或旧知识回应不合格。只有通过审查的结果返回 Session 提交，废弃候选不进入旅程。
`oldStreetTurn` 接纳同一旅程、同一场景且恰好增加一个版本的 `oldStreetAttemptTarget` 叙述块，沿用现有回应区与移动收起逻辑；普通叙述提示及历史恢复不进入该区域。自由行动输入与人物交谈共用等待中的输入展示。

`decodeSpatialArt` 为初次背景、转场背景与主角预览解码提供 10 秒期限与页面 AbortSignal；解码失败统一为 ART_IMAGE 错误，由现有素材恢复提示承接。失败清空临时 Image 来源，blob 仍由调用方按既有生命周期释放。合成恢复测试串联实际 OldStreetAuthority、SessionClient 和解码故障：服务端已确认转场后重新 enroll/recover 保留场景、落点及放大镜，不再 POST 行动；此证据不等于真实 iPhone 故障测试。

2026-09-16 本地实际 UI 检查：现有测试旅程从素材失败提示点击恢复，工作棚重新可用；随后通过出口步行到修表铺、移盒拿镜，认识阿岚、借推车清箱，经储物室到工作棚领取旧钟、抬插销开捷径，再回铺中打开钟底特写。依据图像点击右下金属牌并选择一对燕子，收到保存后的刻记文字。测试未调用自由模型，也未读取或注入隐藏旅程状态。发现观察入口原本只标“抽屉 · 收据”，现用同一可执行规则切换目标标签，并补行囊地点提示；本次未宣称新玩家理解验收或旧钟支线完整归还验收。

`recordOldStreetInteraction` 对作者固定行动结果中的成对弯引号分段：引号内为具名对白，其余为旁白；招呼动作原本就是直接台词，保留原行为。此规则只用于固定行动结果，不解析自由模型文本或回写旧存档。双语测试覆盖首次介绍、递钟动作/台词及无直接台词的同意摘要。
同日实际本地 renderer 复验：延续钟底已辨认的测试旅程，经修表铺→院子→洗衣店，点击阿岚后交还旧钟。截图与 AX 显示“店主接过钟”旁白、阿岚气泡仅“这是我母亲的钟，谢谢你送回来。”、后置“她把它摆回柜台。”旁白；背包移除旧钟，柜台标签转为已归还，询问留下故事的后续行动开放。使用固定行动，未发起真实模型请求。

2026-09-16 本地实际选择后果复验：在同一旅程中询问阿岚留下旧钟故事，发现页先显示已同意但尚未收录；到修表铺记录册执行收录，出现撤下按钮，再执行撤下恢复收录按钮。人物页仍显示阿岚及“你帮她送回了母亲留下的旧钟”，发现页仍有钟底刻记和旧钟来历。新地点提示在实际发现页可见。此回合验证固定行动的可撤回选择，不涉及真实模型或线上发布。

### 真实自由尝试批次（2026-09-16）
用户明确授权六条合成旧街输入与合成状态发送到既有 game-chat 接口，每条最多四次请求，总上限24。脚本 `scripts/test-oldstreet-free-attempts.ts` 默认只准备数据，显式 live 才联网；此次结果在 `oldstreet-free-attempts-live-20260916.json`，实际18请求。首次六条均返回但敲击虚构内部声音、取镜后断言无其他物品，语义检查未拦截；因此不能以返回成功计为质量通过。修正生成和检查中的隐含观察约束后，在各条剩余请求额度内复测：敲击保留内容未知、取镜后正确看见收据。拆柜子复测仍触发检查/修正分支，被测试脚本的累计授权上限停止，未验收。移盒返回正确动作ID，暗房返回手动拼合提示，没有执行或跳过谜题。这是生成器的真实网络证据，不是平台全流程或所有自由行动的证明。单次成功生成/检查约1.6–4.3秒。

真实批次后的本地修正：自由尝试审查现在返回最多3条、每条240字以内的具体问题，修正轮收到这些问题而不是只有失败标志。问题只作纠错数据，不成为世界事实；仍共享20秒预算、最多两轮。提供商 JSON 解析失败也使用唯一修正机会，真实网络错误不重发。合成测试证实“抽屉仍有收据”这一拒绝原因进入第二轮并可产生正确回应；这次修改尚无新增真实请求证据，拆柜子用例仍标记未验收。

2026-09-16 发布后本地试玩：已拿放大镜且已归还旧钟的旅程点击“抽屉 · 收据”时，原本只显示一次性动作的“这里已经处理过了”。现由 `oldStreetContextAction` 在抽屉没有可执行行动时提供当前观察“抽屉里还留着收据，放大镜已经拿走了”，不虚构收据内容或增加取物动作；仍持有未检查旧钟时，检查钟底继续优先。中英状态测试通过，当前本地真实页面 AX 与截图复验提示可见且背包保持放大镜、推车。本次不调用模型、不新增存档事实，也未追加线上发布。

2026-09-16 第二段代表性本地旅程完成：接上旧钟已归还、旧钟故事收录后又撤下的同一测试旅程。通过修表铺→合住院→已开插销的工作棚捷径，点击老周借钥匙，短对白与递钥匙旁白分开，背包新增小格钥匙；原路回铺开小格、取信，地图标签依次为锁着/密封信/空。通过旅程列表切到先前已完成的照片路线，再切回修表铺，空小格及放大镜、推车、钥匙、密封信保持。随后从铺门到街口，离开确认指出未归还推车、钥匙；主动选择带借物离开后，结局显示信已送到、旧钟已归还及两件借物仍持有，未显示已经撤下的旧钟收录。展开人物结尾只出现已认识的老周、阿岚，没有未登场许青。以上由实际 UI 点击、AX 和结局截图观察，未注入存档或模型，未证明新玩家理解、真实手机/AlterU平台全流程或所有路线。两个已完成测试旅程均保留，未重置。

恢复反馈修正：启动时在 recover 前保留当前旅程的待确认请求。若回执确认提交且版本恰为 expected_version+1、仍在同一场景，`oldStreetRecoveredTurn` 仅选取该 action_id 前缀的对白/自由尝试块显示；无待确认请求、另一旅程、后续版本或转场不重放历史。若服务端明确拒绝，显示拒绝提示，并在相同场景回填原对话/行动文字与目标供玩家修改，不自动发起新请求。四项 turn 测试和 TypeScript 检查通过。此次尝试打开 Telegram 时系统报告锁屏且自动解锁失败，因此新增恢复反馈尚未完成真实 UI 复验，也不代表 AlterU 平台全流程通过。

随后补充客户端—SQLite 权威层串联故障证据：`old-street-local-recovery.test.ts` 在一次自由尝试已经提交后丢弃响应，重新创建客户端并 enroll/recover；enroll 已读到新版本，仍能按待确认 action_id 找回唯一短回应。断言尝试生成器仅调用一次、重放 action_id 相同、pending 清空、背包不变、只有一个新增事件；恢复后仍可正常转场。与 turn 测试合计5项通过。生成器为合成实现，传输为故障注入，并非真实平台模型或手机断网证据。
# 2026-09-16 平台重新进入诊断

后续细分：`cloudTransport` 将自身超时分别归类为 `CLOUD_HEALTH_TIMEOUT`、`CLOUD_READ_TIMEOUT`、`CLOUD_WRITE_TIMEOUT`，范围包含响应体读取。仍保留 10 秒握手/30 秒业务请求的既有时限，不自动重发写入，也不读取或改写任何身份。17 项 transport/恢复文案测试通过；实际平台阶段以部署后的显示为准。

AlterU 实际主线通关后，重新进入停在恢复旅程页，尚未确认根因。失败页增加默认折叠的连接详情，只输出固定错误分类与启动阶段，不输出原始异常、请求 URL、身份或存档内容。不会清除身份、重置旅程或改变服务端存档。正常游戏界面不显示诊断信息。

验证：恢复文案与分类测试 3/3，旧街 session/恢复测试 26/26，生产构建（含素材哈希与 Worker 启动）通过。平台故障仍需以部署后实际错误码和续玩结果为准，不能凭这些测试宣称已修复。

### 居民视频候选与动态投射（2026-09-16）

`oldStreetProjectedProps` 现在对老周、阿岚、许青的显式居民坐标共享投射 body/position/approach；没有传入坐标的居民仍保持原站位。移动碰撞检查新增受限 `ignoreResident`，只在检查该NPC自身位移时排除自己的身体；玩家、服务端和现有存档调用不改变参数。居民8项和空间/会话/家具32项检查通过。

`src/dev/lan-video-trial.ts` 仅由 oldstreet-dev + DEV + debug + npc_gait_trial=lan-left 共同开启，使用真实RPG-JS事件在洗衣店试走左向10帧。不能启用右向/前后行走，不持久化候选站位。生产构建成功并检查未包含候选图集与测试入口。390×844实景证据、局限与原素材保留见 `oldstreet-lan-video-walk/review.md`；正式NPC素材未替换，本轮未发布。


### 本地四向视频动作候选（2026-09-17）

`prepare-lan-four-way-video.ts` 校验四条原视频SHA及原站姿SHA，对已提取03–12帧做现有去底与脚点对齐，不缩放或重绘，输出11列4行候选图集。`src/dev/lan-video-trial.ts` 按实际碰撞后距离选帧；四向测试从当前位置起步，不传送回原点。入口为本地oldstreet-dev模式的 `debug=1&npc_gait_trial=lan-four`，兼容旧lan-left参数。正式构建条件裁除动态导入，正常入口没有试走按钮。候选尚未正式准入，当前NPC来源仍为主角/修表师GPT基准、洗衣店主/摄影师平台站姿。


### 人物身份随旅程连续（2026-09-17）

行动对白 speaker 与结局人物回顾从 `save.characters` 的稳定 ID 读取当前旅程已介绍姓名，与自由交谈和地图标签统一；不再在结果文本写死旧人物名。未介绍人物仍不进入结局，已完成结局不重算，旧正文/角色/关系不会被内容升级覆盖。本轮尚未激活新姓名或新人物图，新旅程角色定稿需与可见形象、首次介绍一起接入。`old-street-identity-continuity.test.ts` 使用与当前角色表不同的中英文历史身份，序列化恢复后验证行动/交谈/关系/结局一致、旧历史不变、未来角色不泄露；连同对白与结局相关10项测试通过，TypeScript检查通过。

### 平台简化人物实际场景候选（2026-09-17）

用户接受平台 pose-preserving 人物外观的瑕疵范围后，先做实际场景检查，不追加生成。`prepare-laundry-platform-trial.ts` 保留并验证原图 SHA，在右边补两列背景以形成整数三列，再调用制作页共用 `prepareSpritePixels` 去洋红底并对齐脚点；不缩放、不重绘、不修腿。输出 960×1408、3×4，脚点 (160,328)，保留全部12帧。

`src/dev/laundry-platform-trial.ts` 经本地 `oldstreet-dev` + DEV + `debug=1&npc_gait_trial=lan-platform` 加载。真实 RPG-JS 事件使用 .22 比例、居民24单位/秒和20单位步态周期，受现有碰撞约束；正常入口仍使用已发布站姿。390×844 浏览器中候选已在原洗衣店旅程出现，四个方向均触发试走；左、右、上已观察到完成24单位，下向观察后也完成24单位。右向连续快照显示位置推进及 stand→stride-2 切换；无明显洋红矩形，人物大小与主角协调。该观察证明接入、方向和切帧，不等于完整周期左右腿语义或真实 iPhone 观感已经验收。候选站位不写存档，不调用模型，不修改叙事身份。

### 新旅程店主接入与自然活动（2026-09-17，晚于上段候选阶段）

新旅程初始事实 `laundry-cast-v2=true` 同时选择青绿衬衫图集、未认识时的外观称呼，以及玛拉 / Mara 的首次介绍。没有该事实的旧旅程继续使用围裙站姿和旧介绍；已认识姓名仍从存档读取。切换不同人物版本的旅程时，先通过权威客户端切换选中旅程，再重载 renderer，避免旧图配新介绍；不重写旧正文和关系。

`old-street-laundry-art.ts` 使用已去底对齐的 `actor-atlas.png`，`old-street-resident-motion.ts` 新增路线轴和半径参数。店主纵向半径9、速度24单位/秒、20单位一轮步态、端点停留3秒；主角进入100单位范围停步，离开120单位范围恢复，选中交谈或暂停也停止。恢复时若玩家恰好站在原位置，店主可暂时让到后方32单位，避免重叠。纵向半径不取10，是因为静态权威互动范围严格小于54，而默认接近点在人物下方44单位。

新店主与修表师一样由客户端提供实时实体碰撞，服务端不使用过期的原站位挡玩家；仍验证永久障碍及固定互动区域。15项角色/动作检查和25项会话检查通过，覆盖30/60/120fps、边界接近点、恢复重叠、介绍、中英姓名与旧旅程连续性；构建与 Worker 启动通过。

正常入口 `http://localhost:5463/?shop_art=pixel&shop_environment=whole` 的新建合成旅程实际走过街口→合住院→洗衣店，无 debug 或试走按钮。390×844 下先显示外观称呼，招呼后可见新介绍、玛拉的对话和选项。离开后人物 DOM 位置从 y=57.4653% 到60.5903%（18世界单位），截图对应向北/向南站姿；靠近交谈时面向主角。当前准入范围是四向站立/转身及店内纵向活动，侧向完整步态仍不能作为通用模板。没有调用真实模型、没有新增生图、尚未线上发布。

本次另外观察到：换本地开发来源/数据库时，浏览器残留旅程指针可能导致 SESSION_NOT_FOUND，现有启动页只有重连。本轮使用独立 localhost 来源新建测试旅程继续验证，没有清理用户存储或改写原旅程；缺失会话恢复入口待集中恢复流程处理，不将其误报为线上存档丢失。

## 新摄影师与左右步态接入（2026-09-17）

- 新旅程增加 `photographer-cast-v2`，以平台诺拉形象替代新旅程的许青；没有该事实的旧旅程继续使用许青名字、外观和原介绍。`oldStreetCastArtVersion()` 同时比较店主/摄影师版本，换旅程时按需重建renderer。稳定 `xu-photographer` ID与任务/关系保持。
- 共享 `prepare-platform-resident.ts` 只做已授权去底、分帧、脚点对齐；共享 `platform-resident-art.ts` 消费960×1408图集。原图保留，准备清单不等同准入，实际决定单列 `admission.json`。
- 用户观看左右走动对照后认可此效果可接受；摄影师使用横向±24世界单位的路线，速度24、完整步态20单位，店主保留纵向±9。两者近处停止朝向玩家，动作暂停沿用既有单人规则。圆润体型仅当前素材可用，不进入通用基准。
- 旅程菜单新增“另开一段探索”，调用已有Session创建接口，保留原旅程列表，不清除当前/旧存档；同素材版本新开后关闭旅程面板，不同版本重载后恢复新旅程。
- 本地正常入口观察：旧洗衣店旅程恢复为玛拉→列表另开旅程→街口→照相馆→问候→外貌称呼变诺拉；390×844画面比例、去底与对白已检查。热更新期间一次素材加载失败，使用可见恢复按钮后照相馆/诺拉进度恢复。横向巡游DOM脚点x68.75%为右端，y59.7222%，真实renderer显示向右站姿。
- 相关43项角色/居民/身份/Session测试通过；改横向后6项角色与两路线检查重新通过，含30/60/120fps、实际碰撞、权威交互距离和恢复避让。首次整包构建已通过；最终提交前按最终源码重新构建。没有重复跑全部故事路线，没有新增叙事模型请求。

## 街口环境独立载入（2026-09-17）

`old-street-environment-art.ts` 的 `streetGround` 引用平台768×1152正俯视候选，`old-street-environment-dependencies.ts` 仅在街口请求，合住院仍请求yard；已有blob去重、就绪和失败恢复复用。`old-street-floor.tsx` 将裁切平面映射到既有272×512地面矩形，门与碰撞定义不变。没有引用两张失败透视候选。环境依赖2项检查通过、tsc通过。本地普通入口从既有照相馆旅程过门返回街口，390×844检查比例/边缘/门口，点击地面行走正常；没有修改门位/碰撞，也没有重跑每条路线。

## 街口屋檐与门框（2026-09-17）

streetEdges 通过现有环境下载/解码流程仅在街口加载。平台512×1024屋檐图经SVG局部裁切，按56世界单位宽等比例平铺到地图外边界；首张正面外墙候选不接运行时。门缝来自oldStreetDoors，不从素材推导。旧地板/门位/碰撞与存档未改。街口环境依赖现在5项，早期4项计数为历史。修表铺/照相馆门框颜色分开，开放小巷增加石边磨损。边界与资源依赖3项检查通过；本地同旅程两家店往返、诺拉身份、390和320 CSS宽度检查见doc/oldstreet-street-atmosphere/roof-edges/review.md。截图工具额外缩放的限制已记录，不冒充真机验收。

## 台阶箱组与地图兼容（2026-09-17）

old-street-crate-layout.ts共享64×24占地、768×512图集、384/448脚点与64/614等比缩放。yard箱体贴北边界、cellar背面也有关闭态碰撞；oldStreetProjectedProps提供清路前后位置，RPG-JS事件仍随权威facts移动。oldstreet-thresholds-4保留旧版本读取时的原箱体规则，服务upgrade迁到新安全点，不改剧情/人物/库存。34项空间与Session检查通过；最后贴墙位置调整后相关9项复验通过。真实UI借推车、搬箱、台阶露出、进入地下室已验证，见doc/oldstreet-crates/threshold-redesign/review.md。

同一正常UI旅程实际通过清开的台阶进入地下储物室并返回院子，随后主动刷新，界面仍显示“墙边的旧箱”、开放地下入口和随身推车。已完成cloud构建、9场景资源校验、Worker启动检查及凭据扫描。本次不更新正式主站/Pages。


## 合住院氛围地面（2026-09-17）

`old-street-environment-art.ts` 的yard键改指平台edit候选 `doc/oldstreet-yard-atmosphere/reference-edit/candidate.png`，`old-street-floor.tsx` 使用完整576×960图等比映射288×480，替代原重复pattern。下载依赖仍为既有yard键，原图不被改写；门、箱子、碰撞、地图版本与存档均未修改。前两张未准入候选和原因保留，不能误当成运行素材。

CUA在localhost:5463既有合成旅程实测：390×844、320×568人物和地面比例、箱组紧贴台阶；点地移动带动镜头；院落→街口→院落实际背景切换；刷新恢复同一院落未清路状态。外部访客栏仍加载，用其Close检查无覆盖主构图。没有重复全部剧情路线。

验证：环境依赖两项测试通过；npm run build（cloud构建、原作资源检查、Worker启动检查）通过，日志 `/tmp/rpg-yard-atmosphere-build.log`。实际dist/assets/candidate-2Tfv8UFx.png与源图SHA256均为2dd7ffa17140584d7fce7f8a8f1af9018b86de5126a859be1e246b28b9f77988，资源打包非仅源码存在；凭据扫描通过。仅本地开发增量，未发布正式主站或Pages，不代表完整单人/平台验收完成。


## 记录册状态投射（2026-09-17）

`old-street-record-book.ts` 将权威 facts 的 consent + recorded 转成 stand/photo/clock/both。同一个记录册事件叠加册体、旧照、旧钟插图，四种状态显式设定两插图的 opacity，以支持撤下再收录。沿用现有照片谜题和旧钟图片，不生成或改写像素；加载经统一下载器及 nearest 纹理流程，卸载释放 blob。`old-street-prop-state.ts` 共享对应中英文标签。事件脚点、碰撞和任务规则不变，旧存档无需迁移。

实际浏览器验证照片的收录/撤下/重新收录及390×844、320×568显示，照片支线与取信主线至结局、刷新恢复一致。旧钟和双条目图层本轮只有组合/边界测试，不能称其视觉复验已完成。3项针对状态投射测试及生产 build（空间检查、9场景27资源SHA验证、Worker启动）通过。首次构建发现新增测试的数组联合类型未保留图层 opacity，改为明确元组后完整重建通过。详见 `oldstreet-integrated-playtest-20260917.md`。


## 动态扩展恢复入口（2026-09-17）

`old-street-expansion-recovery.ts` 将查询与恢复既有任务组合：计划 queued、照片 preparing 时提交空对象，沿用服务的任务ID及租约；candidate/failed/null只读。照片组件在每次轮询调用而非仅挂载时一次，因此旧服务租约过期后能够接续。状态请求与图片下载分别记录失败；重连重新查询，重载图片只触发文件下载/校验，不发 retry 或创建新任务。原剧情动作/拼图proof仍由Story Session裁决。5项针对测试与实际组件320/390宽恢复操作通过，详见 `oldstreet-expansion-recovery-20260917.md`。本轮未调用真实模型/媒体服务。

## DOM/SVG图片准备（2026-09-17）

`decodeSpatialArt` 不再只依赖decode Promise：成功load或complete缓存且natural尺寸非零也可完成准备，取消/损坏/真实停滞仍保持明确失败。适用于环境图和主角预览尺寸，不替代`loadSpatialArtTexture`或renderer握手。真实PNG+模拟停滞已复现旧误判并验证修复，主游戏刷新及切换现有旅程通过；见 `oldstreet-image-ready-20260917.md`。自然发生的旧超时原因仍未完全确认。

### 2026-09-17 对话分页与尾声演出（本地）

`old-street-dialogue-pages.ts`仅投影展示段落，保持原文本和顺序，中文64字符/英文180字符目标长度，不向Session提交翻页动作。`old-street-dev.tsx`统一显式选择和右下角主行动，NPC交互完成后保留谈话目标，结束/走动收起面板；自由输入按需展开，恢复提示3.2秒消退。

`old-street-ending-reel.ts`只读取complete状态且departed的结局快照：preserved、已登场人物的epilogues、unresolved。不改存档，不重新运行结算。`old-street-ending-view.tsx/css`提供全屏原生dialog，复用主角图集正面中帧、已准入钟和照片。SVG clipPath限制到单帧，避免字形SVG全局尺寸和邻帧漏出。尾声的前后段、暂停、跳过和重看只改组件状态；查看旅程继续使用已有旅程对话框。隐藏页面停止自动节拍，prefers-reduced-motion改为手动阅读。媒体失败时文字仍能完整阅读。

19项相关测试通过：分页保真、上下文主行动、回合恢复、既有结局与新增尾声不修改存档。真实浏览器已验证320/390中文状态、暂停/跳过/重看/返回旅程和reduce模式；并未据此宣称英文长内容、iPhone键盘、完整平台流程或最终UI验收完成。

## 2026-09-17：英文 UI、对白节拍与相机边界

`old-street-tool-icon.tsx` 提供三枚同体系工具图标，工具按钮保留完整 aria-label，短英文标签避免 320px 标题被挤成竖排。`oldStreetDialogueBeats` 在原分页结果上合并至多两段、总长不超过中文64/英文180的短块，仅改展示，不改 StorySave 或说话身份。短视口展开输入时保留提交区域，暂隐藏正文与选择。

`old-street-camera.ts` 的纵向 scale 下限改为 viewportHeight/576，平移下界使用完整视口减地图高度，上界为0；原固定阅读带只参与跟随目标，不再作为地图下沿，消除靠近南门时的场景外留白。总览调试模式不变；世界/碰撞单位与反向点击换算不变。

`OldStreetAudio` 增加 ending cue：新确认 departed 提交或主动重放时播放两次有限长度的正弦音，先停止旧 foley；恢复结局不自动触发音效。静音、失焦与音频未解锁仍按原合同处理。`old-street-context-action.ts` 对已取信小格提供具体的已知状态。

代表性英文实景及模拟键盘、18项定向测试范围见 `ui-polish-review-20260917.md`。不把合成音频测试视为真机听感，不把本轮本地测试视为正式部署验收。

## 2026-09-17：动态主线实例与权威事务（开发中，未开启玩家入口）

`old-street-campaign.ts` 定义可选的、按旅程保存的 version1 探索链：三条寄存记录的双特征比对，以及承接被选记录的材料查看/保留选择。记录必须有唯一双特征匹配、每个单特征各有干扰项；固定规则决定答案，不读取模型自报答案或效果。存档保存实际生成内容及实例ID，随机种子不是内容恢复来源。

`old-street-campaign-planner.ts` 通过现有 ModelRequest 生成严格字段的两类内容。第二次输入由第一段权威选中的记录构成；没有任意 Prolog、模型发道具或改结局的入口。字段与结构验证不能证明叙事质量，真实生成与语义检查仍待做。

`old-street-campaign-actions.ts` 的 plan / observe / decide 接入现有 SessionAuthority 的准备、提交、回执和重放流程，不建第二套存档。位置和目标绑定当前 record-book / photo-folder；必须实际观察才能判断，错误比对不提交状态。已生成实例禁止被新请求重生，已决定取舍禁止重复领物品。取原件与留下原件均可完成，尾声分别反映实物带回或仅转述。

只有在 Authority 显式装配 campaignGenerator 或 campaignCandidate 且创建选项为 `{campaign:'letter-trail-v1'}` 时才新建这种旅程。默认创建与所有旧存档不变；本地调试入口、专用材料视图与异步任务已按下节接入，正式Worker任务接口与合成内容地图完整试玩已在后续接通，见下节；真实生成和线上验收仍待完成。开启后的取信反馈指向记录册，最终离开要求两段都完成；旧旅程仍可按原规则离开。直接生成器保留给独立权威测试，本地开发服务采用后台准备后的候选准入。

模型失败按已有 OLD_STREET_MODEL_UNAVAILABLE 返回确定未提交；内容准入失败用 CAMPAIGN_PLAN_REJECTED；新增确定失败码已加入恢复客户端的终止分类，不使错误答案变成永久 pending。结构无效不会保存实例、线索或完成事实。

本轮证据：合成内容下的生成器上下文测试、唯一解测试、两种结局取舍各一条真实 Authority 路线、磁盘重开/丢回执不重生成、未观察拒绝、未完成主线不能离开、失败不写进度，连同旧 Session 回归30项通过。没有新增真实模型或媒体请求，没有浏览器动态主线通关证据，没有声称两个生成旅程已经实际验收。当前机制原型不代表45–60分钟内容量。
## 2026-09-17 材料界面开发候选补充

`server/old-street-campaign-jobs.ts` 将材料草稿保存在同一数据库的独立任务表，准备不更新旅程版本或位置。queued/planning有25秒截止；生成调用22秒超时。失败仅在显式重试时开启下一次attempt，晚到结果不能覆盖新attempt。`campaign-plan` 在原地图物件旁校验并采纳已准备内容，阅读和选择仍分别提交权威动作。

本地 `OLDSTREET_CAMPAIGN_TRIAL=1` 且模型已配置时才开放任务接口；前端需同时满足开发构建、debug和返回能力才显示候选创建入口。正式Worker尚未接入该任务接口，本轮没有改变正常旅程创建规则。`OldStreetCampaignView` 查询失败只重新读取，服务确认准备失败才可重试生成。`RecoverableSessionClient.enroll` 保存可选创建配置并随丢失回执恢复，不给已有旅程追加新门槛。

旅程菜单头部固定、中间独立滚动；材料视图独立滚动正文并固定选择区。验证范围见 `material-interaction-ui-20260917.md`。开发组件夹具位于 `_qa/campaign-view.html`，不包含在Vite正式输入中。

物件面板标题与地图使用同一个 `targetTitle` 投射，观察提示复用 `oldStreetContextAction`，不另造剧情事实。`RpgRendererOptions.onRouteCancelled` 是可选的行动接近中断通知；旧街保存本次接近的清理函数，方向键/失焦/阻断/主动暂停取消路线后释放忙碌状态。到达前的“停下”不提交原行动；自由输入取消时恢复草稿。到达后转入网络执行阶段，不再提供撤销按钮，继续原有回执恢复合同。

### 动态材料与自由输入共用状态

`src/old-street-campaign-interaction.ts` 从当前旅程投射可执行材料动作、实际生成记录标签及已观察知识；不把正确记录预筛成唯一可选项。未观察内容不进入模型上下文，已有取舍不重复提供。运行时将解释出的ID映射回 `prepareCampaignAction`，与材料按钮共用位置、观察、比对、物品和回执规则。`campaign-read` 可在一个版本提交中采纳已准备草稿并阅读；已经有实例时只阅读，不生成。后台草稿未就绪仍返回明确未准备，不虚构内容。

自由尝试模型可用短文回应观察、回忆和疑问，选择必须识别玩家明确指定的记录；生成与审查提示均禁止代玩家解出“正确的那条”。真实模型对新记录的语义准确率尚未测量，合成解释器只证明接线与权威规则。旧解释器兼容路径也可接材料动作，但无独立语义质量声明。

材料提交块带 `oldStreetCampaignStage`，由现有短段落及丢回执恢复呈现，避免长线索在临时提示里消失。`oldStreetJournal(save,campaign?)` 根据同一已观察实例生成寄存条、各记录、材料正文及原件去向，目的提示在完成前不再提前建议回家。原件位置与记录所指地点分开表达。记录册/资料架标题与模型上下文不再错误投射为空白/空架；不会据此宣称补出了新实物美术。

合成机制测试及组件画面检查见 `campaign-input-review-20260917.md`。后续地图试玩和Worker增量以下节为准，主线完整内容、实际生成和平台整合验收仍未完成。

### 材料主线地图试玩与Worker任务（2026-09-17）

`worker/source.ts` 在已有旧街Durable Object内装配 `OldStreetCampaignJobs`，构造器可显式注入campaignProvider供本地测试；正常发布由 `OLD_STREET_CAMPAIGN_RELEASED`控制，当前false。候选读取注入原 `OldStreetAuthority`，不另建剧情数据库或同步生成入口。已有任务能跨对象重建复用，后台任务交给waitUntil；超时/重试仍由原任务表裁决。

`handleOldStreetSession` 接受登记options并交原Authority验证；`expansion-capabilities`增加campaign布尔值；`campaign-trace`/`campaign-parcel`复用 `oldStreetCampaignOperation`。GET查询，POST仅允许retry字段；queued才执行，failed仅显式重试。开发适配器也使用此操作，避免开发与正式路由不同。Worker本地预览在已有模型配置且 `OLDSTREET_CAMPAIGN_TRIAL=1` 时显式装配，不改变线上开关。

材料视图的ready按钮改为 `campaign-read`，一次准入+观察，决定仍单独提交。`oldStreetPhotoShelfPose(save,campaign?)`的stand/empty/papers/both投射两份物品，三图层分别对应架子、照片夹与主线纸袋。使用已准入图集，不增添剧情事实或碰撞。

`_qa/campaign-playtest-server.ts`仅本地开发启动：合成生产器禁用全部真实模型，独立测试数据库，运行原游戏renderer。实际路线与Worker测试证据、局限见 `campaign-map-playtest-20260917.md`；该启动器不是第二个游戏或发布入口。

### 档案到照片的连续发现（2026-09-17）

`old-street-archive-photo.ts` 只从已完成重建的 archive 取得稳定 ID、按已解顺序排列的事件和结论。玩家在照相馆选择关联调查时，runtime 从权威 head 构造 `expansions[0].archiveSource`；忽略客户端自报背景，未完成档案不能建立关联。普通暗房意图仍不自动关联，已有请求不改写。head 校验快照与原档案一致。

扩展 planner 把快照送入原平台叙事接口；关联请求增加一次语义复核，与生成共用原 22 秒预算，不自动无限修复。图像仍走既有媒体任务和 SHA 准入，布局、碰撞和门不变。复核仅是候选筛查，不能保证图片或生成语义正确。

真实拼图凭证通过后，将候选 discovery 保存到 `darkroom-photo-discovery`；此前只准备候选不授予该发现。暗房结果、旅程笔记、自由行动的已知内容及结局读取同一字段。带走/留下原图不删除观察，旧已完成照片不追溯补造发现。没有新增完成条件。实证与局限见 `archive-photo-review-20260917.md`。

### 暗房媒体实景验证与展示（2026-09-17）

本地开发适配器可显式注入 QA 的扩展 planner/媒体 producer，生产 Worker 入口没有此注入。`_qa/archive-photo-playtest-server.ts --live-media` 使用独立合成数据库、记录中的真实桥板方案和实际平台媒体任务，`prepare-archive-photo-checkpoint.ts` 通过普通权威行动准备照相馆检查点。不是直接注入完成存档；前序档案仍是合成内容，不冒充整条真实生成主线。

`OldStreetExpansionPhotoView` 不再常驻显示整张图；主地图只保留状态，使用与服务端相同的交互绑定判定显影台距离。靠近才能拼合/决定去向/回看；显示成功后保留只读查看入口。`OldStreetPhotoView.reviewOnly` 复用弹层并去掉候选块、旋转和提交控件。拼图/去向提交同时清除过时操作叙述。地图坐标、镜头与碰撞不变。

实际平台调用一次，768×576 PNG 已经在320/390地图及弹层检查、拼合、留下并刷新恢复；详情 `archive-photo-media-20260917/review.md`。新媒体结果的构图适用范围仅为收藏插画，不是正交可行走背景标准。

### 调查发现分享与人物记忆（2026-09-17）

`old-street-shared-evidence.ts` 从权威 head 提供出示照片、转述发现、分享已完成档案三类可用动作。当前房间与已介绍角色必需；出示额外要求照片库存。原 free-input 精确选项、模型提议白名单和 runtime 共用这些动作，无新存档引擎或 API。服务端从既有已观察发现取正文，不接受客户端自报证据。`prepareEvidenceShare` 写入成对对白块，附稳定 recipient/kind/text；会话权威仍负责提交和重试回执。

每个 NPC 的后续对白只接收自己收到的证据快照。转述后仍可出示，出示后不再提供重复转述；作者回问话题和模型上下文都区分亲眼看图与听玩家描述。未引入好感收益、交付所有权或完成条件。已有存档无这些记录时自然显示尚未分享；不自动迁移成所有人已知。

`os-actions__content` 将对白和话题放到同一滚动区，标题/关闭操作保留在滚动区外；新回复、分页和切换目标回到顶部。对白分页读取旅程正文语言，避免英文旅程在中文界面按字符截断单词。实证见 `shared-evidence-review-20260917.md`。

### 生成前固定调查路线（2026-09-17）

`src/old-street-investigation-route.ts` 定义三种版本化路线，以新旅程 ID 稳定调度；`old-street-runtime.ts` 仅在新建 v3 时保存 `campaign.explorationRoute`，升级不补字段。`campaignJobContext`、成套草稿任务及档案准入验证使用同一值。planner 只发送路线计划给模型，不发送旅程 ID；物理位置不匹配的草稿须修正，不能换条路线冒充重试成功。

旧旅程继续使用已保存内容和原上下文。借阅路线固定 `denseSource=index`，外放日志直接可读；独立旧档案编译可按已保存计划组装。明确拒绝的叙事复核反馈可截短至240字符进入原有一次修正，通过仍必须 valid=true 且 issues 为空。

实证和失败见 `planned-routes-review-20260917.md`。这是已有场景的路线组合能力，不是任意房间生成；生产开关未开启。

### 档案旧照复核证据（2026-09-17）

`reviewArchivePhotograph` 把原事件与图片描述句子编号，要求比较主体后选择现有ID；主题、材质、可见发现、主体关系和无问题列表共同决定通过。只有格式错误可修正一次，历史与候选不变；内容拒绝和网络失败不自动循环。最多一次创作与两次复核，共享既有任务22秒截止；完整链真实测试预算相应调整为每链9次上限。已有准备方案不重新复核。

`oldStreetAttemptContext` 根据已保存扩展的 `photoMethod` 输出调焦曝光或旧拼合语义；显影台观察台词使用通用查看描述，避免新机制仍提示拼合。实证、反例和一份实际媒体→结局联测见 `photo-evidence-review-20260917.md`，不据此开放正式入口。

### 2026-09-17 材料面板首次阅读

`old-street-campaign-view.tsx` 在物件接近后的面板内，读取同一准备任务；无任务时自动发起一次准备，ready 时通过原 `campaignAct('read')` 提交权威准入与观察。已有未观察实例走 `observe`，已观察实例不重写正文。面板内的 prepare/read latch 限制一次自动尝试，失败仍由现有按钮重试；关闭卸载取消轮询，不在地图远处提交观察。服务端、结局条件、旧存档结构均未改变。完整路线实证与限制见 `full-route-review-20260917.md`。

### 屋顶补给来源（2026-09-17）
`old-street-roof-recovery.ts` 统一定义新旅程固定的长板来源、备用板占地、领取/消耗规则、可见知识及库存不变量。`old-street-runtime.ts` 仅新建完整旅程时赋值，旧档未定义来源时继续现场方案。`old-street-space.ts` 与 `old-street-roof-recovery-view.tsx` 共用占地，领取后同步移除碰撞和板图。两种搭板行动均进入原来的权威事务；`old-street-scene-knowledge.ts` 为自由输入/对白提供对应现场状态。证据见 `roof-supply-review-20260917.md`。

### 2026-09-17 续玩语言、显影衔接与片尾照片

`old-street-dev.tsx` 的界面 locale 由当前 `head.save.locale` 决定；首次建档仍用浏览器语言。启动恢复、错误提示、切换旅程及延迟准备场景的闭包读取对应的已恢复/当前旅程语言。照片去向决定后默认收起说明；再次点选显影台可回看。

`old-street-ending-reel.ts` 将已提交暗房发现与暗房照片去向标记为 `journey-photo`。`OldStreetEndingView` 使用原 Session 的只读 `/expansion-photo-file`，SHA-256 与 `darkroom-photo-matched` 一致才创建 blob URL，卸载时回收。固定照片夹仍用其原美术；取图失败不阻断字幕、跳过和重看，不写存档、不新增生图。


### 2026-09-17 系统交互结构

`rpg-renderer.ts` 的可选 `controlsBlocked` 是独立于异步动作 pause 的界面输入门禁。进入阻塞时清空按键/摇杆/路线，阻止移动与更新意图，向 onFrame 报告暂停；旧街主界面通过统一 modalOpen ref 提供状态。程序性 walkTo 保留原语义，允许关闭面板与排队行动在同一 React 事件中衔接；阻塞期间不执行路线。`renderer-input.ts` 排除已处理事件、组合输入、快捷键及编辑/模态内按键。动态照片组件通过 onOpenChange 报告显示、关闭与卸载，解除请求 pause 不会绕过仍打开的模态门禁。

`OldStreetLeaveView` 使用 showModal/原生 Escape，默认聚焦 Stay；确认后继续原来的 `oldstreet:leave` 权威行动，未改变借物、结局、持久化规则。

`old-street-dev.tsx` 将 `selected` 限定为玩家主动开启的上下文目标。地图物件点击只调用接近寻路，`useNearby()` 为统一行动入口；普通物件展示完整合法操作列表，人物首次主动交谈才执行介绍，自然出口由同一入口提交转场。离开/关闭清空上一对象的正文；输入草稿随目标隔离。按钮使用 PointerDown，并通过 detail=0 的 click 接入键盘/辅助技术，避免触屏双触发。

互动面板由目标/首次委托/恢复故障决定可见性，不再由 notice、残留正文或后台生成决定。短提示独立4秒收束。生成组件在对应场景内保持挂载，hidden 包装只控制展示；不因收起重新发起生成。特写主动关闭统一回探索；提交成功仍可保留当前物件后续操作。连接进入恢复状态时退出档案/照片特写，避免遮住恢复入口。

`old-street-interface.css` 定义控制区、互动区、内容宽度和短窗口规则。地图尺寸不依赖面板高度。互动正文和选项共用滚动区，标题/关闭在外；地图长内容保留顶部关闭。地图使用短显示名＋完整可访问名称，不切碎英文地名。规则与验证边界见 `interaction-layout-contract.md` 和 `interaction-layout-review-20260917.md`。本次未改动服务器合同、关卡/碰撞、存档或生产入口。


### 准备任务回访（2026-09-17）

动态入口的候选准入成功后，`requestExpansion` 收起当前上下文并显示自然门位置提示，不提交移动或自动进入。规划/照片组件位于当前操作区前部，旧日志和自由输入随后；hidden 与原有挂载生命周期保持不变。`commission-playtest-progress.ts --before-photo --journey=<id>` 仅对明确选中的未开始合成 v3 旅程准备相关照片请求前的权威状态，供有界界面验证使用。见 `dynamic-entry-review-20260917.md`。
`preparationTargets` 从当前旅程权威前置条件筛选未准入内容对应的任务查询地址；`useOldStreetPreparations` 只GET既有任务。没有任务不轮询，准备中/连接不可用每8秒查询，切后台暂停、回前台查询；场景、主动面板和旅程变化触发重新检查。请求结束时检查effect存活，旧旅程结果不能回填当前列表。查询不会创建任务、激活地图或消费材料。

`PreparationHistory` 保留最近已知状态，跨断线仍识别等待→就绪，并按旅程重置；冷启动已有就绪不提示。短提示持续6秒，探索主层才显示，随身的折叠列表可随时回看地点和操作。准备列表过滤已准入/已完成阶段。操作帮助置于首次委托及旅程菜单。外借日志已阅读时放大台先显示共用上下文，读日志入口保留；日志或扩展入口存在时，不把固定照片夹的缺失前置条件当成整个放大台不可用。
