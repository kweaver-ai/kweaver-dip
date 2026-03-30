package configuration_center

type ObjectInfo struct {
	ID         string `json:"id" example:"对象id"`
	Name       string `json:"name" example:"对象名称"`
	Path       string `json:"path" example:"对象路径"`
	PathID     string `json:"path_id" example:"对象路径id"`
	Type       string `json:"type" example:"对象类型"`
	Attributes any    ` json:"attributes" example:"对象属性"`
}
type ObjectIDReqParam struct {
	IDS  []string `json:"ids" form:"ids" binding:"required,gt=0,unique,dive,uuid"`
	Type string   `json:"type" form:"type" binding:"required,oneof=business_system business_matters"`
}

type QueryParam struct {
	ObjectID  string `json:"object_id" form:"object_id" binding:"omitempty,uuid"`                       // 对象id
	Offset    uint64 `json:"offset" form:"offset,default=1" binding:"min=1"`                            // 页码
	Limit     uint64 `json:"limit" form:"limit,default=10" binding:"min=1"`                             // 每页大小
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"`          // 排序方向
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at"` // 排序类型
	Keyword   string `json:"keyword" form:"keyword" `                                                   // do not verify keyword
	IsAll     bool   `json:"is_all" form:"is_all,default=true" binding:"omitempty"`                     // 是否获取全部对象，默认true(获取全部对象)
	Type      string `json:"type" form:"type" binding:"omitempty"`                                      // 对象类型
	Names     string `json:"names"  form:"names"  binding:"omitempty"`                                  //多个对象名字的精确查找
}

type SummaryInfo struct {
	ID   string `json:"id" `  // 对象ID
	Name string `json:"name"` // 对象名称
	Type string `json:"type"` // 对象类型
	Path string `json:"path"` // 对象路径
}

type QueryPageReapParam struct {
	Entries    []*SummaryInfo `json:"entries"`     // 对象列表
	TotalCount int64          `json:"total_count"` // 当前筛选条件下的对象数量
}

type CheckRepeatResp struct {
	Name   string `json:"name"  example:"name"`   // 被检测的资源名称
	Repeat bool   `json:"repeat" example:"false"` // 是否重复
}

type ObjectInfoResp struct {
	ID     string `json:"id" `     // 对象ID
	Name   string `json:"name"`    // 对象名称
	Path   string `json:"path"`    // 对象路径
	PathID string `json:"path_id"` // 对象路径id
}

//var client = trace.NewOtelHttpClient()

//func GetRemoteObjectInfo(ctx context.Context, objectID string, token string) (*ObjectInfo, error) {
//	newCtx, span := ar_trace.Tracer.Start(ctx, "Configuration_ceter GetRemoteObjectInfo")
//	defer span.End()
//	ccaddr := constant.ConfigurationCenterUrl //127.0.0.1:8133
//	//http://127.0.0.1:8133/api/configuration-center/v1/objects/0597fec6-0145-4b10-97a9-7b927a3a48b8
//	urlStr := "http://%s/api/configuration-center/v1/objects/%s"
//	urlStr = fmt.Sprintf(urlStr, ccaddr, objectID)
//	request, _ := http.NewRequest("GET", urlStr, nil)
//	span.AddEvent("Request.Header set Authorization")
//	request.Header.Set("Authorization", token)
//	// client := &http.Client{}
//	resp, err := client.Do(request.WithContext(newCtx))
//	//resp, err := http.Get(urlStr)
//
//	if err != nil {
//		log.WithContext(ctx).Error(err.Error())
//		return nil, errorcode.Desc(errorcode.ModelConfigurationCenterUrlError)
//	}
//	// 可能 404 NotFound
//	// resp.StatusCode != http.StatusOK
//
//	// 延时关闭
//	defer resp.Body.Close()
//
//	// 返回的结果resp.Body
//	body, err := io.ReadAll(resp.Body)
//	if resp.StatusCode != http.StatusOK {
//		if resp.StatusCode == http.StatusNotFound {
//			return nil, errorcode.Desc(errorcode.ModelConfigurationCenterUrlError)
//		} else {
//			return new(ObjectInfo), errorcode.Desc(errorcode.ModelDepartmentNotFound)
//		}
//	}
//
//	if err != nil {
//		log.WithContext(ctx).Error(err.Error())
//		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
//	}
//
//	res := new(ObjectInfo)
//	// 把请求到的数据Unmarshal到res中
//	err = json.Unmarshal(body, res)
//	//if err != nil {
//	//	log.WithContext(ctx).Error(err.Error())
//	//	return nil, errorcode.Detail(errorcode.ModelDatabaseError, err.Error())
//	//}
//
//	return res, nil
//}

//func GetRemoteObjects(ctx context.Context, q QueryParam, token string) (*QueryPageReapParam, error) {
//	newCtx, span := ar_trace.Tracer.Start(ctx, "Configuration_ceter GetRemoteObjects")
//	defer span.End()
//	ccaddr := constant.ConfigurationCenterUrl //127.0.0.1:8133
//	//http://127.0.0.1:8133/api/configuration-center/v1/objects
//	urlStr := "http://%s/api/configuration-center/v1/objects"
//	urlStr = fmt.Sprintf(urlStr, ccaddr)
//	limit := fmt.Sprintf("%d", q.Limit)
//	offset := fmt.Sprintf("%d", q.Offset)
//	isAll := fmt.Sprintf("%t", q.IsAll)
//	objectType := fmt.Sprintf("%s", q.Time)
//	query := map[string]string{
//		"id":        q.ObjectID,
//		"limit":     limit,
//		"offset":    offset,
//		"is_all":    isAll,
//		"keyword":   q.Keyword,
//		"type":      objectType,
//		"sort":      q.Sort,
//		"direction": q.Direction,
//		"names":     q.Names,
//	}
//
//	params := make([]string, 0, len(query))
//	for k, v := range query {
//		params = append(params, k+"="+v)
//	}
//	if len(params) > 0 {
//		urlStr = urlStr + "?" + strings.Join(params, "&")
//	}
//
//	request, _ := http.NewRequest("GET", urlStr, nil)
//	span.AddEvent("Request.Header set Authorization")
//	request.Header.Set("Authorization", token)
//	// client := &http.Client{}
//	resp, err := client.Do(request.WithContext(newCtx))
//	//resp, err := http.Get(urlStr)
//
//	if err != nil {
//		log.WithContext(ctx).Error(err.Error())
//		return nil, errorcode.Desc(errorcode.ModelConfigurationCenterUrlError)
//	}
//	// 可能 404 NotFound
//	// resp.StatusCode != http.StatusOK
//
//	// 延时关闭
//	defer resp.Body.Close()
//
//	// 返回的结果resp.Body
//	body, err := io.ReadAll(resp.Body)
//	if resp.StatusCode != http.StatusOK {
//		if resp.StatusCode == http.StatusNotFound {
//			return nil, errorcode.Desc(errorcode.ModelConfigurationCenterUrlError)
//		} else {
//			return new(QueryPageReapParam), errorcode.Desc(errorcode.ModelDepartmentNotFound)
//		}
//	}
//
//	if err != nil {
//		log.WithContext(ctx).Error(err.Error())
//		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
//	}
//
//	res := new(QueryPageReapParam)
//	// 把请求到的数据Unmarshal到res中
//	err = json.Unmarshal(body, res)
//	//if err != nil {
//	//	log.WithContext(ctx).Error(err.Error())
//	//	return nil, errorcode.Detail(errorcode.ModelDatabaseError, err.Error())
//	//}
//
//	return res, nil
//}

//func GetRemoteObjectName(ctx context.Context, ids []string, objectType string, token string) ([]ObjectInfoResp, error) {
//	newCtx, span := ar_trace.Tracer.Start(ctx, "Configuration_ceter GetRemoteObjectName")
//	defer span.End()
//	ccaddr := constant.ConfigurationCenterUrl //127.0.0.1:8133
//	//http://127.0.0.1:8133/api/configuration-center/v1/objects/0597fec6-0145-4b10-97a9-7b927a3a48b8
//	urlStr := "http://%s/api/configuration-center/v1/objects/names"
//	urlStr = fmt.Sprintf(urlStr, ccaddr)
//	var reqBody io.Reader
//	b, err := json.Marshal(&ObjectIDReqParam{
//		IDS:  ids,
//		Time: objectType,
//	})
//	if err != nil {
//		log.WithContext(ctx).Error(err.Error())
//		return nil, errorcode.Desc(errorcode.ModelJsonMarshalError)
//	}
//	reqBody = bytes.NewReader(b)
//
//	request, _ := http.NewRequest(http.MethodGet, urlStr, reqBody)
//	span.AddEvent("Request.Header set Authorization")
//	request.Header.Set("Authorization", token)
//	// client := &http.Client{}
//	resp, err := client.Do(request.WithContext(newCtx))
//	if err != nil {
//		log.WithContext(ctx).Error(err.Error())
//		return nil, errorcode.Desc(errorcode.ModelConfigurationCenterUrlError)
//	}
//
//	// 可能 404 NotFound
//	// resp.StatusCode != http.StatusOK
//
//	// 延时关闭
//	defer resp.Body.Close()
//
//	// 返回的结果resp.Body
//	body, err := io.ReadAll(resp.Body)
//
//	if resp.StatusCode != http.StatusOK {
//		if resp.StatusCode == http.StatusNotFound {
//			return nil, errorcode.Desc(errorcode.ModelConfigurationCenterUrlError)
//		} else {
//			return nil, errorcode.Desc(errorcode.ModelMainBusinessNotFound)
//		}
//	}
//	if err != nil {
//		log.WithContext(ctx).Error(err.Error())
//		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
//	}
//
//	var res []ObjectInfoResp
//	err = json.Unmarshal(body, &res)
//	if err != nil {
//		log.WithContext(ctx).Error(err.Error())
//		return nil, errorcode.Desc(errorcode.ModelJsonUnMarshalError)
//	}
//	return res, nil
//}

//func CheckRemoteObjectRepeat(ctx context.Context, id, name, checkType string, token string) (bool, error) {
//	newCtx, span := ar_trace.Tracer.Start(ctx, "CheckRemoteObjectRepeat")
//	defer span.End()
//	ccaddr := constant.ConfigurationCenterUrl //127.0.0.1:8133
//	//http://127.0.0.1:8133/api/configuration-center/v1/objects/check
//	urlStr := "http://%s/api/configuration-center/v1/objects/check?id=%s&name=%s&check_type=%s&object_type=%s"
//	urlStr = fmt.Sprintf(urlStr, ccaddr, id, name, checkType, constant.ObjectTypeStringMainBusiness)
//	log.WithContext(ctx).Info("CheckRemoteObjectRepeat", zap.Any("url", urlStr))
//	request, _ := http.NewRequest("GET", urlStr, nil)
//	span.AddEvent("Request.Header set Authorization")
//	request.Header.Set("Authorization", token)
//	// client := &http.Client{}
//	resp, err := client.Do(request.WithContext(newCtx))
//	//resp, err := http.Get(urlStr)
//
//	if err != nil {
//		log.WithContext(ctx).Error("CheckRemoteObjectRepeat", zap.Error(err))
//		return false, errorcode.Desc(errorcode.ModelConfigurationCenterUrlError)
//	}
//	// 可能 404 NotFound
//	// resp.StatusCode != http.StatusOK
//
//	// 延时关闭
//	defer resp.Body.Close()
//
//	// 返回的结果resp.Body
//	body, err := io.ReadAll(resp.Body)
//	if resp.StatusCode != http.StatusOK {
//		log.WithContext(ctx).Error("CheckRemoteObjectRepeat read body", zap.Error(err))
//		if resp.StatusCode == http.StatusNotFound {
//			return false, errorcode.Desc(errorcode.ModelConfigurationCenterUrlError)
//		} else if resp.StatusCode == http.StatusBadRequest {
//			res := new(ginx.HttpError)
//			err = json.Unmarshal(body, res)
//			if err != nil {
//				log.WithContext(ctx).Error(err.Error())
//				return false, errorcode.Desc(errorcode.ModelJsonUnMarshalError)
//			}
//			if res.Code == "ConfigurationCenter.BusinessStructure.ObjectNotFound" {
//				if checkType == "create" {
//					return false, errorcode.Desc(errorcode.ModelDepartmentNotFound)
//				} else {
//					return false, errorcode.Desc(errorcode.ModelMainBusinessNotFound)
//				}
//			} else if res.Code == "ConfigurationCenter.BusinessStructure.ObjectNameRepeat" {
//				return true, errorcode.Desc(errorcode.ModelObjectNameAlreadyExist)
//			} else {
//				return false, errorcode.Desc(errorcode.ModelCCUrlError)
//			}
//		}
//	}
//
//	if err != nil {
//		log.WithContext(ctx).Error(err.Error())
//		return false, errorcode.Detail(errorcode.PublicInternalError, err.Error())
//	}
//
//	res := new(CheckRepeatResp)
//	// 把请求到的数据Unmarshal到res中
//	err = json.Unmarshal(body, res)
//	if err != nil {
//		log.WithContext(ctx).Error(err.Error())
//		return false, errorcode.Desc(errorcode.ModelJsonUnMarshalError)
//	}
//
//	return res.Repeat, nil
//}
