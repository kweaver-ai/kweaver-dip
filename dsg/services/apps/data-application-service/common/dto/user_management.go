package dto

type UserInfo struct {
	Name       string   `json:"name"`
	Roles      []string `json:"roles"`
	ParentDeps [][]struct {
		Id   string `json:"id"`
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"parent_deps"`
	Id string `json:"id"`
}

type AppsInfo struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}
