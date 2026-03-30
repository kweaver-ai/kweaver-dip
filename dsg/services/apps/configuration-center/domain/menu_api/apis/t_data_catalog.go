package apis

func init() {
	Append(&MenuResource{
		Path:        "/api/data-catalog/v1/data-catalog/feedback",
		ServiceName: "data-catalog",
		Method:      "POST",
		Desc:        "目录意见反馈",
	})
}
