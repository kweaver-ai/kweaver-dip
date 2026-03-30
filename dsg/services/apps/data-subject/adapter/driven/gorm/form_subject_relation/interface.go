package form_subject_relation

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
)

type Repo interface {
	Get(c context.Context, fid string) ([]*model.SubjectDomainWithRelation, error)
	Update(c context.Context, formID string, relations []*model.FormBusinessObjectRelation) error
	Remove(c context.Context, formId ...string) error
	GetFormEntities(c context.Context, fid string) (businessObjectIDSlice []string, err error)
}
