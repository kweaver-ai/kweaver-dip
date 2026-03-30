package template

var (
	TemplateStruct Templates
)

type Rule struct {
	Regexp     string `yaml:"regexp" json:"regexp"`
	RegexpInfo string `yaml:"regexp_info" json:"regexp_info"`
	MaxLength  int    `yaml:"max_length" json:"max_length"`
	LengthInfo string `yaml:"length_info" json:"length_info"`
}
type Component struct {
	Index            int    `yaml:"index" json:"index"`
	Label            string `yaml:"label" json:"label"`
	Name             string `yaml:"name" json:"name"`
	Type             string `yaml:"type" json:"type"`
	Required         bool   `yaml:"required" json:"required"`
	Rule             *Rule  `yaml:"rule" json:"rule"`
	LabelName        string `yaml:"label_name" json:"label_name"`
	Disable          bool   `yaml:"disabled" json:"disabled"`
	SameAs           string `yaml:"same_as" json:"same_as"`
	PlaceHold        string `yaml:"placeholder" json:"placeholder"`
	IsMultipleValues bool   `yaml:"is_multiple_values" json:"is_multiple_values"`
	IsKv             bool   `yaml:"is_kv" json:"is_kv"`
	MaxValues        int    `yaml:"max_values" json:"max_values"`
	Separator        string `yaml:"separator" json:"separator"`
	Belong           string `yaml:"belong" json:"belong"`
	KvValueCell      string `yaml:"kv_value_cell" json:"kv_value_cell"`
}
type Template struct {
	Name      string `yaml:"name" json:"name"`
	SheetName string `yaml:"sheet_name" json:"sheet_name"`
	// FillInstructions string       `yaml:"fill_instructions" json:"fill_instructions"`
	ModelsName string       `yaml:"models_name"  json:"models_name"`
	Type       int          `yaml:"type" json:"type"`
	Components []*Component `yaml:"components" json:"components"`
}
type Templates struct {
	Templates []*Template `yaml:"templates" json:"templates"`
}

// func GetAddNameAndDescription(name string) ([]*Component, error) {
// 	for _, v := range TemplateStruct.Templates {
// 		if v.Name != name {
// 			continue
// 		}

// 		var index int
// 		res := make([]*Component, 0, len(v.Components))
// 		for i, component := range v.Components {
// 			if component.Index < 1 {
// 				continue
// 			}

// 			if component.Label == v.ModelsName {
// 				index = i
// 			}
// 			tmp := *component // deep copy
// 			res = append(res, &tmp)

// 			if component.Label == v.ModelsName {
// 				index = len(res) - 1
// 			}
// 		}

// 		res[index].Disable = true
// 		res[index].SameAs = "name"
// 		res[index].PlaceHold = "与「业务模型名称」相同"
// 		res = append(res, &Component{
// 			Index:    0,
// 			Label:    "业务模型名称",
// 			Name:     "name",
// 			Type:     "input",
// 			Required: true,
// 			Rule: &Rule{
// 				Regexp:     `^[a-zA-Z0-9\u4e00-\u9fa5-_]+$`,
// 				RegexpInfo: "仅支持中英文、数字、下划线及中划线",
// 				MaxLength:  128,
// 				LengthInfo: "超过最大长度：128",
// 			},
// 			Disable: false,
// 			SameAs:  v.Components[index].Name,
// 		}, &Component{
// 			Index:    len(v.Components) + 1,
// 			Label:    "业务模型描述",
// 			Name:     "description",
// 			Type:     "text_area",
// 			Required: false,
// 			Rule: &Rule{
// 				Regexp:     `^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$`,
// 				RegexpInfo: "仅支持中英文、数字及键盘上的特殊字符",
// 				MaxLength:  255,
// 				LengthInfo: "超过最大长度：255",
// 			},
// 			Disable: false,
// 		})

// 		sort.Slice(res, func(i, j int) bool {
// 			if res[i].Index < res[j].Index {
// 				return true
// 			}

// 			return false
// 		})

// 		return res, nil
// 	}

// 	return nil, errorcode.Desc(errorcode.ModelTemplatesNotExist)
// }
