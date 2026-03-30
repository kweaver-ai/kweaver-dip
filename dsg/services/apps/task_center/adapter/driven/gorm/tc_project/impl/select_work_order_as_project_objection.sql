SELECT
  `work_order_id` AS `id`,
  `name` AS `name`,
  'work_order' AS `type`,
  `type` AS `sub_type`,
  `node_id` AS `node_id`,
  `stage_id` AS `stage_id`,
  {{- /* domain/work_order.WorkOrderStatus -> common/constant.CommonStatus */}}
  CASE
    {{- /*WorkOrderStatusPendingSignature  ->  CommonStatusReady */}}
    WHEN `status` = 1 THEN 1
    {{- /*WorkOrderStatusSignedFor ->  CommonStatusReady */}}
    WHEN `status` = 2 THEN 1
    {{- /*WorkOrderStatusOngoing ->  CommonStatusOngoing */}}
    WHEN `status` = 3 THEN 2
    {{- /*WorkOrderStatusFinished ->  CommonStatusCompleted */}}
    WHEN `status` = 4 THEN 3
    ELSE 0
  END AS `status`,
  `responsible_uid` AS `executor_id`,
  `updated_by_uid` AS `updated_by_uid`,
  `updated_at` AS `updated_at`,
  `created_at` AS `created_at`,
  UNIX_TIMESTAMP(`finished_at`) AS `deadline`,
  `audit_status` AS `audit_status`,
  `audit_description` AS `audit_description`,
  `synced` AS `synced`
FROM  `af_tasks`.`work_order`

{{- /* 工单来源类型：项目 */}}
WHERE `source_type` = 8
AND   `deleted_at` = 0
{{- with .ProjectId }}
AND   `source_id` = {{ "'" }}{{ . }}{{ "'" }}
{{- end }}
{{- with .Keyword }}
AND   `name` LIKE {{ "'%" }}{{ . }}{{ "%'" }}
{{- end }}
{{- with .Status }}
AND   `status` IN {{ workOrderStatusesForObjectionQueryParamStatus . }}
{{- end }}
{{- with .Priority }}
AND   `priority` = {{ "'" }}{{ commonPriorityToInt32 . }}{{ "'" }}
{{- end }}
{{- with .ExecutorId }}
AND   `responsible_uid` = {{ "'" }}{{ . }}{{ "'" }}
{{- end }}
{{- with .NodeId }}
AND   `node_id` = {{ "'" }}{{ . }}{{ "'" }}
{{- end }}
