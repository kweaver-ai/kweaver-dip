package microservice

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestEnforceEqualWithoutEffect(t *testing.T) {
	type args struct {
		a *Enforce
		b *Enforce
	}
	tests := []struct {
		name string
		args args
		want assert.BoolAssertionFunc
	}{
		{
			name: "完全相同",
			args: args{
				a: &Enforce{
					Action:      "read",
					Effect:      "allow",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
				b: &Enforce{
					Action:      "read",
					Effect:      "allow",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
			},
			want: assert.True,
		},
		{
			name: "只有 effect 不同",
			args: args{
				a: &Enforce{
					Action:      "read",
					Effect:      "allow",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
				b: &Enforce{
					Action:      "read",
					Effect:      "deny",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
			},
			want: assert.True,
		},
		{
			name: "action 不同",
			args: args{
				a: &Enforce{
					Action:      "read",
					Effect:      "allow",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
				b: &Enforce{
					Action:      "download",
					Effect:      "deny",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
			},
			want: assert.False,
		},
		{
			name: "object id 不同",
			args: args{
				a: &Enforce{
					Action:      "read",
					Effect:      "allow",
					ObjectId:    "c4ea79a8-f575-11ee-bd08-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
				b: &Enforce{
					Action:      "read",
					Effect:      "deny",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
			},
			want: assert.False,
		},
		{
			name: "object type 不同",
			args: args{
				a: &Enforce{
					Action:      "read",
					Effect:      "allow",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "api",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
				b: &Enforce{
					Action:      "read",
					Effect:      "deny",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
			},
			want: assert.False,
		},
		{
			name: "subject id 不同",
			args: args{
				a: &Enforce{
					Action:      "read",
					Effect:      "allow",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "d4d4c0ee-f575-11ee-bbc6-005056b4b3fc",
					SubjectType: "user",
				},
				b: &Enforce{
					Action:      "read",
					Effect:      "deny",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
			},
			want: assert.False,
		},
		{
			name: "subject type 不同",
			args: args{
				a: &Enforce{
					Action:      "read",
					Effect:      "allow",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "role",
				},
				b: &Enforce{
					Action:      "read",
					Effect:      "deny",
					ObjectId:    "82ca4e4a-f575-11ee-9983-005056b4b3fc",
					ObjectType:  "data_view",
					SubjectId:   "855615c2-f575-11ee-bcef-005056b4b3fc",
					SubjectType: "user",
				},
			},
			want: assert.False,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.want(t, EnforceEqualWithoutEffect(tt.args.a, tt.args.b))
		})
	}
}
