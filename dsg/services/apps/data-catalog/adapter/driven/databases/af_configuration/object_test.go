package af_configuration

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseObjectTypeString(t *testing.T) {
	tests := []struct {
		name    string
		s       string
		want    ObjectType
		wantErr error
	}{
		{
			name: "unknown",
			s:    ObjectStringUnknown,
			want: ObjectUnknown,
		},
		{
			name: "organization",
			s:    ObjectStringOrganization,
			want: ObjectOrganization,
		},
		{
			name: "department",
			s:    ObjectStringDepartment,
			want: ObjectDepartment,
		},
		{
			name:    "undefined",
			s:       "undefined",
			want:    ObjectUnknown,
			wantErr: ErrInvalidObjectTypeString("undefined"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseObjectTypeString(tt.s)
			require.ErrorIs(t, err, tt.wantErr)
			require.Equal(t, tt.want, got)
		})
	}
}

func TestObjectType_String(t *testing.T) {
	tests := []struct {
		name string
		// 被测试的 Object 类型
		objectType ObjectType
		// 期望这个 Object 类型是否是未定义的
		undefined bool
		// 期望 objectType.String 的返回值
		want string
	}{
		{
			name:       "unknown",
			objectType: ObjectUnknown,
			want:       ObjectStringUnknown,
		},
		{
			name:       "organization",
			objectType: ObjectOrganization,
			want:       ObjectStringOrganization,
		},
		{
			name:       "department",
			objectType: ObjectDepartment,
			want:       ObjectStringDepartment,
		},
		{
			name:       "undefined",
			objectType: 12450,
			undefined:  true,
			want:       ObjectStringUnknown,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.objectType.String()
			require.Equal(t, tt.want, got, "string")

			_, ok := mapObjectTypeToString[tt.objectType]
			require.Equal(t, tt.undefined, !ok, "undefined")
		})
	}
}
