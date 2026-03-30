package dto

func (in *UserInfo) DeepCopyInto(out *UserInfo) {
	*out = *in
	if in.Roles != nil {
		in, out := &in.Roles, &out.Roles
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.ParentDeps != nil {
		in, out := &in.ParentDeps, &out.ParentDeps
		*out = make([][]ParentDepartment, len(*in))
		for i := range *in {
			in, out := &(*in)[i], &(*out)[i]
			*out = make([]ParentDepartment, len(*in))
			for j := range *in {
				(*in)[j].DeepCopyInto(&(*out)[j])
			}
		}
	}
}

func (in *UserInfo) DeepCopy() *UserInfo {
	if in == nil {
		return nil
	}
	out := new(UserInfo)
	in.DeepCopyInto(out)
	return out
}

func (in *ParentDepartment) DeepCopyInto(out *ParentDepartment) {
	*out = *in
}

func (in *ParentDepartment) DeepCopy() *ParentDepartment {
	if in == nil {
		return nil
	}
	out := new(ParentDepartment)
	in.DeepCopyInto(out)
	return out
}
