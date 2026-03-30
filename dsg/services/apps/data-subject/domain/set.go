package gorm

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/excel_process"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/subject_domain"
)

var Set = wire.NewSet(
	subject_domain.NewSubjectDomainUseCase,
	excel_process.NewExcelProcessUsecase,
)
