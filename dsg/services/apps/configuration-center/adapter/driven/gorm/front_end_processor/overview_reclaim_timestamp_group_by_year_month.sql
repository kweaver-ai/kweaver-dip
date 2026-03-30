SELECT
    COUNT(`id`) AS `count`,
    YEAR(`reclaim_timestamp`) AS `year`,
    MONTH(`reclaim_timestamp`) AS `month`
FROM front_end_processors
WHERE ? <= `reclaim_timestamp` AND `reclaim_timestamp` < ?
GROUP BY `year`, `month`
ORDER BY `reclaim_timestamp` DESC
