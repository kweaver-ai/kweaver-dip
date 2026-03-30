package v1

import (
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
)

func verifyBusinessResponsibility(entry *info_resource_catalog.BelongInfoVO) (err error) {
	if entry == nil || entry.Office == nil || entry.Action != info_resource_catalog.ActionSubmit {
		return
	}
	if entry.Office.ID != "" {
		err = errors.New("当action为submit且传递了belong_info.office.id时，belong_info.office.business_responsibility不能为空")
	}
	return
}

func verifySharedMessage(entry *info_resource_catalog.SharedOpenInfoVO) (err error) {
	if entry == nil || entry.Action != info_resource_catalog.ActionSubmit || entry.SharedType == info_resource_catalog.SharedTypeUnconditional.String {
		return
	}
	if entry.SharedMessage == "" {
		err = errors.New("当action为submit且shared_open_info.shared_type不为all时，shared_open_info.shared_message不能为空")
	}
	return
}

func extraVerify(belongInfo *info_resource_catalog.BelongInfoVO, sharedOpenInfo *info_resource_catalog.SharedOpenInfoVO) (err error) {
	return errors.Join(verifyBusinessResponsibility(belongInfo), verifySharedMessage(sharedOpenInfo))
}
