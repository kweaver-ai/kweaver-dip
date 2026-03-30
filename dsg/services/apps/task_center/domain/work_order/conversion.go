package work_order

import (
	"net/url"
	"strconv"
	"unsafe"

	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

// url.Values -> WorkOrderListCreatedByMeOptions
func Convert_url_Values_To_WorkOrderListCreatedByMeOptions(in *url.Values, out *WorkOrderListCreatedByMeOptions) (err error) {
	if err = Convert_url_Values_To_WorkOrderSortOptions(in, &out.WorkOrderSortOptions); err != nil {
		return
	}
	if err = Convert_url_Values_To_WorkOrderPaginateOptions(in, &out.WorkOrderPaginateOptions); err != nil {
		return
	}

	if values, ok := map[string][]string(*in)["keyword"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_string(&values, &out.Keyword); err != nil {
			return err
		}
	} else {
		out.Keyword = ""
	}

	if values, ok := map[string][]string(*in)["fields"]; ok && len(values) > 0 {
		out.Fields = *(*[]string)(unsafe.Pointer(&values))
	} else {
		out.Fields = nil
	}

	if values, ok := map[string][]string(*in)["type"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_string(&values, &out.Type); err != nil {
			return err
		}
	} else {
		out.Type = ""
	}

	if values, ok := map[string][]string(*in)["status"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_v1_WorkOrderStatusV2(&values, &out.Status); err != nil {
			return err
		}
	} else {
		out.Status = ""
	}

	if values, ok := map[string][]string(*in)["priority"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_string(&values, &out.Priority); err != nil {
			return err
		}
	} else {
		out.Priority = ""
	}

	if values, ok := map[string][]string(*in)["started_at"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_int64(&values, &out.StartedAt); err != nil {
			return err
		}
	} else {
		out.StartedAt = 0
	}

	if values, ok := map[string][]string(*in)["finished_at"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_int64(&values, &out.FinishedAt); err != nil {
			return err
		}
	} else {
		out.FinishedAt = 0
	}

	return
}

// url.Values -> WorkOrderListMyResponsibilitiesOptions
func Convert_url_Values_To_WorkOrderListMyResponsibilitiesOptions(in *url.Values, out *WorkOrderListMyResponsibilitiesOptions) (err error) {
	if err = Convert_url_Values_To_WorkOrderSortOptions(in, &out.WorkOrderSortOptions); err != nil {
		return
	}
	if err = Convert_url_Values_To_WorkOrderPaginateOptions(in, &out.WorkOrderPaginateOptions); err != nil {
		return
	}

	if values, ok := map[string][]string(*in)["keyword"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_string(&values, &out.Keyword); err != nil {
			return err
		}
	} else {
		out.Keyword = ""
	}

	if values, ok := map[string][]string(*in)["fields"]; ok && len(values) > 0 {
		out.Fields = *(*[]string)(unsafe.Pointer(&values))
	} else {
		out.Fields = nil
	}

	if values, ok := map[string][]string(*in)["type"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_string(&values, &out.Type); err != nil {
			return err
		}
	} else {
		out.Type = ""
	}

	if values, ok := map[string][]string(*in)["status"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_v1_WorkOrderStatusV2(&values, &out.Status); err != nil {
			return err
		}
	} else {
		out.Status = ""
	}

	if values, ok := map[string][]string(*in)["priority"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_string(&values, &out.Priority); err != nil {
			return err
		}
	} else {
		out.Priority = ""
	}

	if values, ok := map[string][]string(*in)["started_at"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_int64(&values, &out.StartedAt); err != nil {
			return err
		}
	} else {
		out.StartedAt = 0
	}

	if values, ok := map[string][]string(*in)["finished_at"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_int64(&values, &out.FinishedAt); err != nil {
			return err
		}
	} else {
		out.FinishedAt = 0
	}

	return
}

// Convert_Slice_string_To_v1_WorkOrderStatusV2 allows converting a URL query parameter to WorkOrderStatusV2
func Convert_Slice_string_To_v1_WorkOrderStatusV2(in *[]string, out *WorkOrderStatusV2) error {
	if len(*in) > 0 {
		*out = WorkOrderStatusV2((*in)[0])
	}
	return nil
}

// task_center_v1.WorkOrderType -> int32
func Convert_task_center_v1_WorkOrderType_To_WorkOrderType(in *task_center_v1.WorkOrderType, out *int32) error {
	*out = enum.ToInteger[WorkOrderType](*(*string)(in)).Int32()
	return nil
}

// url.Values -> WorkOrderSortOptions
func Convert_url_Values_To_WorkOrderSortOptions(in *url.Values, out *WorkOrderSortOptions) (err error) {
	if values, ok := map[string][]string(*in)["sort"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_string(&values, &out.Sort); err != nil {
			return err
		}
	} else {
		out.Sort = ""
	}

	if values, ok := map[string][]string(*in)["direction"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_string(&values, &out.Direction); err != nil {
			return err
		}
	} else {
		out.Direction = ""
	}

	return
}

// url.Values -> WorkOrderPaginateOptions
func Convert_url_Values_To_WorkOrderPaginateOptions(in *url.Values, out *WorkOrderPaginateOptions) (err error) {
	if values, ok := map[string][]string(*in)["offset"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_int(&values, &out.Offset); err != nil {
			return err
		}
	} else {
		out.Offset = 0
	}

	if values, ok := map[string][]string(*in)["limit"]; ok && len(values) > 0 {
		if err := Convert_Slice_string_To_int(&values, &out.Limit); err != nil {
			return err
		}
	} else {
		out.Limit = 0
	}

	return nil
}

// []string -> string
//
// TODO: Move to GoCommon
func Convert_Slice_string_To_string(in *[]string, out *string) error {
	if len(*in) == 0 {
		*out = ""
		return nil
	}
	*out = (*in)[0]
	return nil
}

// []string -> int
//
// TODO: Move to GoCommon
func Convert_Slice_string_To_int(in *[]string, out *int) error {
	if len(*in) == 0 {
		*out = 0
		return nil
	}
	str := (*in)[0]
	i, err := strconv.Atoi(str)
	if err != nil {
		return err
	}
	*out = i
	return nil
}

func Convert_Slice_string_To_int64(in *[]string, out *int64) error {
	if len(*in) == 0 {
		*out = 0
		return nil
	}
	str := (*in)[0]
	i, err := strconv.ParseInt(str, 10, 64)
	if err != nil {
		return err
	}
	*out = i
	return nil
}
