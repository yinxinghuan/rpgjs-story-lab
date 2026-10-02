# 旧街 Harbor 像素 UI 本地验收 · 2026-10-02

## 范围与真源

用户指定旧街 UI 参考《A Summer in Harbor》最新 UI。参考正式 e77275c；源 `/private/tmp/harbor-quest-release-20261002/source`，协调方已核对与当前工作副本 UI/字体一致。本轮只改 `_release-oldstreet-conversation` 的界面；保留旧街纸色/墨绿、夜街、人物和物件。没有复制 Harbor 场景素材，没有修改故事、空间碰撞、账号、API、存档结构或模型限制。新增主题 `oldstreet-harbor-pixel` 是适配方案，不冒称通用 catalog 03 的默认长文系统字体方案。

字体是未修改的 Fusion Pixel proportional zh_hans 和 Jersey15（不是 Jersey10）。SHA256 分别为 `9d8d2f0bae6214568c591c72f4f3e8cbc39b2eeda461861e521e45d966ccefac`、`dbe00479d62bb3b9fcf0d28f88a021ffc4bd7b01d6ad5c6f74b5fa371bb210ed`，与参考一致。许可证和上游 attribution 全文随 public/dist 分发；保留原 notices。正文 16px/1.75，中文标题使用 Fusion Pixel，英文主标题使用 Jersey15；方角纸面、墨绿按钮、金色焦点、分层硬边阴影保持一致。摇杆保留圆形，因为它表示二维方向输入，不是菜单按钮。

## 本地入口与隔离

可玩预览：`http://127.0.0.1:55689/`。对照页：`http://127.0.0.1:55689/_qa/ui/pixel-theme-20261002/review.html`。服务器使用 Node 22、Vite oldstreet-dev；数据在 `/private/tmp/oldstreet-ui-20261002.41gb9y/data`，模型测试预算为 0。不会改真实账号、玩家数据或线上世界。QA 使用独立浏览器上下文，并仅在测试中隐藏访客栏判断 platform-layout；生产不加入隐藏访客栏样式。

## 实际路径与布局夹具分开

- 真实应用：桌面 1024×768、390×844、320×568 × zh/en，首次开始、地图、背包线索/目标、菜单、存档、关闭回到原地点；正常键盘走位使修表铺目标可见、行动按钮变为可用，然后桌面点击/手机触控行动按钮，等待权威转场并断言场景标题为修表铺。6 组真实进门均通过；没有 force click、位置注入或存档注入。
- 合成压力页：同 6 组尺寸/语言，长 NPC 正文、8 个长选择、自由输入并提交本地合成选择、8 组历史、12 条补充笔记、12 条合成存档、长材料、地图、失败恢复、加载、结局。滚动后能操作最后选择、输入、历史、返回和重新打开。此页只证明 UI 状态可用，不能证明线上模型或合成世界真实性。
- 390/320 额外在真实应用发送正常 touchStart/move/end 到摇杆，验证释放后 `data-active=false`；重复打开/关闭菜单 3 次，场景不变、没有残留 dialog。触控模拟仍不能代替 iPhone 硬件手感。
- 基线：30 张真实应用 before 截图，通过测试拦截新增主题模块保留旧 UI 样式；非重新发布历史版本。after 主脚本 108 状态截图、无横向页面溢出，真实进入场景有独立断言；末轮 polish 则复验最终长标题、字体、44px 目标、弹层边界和 HUD/对话分离。原始 JSON 和图片保留在 `_qa/ui/pixel-theme-20261002/`。

末轮 polish 48 组布局断言全部通过：字体实际加载、可见按钮至少 44px、弹层在屏内、HUD 不重叠对白、无页面横向溢出。

## 发现与修正

1. 英文长对话标题被文字返回按钮挤窄：顶栏改 44×44 同家族 SVG 关闭，保留双语 accessible name/title；初次开始仍使用文字按钮。320px 正文空间改善，同状态复验。
2. 材料 reader 是 body portal：直接覆盖 portal 主题，宽度上限 760px；超长标题最多 20dvh 且自身可滚动，正文独立滚动，返回始终可见。
3. 英文 Backpack 被断成两行：英语工具按钮 60px，标签 11px 且不在词内换行；窄屏复验。
4. 地图关闭按钮旧圆角残留：使用方角纸面边框；地图当前位置圆点与路线编号仍保留语义形状。
5. 压力页的很长 HUD 标题可能顶到对话：标题内部限高滚动，HUD 不侵入预留面板区域；普通真实房间标题不受截断。
6. 初版脚本仅向上走，手机门在屏幕外，不能把截图算进门通过。补正常向左/向上走位和真实行动按钮断言。早期直接点门寻路有不稳定超时，未用 force 掩盖，最终正常走位进门路径通过；本轮不宣称已完成所有点地寻路或相机边界审计。

## 工程检查

25 项既有剧情、对白分页、双语、结局、地图、空间与恢复定向测试通过。完整 `npm run build`（tsc、spatial binding、Vite cloud、原场景资源 SHA、Worker 启动）通过。public secret audit、API base audit、UI foundation strict 检查、diff whitespace 检查通过；字体与完整 notices 存在于 dist。旧资产 URL 与大 bundle 等既有构建警告不被当作本轮已修复项。

## 交付边界

本轮没有 git commit/push/部署、云购买或 IAM 操作。没有替换线上旧街，也未改另一游戏。原 dirty `doc/CONTINUE-HERE.md` 仅追加本轮说明，其既有内容与 node_modules 保留。待用户确认外观后再进入发布工作；正式发布仍须同 commit 双前端、权限/后台入口和真实平台验收。

Chromium 桌面和触控模拟不是 iPhone 真机验收；新玩家理解 `comprehension unverified`。没有完整剧情通关、真实自由 AI、新动态工坊、真实账号跨设备或新生成媒体验收声明。
