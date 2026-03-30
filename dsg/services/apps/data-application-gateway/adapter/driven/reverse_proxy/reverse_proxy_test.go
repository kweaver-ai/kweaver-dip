package reverse_proxy

import (
	"mime"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestContentType(t *testing.T) {
	contentTypes := []string{
		"application/json",
		"application/json; charset=utf-8",
	}

	for _, ct := range contentTypes {
		t.Run(ct, func(t *testing.T) {
			if mt, _, err := mime.ParseMediaType(ct); assert.NoError(t, err) {
				assert.Equal(t, "application/json", mt)
			}
		})
	}
}

func Test_validateContentType(t *testing.T) {
	type args struct {
		contentType string
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name: "empty",
		},
		{
			name: "json",
			args: args{
				contentType: "application/json",
			},
		},
		{
			name: "json charset utf-8",
			args: args{
				contentType: "application/json; charset=utf-8",
			},
		},
		{
			name: "html",
			args: args{
				contentType: "txt/html",
			},
			wantErr: true,
		},
		{
			name: "html charset utf-8",
			args: args{
				contentType: "txt/html; charset=utf-8",
			},
			wantErr: true,
		},
		{
			name: "invalid media type",
			args: args{
				contentType: "invalid?media?type",
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := validateContentType(tt.args.contentType); (err != nil) != tt.wantErr {
				t.Errorf("validateContentType() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
