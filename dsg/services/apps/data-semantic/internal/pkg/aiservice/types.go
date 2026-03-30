// Package aiservice provides AI service client integration
package aiservice

// RequestType defines the type of AI service request
type RequestType string

const (
	// RequestTypeFullUnderstanding for full field understanding
	RequestTypeFullUnderstanding RequestType = "full_understanding"
	// RequestTypePartialUnderstanding for partial field understanding
	RequestTypePartialUnderstanding RequestType = "partial_understanding"
	// RequestTypeRegenerateBusinessObjects for regenerating business objects
	RequestTypeRegenerateBusinessObjects RequestType = "regenerate_business_objects"
)

// AIServiceResponse represents the response from AI service
type AIServiceResponse struct {
	TaskID    string `json:"task_id"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	MessageID string `json:"message_id"`
}

// FormView represents the form view data sent to AI service
type FormView struct {
	ID               string          `json:"form_view_id"`
	TechnicalName    string          `json:"form_view_technical_name"`
	BusinessName     string          `json:"form_view_business_name"`
	Description      string          `json:"form_view_desc"`
	Fields           []FormViewField `json:"form_view_fields"`
}

// FormViewField represents a field in the form view
type FormViewField struct {
	ID            string `json:"form_view_field_id"`
	TechnicalName string `json:"form_view_field_technical_name"`
	BusinessName  string `json:"form_view_field_business_name"`
	Type          string `json:"form_view_field_type"`
	Role          string `json:"form_view_field_role"`
	Description   string `json:"form_view_field_desc"`
	Comment       string `json:"form_view_field_comment"`
}

// ClientInterface AI 服务客户端接口
type ClientInterface interface {
	Call(requestType RequestType, messageID string, formView *FormView, token string) (*AIServiceResponse, error)
}
