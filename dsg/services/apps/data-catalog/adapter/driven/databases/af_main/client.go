package af_main

import "gorm.io/gorm"

type AFMain struct {
	DB *gorm.DB
}

func New(db *gorm.DB) *AFMain { return &AFMain{DB: db} }

func (c *AFMain) SubjectDomain() SubjectDomainInterface { return newSubjectDomains(c.DB) }

var _ AFMainInterface = &AFMain{}
