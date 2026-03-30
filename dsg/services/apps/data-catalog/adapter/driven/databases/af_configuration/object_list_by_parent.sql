SELECT * FROM `object` WHERE `path_id` LIKE CONCAT((SELECT `path_id` FROM af_configuration.object WHERE id = ?), '%');
