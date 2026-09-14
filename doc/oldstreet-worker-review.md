# 旧街 Worker 接入实证 · 2026-09-15

复用现有 Worker/SessionAuthority/凭证边界，没有创建新部署、游戏 UUID 或另一套存档内核。新故事在已有 namespace 内使用独立对象键，旧列车路径、对象键和数据不改动。

已验证：中英文屋顶路线从创建旅程到取信回家，共 11 次权威动作；每次重开真实 SQLite、恢复同一 head、重放原请求只返回原回执、另一凭证读取返回 404。目录与事件查询正确。发布开关关闭返回 404，缺失凭证返回 401，运行版本不符返回 409，伪造 owner 开户字段拒绝，默认美术门禁拒绝创建。

前端 cloudTransport + RecoverableSessionClient 联测：行动已提交但响应丢失，销毁对象/重开存储后重新创建客户端，同一凭证恢复到店铺；版本和事件仅增加一次。此测试走实际 Request/Response Worker handler，不是线上网络或 AlterU 实机验证。

新 Worker/客户端与原 ProductionAuthority 合计 18 项测试通过；旧列车 HTTP 的身份/故事隔离及发布门禁回归 2 项通过。TypeScript 与 Worker 构建通过；构建产物已用 opaque module 导入并调用健康接口。API base 审计通过。

尚缺：新场景和实体素材准入、生产前端装配、真实模型/完整路线质量验证、平台账号绑定的跨设备自动找回、实际部署及 AlterU 全程试玩。当前不开放 OLD_STREET_RELEASED，不宣称上线或总目标完成。
