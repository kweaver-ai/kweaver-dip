SELECT
    COUNT(`id`) AS `count`,
    YEAR(`creation_timestamp`) AS `year`,
    MONTH(`creation_timestamp`) AS `month`
FROM front_end_processors
WHERE ? <= `creation_timestamp` AND `creation_timestamp` < ?
GROUP BY `year`, `month`
ORDER BY `creation_timestamp` DESC
