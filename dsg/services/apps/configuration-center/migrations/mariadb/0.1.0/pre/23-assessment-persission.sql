USE af_configuration;


insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2898','2025-09-05 11:03:44.807','2025-09-05 11:03:44.807',NULL,'查看部门数据考核概览','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2898' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2899','2025-09-05 11:03:44.807','2025-09-05 11:03:44.807',NULL,'管理部门考核目标','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2899' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2900','2025-09-05 11:03:44.807','2025-09-05 11:03:44.807',NULL,'管理部门考核计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2900' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2901','2025-09-05 11:03:44.807','2025-09-05 11:03:44.807',NULL,'查看运营数据考核概览','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2901' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2902','2025-09-05 11:03:44.807','2025-09-05 11:03:44.807',NULL,'管理运营考核目标','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2902' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2903','2025-09-05 11:03:44.807','2025-09-05 11:03:44.807',NULL,'管理运营考核计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2903' );

insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2904','2025-09-12 14:49:44.807','2025-09-05 11:03:44.807',NULL,'数据资产概览','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2904' );



insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '680d50d8-50c9-11f0-a6cd-daa7e4d41f1d','2025-09-01 14.40:44.807','2025-09-01 14.40:44.807',NULL,'数据获取概览','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '680d50d8-50c9-11f0-a6cd-daa7e4d41f1d' );

insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`)
SELECT 'e6dfc0a2-8df1-11f0-8508-460704bf4dfc','2025-09-10 14.40:44.807','2025-09-10 14.40:44.807',NULL,'数据处理概览','Operation',NULL
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'e6dfc0a2-8df1-11f0-8508-460704bf4dfc' );
update `permissions` set id = '0077a70c-37c9-46fd-a805-3a4265fb2905' where id = 'e6dfc0a2-8df1-11f0-8508-460704bf4dfc';


insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2891','2025-08-27 11:03:44.807','2025-08-27 11:03:44.807',NULL,'负责人注册','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2891' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2892','2025-08-27 11:03:44.807','2025-08-27 11:03:44.807',NULL,'机构注册','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2892' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2893','2025-08-27 11:03:44.807','2025-08-27 11:03:44.807',NULL,'网关应用管理','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2893' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2894','2025-08-27 11:03:44.807','2025-08-27 11:03:44.807',NULL,'应用注册','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2894' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2895','2025-08-27 11:03:44.807','2025-08-27 11:03:44.807',NULL,'系统注册','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2895' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2896','2025-08-27 11:03:44.807','2025-08-27 11:03:44.807',NULL,'系统接入','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2896' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2897','2025-08-27 11:03:44.807','2025-08-27 11:03:44.807',NULL,'服务监控','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2897' );


insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`)
SELECT '3c11eadd-8259-11f0-9f49-0eb42bdf8fb1','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'业务事项管理','Operation',NULL
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '3c11eadd-8259-11f0-9f49-0eb42bdf8fb1' );


