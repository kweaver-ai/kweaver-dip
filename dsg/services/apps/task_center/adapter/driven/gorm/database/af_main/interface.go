package af_main

import "context"

type AFMainInterface interface {
	// 逻辑视图
	FormViews() FormViewInterface
}

type FormViewInterface interface {
	Get(ctx context.Context, id string) (*FormView, error)
}

type FormView struct {
	ID            string `json:"id,omitempty"`
	TechnicalName string `json:"technical_name,omitempty"`
	OriginalName  string `json:"original_name,omitempty"`
	BusinessName  string `json:"business_name,omitempty"`
	DatasourceID  string `json:"datasource_id,omitempty"`
	DepartmentID  string `json:"department_id,omitempty"`
	ExploreJobID  string `json:"explore_job_id,omitempty"`
}
