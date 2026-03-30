USE af_configuration;

-- 是否数字员工菜单1是、0否
INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT 'digital_human', '1', '12'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'digital_human' );
