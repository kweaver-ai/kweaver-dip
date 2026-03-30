package impl

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
)

// -> model

// meta_v1.Metadata -> model.Metadata
func convert_AuthServiceV1_Metadata_Into_Model_Metadata(in *meta_v1.Metadata, out *model.Metadata) {
	// TODO: Return error
	out.ID = in.ID
	out.CreatedAt = in.CreatedAt.Time
	out.UpdatedAt = in.UpdatedAt.Time
	if in.DeletedAt != nil {
		out.DeletedAt = gorm.DeletedAt{
			Time:  in.DeletedAt.Time,
			Valid: true,
		}
	}
}

// meta_v1.Metadata -> model.Metadata
func convert_AuthServiceV1_Metadata_To_Model_Metadata(in *meta_v1.Metadata) (out *model.Metadata) {
	if in == nil {
		return
	}
	out = new(model.Metadata)
	convert_AuthServiceV1_Metadata_Into_Model_Metadata(in, out)
	return
}

// meta_v1.ListOptions -> model.ListOptions
func convert_MetaV1_ListOptions_Into_Model_ListOptions(in *meta_v1.ListOptions, out *model.ListOptions) {
	out.Limit = in.Limit
	out.Offset = (in.Offset - 1) * in.Limit
}

// meta_v1.ListOptions -> model.ListOptions
func convert_MetaV1_ListOptions_To_Model_ListOptions(in *meta_v1.ListOptions) (out *model.ListOptions) {
	if in == nil {
		return
	}
	out = new(model.ListOptions)
	convert_MetaV1_ListOptions_Into_Model_ListOptions(in, out)
	return
}

// auth_service_v1.IndicatorDimensionalRule -> model.IndicatorDimensionalRule
func convert_AuthServiceV1_IndicatorDimensionalRule_Into_Model_IndicatorDimensionalRule(in *auth_service_v1.IndicatorDimensionalRule, out *model.IndicatorDimensionalRule) {
	convert_AuthServiceV1_Metadata_Into_Model_Metadata(&in.Metadata, &out.Metadata)
	convert_AuthServiceV1_IndicatorDimensionalRuleSpec_Into_Model_IndicatorDimensionalRuleSpec(&in.Spec, &out.Spec)
}

// auth_service_v1.IndicatorDimensionalRule -> model.IndicatorDimensionalRule
func convert_AuthServiceV1_IndicatorDimensionalRule_To_Model_IndicatorDimensionalRule(in *auth_service_v1.IndicatorDimensionalRule) (out *model.IndicatorDimensionalRule) {
	if in == nil {
		return
	}
	out = new(model.IndicatorDimensionalRule)
	convert_AuthServiceV1_IndicatorDimensionalRule_Into_Model_IndicatorDimensionalRule(in, out)
	return
}

// auth_service_v1.IndicatorDimensionalRuleSpec -> model.IndicatorDimensionalRuleSpec
func convert_AuthServiceV1_IndicatorDimensionalRuleSpec_Into_Model_IndicatorDimensionalRuleSpec(in *auth_service_v1.IndicatorDimensionalRuleSpec, out *model.IndicatorDimensionalRuleSpec) {
	out.Name = in.Name
	out.IndicatorID = in.IndicatorID
	out.AuthScopeID = in.AuthScopeID
	out.ScopeFields, _ = json.Marshal(in.ScopeFields)
	out.Fields = convert_AuthServiceV1_Fields_To_Model_IndicatorDimensionalRuleFieldSpecs(in.Fields)
	out.RowFilters, _ = json.Marshal(in.RowFilters)
	out.FixedRowFilters, _ = json.Marshal(in.FixedRowFilters)
}

// auth_service_v1.IndicatorDimensionalRuleSpec -> model.IndicatorDimensionalRuleSpec
func convert_AuthServiceV1_IndicatorDimensionalRuleSpec_To_Model_IndicatorDimensionalRuleSpec(in *auth_service_v1.IndicatorDimensionalRuleSpec) (out *model.IndicatorDimensionalRuleSpec) {
	if in == nil {
		return
	}
	out = new(model.IndicatorDimensionalRuleSpec)
	convert_AuthServiceV1_IndicatorDimensionalRuleSpec_Into_Model_IndicatorDimensionalRuleSpec(in, out)
	return
}

// auth_service_v1.Field -> model.IndicatorDimensionalRuleFieldSpec
func convert_AuthServiceV1_Field_Into_Model_IndicatorDimensionalRuleFieldSpec(in *auth_service_v1.Field, out *model.IndicatorDimensionalRuleFieldSpec) {
	// TODO: Return error
	out.FieldID = in.ID
	out.Name = in.Name
	out.NameEn = in.NameEn
	out.DataType = in.DataType
}

// auth_service_v1.Field -> model.IndicatorDimensionalRuleFieldSpec
func convert_AuthServiceV1_Field_To_Model_IndicatorDimensionalRuleFieldSpec(in *auth_service_v1.Field) (out *model.IndicatorDimensionalRuleFieldSpec) {
	if in == nil {
		return
	}
	out = new(model.IndicatorDimensionalRuleFieldSpec)
	convert_AuthServiceV1_Field_Into_Model_IndicatorDimensionalRuleFieldSpec(in, out)
	return
}

// auth_service_v1.Field -> model.IndicatorDimensionalRuleFieldSpec
func convert_AuthServiceV1_Fields_To_Model_IndicatorDimensionalRuleFieldSpecs(in []auth_service_v1.Field) (out []model.IndicatorDimensionalRuleFieldSpec) {
	if in == nil {
		return
	}
	out = make([]model.IndicatorDimensionalRuleFieldSpec, len(in))
	for i := range in {
		convert_AuthServiceV1_Field_Into_Model_IndicatorDimensionalRuleFieldSpec(&in[i], &out[i])
	}
	return
}

// auth_service_v1.IndicatorDimensionalRuleListOptions -> model.IndicatorDimensionalRuleListOptions
func convert_AuthServiceV1_IndicatorDimensionalRuleListOptions_Into_Model_IndicatorDimensionalRuleListOptions(in *auth_service_v1.IndicatorDimensionalRuleListOptions, out *model.IndicatorDimensionalRuleListOptions) {
	convert_MetaV1_ListOptions_Into_Model_ListOptions(&in.ListOptions, &out.ListOptions)
	out.IndicatorID = in.IndicatorID
}

// auth_service_v1.IndicatorDimensionalRuleListOptions -> model.IndicatorDimensionalRuleListOptions
func convert_AuthServiceV1_IndicatorDimensionalRuleListOptions_To_Model_IndicatorDimensionalRuleListOptions(in *auth_service_v1.IndicatorDimensionalRuleListOptions) (out *model.IndicatorDimensionalRuleListOptions) {
	if in == nil {
		return
	}
	out = new(model.IndicatorDimensionalRuleListOptions)
	convert_AuthServiceV1_IndicatorDimensionalRuleListOptions_Into_Model_IndicatorDimensionalRuleListOptions(in, out)
	return
}

// model ->

// model.Metadata -> meta_v1.Metadata
func convert_Model_Metadata_Into_MetaV1_Metadata(in *model.Metadata, out *meta_v1.Metadata) {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	if in.DeletedAt.Valid {
		out.DeletedAt = ptr.To(meta_v1.NewTime(in.DeletedAt.Time))
	}
}

// model.Metadata -> meta_v1.Metadata
func convert_Model_Metadata_To_MetaV1_Metadata(in *model.Metadata) (out *meta_v1.Metadata) {
	if in == nil {
		return
	}
	out = new(meta_v1.Metadata)
	convert_Model_Metadata_Into_MetaV1_Metadata(in, out)
	return
}

// model.ListOptions -> meta_v1.ListOptions
func convert_Model_ListOptions_Into_MetaV1_ListOptions(in *model.ListOptions, out *meta_v1.ListOptions) {
	out.Limit = in.Limit
	out.Offset = in.Offset/in.Limit + 1
}

// meta_v1.ListOptions -> model.ListOptions
func convert_Model_ListOptions_To_MetaV1_ListOptions(in *model.ListOptions) (out *meta_v1.ListOptions) {
	if in == nil {
		return
	}
	out = new(meta_v1.ListOptions)
	convert_Model_ListOptions_Into_MetaV1_ListOptions(in, out)
	return
}

// model.IndicatorDimensionalRule -> auth_service_v1.IndicatorDimensionalRule
func convert_Model_IndicatorDimensionalRule_Into_AuthServiceV1_IndicatorDimensionalRule(in *model.IndicatorDimensionalRule, out *auth_service_v1.IndicatorDimensionalRule) {
	convert_Model_Metadata_Into_MetaV1_Metadata(&in.Metadata, &out.Metadata)
	convert_Model_IndicatorDimensionalRuleSpec_Into_AuthServiceV1_IndicatorDimensionalRuleSpec(&in.Spec, &out.Spec)
}

// model.IndicatorDimensionalRule -> auth_service_v1.IndicatorDimensionalRule
func convert_Model_IndicatorDimensionalRule_To_AuthServiceV1_IndicatorDimensionalRule(in *model.IndicatorDimensionalRule) (out *auth_service_v1.IndicatorDimensionalRule) {
	if in == nil {
		return
	}
	out = new(auth_service_v1.IndicatorDimensionalRule)
	convert_Model_IndicatorDimensionalRule_Into_AuthServiceV1_IndicatorDimensionalRule(in, out)
	return
}

// model.IndicatorDimensionalRuleSpec -> auth_service_v1.IndicatorDimensionalRuleSpec
func convert_Model_IndicatorDimensionalRuleSpec_Into_AuthServiceV1_IndicatorDimensionalRuleSpec(in *model.IndicatorDimensionalRuleSpec, out *auth_service_v1.IndicatorDimensionalRuleSpec) {
	out.IndicatorID = in.IndicatorID
	out.AuthScopeID = in.AuthScopeID
	convert_Model_IndicatorDimensionalRuleSpec_Into_AuthServiceV1_Rule(in, &out.Rule)
}

// model.IndicatorDimensionalRuleSpec -> auth_service_v1.IndicatorDimensionalRuleSpec
func convert_Model_IndicatorDimensionalRuleSpec_To_AuthServiceV1_IndicatorDimensionalRuleSpec(in *model.IndicatorDimensionalRuleSpec) (out *auth_service_v1.IndicatorDimensionalRuleSpec) {
	if in == nil {
		return
	}
	out = new(auth_service_v1.IndicatorDimensionalRuleSpec)
	convert_Model_IndicatorDimensionalRuleSpec_Into_AuthServiceV1_IndicatorDimensionalRuleSpec(in, out)
	return
}

// model.IndicatorDimensionalRuleSpec -> auth_service_v1.Rule
func convert_Model_IndicatorDimensionalRuleSpec_Into_AuthServiceV1_Rule(in *model.IndicatorDimensionalRuleSpec, out *auth_service_v1.Rule) {
	out.Name = in.Name
	out.Fields = convert_Model_IndicatorDimensionalRuleFieldSpecs_To_AuthServiceV1_Fields(in.Fields)
	json.Unmarshal(in.RowFilters, &out.RowFilters)
	json.Unmarshal(in.FixedRowFilters, &out.FixedRowFilters)
	json.Unmarshal(in.ScopeFields, &out.ScopeFields)
}

// model.IndicatorDimensionalRuleSpec -> auth_service_v1.Rule
func convert_Model_IndicatorDimensionalRuleSpec_To_AuthServiceV1_Rule(in *model.IndicatorDimensionalRuleSpec) (out *auth_service_v1.Rule) {
	if in == nil {
		return
	}
	out = new(auth_service_v1.Rule)
	convert_Model_IndicatorDimensionalRuleSpec_Into_AuthServiceV1_Rule(in, out)
	return
}

// model.IndicatorDimensionalRuleFieldSpec -> auth_service_v1.Field
func convert_Model_IndicatorDimensionalRuleFieldSpec_Into_AuthServiceV1_Field(in *model.IndicatorDimensionalRuleFieldSpec, out *auth_service_v1.Field) {
	out.ID = in.FieldID
	out.Name = in.Name
	out.NameEn = in.NameEn
	out.DataType = in.DataType
}

// model.IndicatorDimensionalRuleFieldSpec -> auth_service_v1.Field
func convert_Model_IndicatorDimensionalRuleFieldSpecs_To_AuthServiceV1_Fields(in []model.IndicatorDimensionalRuleFieldSpec) (out []auth_service_v1.Field) {
	if in == nil {
		return
	}
	out = make([]auth_service_v1.Field, len(in))
	for i := range in {
		convert_Model_IndicatorDimensionalRuleFieldSpec_Into_AuthServiceV1_Field(&in[i], &out[i])
	}
	return out
}

// model.IndicatorDimensionalRuleList -> auth_service_v1.IndicatorDimensionalRuleList
func convert_Model_IndicatorDimensionalRuleList_Into_AuthService_IndicatorDimensionalRuleList(in *model.IndicatorDimensionalRuleList, out *auth_service_v1.IndicatorDimensionalRuleList) {
	out.Entries = make([]auth_service_v1.IndicatorDimensionalRule, len(in.Entries))
	for i := range in.Entries {
		convert_Model_IndicatorDimensionalRule_Into_AuthServiceV1_IndicatorDimensionalRule(&in.Entries[i], &out.Entries[i])
	}
	out.TotalCount = int(in.TotalCount)
}

// model.IndicatorDimensionalRuleList -> auth_service_v1.IndicatorDimensionalRuleList
func convert_Model_IndicatorDimensionalRuleList_To_AuthService_IndicatorDimensionalRuleList(in *model.IndicatorDimensionalRuleList) (out *auth_service_v1.IndicatorDimensionalRuleList) {
	if in == nil {
		return nil
	}
	out = new(auth_service_v1.IndicatorDimensionalRuleList)
	convert_Model_IndicatorDimensionalRuleList_Into_AuthService_IndicatorDimensionalRuleList(in, out)
	return
}

func convert_Pointer_meta_v1_Time_To_String(in **meta_v1.Time, out *string) error {
	if *in == nil {
		*out = "nil"
	} else {
		*out = (*in).Format(time.RFC3339)
	}
	return nil
}

func convert_String_To_Pointer_meta_v1_Time(in *string, out **meta_v1.Time) error {
	if (*in) == "nil" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, *in)
	if err != nil {
		return err
	}
	tt := meta_v1.NewTime(t)
	*out = &tt
	return nil
}
