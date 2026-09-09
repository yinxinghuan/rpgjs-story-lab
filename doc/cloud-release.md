# 车厢云端试运行

本次发布验证制作工作流中的服务与部署环节，沿用 B 视角、三场景、两条完成路线和既定 UI。不是最终完整游戏验收。

- 自托管永久 UUID：cb90357b-fe01-48ab-b14b-0620eb0d556e。
- 版本标记：carriage-cloud-trial-20260910-1。
- `npm run build` 生成 cloud 前端及 Worker，Pages 工作流使用相同构建。镜像只提供主站导航与显式旧浏览器存档入口，不访问另一套云端数据库。
- Worker 只保存新旅程；用户于 2026-09-10 同意临时随机访问凭据试运行。无旧存档上传、真实账号验证、跨设备同步或账号找回。
- Narrator 固定预设规则，不将旅程发送给外部模型。
- 回滚：将 Worker 的 PRODUCTION_WRITES_ENABLED 设为 false 后重建部署，可暂停新请求；保留 DO class、绑定和迁移，不删除命名空间。旧 Pages 入口不受此开关影响。

## 验证进度

部署前已有 66 项本机测试。此次待执行真实 DO 两路线、回执重放、版本冲突、不同持有者隔离、重新读档、真实浏览器入口和同版本双 bundle 校验。线上结果仅在实际执行后更新。

尚待后续工作：正式账号身份和找回、备份恢复演练、空间遮挡、完整性能证据、工作流最后一轮独立复用与正式目录上架。当前不宣称以上完成。

## 检查器适用边界

通用 `audit-story-session-release.mjs` 本次返回失败：它硬编码文字版 `src/story/StoryShell.tsx`、`STORY_SESSIONS`、`/api/story`、`action_cache` 等命名，本项目没有该目录结构。没有添加空壳文件或伪造通过。空间壳的对应实现是 `main.tsx` / `runtime-selection.ts`、`SessionClient`、`cloud-session.ts`、`ProductionAuthority`、`CarriageJourneyAuthority` 和 `/api/lab`；`receipts`、`journeys.enrollment`、`journal` 分别负责回执、登记重放与事件。Worker 构建通过 `npm run build:worker` 间接执行，已实际产出。媒体生成不在本次运行时范围内。对应合同由本项目客户端/SQLite/DO适配器测试和真实云端 canary 验证，通用检查器仍记录为“不适用且未通过”，不能标为绿灯。

仓库级存储检查仅遍历已登记游戏，本项目尚未上架，未被纳入其计数。当前项目单独核对：HTML 在主模块前加载 scoped adapter；源码显式使用 alteruLocalStorage；IndexedDB 由 URL UUID 隔离，并有重混 UUID 与旧数据库名回归测试。
