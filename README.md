# 留一盏灯 · Carriage 07

基于 [RPG-JS](https://github.com/RSamaium/RPG-JS)，作者 Samuel Ronce，MIT 许可证；保留的依赖许可证见 `public/THIRD_PARTY_NOTICES.txt`。内部叙事核心来自 AlterU stateful-story-template，固定版本见 `src/vendor/story/ENGINE_SOURCE.json`。场景和角色素材为本实验制作，未采用 starter 游戏美术。

**[iPhone 测试入口](https://yinxinghuan.github.io/rpgjs-story-lab/)**

在 Safari 中打开，竖屏游玩。点过道行走或拖动左下摇杆，走近物件后点右下行动按钮；也可直接点物件自动走近。右上角查看物品、旅程记录和设置。三处场景：客厢、行李检修车、驾驶室；两种供电选择对应不同接应方式。

## GitHub Pages 手机测试版

固定 B 俯视方向，包含移动、碰撞、物件特写、人物介绍、剧情选择、两条完成路线与浏览器存档。自由输入使用预设规则与回应，**不调用在线 AI 服务**。存档只在当前浏览器的网站存储中；清除网站数据、无痕浏览或换浏览器不会共享进度。无需电脑开机或同一Wi-Fi。

```sh
npm ci
npm test
npm run build:pages
npm run preview:pages
```

使用 Node 22.22.2。`build:pages` 输出 `dist-pages/`，`base: './'`；GitHub Actions 构建并发布。默认 Pages 入口显式使用 IndexedDB，无服务器API依赖。资源仍需网络加载，此版本不是离线PWA。

## 本地联网研究模式

```sh
npm run dev
# 或 npm run build && npm run preview
```

该模式使用本机 Node.js/SQLite 旅程服务，可通过设置启用在线模型扩展。它与 Pages 版存档分离；不作为已部署的云服务。`.data/`、凭据、开发过程的试玩记录与私有配置不进入公开仓库。

两种模式复用 `journey-runtime.ts` 的动作校验及 `story.ts` 的剧情规则。Pages 的 IndexedDB 事务保证当前动作与回执一起保存，重复提交可恢复，过期版本会被拒绝。

- [玩法](doc/requirements.md)
- [美术和UI](doc/visual.md)
- [技术与边界](doc/technical.md)

这是独立手机测试发布，不是生产多人版本或完整平台双部署。浏览器模拟尺寸验证不等于实体iPhone Safari性能验收。
