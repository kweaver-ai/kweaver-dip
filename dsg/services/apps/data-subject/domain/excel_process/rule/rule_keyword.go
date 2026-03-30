package rule

type KvContentKeyWord struct {
	RuleName string `yaml:"RuleName"`
	Start    int    `yaml:"Start"`
	End      int    `yaml:"End"`
}
type SheetNameKeyWord struct {
	RuleName   string `yaml:"RuleName"`
	LengthLess int    `yaml:"LengthLess"`
	Row        int    `yaml:"Row"`
}
type InstructionKeyWord struct {
	RuleName      string   `yaml:"RuleName"`
	Keyword       []string `yaml:"Keyword"`
	LengthGreater int      `yaml:"LengthGreater"`
	Rows          []int    `yaml:"Rows"`
}
type TableContentKeyWord struct {
	RuleName     string `yaml:"RuleName"`
	TitleNum     int    `yaml:"TitleNum"`
	ContentCount int    `yaml:"ContentCount"`
}
type CutRuleByKeyWord struct {
	KvContent    KvContentKeyWord    `yaml:"KvContent"`
	SheetName    SheetNameKeyWord    `yaml:"SheetName"`
	Instruction  InstructionKeyWord  `yaml:"Instruction"`
	TableContent TableContentKeyWord `yaml:"TableContent"`
}
