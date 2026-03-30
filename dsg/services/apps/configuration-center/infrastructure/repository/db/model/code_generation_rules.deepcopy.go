package model

func (in *CodeGenerationRule) DeepCopyInto(out *CodeGenerationRule) {
	*out = *in
	in.CodeGenerationRuleSpec.DeepCopyInto(&out.CodeGenerationRuleSpec)
	in.CodeGenerationRuleStatus.DeepCopyInto(&out.CodeGenerationRuleStatus)
}

func (in *CodeGenerationRuleSpec) DeepCopyInto(out *CodeGenerationRuleSpec) {
	*out = *in
}

func (in *CodeGenerationRuleStatus) DeepCopyInto(out *CodeGenerationRuleStatus) {
	*out = *in
}
