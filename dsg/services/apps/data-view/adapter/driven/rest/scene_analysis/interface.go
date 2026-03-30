package scene_analysis

import (
	"context"
)

type SceneAnalysisDriven interface {
	GetScene(ctx context.Context, id string) (sceneObjDetail *SceneObj, err error)
}

type SceneObj struct {
	SceneMeta
	SceneBody
}
type SceneMeta struct {
	Name string `json:"name" form:"name" binding:"required,VerifyName128NoSpace"`  // 场景名称
	Desc string `json:"desc" form:"desc" binding:"omitempty,VerifyDescription300"` // 场景描述
}

type SceneBody struct {
	ID     string `json:"id" form:"id" binding:"required,uuid"`                                                        // 场景ID
	Canvas string `json:"canvas" form:"canvas" binding:"required"`                                                     // 画布
	Image  string `json:"image" form:"image" binding:"omitempty" example:"data:image/png;base64,U3dhZ2dlciByb2Nrcw=="` // 画布图片数据，base64编码
	Config string `json:"config" form:"config" binding:"omitempty"`                                                    // 画布节点配置
}
