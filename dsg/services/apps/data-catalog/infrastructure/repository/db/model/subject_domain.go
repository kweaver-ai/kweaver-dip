package model

const TableNameSubjectDomain = "subject_domain"

type SubjectDomain struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
	Path string `json:"path,omitempty"`
}

func (SubjectDomain) TableName() string { return TableNameSubjectDomain }
