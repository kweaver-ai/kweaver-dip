package constant

type ItemFlag int32

const (
	ItemFlagAttr1 ItemFlag = 1 << iota
	ItemFlagAttr2
)

func (f ItemFlag) Int32() int32 {
	return int32(f)
}

func (f ItemFlag) UInt32() uint32 {
	return uint32(f)
}

func (f ItemFlag) AddAttr1(real ...bool) ItemFlag {
	return f.AddSign(ItemFlagAttr1, real...)
}

func (f ItemFlag) AddAttr2(real ...bool) ItemFlag {
	return f.AddSign(ItemFlagAttr2, real...)
}

func (f ItemFlag) HasAttr1() bool {
	return f.HasSign(ItemFlagAttr1)
}

func (f ItemFlag) HasAttr2() bool {
	return f.HasSign(ItemFlagAttr2)
}

func (f ItemFlag) AddSign(sign ItemFlag, real ...bool) ItemFlag {
	if len(real) > 0 && !real[0] {
		return f
	}

	return f | sign
}

func (f ItemFlag) HasSign(sign ItemFlag) bool {
	return f&sign == sign
}
