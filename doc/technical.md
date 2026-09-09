# 技术文档 · GitHub Pages 手机测试版

## 1. 技术栈

React 18、TypeScript、Vite 8、RPG-JS 5 beta、CanvasEngine/PixiJS。Node 22.22.2用于构建和本地服务。界面DOM与引擎画布共享世界地图父层和尺度。第三方固定版本见package-lock.json；完整声明随public/THIRD_PARTY_NOTICES.txt进入构建。

## 2. 目录结构

- src/main.tsx / style.css：移动、镜头、HUD、特写、菜单与双语文案。
- src/space.ts / space-bridge.ts：真实RPG-JS renderer、移动与碰撞桥接。
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

浏览器数据库名为`alteru:<GAME_ID>:pages-journeys-v1`，包含heads、enrollments、actions三个store；数据不上传。IndexedDB读写事务把剧情新版本和操作回执一起提交。版本冲突拒绝过时写入，同action_id同参数返回原回执，不重复发放物品；不同参数复用id拒绝。位置回写检查当前场景和版本，不能把过时坐标写入新区域。当前地图版本不匹配时明确失败，不猜测迁移未知版本。

待确认操作、语言和旅程id继续通过alteruLocalStorage作用域适配器保存。角色每2秒保存位置，切到后台额外尝试保存并停止持续移动；Safari终止进程时最后一次异步位置写入不保证完成。剧情操作只有事务成功才呈现已提交结果。清除网站数据、换浏览器或无痕会话结束可能失去存档，不提供云同步。角色、库存与设备状态由同一规则内核决定，图片仅投射状态。

### 输入和界面

手机宽度<700或高度<=500时全屏铺底，镜头等比跟随。地图逻辑384×576；步速110世界像素/秒；人体碰撞9×15。点地图反变换到世界坐标寻路，点击物件走到approachPoint再互动。正文/按钮DOM独立适配；打开面板暂停移动；返回地图留在原位置。iOS长按CSS防护在入口加载，文本框恢复文本选择。声音由用户开启后使用AudioContext短合成音。

### 平台外访问

入口保留远程guest-shell扩展，由平台管理外部访客栏；游戏不上传现有试玩记录或个人配置。平台扩展与游戏本地剧情数据库是不同边界。Pages无自有后台、无多人世界。

## 4. 扩展点

玩法规则改story.ts；新增实体同步scene-layout、contract、人物介绍及图集准入。视角和素材改art-catalog/sprite-config/世界图集，但须保留碰撞与状态对应。更换存储通过client-session的显式模式入口，继续复用journey-runtime。在线AI、云存档、动态资产和多人版本需另行部署正式服务，本测试版不宣称具备这些能力。

本次授权仅GitHub Pages手机测试发布，不上架平台、不运行正式双部署，也不上传个人存档。自动化测试不替代新人理解或iPhone真机帧率验收。
