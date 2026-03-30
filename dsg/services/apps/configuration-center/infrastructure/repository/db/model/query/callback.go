package query

import (
	"gorm.io/gorm"
)

// RegisterCallbacks 添加数据库回调
func RegisterCallbacks(q *Query, fn func(*gorm.DB)) {
	fn(q.Datasource.datasourceDo.UnderlyingDB())
	fn(q.InfoSystem.infoSystemDo.UnderlyingDB())
	fn(q.Object.objectDo.UnderlyingDB())
	fn(q.User.userDo.UnderlyingDB())
}

func RegisterDBCallbacks(q *Query, fn func(*gorm.DB)) {
	fn(q.Datasource.datasourceDo.UnderlyingDB())
	fn(q.Flowchart.flowchartDo.UnderlyingDB())
	fn(q.FlowchartNodeConfig.flowchartNodeConfigDo.UnderlyingDB())
	fn(q.FlowchartNodeTask.flowchartNodeTaskDo.UnderlyingDB())
	fn(q.FlowchartUnit.flowchartUnitDo.UnderlyingDB())
	fn(q.FlowchartVersion.flowchartVersionDo.UnderlyingDB())
	fn(q.InfoSystem.infoSystemDo.UnderlyingDB())
	fn(q.MqMessage.mqMessageDo.UnderlyingDB())
	fn(q.Object.objectDo.UnderlyingDB())
	fn(q.Resource.resourceDo.UnderlyingDB())
	fn(q.SystemRole.systemRoleDo.UnderlyingDB())
	fn(q.User.userDo.UnderlyingDB())
	fn(q.UserRole.userRoleDo.UnderlyingDB())
	fn(q.Configuration.configurationDo.UnderlyingDB())
	fn(q.TDictItem.tDictItemDo.UnderlyingDB())
	fn(q.TDict.tDictDo.UnderlyingDB())
}
