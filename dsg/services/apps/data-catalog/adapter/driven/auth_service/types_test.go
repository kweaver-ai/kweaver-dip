package auth_service

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetObjectsOptions_Query(t *testing.T) {
	type fields struct {
		SubjectType SubjectType
		SubjectID   string
		ObjectTypes []ObjectType
		ObjectID    string
	}
	tests := []struct {
		name   string
		fields fields
		want   url.Values
	}{
		{
			name:   "none",
			fields: fields{},
			want:   url.Values{},
		},
		{
			name: "all",
			fields: fields{
				SubjectType: SubjectTypeUser,
				SubjectID:   "e9611d06-b94f-4f11-ad0b-d8dfe3d4cbbe",
				ObjectTypes: []ObjectType{
					ObjectTypeDomain,
					ObjectTypeDataCatalog,
					ObjectTypeDataView,
					ObjectTypeAPI,
				},
				ObjectID: "98bdcc21-2129-452a-9ec8-000413aae09c",
			},
			want: url.Values{
				"subject_type": []string{
					"user",
				},
				"subject_id": []string{
					"e9611d06-b94f-4f11-ad0b-d8dfe3d4cbbe",
				},
				"object_type": []string{
					"domain,data_catalog,data_view,api",
				},
				"object_id": []string{
					"98bdcc21-2129-452a-9ec8-000413aae09c",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			opts := &GetObjectsOptions{
				SubjectType: tt.fields.SubjectType,
				SubjectID:   tt.fields.SubjectID,
				ObjectTypes: tt.fields.ObjectTypes,
				ObjectID:    tt.fields.ObjectID,
			}
			assert.Equal(t, tt.want, opts.Query())
		})
	}
}
