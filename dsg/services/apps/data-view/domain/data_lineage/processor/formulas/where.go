package formulas

type WhereConfig struct {
	Where         []WhereDetail `json:"where"`
	WhereRelation string      `json:"where_relation"`
}

type WhereDetail struct {
	Relation string       `json:"relation"`
	Member   []MemberInfo `json:"member"`
}

type MemberInfo struct {
	Field    ConfigField `json:"field"`
	Operator string      `json:"operator"`
	Value    string      `json:"value"`
}

