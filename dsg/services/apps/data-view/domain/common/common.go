package common

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/standardization"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	fieldRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	data_subject_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// CommonUseCase ： CommonFunc CommonVerify
type CommonUseCase struct {
	fieldRepo                 fieldRepo.FormViewFieldRepo
	standardDriven            standardization.Driven
	userMgr                   user_management.DrivenUserMgnt
	DrivenDataSubjectNG       data_subject_local.DrivenDataSubject
	configurationCenterDriven configuration_center.Driven
}

func NewCommonUseCase(
	fieldRepo fieldRepo.FormViewFieldRepo,
	standardDriven standardization.Driven,
	userMgr user_management.DrivenUserMgnt,
	DrivenDataSubjectNG data_subject_local.DrivenDataSubject,
	configurationCenterDriven configuration_center.Driven,
) *CommonUseCase {
	return &CommonUseCase{
		fieldRepo:                 fieldRepo,
		standardDriven:            standardDriven,
		userMgr:                   userMgr,
		DrivenDataSubjectNG:       DrivenDataSubjectNG,
		configurationCenterDriven: configurationCenterDriven,
	}
}

func (c *CommonUseCase) ClearSyntheticData(ctx context.Context, viewId string, fieldReqMap map[string]*form_view.StandardInfo) (bool, error) {
	//判断是否需要清除合成数据
	var clearSyntheticData bool
	var originalFieldIsDelete bool
	originalFieldList, err := c.fieldRepo.GetFormViewFieldList(ctx, viewId)
	if err != nil {
		return clearSyntheticData, errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
	}
	for _, originalField := range originalFieldList {
		reqField, exist := fieldReqMap[originalField.ID]
		if !exist { // 字段被删除，清除合成数据
			clearSyntheticData = true
			originalFieldIsDelete = true
			break
		}
		// 数据标准code或码表id改变，清除合成数据
		if (!clearSyntheticData && reqField.StandardCode != originalField.StandardCode.String) || (!clearSyntheticData && reqField.CodeTableID != originalField.CodeTableID.String) {
			clearSyntheticData = true
			break
		}
	}
	if !originalFieldIsDelete && len(originalFieldList) != len(fieldReqMap) { // 字段数量改变,非删除字段即新增，清除合成数据
		clearSyntheticData = true
	}
	return clearSyntheticData, nil
}

func (c *CommonUseCase) VerifyStandard(ctx context.Context, CodeTableIDs []string, StandardCodes []string) error {
	CodeTableIDs = util.DuplicateStringRemoval(CodeTableIDs)
	StandardCodes = util.DuplicateStringRemoval(StandardCodes)
	if len(CodeTableIDs) != 0 {
		log.WithContext(ctx).Infof("verify CodeTableIDs :%+v", CodeTableIDs)
		CodeTables, err := c.standardDriven.GetStandardDict(ctx, CodeTableIDs)
		if err != nil {
			return err
		} else if len(CodeTables) != len(CodeTableIDs) {
			return errorcode.Desc(my_errorcode.CodeTableIDsVerifyFail)
		}
		for _, codeTables := range CodeTables {
			if codeTables.Deleted == true {
				return errorcode.Desc(my_errorcode.CodeTableIDsVerifyFail)
			}
		}
	}
	if len(StandardCodes) != 0 {
		log.WithContext(ctx).Infof("verify StandardCodes :%+v", StandardCodes)
		Standards, err := c.standardDriven.GetDataElementDetailByCode(ctx, StandardCodes...)
		if err != nil {
			return err
		} else if len(Standards) != len(StandardCodes) {
			return errorcode.Desc(my_errorcode.StandardCodesVerifyFail)
		}
		for _, standard := range Standards {
			if standard.Deleted == true {
				return errorcode.Desc(my_errorcode.StandardCodesVerifyFail)
			}
		}
	}
	return nil
}

func (c *CommonUseCase) VerifyDepartmentID(ctx context.Context, departmentID string) error {
	//校验部门id
	if departmentID != "" {
		departmentInfos, err := c.userMgr.GetDepartmentParentInfo(ctx, departmentID, "name,parent_deps")
		if err != nil || len(departmentInfos) == 0 {
			return errorcode.Detail(my_errorcode.DepartmentIdNotExist, err.Error())
		}
	}
	return nil
}

func (c *CommonUseCase) VerifySubjectID(ctx context.Context, subjectID string) error {
	if subjectID != "" {
		object, err := c.DrivenDataSubjectNG.GetsObjectById(ctx, subjectID)
		if err != nil {
			return errorcode.Detail(my_errorcode.DomainIdNotExist, err.Error())
		}
		if !constant.IsCouldBindSubject(object.Type) {
			return errorcode.Desc(my_errorcode.OnlySubjectDomain)
		}
	}
	return nil
}

//func (c *CommonUseCase) VerifyOwnerID(ctx context.Context, view *model.FormView, ownerIDs []string) error {
//	//校验OwnerID
//	for _, ownerID := range ownerIDs {
//		exist, err := c.configurationCenterDriven.GetCheckUserPermission(ctx, access_control.ManagerDataView, ownerID)
//		if err != nil {
//			return err
//		}
//		if !exist {
//			return errorcode.Desc(my_errorcode.OwnersIncorrect)
//		}
//	}
//	return nil
//}

func (c *CommonUseCase) VerifyDepartmentIDSubjectIDOwnerID(ctx context.Context, view *model.FormView, departmentID string, subjectID string, ownerID []string) (err error) {
	//校验部门id
	if err = c.VerifyDepartmentID(ctx, departmentID); err != nil {
		return
	}
	//校验主题id
	if err = c.VerifySubjectID(ctx, subjectID); err != nil {
		return
	}
	//校验OwnerID
	//if err = c.VerifyOwnerID(ctx, view, ownerID); err != nil {
	//	return err
	//}

	return nil
}
