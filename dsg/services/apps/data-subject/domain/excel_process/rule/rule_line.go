package rule

var (
	LineRulesStruct LineRules
)

type KvContentLine struct {
	Start int `yaml:"Start"`
	End   int `yaml:"End"`
}
type SheetNameLine struct {
	Row int `yaml:"Row"`
}
type InstructionLine struct {
	Rows []int `yaml:"Rows"`
}
type TableContentLine struct {
	TitleNum     int `yaml:"TitleNum"`
	ContentCount int `yaml:"ContentCount"`
}
type CutRuleByLine struct {
	Name         string           `yaml:"Name"`
	ModelsName   string           `yaml:"ModelsName"`
	Type         int              `yaml:"Type"`
	KvContent    KvContentLine    `yaml:"KvContent"`
	SheetName    SheetNameLine    `yaml:"SheetName"`
	Instruction  InstructionLine  `yaml:"Instruction"`
	TableContent TableContentLine `yaml:"TableContent"`
}
type LineRules struct {
	LineRules []*CutRuleByLine `yaml:"lineRules"`
}
