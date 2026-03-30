import React, {
    Dispatch,
    ReactNode,
    SetStateAction,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { isNumber, noop, trim } from 'lodash'
import classnames from 'classnames'
import { Tooltip } from 'antd'
import {
    formatError,
    IStandardEnum,
    formsCheckUniqueness,
    getDataEleDetailById,
    TaskStatus,
    LoginPlatform,
} from '@/core'
import { FormTableKind, StandardStatus, standardStatusInfos } from './const'
import styles from './styles.module.less'
import __ from './locale'
import {
    ValueRangeType,
    exChangeRangeDataToString,
} from '../FormTableMode/const'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import { OptionMenuType } from '@/ui'
import { getPlatformNumber } from '@/utils'

/**
 * 字段标准信息
 * @param keyId 标识
 * @param originalField 初始值
 * @param recommendFields 推荐值
 * recommendFields信息
 * std_code	string 否 标准编码，唯一标识
 * std_ch_name string 否 标准中文名称
 * std_en_name string 否 标准英文名称
 * data_length int 是 数据长度
 * data_precision int 是 数据精度
 * data_type string	否 数据类型：数值型/字符型/日期型/日期时间型/时间戳型/布尔型
 * data_range string 是	值域，格式：1、标识范围：(1,9999) 2、标识列表：[1,2,3,4,5]
 * std_type	string 否 标准分类（标准类型）：团体标准/企业标准/行业标准/地方标准/国家标准/国际标准/其他标准
 * dict	json 是	码表
 * @param historyFields 历史值
 * @param changedField 更换值
 */
export interface IFieldInfo {
    keyId: any
    originalField: any
    recommendFields: any[]
    historyFields: any[]
    changedField?: any
}

export interface IFieldsInfoContext {
    fieldsInfo: IFieldInfo[]
    setFieldsInfo: Dispatch<SetStateAction<IFieldInfo[]>>
}

export const FieldsInfoContext = React.createContext<IFieldsInfoContext>({
    fieldsInfo: [],
    setFieldsInfo: noop,
})

interface IFieldsInfoProvider {
    children: ReactNode
}

export const FieldsInfoProvider: React.FC<IFieldsInfoProvider> = ({
    children,
}) => {
    const [fieldsInfo, setFieldsInfo] = useState<IFieldInfo[]>([])
    const values = useMemo(
        () => ({ fieldsInfo, setFieldsInfo }),
        [fieldsInfo, setFieldsInfo],
    )

    return (
        <FieldsInfoContext.Provider value={values}>
            {children}
        </FieldsInfoContext.Provider>
    )
}

/**
 * 标准化状态组件
 * @param value 标准化状态
 */
export const StandardStatusLabel: React.FC<{
    value: string
}> = ({ value }) => {
    const { label, color, bgColor } = standardStatusInfos.find(
        (s) => s.value === value,
    )!
    return (
        <div
            style={{
                display: 'flex',
                height: 28,
                width: 76,
                fontSize: 12,
                color: `${color}`,
                backgroundColor: `${bgColor}`,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {label}
        </div>
    )
}

/**
 * 标准名字、依据组件
 * @param name 标准名字
 * @param basis 标准分类
 * @returns
 */
export const StandardLabel: React.FC<{
    name: string
    nameEn?: string
    basis: string
    bg?: string
    disabled?: boolean
    disabledTip?: string
}> = ({ name, nameEn, basis, bg, disabled, disabledTip }) => {
    return (
        <div
            className={classnames(
                styles.standardLabelWrapper,
                disabled && styles.standardLabelWrapperDisabled,
            )}
            style={bg ? { backgroundColor: bg } : undefined}
            title={name}
        >
            <Tooltip title={disabled ? disabledTip : ''} placement="topLeft">
                <div className={styles.standardCNLabel}>
                    <span className={classnames(styles.name, styles.disbled)}>
                        {name}
                    </span>
                    {basis && <span className={styles.basis}>{basis}</span>}
                </div>
            </Tooltip>

            {nameEn && (
                <div
                    className={classnames(
                        styles.standardENLabel,
                        styles.disbled,
                    )}
                >
                    {nameEn}
                </div>
            )}
        </div>
    )
}

/**
 * 获取标准的具体标准分类
 * @param val 具体值
 * @param all 标准分类集
 * @returns
 */
export const getFormulateBasis = (val: any, all?: IStandardEnum) => {
    if (!all || !val) {
        return ''
    }
    const { formulate_basis } = all
    const arr = formulate_basis
        .filter((v) => v.value === val)
        .map((v) => v.type)
    return arr && arr?.length > 0 ? arr[0] : ''
}

/**
 * 获取标准的具体标准分类的枚举值
 * @param val 具体值
 * @param all 标准分类集
 * @returns
 */
export const getFormulateBasisNum = (val: any, all?: IStandardEnum) => {
    if (!all || !val) {
        return ''
    }
    const { formulate_basis } = all
    const arr = formulate_basis
        .filter((v) => v.type === val)
        .map((v) => v.value)
    return arr && arr?.length > 0 ? arr[0] : ''
}

/**
 * 获取标准的数据类型
 * @param val 具体值
 * @param all 标准分类集
 * @returns
 */
export const getDataType = (val: any, all?: IStandardEnum) => {
    if (!all || !val) {
        return ''
    }
    const { data_type } = all
    const arr = data_type.filter((v) => v.value === val).map((v) => v.type)
    return arr && arr?.length > 0 ? arr[0] : ''
}

/**
 * 检查重复
 * @param rule
 * @param value 当前输入的值
 * @returns
 */
export const checkNameRepeat = async (mid, value, id = '') => {
    try {
        if (id) {
            await formsCheckUniqueness(mid, { form_id: id, name: trim(value) })
        } else {
            await formsCheckUniqueness(mid, { name: trim(value) })
        }
        return Promise.resolve()
    } catch (ex) {
        if (ex?.data?.code === 'BusinessGrooming.Form.NameAlreadyExist') {
            return Promise.reject(new Error(__('该表单名称已存在，请重新输入')))
        }

        formatError(ex)
        return Promise.reject(new Error(''))
    }
}

/**
 *
 * @param recommendId
 * @param initInfo
 * @param value 若type为1，为id， 若type为2，则为code
 * @returns
 */
export const transformDataOptions = async (
    recommendId: string,
    initInfo: any,
    type?: number,
): Promise<any> => {
    try {
        if (!recommendId) return initInfo
        const { data } = await getDataEleDetailById({
            type: isNumber(type) ? type : 2,
            value: recommendId,
        })
        let valueInfo = {}
        if (data?.rule_id) {
            valueInfo = {
                value_range_type: ValueRangeType.CodeRule,
                value_range: exChangeRangeDataToString({
                    id: data.rule_id,
                    name: data.rule_name,
                }),
            }
        } else if (data?.dict_id) {
            valueInfo = {
                value_range_type: ValueRangeType.CodeTable,
                value_range: exChangeRangeDataToString({
                    id: data.dict_id,
                    name: data.dict_name_cn,
                }),
            }
        } else {
            valueInfo = {
                value_range_type: ValueRangeType.None,
                value_range: '',
            }
        }

        return {
            ...initInfo,
            ...valueInfo,
        }
    } catch (ex) {
        formatError(ex)
        return Promise.resolve({
            ...initInfo,
            value_range_type: ValueRangeType.None,
            value_range: '',
        })
    }
}

/**
 * 数据标准化-获取数据元详情
 * @param recommendId 数据元id
 * @param initInfo 初始信息
 * @param type 类型
 * @returns
 */
export const transformDataOptionsForDataStandard = async (
    recommendId: string,
    initInfo: any,
    type?: number,
) => {
    try {
        if (!recommendId) return initInfo
        const { data } = await getDataEleDetailById({
            type: isNumber(type) ? type : 2,
            value: recommendId,
        })

        return {
            ...initInfo,
            code_table: data.dict_id,
            encoding_rule: data.rule_id,
            rule_name: data.rule_name,
        }
    } catch (ex) {
        formatError(ex)
        return Promise.resolve({
            ...initInfo,
            value_range_type: ValueRangeType.None,
            value_range: '',
        })
    }
}

// 不限
export const allStatusValue = ''

export const reqStandTaskStatusList = [
    {
        label: __('不限'),
        value: allStatusValue,
    },
    {
        value: TaskStatus.READY,
        label: __('未开始'),
    },
    {
        value: TaskStatus.ONGOING,
        label: __('进行中'),
    },
]

// 待新建标准过滤项
export const reqStandSearchData: IformItem[] = [
    {
        label: __('新建标准状态'),
        key: 'task_status',
        options: reqStandTaskStatusList,
        type: SearchType.Radio,
    },
]

export const defFieldStdState = 'all'

// 标准化过滤项
export const standardizingSearchData: IformItem[] = [
    {
        label: __('标准状态'),
        key: 'status',
        options: [
            {
                value: defFieldStdState,
                label: __('不限'),
            },
            {
                value: StandardStatus.NONE,
                label: __('未标准化'),
            },
            {
                value: StandardStatus.NORMAL,
                label: __('已标准化'),
            },
        ],
        type: SearchType.Radio,
    },
]

/**
 * 业务表标准化操作类型
 */
export enum StdOperateType {
    // 配置数据元
    ConfigureDataEle = 'configureDataEle',

    // 添加到新建标准
    AddToStd = 'addTotStd',

    // 新建标准任务
    CreateStdTask = 'createStdTask',

    // 智能推荐
    IntelligentRecomd = 'intelligentRecomd',
}

// 业务表操作选项
export const AllOptions = (isAuditMode?: boolean) => [
    {
        key: 'detail',
        label: __('详情'),
        access: 'manageBusinessModelAndBusinessDiagnosis',
    },
    {
        key: 'edit',
        label: __('编辑'),
        disabled: isAuditMode,
        access: 'manageBusinessModelAndBusinessDiagnosis',
    },
    {
        key: 'standard',
        label: __('标准化'),
        // isNeedBadge: record?.new_flag,
        disabled: isAuditMode,
        access: 'manageBusinessModelAndBusinessDiagnosis',
    },
    {
        key: 'export',
        label: __('导出'),
        disabled: isAuditMode,
        access: 'manageBusinessModelAndBusinessDiagnosis',
    },
    // {
    //     key: 'detail',
    //     label: __('基本信息'),
    //     menuType: OptionMenuType.Menu,
    //     access: `${ResourceType.business_form}.${RequestType.put}`,
    // },
    {
        key: 'createTask',
        label: __('新建数据开发任务'),
        disabled: isAuditMode,
        access: `manageDataOperationProject`,
    },
    {
        key: 'del',
        label: __('删除'),
        disabled: isAuditMode,
        access: 'manageBusinessModelAndBusinessDiagnosis',
    },
]

const platform = getPlatformNumber()

// 业务表类型操作选项
export const FormTableKindOptions = {
    [FormTableKind.BUSINESS]:
        platform === LoginPlatform.default
            ? ['detail', 'edit', 'export', 'createTask', 'del']
            : ['detail', 'edit', 'export', 'del'],
    [FormTableKind.STANDARD]:
        platform === LoginPlatform.default
            ? ['detail', 'edit', 'standard', 'export', 'createTask', 'del']
            : ['detail', 'edit', 'standard', 'export', 'del'],
    [FormTableKind.DATA_ORIGIN]: ['detail', 'edit', 'del'],
    [FormTableKind.DATA_STANDARD]: ['detail', 'edit', 'standard', 'del'],
    [FormTableKind.DATA_FUSION]: ['detail', 'edit', 'del'],
}

export const calcMenusPosition = (options: any[], record: any) => {
    return options.map((item, index) => {
        if (item.key === 'standard') {
            return {
                ...item,
                isNeedBadge: record?.new_flag,
                menuType:
                    options.length > 4 && index > 2
                        ? OptionMenuType.More
                        : OptionMenuType.Menu,
            }
        }
        return {
            ...item,
            menuType:
                options.length > 4 && index > 2
                    ? OptionMenuType.More
                    : OptionMenuType.Menu,
        }
    })
}
/**
 * 获取业务表的操作选项
 * @param record 业务表
 * @returns
 */
export const getFormOptions = (record: any, isAuditMode?: boolean) => {
    if (!record?.table_kind) {
        return calcMenusPosition(AllOptions(isAuditMode), record)
    }
    const formOptions = AllOptions(isAuditMode).filter((item) => {
        return FormTableKindOptions[record?.table_kind]?.includes(item.key)
    })
    return calcMenusPosition(formOptions, record)
}
