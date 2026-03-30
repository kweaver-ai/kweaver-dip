import { Checkbox, Row, Col, Tag, Select } from 'antd'
import type { CheckboxValueType } from 'antd/es/checkbox/Group'
import React, { useEffect, useState } from 'react'
import { CaretRightOutlined, DownOutlined } from '@ant-design/icons'
import type { CustomTagProps } from 'rc-select/lib/BaseSelect'
import styles from '../styles.module.less'
import __ from '../../locale'

const CheckboxGroup = Checkbox.Group
const { Option } = Select

interface IMulti {
    // 所有选项
    options: {
        value: any
        label: string
    }[]

    // 选中项
    checkedList: CheckboxValueType[]

    // 选中项变更
    onCheckedChange: (list: CheckboxValueType[]) => void

    // 显示全选
    isShowAll?: boolean

    // 布局分布
    spans?: Array<number>
}

// 多选
export function Multi({
    options,
    checkedList,
    onCheckedChange,
    isShowAll = true,
    spans,
}: IMulti) {
    const [indeterminate, setIndeterminate] = useState(false)
    const [checkAll, setCheckAll] = useState(false)

    useEffect(() => {
        if (checkedList.length === 0) {
            setCheckAll(false)
            setIndeterminate(false)
        }
    }, [checkedList])

    // 选中项变更
    const onChange = (list: CheckboxValueType[]) => {
        onCheckedChange(list)
        setIndeterminate(!!list.length && list.length < options.length)
        setCheckAll(list.length === options.length)
    }

    // 全选变更
    const onCheckAllChange = (e: any) => {
        onCheckedChange(
            e.target.checked ? options.map((item) => item?.value) : [],
        )
        setIndeterminate(false)
        setCheckAll(e.target.checked)
    }

    return (
        <>
            {isShowAll && (
                <Checkbox
                    indeterminate={indeterminate}
                    onChange={onCheckAllChange}
                    checked={checkAll}
                >
                    {__('全部')}
                </Checkbox>
            )}
            <div>
                <CheckboxGroup
                    className={styles.checkbox_group}
                    value={checkedList}
                    onChange={onChange}
                >
                    <Row gutter={[0, 4]}>
                        {options?.map((item, i) => (
                            <Col span={spans && spans[i] ? spans[i] : 12}>
                                <Checkbox value={item?.value}>
                                    {item?.label}
                                </Checkbox>
                            </Col>
                        ))}
                    </Row>
                </CheckboxGroup>
            </div>
        </>
    )
}

// 自定义折叠面板头
export const PanellHeader = ({ Icon, title, iconProps = {} }: any) => {
    return (
        <>
            <Icon className={styles.collapse_icon} {...iconProps} />
            <span className={styles.collapse_title}>{title}</span>
        </>
    )
}

// 自定义折叠面板按钮
export const getNode = (isActive) => {
    return <CaretRightOutlined rotate={isActive ? 90 : 0} />
}

// 资源类型选项
export const resourceOptions = [
    {
        value: 'data_view',
        label: '库表 ',
    },
    {
        value: 'indicator',
        label: '指标',
    },
    {
        value: 'interface_svc',
        label: '接口服务 ',
    },
]

// 折叠面板类型
export const enum PanelType {
    // 资源类型
    AssetType = 'asset_type',

    // 基础信息分类
    DataKind = 'data_kind',

    // 更新周期
    UpdateCycle = 'update_cycle',

    // 共享属性
    SharedType = 'shared_type',

    // 所属部门
    Department = 'department',

    // 所属主题
    SubjectDomain = 'subject_domain',

    // 数据Owner
    DataOwner = 'data_owner',

    // 信息系统
    InfoSystem = 'info_system',

    // 上线日期
    OnlineAt = 'online_at',

    // 发布日期
    PublishedAt = 'published_at',

    // 发布状态
    PublishState = 'publish_status_category',

    // 上线状态
    OnlineState = 'online_status',
}

// 默认展开的折叠面板
export const defaultActiveKey = [
    PanelType.AssetType,
    PanelType.DataKind,
    PanelType.UpdateCycle,
    PanelType.SharedType,
    PanelType.Department,
    PanelType.SubjectDomain,
    PanelType.DataOwner,
    PanelType.InfoSystem,
    PanelType.OnlineAt,
    PanelType.PublishedAt,
    PanelType.PublishState,
    PanelType.OnlineState,
]

// 根据时间，转换为接口需要的时间戳格式
export const getDateObj = (val) => {
    if (!val) {
        return {}
    }
    const timeObj: any = {
        start_time: null,
        end_time: null,
    }

    if (val[0]) {
        timeObj.start_time = val[0].startOf('day').valueOf()
    }

    if (val[1]) {
        timeObj.end_time = val[1].endOf('day').valueOf()
    }

    return timeObj
}

// 认知搜索发布状态
export enum CogSearchPubState {
    UNPUBLISHED = 'unpublished_category',
    PUBLISHED = 'published_category',
}

// 发布状态
export const stateOptionList = [
    {
        value: CogSearchPubState.UNPUBLISHED,
        label: __('未发布'),
    },
    {
        value: CogSearchPubState.PUBLISHED,
        label: __('已发布'),
    },
]

// 上线状态
export enum OnlineState {
    // 已上线
    ONLINE = 'online',

    // 未上线
    UNLINE = 'unline',
}

// 上线状态选项
export const onlineOptions = [
    {
        value: OnlineState.ONLINE,
        label: __('已上线'),
    },
    {
        value: OnlineState.UNLINE,
        label: __('未上线'),
    },
]

// 目录模式下状态值映射，选择发布状态和上线状态时需要传给后端多个状态
export const stateMapping = {
    // 发布状态映射
    publish: {
        [CogSearchPubState.UNPUBLISHED]: ['unpublished_category'],
        [CogSearchPubState.PUBLISHED]: ['published_category'],
    },
    // 上线状态映射
    online: {
        [OnlineState.ONLINE]: ['online', 'down-auditing', 'down-reject'],
        [OnlineState.UNLINE]: [
            'notline',
            'up-auditing',
            'up-reject',
            'offline',
        ],
    },
} as const

// 转换状态为实际状态值数组
export const transformState = (
    state: CheckboxValueType[],
    type: 'publish' | 'online',
): string[] => {
    return state.flatMap(
        (item) =>
            stateMapping[type][
                item as keyof (typeof stateMapping)[typeof type]
            ] || [],
    )
}

// 标签渲染
export const tagRender = ({ label, closable, onClose }: CustomTagProps) => (
    <Tag closable={closable} onClose={onClose} className={styles.tag_wrapper}>
        <span className={styles.tag_span} title={label as string}>
            {label}
        </span>
    </Tag>
)

export function MultiSelect({
    value,
    onChange,
    options,
}: {
    value: any[]
    onChange: (values: any[]) => void
    options: any
}) {
    return (
        <Select
            mode="multiple"
            value={value}
            onChange={onChange}
            placeholder={__('请选择')}
            maxTagCount={2}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            tagRender={tagRender}
            allowClear
            style={{ width: '100%' }}
            getPopupContainer={(node) => node.parentNode}
            showArrow
            suffixIcon={<DownOutlined />}
            menuItemSelectedIcon={null}
            optionLabelProp="label"
            notFoundContent={<div>{__('暂无数据')}</div>}
        >
            {options?.length > 0 &&
                options.map((option) => (
                    <Option
                        key={option.value}
                        value={option.value}
                        label={option.label}
                    >
                        <Checkbox
                            checked={value.includes(option.value)}
                            style={{ width: '100%' }}
                        >
                            {option.label}
                        </Checkbox>
                    </Option>
                ))}
        </Select>
    )
}
