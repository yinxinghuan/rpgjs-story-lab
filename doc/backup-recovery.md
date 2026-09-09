# 新云端旅程的备份与恢复

## 已实现的边界

Worker 提供当前持有者专属的只读 `GET /api/lab/sessions/:id/backup`。它在同一次 SQL 事务中读取当前剧情 head、登记ID、全部事件和全部回执，返回 `carriage-journey-backup-v1` 及 SHA256 完整性校验。此快照不受普通 events 接口每页100条的限制；上限为10000条事件，另有保守体积预检和8MiB序列化上限，超限明确返回413，不截断备份。

备份没有浏览器访问凭据，但包含旅程正文、位置和owner哈希，因此仍属私有数据。仅通过已持有的能力凭据读取；不遍历他人的旅程，不把文件提交到Git，不把旧本机/Pages存档上传。本次云端验证只用代理创建的合成新旅程。

SHA256只检验损坏，不是数字签名或导入权限。服务器没有HTTP恢复/导入接口，不接受浏览器上传任意存档。离线工具仅允许受信任操作员指定的备份写入全新的空SQLite文件，权限0600；既有文件/数据库一律拒绝覆盖。

```sh
node --import tsx scripts/restore-journey-backup.ts /private/path/backup.json /private/path/new-database.sqlite
```

恢复会核对格式、游戏UUID、地图版本、head/version/cursor、owner、事件连续性、动作ID、请求和回执对应关系。head、事件、回执和登记在同一事务中恢复，失败整体回滚。完成后必须重放一个旧领取动作、核对库存及当前版本，再继续一个新动作；只看到JSON文件存在不算恢复成功。

## 平台时间点恢复

Cloudflare 官方文档说明 SQLite Durable Object 支持过去30天内的整库时间点恢复，覆盖SQL和KV；本地开发不支持该持久日志能力。参见 [SQLite storage PITR](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/#pitr-point-in-time-recovery-api)。这项平台能力与上述可移植备份是不同恢复途径。

当前尚未暴露运行中的DO回滚入口，也没有执行真实PITR。整库回滚会同时回退head、版本、登记与回执，恢复前必须隔离该owner的写入，并处理浏览器未确认请求与后续已发生动作，避免旧请求在回退后的版本上重新执行。不能把离线SQLite恢复或重新部署保留存档说成云端时间点恢复已经验收。

## 验证

本机测试覆盖105次操作的完整导出恢复、重复领取回执、登记重放、继续新动作、跨owner拒绝、损坏/缺失/错UUID/错地图、非空目标拒绝、事务故障回滚和离线CLI新文件权限。真实云端可运行 `scripts/check-cloud.ts`，在两条结局后通过备份接口导出，并在进程内新SQLite恢复、重放旧回执。它只输出结果和计数，不输出凭据或正文。

剩余：受控的真实PITR演练与运营恢复入口、跨设备身份找回不包含在此离线恢复工具中。平台凭据丢失也不能靠备份里没有的随机能力自动找回。
