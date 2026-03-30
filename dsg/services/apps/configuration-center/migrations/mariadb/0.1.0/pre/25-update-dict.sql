USE `af_configuration`;


insert into `t_dict` (`id`,`f_type`,`name`,`f_description`,`created_at`,`updated_at`,`sszd_flag`)
select 43,'catalog-feedback-type','目录反馈类型','应用于目录反馈的反馈类型字段','2024-12-17 14:28:55','2024-12-17 14:28:55',0
from dual where not exists (select `id` from t_dict where `id` = 43);


insert into `t_dict` (`id`,`f_type`,`name`,`f_description`,`created_at`,`updated_at`,`sszd_flag`)
select 45,'business-matters-type','业务事项类型','应用于目录业务事项字段','2024-12-17 14:28:55','2024-12-17 14:28:55',0
from dual where not exists (select `id` from t_dict where `id` = 45);

insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`) select 447,'catalog-feedback-type','1','目录信息错误',null,'2024-12-17 14:28:55',43,1    from dual where not exists (select `id` from t_dict_item where `id` = 447);
insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`) select 448,'catalog-feedback-type','2','数据质量问题',null,'2024-12-17 14:28:55',43,2    from dual where not exists (select `id` from t_dict_item where `id` = 448);
insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`) select 449,'catalog-feedback-type','3','挂接资源和目录不一致',null,'2024-12-17 14:28:55',43,3    from dual where not exists (select `id` from t_dict_item where `id` = 449);
insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`) select 450,'catalog-feedback-type','4','接口问题',null,'2024-12-17 14:28:55',43,4    from dual where not exists (select `id` from t_dict_item where `id` = 450);
insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`) select 451,'catalog-feedback-type','5','其他',null,'2024-12-17 14:28:55',43,5    from dual where not exists (select `id` from t_dict_item where `id` = 451);


insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`)
select 455,'business-matters-type','111','行政确认',"行政确认的描述",'2024-12-17 14:28:55',45,0
from dual where not exists (select `id` from t_dict_item where `id` = 455);

insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`)
select 456,'business-matters-type','222','行政奖励',"行政奖励的描述",'2024-12-17 14:28:55',45,1
from dual where not exists (select `id` from t_dict_item where `id` = 456);

insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`)
select 457,'business-matters-type','333','其他',"其他",'2024-12-17 14:28:55',45,1
from dual where not exists (select `id` from t_dict_item where `id` = 457);

UPDATE `user` SET `status` = '1' WHERE `id`='266c6a42-6131-4d62-8f39-853e7093701c';