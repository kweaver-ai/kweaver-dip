package impl

import "context"

func (r RepoImpl) QueryIndicatorCount(ctx context.Context) (total int64, err error) {
	sql := "select  count(tti.id) as total from af_data_model.t_technical_indicator tti " +
		" join af_main.subject_domain sd  on  tti.subject_domain_id =sd.id " +
		"  where sd.deleted_at=0 and tti.deleted_at is null"
	err = r.db.WithContext(ctx).Raw(sql).Count(&total).Error
	return total, err
}

func (r RepoImpl) QueryInterfaceCount(ctx context.Context, isOperator bool) (total int64, err error) {
	sql := "select  count(s.service_id) as total from data_application_service.service s " +
		"  join af_main.subject_domain sd  on  s.subject_domain_id =sd.id " +
		"  where sd.deleted_at=0 and s.delete_time=0 and s.is_changed=0 "
	//如果是数据运营，数据开发人员，返回所有，否则，只展示发布的
	if !isOperator {
		sql += "  and s.status='online'"
	}
	err = r.db.WithContext(ctx).Raw(sql).Count(&total).Error
	return total, err
}
