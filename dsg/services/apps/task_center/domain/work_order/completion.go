package work_order

func CompleteWorkOrderListCreatedByMeOptions(opts *WorkOrderListCreatedByMeOptions) {
	CompleteWorkOrderSortOptions(&opts.WorkOrderSortOptions)
	CompleteWorkOrderPaginateOptions(&opts.WorkOrderPaginateOptions)
	if opts.Keyword != "" && opts.Fields == nil {
		opts.Fields = []string{"code", "name"}
	}
}

func CompleteWorkOrderListMyResponsibilitiesOptions(opts *WorkOrderListMyResponsibilitiesOptions) {
	CompleteWorkOrderSortOptions(&opts.WorkOrderSortOptions)
	CompleteWorkOrderPaginateOptions(&opts.WorkOrderPaginateOptions)
	if opts.Keyword != "" && opts.Fields == nil {
		opts.Fields = []string{"code", "name"}
	}
}

func CompleteWorkOrderSortOptions(opts *WorkOrderSortOptions) {
	if opts.Sort != "" && opts.Direction == "" {
		opts.Direction = "asc"
	}
}

func CompleteWorkOrderPaginateOptions(opts *WorkOrderPaginateOptions) {
	if opts.Offset == 0 {
		opts.Offset = 1
	}
}
