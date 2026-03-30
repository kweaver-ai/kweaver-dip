SELECT
    `sv`.`id` AS `id`,
    `sv`.`name` AS `name`,
    `fv`.`id` AS `data_view_id`,
    `fv`.`business_name` AS `data_view_business_name`
FROM `sub_views` AS `sv`
LEFT JOIN
    `form_view` AS `fv` ON `sv`.`logic_view_id` = `fv`.`id`
WHERE `sv`.`deleted_at` = 0
    AND `sv`.`id` = ?
