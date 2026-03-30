package impl

import "context"

func (f *flowchartUseCase) NameExistCheck(ctx context.Context, name string, fid *string) (bool, error) {
	var fIds []string
	if fid != nil {
		_, err := f.FlowchartExistCheckDie(ctx, *fid)
		if err != nil {
			return false, err
		}

		fIds = []string{*fid}
	}

	return f.repoFlowchart.ExistByName(ctx, name, fIds...)
}
