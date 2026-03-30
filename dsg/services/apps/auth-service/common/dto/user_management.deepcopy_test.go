package dto

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestUserInfo_DeepCopyInto(t *testing.T) {
	in := &UserInfo{
		Name: "NAME",
		Roles: []string{
			"ROLE_0",
			"ROLE_1",
		},
		ParentDeps: [][]ParentDepartment{
			{
				{
					Id:   "ID_0_0",
					Name: "NAME_0_0",
					Type: "TYPE_0_0",
				},
				{
					Id:   "ID_0_1",
					Name: "NAME_0_1",
					Type: "TYPE_0_1",
				},
			},
			{
				{
					Id:   "ID_1_0",
					Name: "NAME_1_0",
					Type: "TYPE_1_0",
				},
				{
					Id:   "ID_1_1",
					Name: "NAME_1_1",
					Type: "TYPE_1_1",
				},
			},
		},
		Id: "ID",
	}

	got := in.DeepCopy()

	want := &UserInfo{
		Name: "NAME",
		Roles: []string{
			"ROLE_0",
			"ROLE_1",
		},
		ParentDeps: [][]ParentDepartment{
			{
				{
					Id:   "ID_0_0",
					Name: "NAME_0_0",
					Type: "TYPE_0_0",
				},
				{
					Id:   "ID_0_1",
					Name: "NAME_0_1",
					Type: "TYPE_0_1",
				},
			},
			{
				{
					Id:   "ID_1_0",
					Name: "NAME_1_0",
					Type: "TYPE_1_0",
				},
				{
					Id:   "ID_1_1",
					Name: "NAME_1_1",
					Type: "TYPE_1_1",
				},
			},
		},
		Id: "ID",
	}

	assert.Equal(t, want, got)
}
