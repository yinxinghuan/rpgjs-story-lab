# 技术文档 · GitHub Pages 手机测试版

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
- .github/workflows/pages.yml：构建、测试并发布dist-pages。

## 3. 核心模块

### 两种显式运行方式

`npm run build:pages` 使用mode=pages、base='./'，输出dist-pages；默认通过BrowserJourney运行预设剧情，不请求本机或平台的旅程API。设置隐藏在线模型选项，即便内部传入live，浏览器叙事处理仍只调用localReply。部署后不依赖电脑或同一网络。资源加载需要网络，未实现离线PWA。

`npm run build` / `npm run dev`保留本地Node/SQLite研究模式，请求 `/<GAME_ID>/api/lab`，默认数据库`.data/story.sqlite`，可用CARRIAGE_LAB_DB指定独立测试文件。此服务没有随Pages部署。两种模式有不同客户端key前缀，不迁移旧电脑存档。

### 状态与恢复

浏览器数据库名为`alteru:<当前部署UUID>:pages-journeys-v1`。正式自托管域名以URL第一段UUID为权威；Pages/本地回退源码GAME_ID，保持已有数据库名不变，包含heads、enrollments、actions三个store；数据不上传。IndexedDB读写事务把剧情新版本和操作回执一起提交。版本冲突拒绝过时写入，同action_id同参数返回原回执，不重复发放物品；不同参数复用id拒绝。位置回写检查当前场景和版本，不能把过时坐标写入新区域。当前地图版本不匹配时明确失败，不猜测迁移未知版本。

待确认操作、语言和旅程id继续通过alteruLocalStorage作用域适配器保存。角色每2秒保存位置，切到后台额外尝试保存并停止持续移动；Safari终止进程时最后一次异步位置写入不保证完成。剧情操作只有事务成功才呈现已提交结果。清除网站数据、换浏览器或无痕会话结束可能失去存档，不提供云同步。角色、库存与设备状态由同一规则内核决定，图片仅投射状态。

### 输入和界面

手机宽度<700或高度<=500时全屏铺底，镜头等比跟随。地图逻辑384×576；步速110世界像素/秒；人体碰撞9×15。点地图反变换到世界坐标寻路，点击物件走到approachPoint再互动。正文/按钮DOM独立适配；打开面板暂停移动；返回地图留在原位置。iOS长按CSS防护在入口加载，文本框恢复文本选择。声音由用户开启后使用AudioContext短合成音。

主角使用 `stride-0/1/2` 静态姿态纹理，由碰撞处理后的累计实际行走距离选择，每55世界像素完成 `0→1→2→1` 周期。不使用独立定时的walk动画推进主角脚步；图集仍保留通用walk供其他消费者使用。路径在同一次更新中用完110×dt的移动预算，可连续跨越多个4像素节点，不再在节点处插入stand或免费吸附2像素。逐步扫描最多1世界像素，碰墙不累计虚假步幅；停止、到达、暂停与恢复位置时归零步态。dt仍上限40ms，严重掉帧时位移和步态一起减慢，不追赶后台积累时间。

步态回归覆盖30/60/120fps、不规则帧间隔、转角、到达、薄墙、慢速摇杆及真实客厢路径。57项测试通过；桌面和390×844、320×568浏览器视口已检查真实renderer行走帧序列。视口测试不代表iPhone真机性能验收，仍需用户在Safari复测。

### 平台外访问

入口保留远程guest-shell扩展，由平台管理外部访客栏；游戏不上传现有试玩记录或个人配置。平台扩展与游戏本地剧情数据库是不同边界。Pages无自有后台、无多人世界。

## 4. 扩展点

玩法规则改story.ts；新增实体同步scene-layout、contract、人物介绍及图集准入。视角和素材改art-catalog/sprite-config/世界图集，但须保留碰撞与状态对应。更换存储通过client-session的显式模式入口，继续复用journey-runtime。在线AI、云存档、动态资产和多人版本需另行部署正式服务，本测试版不宣称具备这些能力。

复用移动时，将distance-motion.ts接到目标游戏自己的主循环与完整hitbox检查；通过createDistancePoseSelector配置目标素材步幅和静态姿态名。110/55参数只属于本样本。独立工具包使用另一套72单位/秒、24单位步幅的合成空间验证，并有不同步幅及错误参数检查；复制模块不等于自动获得目标引擎集成、主题素材或真机性能保证。

用户已授权继续推进完整游戏和正式部署；当前已公开的仍是Pages手机测试版。生产接入和双部署另行验收，不自动上传个人存档。自动化测试不替代新人理解或iPhone真机帧率验收。

### 云端权威存储预备实现（未启用）

server/production-authority.ts 通过同步 SQL 接口保存 journeys / journal / receipts，复用 journey-runtime 的同一剧情规则。head-migration.ts 同时供本机SQLite与云端预备实现使用，保留旧剧情和行囊。一次动作的head、事件游标和回执在同一 transactionSync 中提交；模型/异步准备在事务外，返回后重查版本。请求用排序后的JSON绑定语义相同的字段，不因JSON键顺序不同失去幂等。

worker/source.ts 导出 CarriageJourneyAuthority 与 handleApi。部署器合同见 worker/bindings.json；npm run build:worker 生成 worker/index.js，不能把普通 npm run build 当成Worker已重建。当前 PRODUCTION_WRITES_ENABLED=false，旅程路由503，health明确未启用，不访问已有本地存档。预备的令牌模式为32字节随机 capability，边界只向DO传SHA256 owner；不是已验证的平台账号身份。尚未获准启用该身份模式，不部署生产写入；当前Narrator固定本地规则，不向模型发送旅程。

每个owner最多100个旅程；列表按更新时间排列。events游标每页最多100条，先验证旅程归属；位置checkpoint不推进剧情版本/游标。无上传/导入旧存档接口，也无客户端覆盖head接口。章节结局继续从权威事实计算，不另建可写结局快照。

新增8项测试使用本机SQLite模拟Durable Object同步SQL接口：两条结局路线、事件/回执/库存与重开，owner隔离，enrollment语言冲突，注入事件写入故障回滚，异步准备竞争，过时位置、关闭的生产边界与令牌清理，以及真实DO适配器入口。尚未在Cloudflare实际DO中验收，不能把这些测试标为云端已上线。前端正式bootstrap、身份方案确认、云端canary、备份恢复与同commit双部署仍待完成。
