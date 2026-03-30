package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
)

//region 获取 数据运营管理 所有权限

func (p *Permissions) GetDataOperationManagementAllPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	attributes := make([]*model.Resource, 0)
	//Resource
	for _, r := range GetDataOperationManagementResource() {
		attributes = append(attributes, &model.Resource{
			RoleID: roleId,
			Type:   r.ToInt32(),
			Value:  AllPermission(),
		})
	}

	//Scope
	for _, s := range GetDataOperationManagementScope() {
		attributes = append(attributes, &model.Resource{
			RoleID: roleId,
			Type:   s.ToInt32(),
			Value:  AllPermission(),
		})
	}

	return attributes, nil
}
func GetDataOperationManagementResource() []access_control.Resource {
	return []access_control.Resource{
		// access_control.CatalogCategory,
		//数据运营管理(工作台)-数据目录管理-数据资源目录
		access_control.DataResourceCatalog,
		//数据运营管理(工作台)-数据需求管理-数据需求申请
		access_control.DataFeature,
		//数据运营管理(工作台)-数据需求管理-数据需求分析
		access_control.DataFeatureAnalyze,
		//数据运营管理(工作台)-接口服务管理-接口服务
		access_control.ServiceManagement,
		//数据运营管理(工作台)-数据探查理解-数据资源目录理解
		access_control.DataExplorationUnderstandingDataResourceCatalogUnderstanding,
	}
}
func GetDataOperationManagementScope() []access_control.Scope {
	return []access_control.Scope{
		// access_control.CatalogCategoryScope,
		access_control.DataResourceCatalogScope,
		access_control.DataFeatureScope,
		access_control.DataFeatureAnalyzeScope,
		access_control.ServiceManagementScope,
		access_control.DataExplorationUnderstandingDataResourceCatalogUnderstandingScope,
	}
}

//endregion

//region 获取 数据资产中心 所有权限

func (p *Permissions) GetDataAssetResource(ctx context.Context, roleId string) ([]*model.Resource, error) {
	attributes := make([]*model.Resource, 0)
	//Resource
	for _, r := range GetDataAssetResource() {
		attributes = append(attributes, &model.Resource{
			RoleID: roleId,
			Type:   r.ToInt32(),
			Value:  AllPermission(),
		})
	}

	//Scope
	for _, s := range GetDataAssetScope() {
		attributes = append(attributes, &model.Resource{
			RoleID: roleId,
			Type:   s.ToInt32(),
			Value:  AllPermission(),
		})
	}
	return attributes, nil
}
func GetDataAssetResource() []access_control.Resource {
	return []access_control.Resource{
		access_control.DataResourceCatalogBusinessObject,
		access_control.DataResourceCatalogDataCatalog,
		//access_control.DataResourceCatalogDataFeature,
		//access_control.DataResourceCatalogApplyList,
	}
}
func GetDataAssetScope() []access_control.Scope {
	return []access_control.Scope{
		access_control.DataResourceCatalogBusinessObjectScope,
		access_control.DataResourceCatalogDataCatalogScope,
		//access_control.DataResourceCatalogDataFeatureScope,
		//access_control.DataResourceCatalogApplyListScope,
	}
}

//endregion

//region 获取 数据资产中心 所有权限

func (p *Permissions) GetDataAssetPartResource(ctx context.Context, roleId string) ([]*model.Resource, error) {
	attributes := make([]*model.Resource, 0)

	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogBusinessObject.ToInt32(), Value: 15})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogBusinessObjectScope.ToInt32(), Value: 15})

	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataCatalog.ToInt32(), Value: 15})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataCatalogScope.ToInt32(), Value: 15})

	return attributes, nil
}

//endregion
