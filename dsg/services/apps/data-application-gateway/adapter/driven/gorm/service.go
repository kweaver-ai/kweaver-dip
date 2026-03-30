package gorm

import (
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"sync/atomic"
	"time"

	"github.com/blastrain/vitess-sqlparser/sqlparser"
	"github.com/hashicorp/golang-lru/v2/expirable"
	"github.com/spf13/cast"
	"github.com/valyala/fasttemplate"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type ServiceRepo interface {
	ServiceGet(ctx context.Context, servicePath string) (res *model.ServiceAssociations, err error)
	GetSubServices(ctx context.Context, serviceID string) (subServices []*model.SubService, err error)
	ServiceGetFields(ctx context.Context, httpMethod string, servicePath string, fields []string) (service *model.Service, err error)
	IsServicePathExist(ctx context.Context, servicePath, serviceID string) (exist bool, err error)
	WizardModelScript(ctx context.Context, params map[string]*dto.Param, catalogName, schemaName, tableName, subServiceRule string, serviceParams []model.ServiceParam, isCount bool) (s string, err error)
	ScriptModelScript(ctx context.Context, params map[string]*dto.Param, catalogName, schemaName, script, subServiceRule string, serviceParams []model.ServiceParam, isCount bool) (s string, err error)
}

var (
	cacheSize = 1 << 10
	cacheTTL  = 10 * time.Second
)

type serviceRepo struct {
	data *db.Data
	// model.ServiceAssociations 的缓存
	cache *expirable.LRU[string, *model.ServiceAssociations]

	hit, miss atomic.Int64
}

func NewServiceRepo(data *db.Data) ServiceRepo {
	repo := &serviceRepo{
		data:  data,
		cache: expirable.NewLRU[string, *model.ServiceAssociations](cacheSize, nil, cacheTTL),
	}
	go func() {
		for range time.Tick(10 * time.Second) {
			log.Debug("cache state", zap.Int64("hit", repo.hit.Load()), zap.Int64("miss", repo.miss.Load()))
		}
	}()
	return repo
}

func (r *serviceRepo) ServiceGet(ctx context.Context, servicePath string) (res *model.ServiceAssociations, err error) {
	if res, ok := r.cache.Get(servicePath); ok {
		r.hit.Add(1)
		return res, nil
	}
	r.miss.Add(1)

	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted()).
		Preload("ServiceDataSource", "delete_time = 0").
		Preload("ServiceParams", "delete_time = 0").
		Preload("ServiceResponseFilters", "delete_time = 0").
		Preload("ServiceScriptModel", "delete_time = 0").
		Preload("SubServices", "deleted_at = 0").
		Where(&model.Service{ServicePath: servicePath}).
		Find(&res)

	if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
		log.WithContext(ctx).Error("ServiceGet", zap.Error(errorcode.Desc(errorcode.ServicePathNotExist)))
		return nil, errorcode.Desc(errorcode.ServicePathNotExist)
	} else if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceGet", zap.Error(tx.Error))
		return nil, err
	}

	r.cache.Add(servicePath, res)

	return
}

func (r *serviceRepo) GetSubServices(ctx context.Context, serviceID string) (subServices []*model.SubService, err error) {
	if err = r.data.DB.WithContext(ctx).Where("service_id=? and deleted_at=0 ", serviceID).Find(&subServices).Error; err != nil {
		return nil, err
	}
	return subServices, nil
}

func (r *serviceRepo) ServiceGetFields(ctx context.Context, httpMethod, servicePath string, fields []string) (service *model.Service, err error) {
	service = &model.Service{}
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.Service{}).
		Select(fields).
		Where(&model.Service{ServicePath: servicePath, HTTPMethod: httpMethod}).
		Find(service)

	return service, tx.Error
}

func (r *serviceRepo) IsServicePathExist(ctx context.Context, servicePath, serviceID string) (exist bool, err error) {
	if servicePath == "" {
		return false, nil
	}
	var count int64
	tx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted()).Where(&model.Service{ServicePath: servicePath})

	if serviceID != "" {
		tx = tx.Where("service_id != ?", serviceID)
	}

	tx.Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("IsServicePathExist", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *serviceRepo) WizardModelScript(ctx context.Context, requestParams map[string]*dto.Param, catalogName, schemaName, tableName, subServiceRule string, serviceParams []model.ServiceParam, isCount bool) (script string, err error) {
	tx := r.data.DB.WithContext(ctx).Session(&gorm.Session{DryRun: true}).Table(tableName)
	if isCount {
		tx = tx.Select("count(*)")
	} else {
		var selects []string
		for _, p := range serviceParams {
			//sql字段名增加反引号
			quote := util.Quote(tx, p.EnName)
			switch p.ParamType {
			case "request":
				requestParam, ok := requestParams[p.EnName]
				if !ok {
					continue
				}
				if cast.ToString(requestParam.Value) == "" {
					continue
				}

				switch p.Operator {
				case "=":
					tx = tx.Where(fmt.Sprintf("%s = ${%s}", quote, p.EnName))
				case "!=":
					tx = tx.Where(fmt.Sprintf("%s != ${%s}", quote, p.EnName))
				case ">":
					tx = tx.Where(fmt.Sprintf("%s > ${%s}", quote, p.EnName))
				case ">=":
					tx = tx.Where(fmt.Sprintf("%s >= ${%s}", quote, p.EnName))
				case "<":
					tx = tx.Where(fmt.Sprintf("%s < ${%s}", quote, p.EnName))
				case "<=":
					tx = tx.Where(fmt.Sprintf("%s <= ${%s}", quote, p.EnName))
				case "like":
					tx = tx.Where(fmt.Sprintf("%s like ${%s}", quote, p.EnName))
				case "in":
					tx = tx.Where(fmt.Sprintf("%s in (${%s})", quote, p.EnName))
				case "not in":
					tx = tx.Where(fmt.Sprintf("%s not in (${%s})", quote, p.EnName))
				}

			case "response":
				if p.DataProtectionQuery {
					quote = fmt.Sprintf(`'*' AS %s`, quote)
				}
				selects = append(selects, quote)
				switch p.Sort {
				case "asc":
					tx = tx.Order(quote + " asc")
				case "desc":
					tx = tx.Order(quote + " desc")
				}
			}
		}
		tx = tx.Select(strings.Join(selects, ","))
	}

	tx.Find(nil)

	script = tx.Dialector.Explain(tx.Statement.SQL.String())
	script, err = r.ScriptModelScript(ctx, requestParams, catalogName, schemaName, script, subServiceRule, serviceParams, isCount)
	if err != nil {
		return "", err
	}

	return
}

// 检查是否时间字符串
func (r *serviceRepo) isTimeParam(value interface{}) bool {
	stringValue := cast.ToString(value)

	if _, err := time.Parse("2006-01-02 15:04:05", stringValue); err == nil {
		return true
	}

	if _, err := time.Parse("2006-01-02", stringValue); err == nil {
		return true
	}

	return false
}

func (r *serviceRepo) ScriptModelScript(ctx context.Context, params map[string]*dto.Param, catalogName, schemaName, script, subServiceRule string, serviceParams []model.ServiceParam, isCount bool) (s string, err error) {
	_, err = r.checkScript(ctx, script)
	if err != nil {
		return "", err
	}

	script, err = r.replaceParams(script, params, serviceParams)
	if err != nil {
		return "", err
	}

	script, err = r.addSchemaName(ctx, catalogName, schemaName, script)
	if err != nil {
		log.WithContext(ctx).Error("ScriptModelScript", zap.Error(err))
		return "", err
	}

	//时间型的字符串 拼接为 timestamp 'value'
	//select cjsj, fgjldshyj from "maria_daf11ee4b25245ec948fb611db87b421"."test"."xzcfjasp_jg" where cjsj = '@TIMESTAMP@2023-08-20'
	//select cjsj, fgjldshyj from "maria_daf11ee4b25245ec948fb611db87b421"."test"."xzcfjasp_jg" where cjsj = timestamp '2023-08-20'
	script = strings.ReplaceAll(script, "'@TIMESTAMP@", "timestamp '")
	if !isCount {
		script = r.addPaginate(ctx, script, params[dto.Offset].Value, params[dto.Limit].Value)
	}

	//将用户自定义的SQL拼接上
	if subServiceRule != "" {
		whereIndex := strings.Index(strings.ToLower(script), " where ")
		if whereIndex > 0 {
			script = fmt.Sprintf("%s where %s and %s", script[:whereIndex], subServiceRule, script[whereIndex+len(" where "):])
		} else {
			orderByIndex := strings.Index(strings.ToLower(script), " order by ")
			if orderByIndex > 0 {
				script = fmt.Sprintf("%s where %s %s", script[:orderByIndex], subServiceRule, script[orderByIndex:])
			} else {
				offsetIndex := strings.Index(strings.ToLower(script), " offset ")
				if offsetIndex > 0 {
					script = fmt.Sprintf("%s where %s %s", script[:offsetIndex], subServiceRule, script[offsetIndex:])
				} else {
					script = fmt.Sprintf("%s where %s ", script, subServiceRule)
				}
			}
		}
	}

	return script, nil
}

func (r *serviceRepo) checkScript(ctx context.Context, script string) (stmt sqlparser.Statement, err error) {
	if script == "" {
		return nil, nil
	}

	// ${xxx} 转换为 ? 否则语法检查会不通过
	t := fasttemplate.New(script, "${", "}")
	script = t.ExecuteFuncString(func(w io.Writer, tag string) (int, error) {
		return w.Write([]byte("?"))
	})

	// 语法解析检查
	stmt, err = sqlparser.Parse(script)
	if err != nil {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	sql := strings.ToLower(script)
	//排除 select *
	if strings.Contains(sql, "select*") || strings.Contains(sql, "select *") {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	//排除注释
	if strings.HasPrefix(sql, "#") || strings.HasPrefix(sql, "/*") {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	//排除 insert、update、delete
	_, ok := stmt.(*sqlparser.Insert)
	if ok {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}
	_, ok = stmt.(*sqlparser.Update)
	if ok {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}
	_, ok = stmt.(*sqlparser.Delete)
	if ok {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	_, ok = stmt.(*sqlparser.Select)
	if !ok {
		return nil, errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	return stmt, nil
}

func (r *serviceRepo) replaceParams(script string, params map[string]*dto.Param, serviceParams []model.ServiceParam) (string, error) {
	//用户配置的参数
	serviceParamsMap := make(map[string]model.ServiceParam)
	for _, param := range serviceParams {
		if param.ParamType == "request" {
			serviceParamsMap[param.EnName] = param
		}
	}

	t := fasttemplate.New(script, "${", "}")
	script, err := t.ExecuteFuncStringWithErr(func(w io.Writer, tag string) (int, error) {
		param, ok := params[tag]
		if !ok || cast.ToString(param.Value) == "" {
			var validErrors form_validator.ValidErrors
			validErrors = append(validErrors, &form_validator.ValidError{
				Key:     tag,
				Message: "请求参数 " + tag + " 为必填字段",
			})
			return 0, validErrors
		}

		if param.DataType == dto.ParamDataTypeString {
			//时间型的字符串 拼接为 timestamp 'value'
			isTime := r.isTimeParam(param.Value)
			if isTime == true {
				param.Value = fmt.Sprintf("'@TIMESTAMP@%s'", cast.ToString(param.Value))
			} else {
				p := serviceParamsMap[tag]
				// like 字符串 拼接为 '%value%'
				if p.Operator == "like" {
					param.Value = fmt.Sprintf("'%%%s%%'", cast.ToString(param.Value))
				} else {
					//普通的字符串 拼接为 'value'
					param.Value = fmt.Sprintf("'%s'", strings.Trim(cast.ToString(param.Value), "'"))
				}
			}
		}

		v := cast.ToString(param.Value)
		return w.Write([]byte(v))
	})

	return script, err
}

func (r *serviceRepo) addSchemaName(ctx context.Context, catalogName, schemaName, script string) (ss string, err error) {
	stmt, err := sqlparser.Parse(script)
	if err != nil {
		return "", err
	}

	//提取表名
	s := stmt.(*sqlparser.Select)
	for _, tableExpr := range s.From {
		switch tableExpr.(type) {
		case *sqlparser.AliasedTableExpr:
			aliasedTableExpr := tableExpr.(*sqlparser.AliasedTableExpr)
			table := aliasedTableExpr.Expr.(sqlparser.TableName).Name.String()
			aliasedTableExpr.Expr = r.newTableName(catalogName, schemaName, table)

		case *sqlparser.JoinTableExpr:
			joinTableExpr := tableExpr.(*sqlparser.JoinTableExpr)
			rightTable := joinTableExpr.RightExpr.(*sqlparser.AliasedTableExpr).Expr.(sqlparser.TableName).Name.String()
			leftTable := joinTableExpr.LeftExpr.(*sqlparser.AliasedTableExpr).Expr.(sqlparser.TableName).Name.String()

			joinTableExpr.RightExpr.(*sqlparser.AliasedTableExpr).Expr = r.newTableName(catalogName, schemaName, rightTable)
			joinTableExpr.LeftExpr.(*sqlparser.AliasedTableExpr).Expr = r.newTableName(catalogName, schemaName, leftTable)
		}
	}

	ss = sqlparser.String(stmt)
	ss = strings.ReplaceAll(ss, "`@@@", "\"")
	ss = strings.ReplaceAll(ss, "@@@`", "\"")
	ss = strings.ReplaceAll(ss, "@@@", "\"")
	return ss, nil
}

func (r *serviceRepo) addPaginate(ctx context.Context, script string, offset, limit interface{}) (s string) {
	o, l := PaginateCalculate(cast.ToInt(offset), cast.ToInt(limit))
	script = script + fmt.Sprintf(" offset %d limit %d", o, l)
	return script
}

func (r *serviceRepo) newTableName(catalogName, dataSchemaName, table string) sqlparser.TableName {
	return sqlparser.TableName{
		Name:      sqlparser.NewTableIdent(fmt.Sprintf("@@@%s@@@.@@@%s@@@.@@@%s@@@", catalogName, dataSchemaName, table)),
		Qualifier: sqlparser.NewTableIdent(""),
	}
}
