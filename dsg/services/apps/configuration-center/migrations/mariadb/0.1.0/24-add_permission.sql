USE `af_configuration`;

insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'd07759f3-953a-4da4-9252-30c0bd42d4b1','2025-09-01 14.40:44.807','2025-09-19 14.40:44.807',NULL,'数据理解概览','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'd07759f3-953a-4da4-9252-30c0bd42d4b1' );

insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`)
SELECT '0077a70c-37c9-46fd-a805-3a4265fb2908',now(),now(),NULL,'实施资源目录','Operation',NULL
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2908' );

insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`)
SELECT '0077a70c-37c9-46fd-a805-3a4265fb2909',now(),now(),NULL,'实施接口服务','Operation',NULL
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2909' );
INSERT INTO `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `description`, `category`) SELECT 'cee432b2-8de8-11f0-b8d2-c6218609b697', '2025-09-10 09:52:29.000', '2025-09-10 09:52:29.000', NULL, '数据资产监测', NULL, 'Operation' FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'cee432b2-8de8-11f0-b8d2-c6218609b697' );
INSERT INTO `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `description`, `category`) SELECT 'e814e7f7-8df3-11f0-8508-460704bf4dfc', '2025-09-10 09:52:29.000', '2025-09-10 09:52:29.000', NULL, '数据资源需求概览', NULL, 'Operation' FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'e814e7f7-8df3-11f0-8508-460704bf4dfc' );

update `permissions` set id = '0077a70c-37c9-46fd-a805-3a4265fb2906' where id = 'd07759f3-953a-4da4-9252-30c0bd42d4b1';
