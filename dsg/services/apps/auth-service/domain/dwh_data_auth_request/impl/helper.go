package impl

import (
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
)

func newDataAuthFormListItem(applyFormInfo *model.TDwhAuthRequestForm, applicantName string) dto.DataAuthFormListItem {
	return dto.DataAuthFormListItem{
		DataAuthRequestBasic: dto.DataAuthRequestBasic{
			ID:               applyFormInfo.ID,
			Name:             applyFormInfo.Name,
			DataID:           applyFormInfo.DataID,
			DataBusinessName: applyFormInfo.DataBusinessName,
			DataTechName:     applyFormInfo.DataTechName,
			Applicant:        applyFormInfo.Applicant,
			ApplicantName:    applicantName,
			ApplyTime:        applyFormInfo.ApplyTime,
			CreatedAt:        applyFormInfo.CreatedAt,
			UpdatedAt:        applyFormInfo.UpdatedAt,
		},
		Status: dto.DataAuthRequestStatus{
			Phase:      applyFormInfo.Phase,
			ApplyID:    applyFormInfo.ApplyID,
			Message:    applyFormInfo.Message,
			ProcDefKey: applyFormInfo.ProcDefKey,
		},
	}
}

func newDataAuthFormSubView(applyFormInfo *model.DwhAuthRequestFormAssociations) dto.SubViewAuthorizingRequestSpec {
	return dto.SubViewAuthorizingRequestSpec{
		ID: applyFormInfo.TDwhAuthRequestSpec.ID,
		Spec: &dto.SubViewSpec{
			Name:        applyFormInfo.TDwhAuthRequestSpec.Name,
			LogicViewID: applyFormInfo.DataID,
			AuthScopeID: applyFormInfo.DataID,
			Detail:      applyFormInfo.TDwhAuthRequestSpec.Spec,
		},
		Policies: []dto.SubjectPolicy{
			{
				SubjectID:   applyFormInfo.Applicant,
				SubjectType: dto.SubjectUser,
				Actions:     []dto.Action{dto.ActionRead},
				ExpiredAt:   timestampToExpiredAt(applyFormInfo.ExpiredAt),
			},
		},
	}
}
