package constant

import "testing"

func TestFlag_addSign(t *testing.T) {
	type args struct {
		sign TreeNodeFlag
	}
	tests := []struct {
		name string
		f    TreeNodeFlag
		args args
		want TreeNodeFlag
	}{
		{
			name: "t1",
			f:    0,
			args: args{
				sign: 1,
			},
			want: 1,
		},
		{
			name: "t2",
			f:    1,
			args: args{
				sign: 1,
			},
			want: 1,
		},
		{
			name: "t3",
			f:    2,
			args: args{
				sign: 1,
			},
			want: 3,
		},
		{
			name: "t4",
			f:    1 << 3,
			args: args{
				sign: 1 << 1,
			},
			want: 1<<3 | 1<<1,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.f.addSign(tt.args.sign); got != tt.want {
				t.Errorf("addSign() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestFlag_hasSign(t *testing.T) {
	type args struct {
		sign TreeNodeFlag
	}
	tests := []struct {
		name string
		f    TreeNodeFlag
		args args
		want bool
	}{
		{
			name: "t1",
			f:    0,
			args: args{
				sign: 2,
			},
			want: false,
		},
		{
			name: "t2",
			f:    3,
			args: args{
				sign: 2,
			},
			want: true,
		},
		{
			name: "t3",
			f:    7,
			args: args{
				sign: 3,
			},
			want: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.f.hasSign(tt.args.sign); got != tt.want {
				t.Errorf("hasSign() = %v, want %v", got, tt.want)
			}
		})
	}
}
