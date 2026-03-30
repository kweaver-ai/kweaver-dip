import __ from './locale'

export const detailsList = [
    { label: __('所属部门'), key: 'department_name' },
    { label: __('建设部门'), key: 'js_department_name' },
    { label: __('系统状态'), key: 'status' },
    { label: __('描述'), key: 'description' },
    { label: __('更新人/更新时间'), key: 'updated_user', secKey: 'updated_at' },
    { label: __('验收时间'), key: 'acceptance_at' },
]

// configuration-center 服务错误码-错误码方案暂未确定，目前先在模块中自定义错误码
export const ConfigurationCenterErrorCode = {
    CreateInfoSystemFailed: 'CreateInfoSystemFailed',
    ModifyInfoSystemFailed: 'ModifyInfoSystemFailed',
    DeleteInfoSystemFailed: 'DeleteInfoSystemFailed',
    InfoSystemNameExist: 'InfoSystemNameExist',
    DrivenCreateInfoSystemFailed: 'DrivenCreateInfoSystemFailed',
    DrivenCreateInfoSystemParamFailed: 'DrivenCreateInfoSystemParamFailed',
    DrivenModifyInfoSystemFailed: 'DrivenModifyInfoSystemFailed',
    DrivenDeleteInfoSystemFailed: 'DrivenDeleteInfoSystemFailed',
    DrivenGetInfoSystemFailed: 'DrivenGetInfoSystemFailed',
    InfoSystemNotExist: 'InfoSystemNotExist',
    InfoSystemTypeSchemaNotNull: 'InfoSystemTypeSchemaNotNull',
    InfoSystemNameExistInfoSystem: 'InfoSystemNameExistInfoSystem',
    InfoSystemNameExistInNoInfoSystem: 'InfoSystemNameExistInNoInfoSystem',
}
