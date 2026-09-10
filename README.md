# 留一盏灯 · Carriage 07

基于 [RPG-JS](https://github.com/RSamaium/RPG-JS)，作者 Samuel Ronce，MIT 许可证；保留的依赖许可证见 `public/THIRD_PARTY_NOTICES.txt`。内部叙事核心来自 AlterU stateful-story-template，固定版本见 `src/vendor/story/ENGINE_SOURCE.json`。场景和角色素材为本实验制作，未采用 starter 游戏美术。

**[云端试运行入口](https://game.aiwaves.tech/cb90357b-fe01-48ab-b14b-0620eb0d556e/)** · [前端镜像与旧手机存档](https://yinxinghuan.github.io/rpgjs-story-lab/)

在 Safari 中打开，竖屏游玩。点过道行走或拖动左下摇杆，走近物件后点右下行动按钮；也可直接点物件自动走近。右上角查看物品、旅程记录和设置。四处场景：客厢、行李检修车、驾驶室、轨旁接应步道；两种供电选择对应不同接应方式。

## 背景制作与候选检查

[制作入口](https://game.aiwaves.tech/cb90357b-fe01-48ab-b14b-0620eb0d556e/creator.html)与主游戏使用同一部署。可选择背景光照、调用公共媒体服务、保存草稿，并在原作地图中试走。已有平台样本也可载入；候选未通过质量验收前不能发布为剧情场景。草稿目前仅在当前浏览器保存，不是账号云端制作库。人物/设备透明、完整原作内容与最终生产工作流仍在推进。

## 云端试运行与旧手机测试版

云端新旅程使用 Worker + Durable Object SQLite 保存，采用浏览器随机访问凭据隔离。它不是账号登录：清除网站数据可能失去访问，不提供跨设备同步或账号找回。旧本地/Pages存档不会上传。

固定 B 俯视方向，包含移动、碰撞、物件特写、人物介绍、剧情选择、两条完成路线与浏览器存档。云端自由输入默认使用作者规则与回应，可在设置中主动开启在线叙述；模型不能直接改变地图或发放物品。Pages 的显式旧旅程仍只使用预设回应和当前浏览器存储。清除浏览器数据可能丢失云端访问凭据及本地旧存档。无需电脑开机或同一Wi-Fi。

```sh
npm ci
npm test
npm run build
# 本地旧版预览：npm run build:pages && npm run preview:pages
```

使用 Node 22.22.2。`npm run build` 生成 `dist/` 和 `worker/index.js`，`base: './'`。GitHub Actions 发布同一 cloud 模式构建，Pages 默认展示主站与旧存档入口；显式 `?story_runtime=legacy` 使用原 IndexedDB，不连接云端后端。资源仍需网络加载，不是离线 PWA。

## 本地联网研究模式

```sh
npm run dev
# 或 npm run build:local && npm run preview
```

该模式使用本机 Node.js/SQLite 旅程服务，可通过设置启用在线模型扩展。它与 Pages 版存档分离；不作为已部署的云服务。`.data/`、凭据、开发过程的试玩记录与私有配置不进入公开仓库。

三种运行方式复用 `journey-runtime.ts` 的动作校验及 `story.ts` 的剧情规则。Pages 的 IndexedDB 事务保证当前动作与回执一起保存，重复提交可恢复，过期版本会被拒绝。

- [玩法](doc/requirements.md)
- [美术和UI](doc/visual.md)
- [技术与边界](doc/technical.md)

当前是临时持有权隔离的云端试运行，不是多人游戏。发布步骤与实际验收边界见 [云端发布记录](doc/cloud-release.md)。浏览器模拟尺寸验证不等于实体 iPhone Safari 性能验收。
