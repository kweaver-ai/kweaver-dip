SELECT`o`.`name` AS `name`, COUNT(`p`.`id`) AS `count`
FROM`front_end_processors` AS `p`
LEFT JOIN`object` AS `o` ON `p`.`department_id` = `o`.`id`
WHERE `p`.`deletion_timestamp` IS NULL
GROUP BY`p`.`department_id`
HAVING`name` != ''
ORDER BY `count` DESC, `name`
LIMIT 15
