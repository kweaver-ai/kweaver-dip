package info_catalog

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"

type ExportInfoCatalogReq struct {
	CatalogIDs []string `json:"catalog_ids"  form:"catalog_ids" binding:"required,min=1"`
	models.ModelID
}

func toSensitive(t int32) string {
	switch t {
	case 1:
		return "敏感"
	case 0:
		return "非敏感"
	default:
		return ""
	}
}
func toSecret(t int32) string {
	switch t {
	case 1:
		return "涉密"
	case 0:
		return "非涉密"
	default:
		return ""
	}
}

func toBool(t int32) string {
	switch t {
	case 1:
		return "是"
	case 0:
		return "否"
	default:
		return ""
	}
}
