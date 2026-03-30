package resources

import "github.com/kweaver-ai/idrm-go-common/rest/studio_web"

type App struct {
	TextZHCN      string `json:"textZHCN"`
	TextZHTW      string `json:"textZHTW"`
	TextENUS      string `json:"textENUS"`
	Icon          string `json:"icon,omitempty"`
	Type          string `json:"type"`
	IsDefaultOpen bool   `json:"isDefaultOpen,omitempty"`
}

type SubApp struct {
	Children   map[string]any `json:"children,omitempty"`
	Entry      string         `json:"entry,omitempty"`
	ActiveRule string         `json:"activeRule,omitempty"`
	BaseRouter string         `json:"baseRouter,omitempty"`
}

type WebAppConfig struct {
	Name       string `json:"name"`
	Parent     string `json:"parent"`
	OrderIndex int    `json:"orderIndex"`
	App        App    `json:"app"`
	SubApp     SubApp `json:"subapp"`
}

var defaultWebApps = []*studio_web.WebAppConfig{
	{
		Name:       "semantic-governance",
		Parent:     "root",
		OrderIndex: 4500,
		App: studio_web.App{
			TextZHCN: "语义治理",
			TextZHTW: "語義治理",
			TextENUS: "Semantic Governance",
			Type:     "group",
		},
		SubApp: studio_web.SubApp{
			Children: map[string]any{},
		},
	},
	{
		Name:       "data-semantic-governance",
		Parent:     "semantic-governance",
		OrderIndex: 4550,
		App: studio_web.App{
			TextZHCN:      "数据语义治理",
			TextZHTW:      "數據語義治理",
			TextENUS:      "Data Semantic Governance",
			Icon:          "//ip:port/anyfabric/semantic.svg",
			Type:          "directory",
			IsDefaultOpen: true,
		},
		SubApp: studio_web.SubApp{
			Entry:      "//ip:port/anyfabric/semanticGovernance.html",
			ActiveRule: "/",
			BaseRouter: "",
		},
	},
}
