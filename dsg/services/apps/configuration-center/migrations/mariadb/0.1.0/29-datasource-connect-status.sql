USE af_configuration;

-- ALTER TABLE `datasource` add COLUMN IF NOT EXISTS `connect_status`  tinyint(2) DEFAULT 1  COMMENT '连接状态 1已连接 2未连接'