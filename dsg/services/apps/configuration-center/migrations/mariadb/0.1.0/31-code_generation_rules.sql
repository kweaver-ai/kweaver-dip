USE af_configuration;

update code_generation_rules set deleted_at = UNIX_TIMESTAMP() where name in ("需求", "共享申请", "信息资源目录", "文件资源", "租户申请","数据分析");
update code_generation_rules set name = "库表", prefix = "SJKB" where name = "逻辑视图";
update code_generation_rules set prefix = "SJZYML" where name = "数据资源目录";
