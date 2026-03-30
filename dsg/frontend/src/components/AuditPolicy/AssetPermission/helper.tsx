import { InfoCircleFilled } from '@ant-design/icons'
import { IFormItem, SearchType } from '@/components/SearchLayout/const'
import {
    IGetRescPolicyList,
    OnlineStatus,
    PolicyDataRescType,
    RescPolicyStatus,
    RescPolicyType,
    SortDirection,
    SortType,
    formatError,
} from '@/core'
import {
    IformItem,
    SearchType as LightSearchType,
} from '@/ui/LightweightSearch/const'
import { info } from '@/utils/modalHelper'
import __ from './locale'

import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'
import { TabsKey } from '@/components/IndicatorManage/const'
import { OperateType } from '@/utils'

export const initSearchCondition: IGetRescPolicyList = {
    offset: 1,
    limit: 10,
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'updated_at',
}

export const menus = [
    { key: SortType.NAME, label: __('按策略名称排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
    { key: SortType.CREATED, label: __('按创建时间排序') },
]

export const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

export const policyStatusList = [
    {
        key: RescPolicyStatus.NotEnabled,
        value: RescPolicyStatus.NotEnabled,
        label: __('未启用'),
        bgColor: 'rgba(0,0,0,0.3)',
    },
    {
        key: RescPolicyStatus.Enabled,
        value: RescPolicyStatus.Enabled,
        label: __('已启用'),
        bgColor: '#52C41B',
    },
    {
        key: RescPolicyStatus.Disabled,
        value: RescPolicyStatus.Disabled,
        label: __('已停用'),
        bgColor: '#FF5E60',
    },
]
export enum IsSetted {
    // 未设置
    Unset = 'false',
    // 已设置
    Set = 'true',
}

// 审核资源是否设置
export const isSettedList = [
    {
        key: 'unset',
        value: IsSetted.Unset,
        label: __('未设置'),
    },
    {
        key: 'set',
        value: IsSetted.Set,
        label: __('已设置'),
    },
]

export const searchFormData: IFormItem[] = [
    {
        label: __('策略名称'),
        key: 'keyword',
        type: SearchType.Input,
        defaultValue: initSearchCondition.keyword,
        isAlone: true,
        itemProps: {
            maxLength: 255,
        },
    },
    {
        label: __('策略状态'),
        key: 'status',
        type: SearchType.Select,
        itemProps: {
            options: policyStatusList.map((item) => ({
                ...item,
                title: item.label,
                label: (
                    <span>
                        <span
                            style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                marginRight: '8px',
                                borderRadius: '50%',
                                background: item.bgColor,
                            }}
                        />
                        {item.label}
                    </span>
                ),
            })),
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('审核流程'),
        key: 'has_audit',
        type: SearchType.Select,
        itemProps: {
            options: isSettedList,
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('审核资源'),
        key: 'has_resource',
        type: SearchType.Select,
        itemProps: {
            options: isSettedList,
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
]

// 资源权限申请内置列表
export const builtInRescPolicyTypeList = [
    RescPolicyType.BuiltInView,
    RescPolicyType.BuiltInInterface,
    RescPolicyType.BuiltInIndicator,
    // 资源不包括目录，后端定义，暂时用不到
    RescPolicyType.BuiltInCatalog,
]

// 资源权限申请内置列表对应标签值
export const rescPolicyTypeLabelList = {
    [RescPolicyType.BuiltInView]: __('全部逻辑视图'),
    [RescPolicyType.BuiltInInterface]: __('全部接口服务'),
    [RescPolicyType.BuiltInIndicator]: __('全部指标'),
    [RescPolicyType.Customize]: __('自定义'),
    [RescPolicyType.BuiltInCatalog]: __('全部目录'),
}

// 策略资源类型对应与服务超市类型
export const policyRescTypeToDataRescType = {
    [PolicyDataRescType.LOGICALVIEW]: DataRescType.LOGICALVIEW,
    [PolicyDataRescType.INDICATOR]: DataRescType.INDICATOR,
    [PolicyDataRescType.INTERFACE]: DataRescType.INTERFACE,
}

export const rescTypeList = [
    {
        key: PolicyDataRescType.LOGICALVIEW,
        value: PolicyDataRescType.LOGICALVIEW,
        label: __('逻辑视图'),
    },
    {
        key: PolicyDataRescType.INDICATOR,
        value: PolicyDataRescType.INDICATOR,
        label: __('指标'),
    },
    {
        key: PolicyDataRescType.INTERFACE,
        value: PolicyDataRescType.INTERFACE,
        label: __('接口服务'),
    },
]

// 内置资源列表
export const allRescTypeList = [
    {
        key: PolicyDataRescType.NOLIMIT,
        value: PolicyDataRescType.NOLIMIT,
        label: __('全部'),
    },
    ...rescTypeList,
]

// 过滤条件
export const filterItems: IformItem[] = [
    {
        label: __('类型'),
        key: 'rescType',
        options: allRescTypeList,
        type: LightSearchType.Radio,
    },
]

// 列表操作项确认框提示
export const oprTitleAndContList = {
    [OperateType.ACTIVE]: {
        title: __('确定${text}审核策略吗？', {
            text: __('启用'),
        }),
        content: __(
            '启用后，用户申请策略管控范围内的资源权限时，将按照此策略设定的审核流程进行审核。',
        ),
    },
    [OperateType.DISABLE]: {
        title: __('确定${text}审核策略吗？', {
            text: __('停用'),
        }),
        content: __('停用后，策略管控范围内的资源，将不再提供此权限申请流程。'),
    },
    [OperateType.DELETE]: {
        title: __('确定${text}审核策略吗？', {
            text: __('删除'),
        }),
        content: __('删除后，策略管控范围内的资源，将不再提供此权限申请流程。'),
    },
}

export enum ResPolicyOprError {
    // 1个数上限
    PolicyNumLimit = 'ConfigurationCenter.AuditPolicy.AuditPolicyResourceOver',
    // 2资源不存在
    ResourceNotExist = 'ConfigurationCenter.AuditPolicy.ResourceNotExist',
    // 3资源已存在其他策略（已在当前策略的不算，必须是其他策略冲突）
    ResourceExistOtherPolicy = 'ConfigurationCenter.AuditPolicy.ResourceHasBind',
    // 策略不存在导致的操作失败直接报操作失败，不用单独报资源添加失败（编辑/启用/禁用策略、配置流程等都可能有的异常）
    PolicyPrcsNotExist = 'ConfigurationCenter.AuditPolicy.AuditPolicyNotFound',
}

export const resPolicyOprErrorList = {
    [ResPolicyOprError.PolicyNumLimit]: {
        title: __('资源全部添加失败'),
        content: __('本次选择的资源个数大于当前策略允许添加的个数。'),
    },
    [ResPolicyOprError.ResourceNotExist]: {
        title: __('资源全部添加失败'),
        content: __('本次选择的资源存在资源异常（资源已不存在）。'),
    },
    [ResPolicyOprError.ResourceExistOtherPolicy]: {
        title: __('资源全部添加失败'),
        content: __(
            '本次选择的资源存在资源异常（资源已有其他审核策略绑定，不能重复添加）。',
        ),
    },
    [ResPolicyOprError.PolicyPrcsNotExist]: {
        title: __('无法执行此操作'),
        content: __('策略不存在。'),
    },
}

/**
 *
 * @param e
 * @param callback 报错的处理方式
 */
export const handleRescPolicyError = (e, callback?: any) => {
    const { code } = e?.data || {}
    if (resPolicyOprErrorList[code]) {
        // 策略不存在导致的操作失败直接报操作失败，不用单独报资源添加失败（编辑/启用/禁用策略、配置流程等都可能有的异常）
        info({
            title: resPolicyOprErrorList[code]?.title,
            icon: <InfoCircleFilled />,
            content: resPolicyOprErrorList[code]?.content,
            okText: __('确定'),
            async onOk() {
                callback?.(e)
            },
        })
    } else {
        callback?.(e)
        formatError(e)
    }
}

export enum SideInfoDrawerTabKey {
    //    审核资源
    AuditResource = 'auditResource',
    // 审核流程
    AuditProcess = 'auditProcess',
    // 更多信息
    MoreInfo = 'moreInfo',
}

// 侧边栏信息tabs
export const sideInfoDrawerTabs = [
    {
        label: __('审核资源'),
        key: SideInfoDrawerTabKey.AuditResource,
    },
    {
        label: __('审核流程'),
        key: SideInfoDrawerTabKey.AuditProcess,
    },
    {
        label: __('更多信息'),
        key: SideInfoDrawerTabKey.MoreInfo,
    },
]

export const moreInfoList = [
    {
        title: __('基本属性'),
        infoList: [
            {
                label: __('策略名称'),
                key: 'name',
                labelWidth: '70px',
                value: '',
                span: 24,
            },
            {
                label: __('描述'),
                key: 'description',
                labelWidth: '70px',
                value: '',
                span: 24,
            },
            {
                label: __('类型'),
                key: 'type',
                labelWidth: '70px',
                value: '',
                span: 24,
            },
            {
                label: __('策略状态'),
                key: 'status',
                labelWidth: '70px',
                value: '',
                span: 24,
            },
            {
                label: __('审核流程'),
                key: 'proc_def_key',
                labelWidth: '70px',
                value: '',
                span: 24,
            },
            {
                label: __('审核资源'),
                key: 'resources',
                labelWidth: '70px',
                value: '',
                span: 24,
            },
        ],
    },
    {
        title: __('更新信息'),
        infoList: [
            {
                label: __('创建人'),
                key: 'creator_name',
                labelWidth: '70px',
                value: '',
                span: 24,
            },
            {
                label: __('创建时间'),
                key: 'created_at',
                labelWidth: '70px',
                value: '',
                span: 24,
            },
            {
                label: __('更新人'),
                key: 'updater_name',
                labelWidth: '70px',
                value: '',
                span: 24,
            },
            {
                label: __('更新时间'),
                key: 'updated_at',
                labelWidth: '70px',
                value: '',
                span: 24,
            },
        ],
    },
]

// 生成 12 条测试数据
export const policyTestData: any = {
    entries: new Array(12).fill(0).map((item, index) => {
        return {
            id: `policy_00${index}`,
            name: (index < 3 ? '内置策略' : '自定义策略') + (index + 1),
            description: `红红火火恍恍惚惚哈哈哈和红红火火恍恍惚惚和红红火火恍恍惚惚哈哈哈和红红火火恍恍惚惚和${index}`,
            type:
                index < 3
                    ? builtInRescPolicyTypeList[index]
                    : RescPolicyType.Customize,
            service_type: 'auth-service',
            audit_type: 'af-data-permission-request',
            proc_def_key: 'Process_0DGEQHEF',
            status: [
                RescPolicyStatus.NotEnabled,
                RescPolicyStatus.Enabled,
                RescPolicyStatus.Disabled,
            ][index % 3],
            resources_count: index + 1,
            resources:
                index % 7 === 0
                    ? undefined
                    : new Array(index * 10 + 1)
                          .fill('resource_001')
                          .map((i, _index) => {
                              return {
                                  department: `部门${_index}`,
                                  id: `res0${_index}`,
                                  name: `资源0${_index}`,
                                  status:
                                      _index < 3
                                          ? OnlineStatus.OFFLINE
                                          : OnlineStatus.ONLINE,
                                  subject_path: `主题域0${_index}`,
                                  technical_name: `技术名称0${_index}`,
                                  type: rescTypeList?.[_index % 3]?.value,
                                  sub_type: [
                                      TabsKey.ATOMS,
                                      TabsKey.DERIVE,
                                      TabsKey.RECOMBINATION,
                                  ][_index % 3],
                                  uniform_catalog_code: `code0${_index}`,
                              }
                          }),
        }
    }),
    total_count: 12,
}

// export const delPolicyDetail = {
//     id: 'policy_detail_00' + 1,
//     name: '自定义策略hhahah',
//     description:
//         '红红火火恍恍惚惚哈哈哈和红红火火恍恍惚惚和红红火火恍恍惚惚哈哈哈和红红火火恍恍惚惚和'
//     type: RescPolicyType.Customize,
//     service_type: 'auth-service',
//     audit_type: 'af-data-permission-request',
//     proc_def_key: 'Process_0DGEQHEF',
//     status: PolicyStatus.Enabled,
//     resources_count: 21,
//     resources: new Array(21).fill('resource_001').map((item, index)=> return {

//     }),
// }
