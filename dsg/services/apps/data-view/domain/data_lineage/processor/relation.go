package processor

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

type FormulaType enum.Object

var (
	FormulaTypeDistinct   = enum.New[FormulaType](1, "distinct", "去重")
	FormulaTypeForm       = enum.New[FormulaType](2, "form", "引用")
	FormulaTypeJoin       = enum.New[FormulaType](3, "join", "关联")
	FormulaTypeMerge      = enum.New[FormulaType](4, "merge", "合并")
	FormulaTypeSelect     = enum.New[FormulaType](5, "select", "选择")
	FormulaTypeSQL        = enum.New[FormulaType](6, "sql", "SQL")
	FormulaTypeWhere      = enum.New[FormulaType](7, "where", "过滤")
	FormulaTypeOutputView = enum.New[FormulaType](8, "output_view", "输出")
)

type SceneNode struct {
	Id           string        `json:"id"`
	Name         string        `json:"name"`          //节点名称
	Src          []string      `json:"src"`           //来源Node
	Formula      []FormulaNode `json:"formula"`       //算子
	OutputFields []OutputField `json:"output_fields"` //输出字段
}

type Expression struct {
	Ref  []string `json:"ref"`
	Expr []string `json:"expr"`
}

type OutputField struct {
	DataType   string `json:"data_type"`
	NameEn     string `json:"name_en"`
	Id         string `json:"id"`
	SourceId   string `json:"sourceId"`
	Name       string `json:"name"`
	OutId      string `json:"outId,omitempty"`
	OriginName string `json:"originName"`
}

func (f FormViewInfoFetcher) QueryViewSourceFields(ctx context.Context, sid string) (map[string]*Expression, error) {
	pool, ok := f.poolDict[sid]
	if ok {
		data := pool.Get()
		dict, isDict := data.(map[string]*Expression)
		if isDict {
			return dict, nil
		}
	}
	pool = newPool()
	f.poolDict[sid] = pool

	newData, err := f.queryViewSourceFields(ctx, sid)
	if err != nil {
		return nil, err
	}
	pool.Put(newData)
	return newData, nil
}

func (f FormViewInfoFetcher) queryViewSourceFields(ctx context.Context, sid string) (map[string]*Expression, error) {
	sceneInfo, err := f.sa.GetScene(ctx, sid)
	if err != nil {
		log.Warnf("query scene info error:%v", err)
		return nil, err
	}
	nodes := make([]*SceneNode, 0)
	if err := json.Unmarshal([]byte(sceneInfo.Config), &nodes); err != nil {
		log.Warnf("unmarshal json string error %v", err)
		return nil, fmt.Errorf("unmarshal json string error %v", err)
	}
	var startNode *SceneNode
	var fields []OutputField
	for _, node := range nodes {
		for _, formula := range node.Formula {
			if formula.Type == FormulaTypeOutputView.String {
				fields = node.OutputFields
				startNode = node
				break
			}
		}
	}
	if startNode == nil {
		return nil, fmt.Errorf("invalid data_view scene %v", sid)
	}
	nTree := NewNodeTree(nodes, startNode)
	results := make(map[string]*Expression)
	for _, field := range fields {
		ref, expr := nTree.FindSourceFields(field.Id)
		results[field.OutId] = &Expression{
			Expr: expr,
			Ref:  ref,
		}
	}
	return results, nil
}

type NodeTree struct {
	lastNode *SceneNode
	nodeDict map[string]*SceneNode
}

func NewNodeTree(ns []*SceneNode, lastNode *SceneNode) *NodeTree {
	return &NodeTree{
		lastNode: lastNode,
		nodeDict: lo.SliceToMap(ns, func(item *SceneNode) (string, *SceneNode) {
			return item.Id, item
		}),
	}
}

func (n *NodeTree) FindSourceFields(fieldID string) ([]string, []string) {
	ref, expr := n.recurse(fieldID, n.lastNode)
	reverseArray(expr)
	return lo.Uniq(ref), expr
}

func (n *NodeTree) recurse(id string, node *SceneNode) ([]string, []string) {
	ex := &Expression{}
	for i := len(node.Formula) - 1; i >= 0; i-- {
		formula := node.Formula[i]

		ref, expr := formula.Express(id)
		//如果是引用算子或者合并算子，那就是该节点的源头了
		if i == 0 && len(ref) > 0 {
			ex.Ref = append(ex.Ref, ref...)
		}
		if expr != "" {
			ex.Expr = append(ex.Expr, expr)
		}
	}
	//变成一个
	if len(ex.Expr) > 0 {
		ex.Expr = []string{expression(ex.Expr)}
	}
	if len(node.Src) <= 0 {
		return ex.Ref, ex.Expr
	}
	resultEx := new(Expression)
	resultEx.Expr = append(resultEx.Expr, ex.Expr...)
	for _, preNodeID := range node.Src {
		preNode, ok := n.nodeDict[preNodeID]
		if !ok {
			continue
		}
		for _, fid := range ex.Ref {
			pref, pexpr := n.recurse(fid, preNode)
			if len(pref) > 0 {
				resultEx.Ref = append(resultEx.Ref, pref...)
			}
			if len(pexpr) > 0 {
				resultEx.Expr = append(resultEx.Expr, pexpr...)
			}
		}
	}
	return resultEx.Ref, resultEx.Expr
}

func expression(ex []string) string {
	reverseArray(ex)
	return fmt.Sprintf("(%s)", strings.Join(ex, ","))
}

func reverseArray(arr []string) {
	length := len(arr)
	for i := 0; i < length/2; i++ {
		arr[i], arr[length-1-i] = arr[length-1-i], arr[i]
	}
}
