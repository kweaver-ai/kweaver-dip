package constant

type TreeNodeFlag int32

const (
	TreeNodeFlagExpansion TreeNodeFlag = 1 << iota
)

func (f TreeNodeFlag) Int32() int32 {
	return int32(f)
}

func (f TreeNodeFlag) AddExpansion(real ...bool) TreeNodeFlag {
	if len(real) > 0 && !real[0] {
		return f
	}

	return f.addSign(TreeNodeFlagExpansion)
}

func (f TreeNodeFlag) HasExpansion() bool {
	return f.hasSign(TreeNodeFlagExpansion)
}

func (f TreeNodeFlag) addSign(sign TreeNodeFlag) TreeNodeFlag {
	return f | sign
}

func (f TreeNodeFlag) hasSign(sign TreeNodeFlag) bool {
	return f&sign == sign
}
