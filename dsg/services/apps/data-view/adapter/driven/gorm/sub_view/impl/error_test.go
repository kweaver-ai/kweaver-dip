package impl

import (
	"errors"
	"testing"

	"github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

func Test_isDuplicatedOnKey(t *testing.T) {
	type args struct {
		err error
		key string
	}
	tests := []struct {
		name      string
		args      args
		assertion assert.BoolAssertionFunc
	}{
		{
			name:      "nil",
			args:      args{err: nil, key: ""},
			assertion: assert.False,
		},
		{
			name: "ok",
			args: args{
				err: &mysql.MySQLError{
					Number:  MySQLErrorNumber_ER_DUP_ENTRY,
					Message: "Duplicate entry '年龄不小于 495 的吸血鬼或妖怪-6a8e3281-6fc8-4cc8-...' for key 'idx_sub_views_name_logic_view_id_deleted_at'",
				},
				key: model.KeyNameSubViewsNameLogicViewIDDeletedAt,
			},
			assertion: assert.True,
		},
		{
			name: "not mysql.MySQLError",
			args: args{
				err: errors.New("something wrong"),
				key: model.KeyNameSubViewsNameLogicViewIDDeletedAt,
			},
			assertion: assert.False,
		},
		{
			name: "not ER_DUP_ENTRY",
			args: args{
				err: &mysql.MySQLError{
					Number:  1068,
					Message: "Duplicate entry '年龄不小于 495 的吸血鬼或妖怪-6a8e3281-6fc8-4cc8-...' for key 'idx_sub_views_name_logic_view_id_deleted_at'",
				},
				key: model.KeyNameSubViewsNameLogicViewIDDeletedAt,
			},
			assertion: assert.False,
		},
		{
			name: "unexpected key",
			args: args{
				err: &mysql.MySQLError{
					Number:  MySQLErrorNumber_ER_DUP_ENTRY,
					Message: "Duplicate entry '年龄不小于 495 的吸血鬼或妖怪-6a8e3281-6fc8-4cc8-...' for key 'idx_sub_views_name_logic_view_id_deleted_at'",
				},
				key: "id_unexpected_key",
			},
			assertion: assert.False,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.assertion(t, isDuplicatedOnKey(tt.args.err, tt.args.key))
		})
	}
}
