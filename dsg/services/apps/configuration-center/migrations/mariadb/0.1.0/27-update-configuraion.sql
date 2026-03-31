USE af_configuration;

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'third_party', 'false', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'third_party' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'quality_pass_score', '100', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'quality_pass_score' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'quality_exemption_score', '100', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'quality_exemption_score' );