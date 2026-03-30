import { FC } from 'react'
import { createPortal } from 'react-dom'
import moment from 'moment'
import { Table, Form, Input, Select, TabsProps, Tooltip, Empty } from 'antd'
import classnames from 'classnames'
import {
    RescCatlgType,
    operatorList,
    maskingList,
    OperationType,
} from './const'
import styles from './styles.module.less'
import DetailsLabel from '../../ui/DetailsLabel'
import __ from './locale'
import { OnlineStatus, PublishStatus } from '@/core'
import OptionBarTool, { menuTypes } from '@/ui/OptionBarTool'
import { OptionMenuType } from '@/ui'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import FileIcon from '../FileIcon'

import dataEmpty from '@/assets/dataEmpty.svg'

// 目录分类tab
export const rescCatlgItems: TabsProps['items'] = [
    {
        key: RescCatlgType.ORGSTRUC,
        label: __('组织架构'),
    },
    {
        key: RescCatlgType.RESC_CLASSIFY,
        label: __('资源分类'),
    },
]

/**
 * @params CLKTOEXPAND 点击展开节点
 * @params SEARCH 搜索
 * @params OTHER 其他情況-如首次进入目录
 */
export enum CatlgOperateType {
    CLKTOEXPAND = 'click_to_expand',
    SEARCH = 'search',
    OTHER = 'other',
}

export interface ILabelTitle {
    label: string
}
export const LabelTitle = ({ label }: ILabelTitle) => {
    return (
        <div className={styles.labelTitleWrapper}>
            <span className={styles.labelLine} />
            <span>{label}</span>
        </div>
    )
}

interface ICantainer {
    detailData?: any
    serviceType?: string
}

// 参数配置组件
export const ParamsCantainer = (props: ICantainer) => {
    const { detailData, serviceType } = props
    const columns = [
        {
            title: '英文名称',
            dataIndex: 'en_name',
            key: 'en_name',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: '中文名称',
            dataIndex: 'cn_name',
            key: 'cn_name',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: '字段类型',
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: '是否必填',
            dataIndex: 'required',
            key: 'required',
            ellipsis: true,
            render: (text) =>
                text === 'yes' ? '必填' : text === 'no' ? '非必填' : '--',
        },
        {
            title: '运算逻辑',
            dataIndex: 'operator',
            key: 'operator',
            ellipsis: true,
            render: (text) =>
                operatorList.find((item) => item.value === text)?.label || '--',
        },
        {
            title: '排序规则',
            dataIndex: 'sort',
            key: 'sort',
            ellipsis: true,
            render: (text) =>
                text === 'unsorted'
                    ? '不排序'
                    : text === 'asc'
                    ? '升序'
                    : '降序',
        },
        {
            title: '脱敏规则',
            dataIndex: 'masking',
            key: 'masking',
            ellipsis: true,
            render: (text) =>
                maskingList.find((item) => item.value === text)?.label || '--',
        },
        {
            title: '默认值',
            dataIndex: 'default_value',
            key: 'default_value',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text) => text || '--',
        },
    ]
    return (
        <div className={styles.paramsCantainer}>
            <LabelTitle label="参数配置" />
            <div className={styles.detailsLabelBox}>
                <div className={styles.paramsTitle}>已选择的请求参数</div>
                <Table
                    columns={columns.filter(
                        (item) => item.key !== 'sort' && item.key !== 'masking',
                    )}
                    dataSource={
                        detailData?.service_param?.data_table_request_params
                    }
                    rowKey="cn_name"
                    pagination={false}
                />
                {serviceType === 'service_generate' && (
                    <>
                        <div
                            className={classnames(
                                styles.paramsTitle,
                                styles.resParamsTitle,
                            )}
                        >
                            已选择的返回参数
                        </div>
                        <Table
                            columns={columns.filter(
                                (item) =>
                                    item.key !== 'required' &&
                                    item.key !== 'operator' &&
                                    item.key !== 'default_value',
                            )}
                            dataSource={
                                detailData?.service_param
                                    ?.data_table_response_params
                            }
                            rowKey="cn_name"
                            pagination={false}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

export const ResponseCantainer = (props: ICantainer) => {
    const { detailData, serviceType } = props
    return (
        <div className={styles.paramsCantainer}>
            <LabelTitle label="分页设置" />
            <div className={styles.detailsLabelBox}>
                <div className={styles.rulesTitle}>
                    返回结果每页显示&nbsp;
                    {detailData?.service_response?.page_size || 5000} 条
                </div>
            </div>
            <LabelTitle label="过滤规则" />
            <div className={styles.detailsLabelBox}>
                <div className={styles.rulesTitle}>
                    设置规则，可获取指定条件的数据，条件之间均为“且”的关系
                </div>
                {detailData?.service_response?.rules.map((item, index) => {
                    return (
                        <div className={styles.rulesBox} key={index}>
                            <Input disabled value={item.param} />
                            <Select
                                disabled
                                value={item.operator}
                                options={operatorList}
                            />
                            <Input disabled value={item.value} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * 按钮组合
 */
export const ButtonLists: Array<menuTypes> = [
    {
        key: OperationType.DETAIL,
        label: __('详情'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.EDIT,
        label: __('编辑'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.ATTACHMENT,
        label: __('附件'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.PUBLISH,
        label: __('发布'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.CHANGE,
        label: __('变更'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.DELETE,
        label: __('删除'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.CHANGE_AUDIT_RETRACT,
        label: __('变更审核撤回'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.ONLINE,
        label: __('上线'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.ONLINE_AUDIT_RETRACT,
        label: __('上线审核撤回'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.OFFLINE,
        label: __('下线'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.OFFLINE_AUDIT_RETRACT,
        label: __('下线审核撤回'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.PUBLISH_AUDIT_RETRACT,
        label: __('发布审核撤回'),
        menuType: OptionMenuType.Menu,
    },
]

/**
 * button信息
 */
export interface ButtonGroupItem {
    // 状态组合，保存当前的数据所处状态
    StatusGroup: [PublishStatus]
    menus: Array<OperationType>
}

/**
 * 状态管理
 */
export const ButtonGroupLists: Array<ButtonGroupItem> = [
    {
        //  未发布，未上线
        StatusGroup: [PublishStatus.UNPUBLISHED],
        menus: [
            OperationType.DETAIL,
            OperationType.EDIT,
            OperationType.ATTACHMENT,
            OperationType.PUBLISH,
            OperationType.DELETE,
        ],
    },
    {
        // 发布审核中， 未上线
        StatusGroup: [PublishStatus.PUB_AUDITING],
        menus: [OperationType.DETAIL, OperationType.PUBLISH_AUDIT_RETRACT],
    },
    {
        // 发布审核未通过， 未上线
        StatusGroup: [PublishStatus.PUB_REJECT],
        menus: [
            OperationType.DETAIL,
            OperationType.EDIT,
            OperationType.ATTACHMENT,
            OperationType.PUBLISH,
            OperationType.DELETE,
        ],
    },
    {
        // 已发布，未上线
        StatusGroup: [PublishStatus.PUBLISHED],
        menus: [
            OperationType.DETAIL,
            // OperationType.CHANGE,
            // OperationType.DELETE,
        ],
    },
]

interface IStatusTextBox {
    // 状态颜色
    color: string
    // 显示内容
    text: string
    // 审核意见
    advice?: string
}

/**
 *  状态显示组件
 * @param param0
 * @returns
 */
export const StatusTextBox: FC<IStatusTextBox> = ({ color, text, advice }) => {
    return (
        <div className={styles.statusTextBox}>
            <div style={{ background: color }} className={styles.statusDot} />
            <div className={styles.text}>{text}</div>
            {advice ? (
                <Tooltip
                    title={`${__('审核意见：')}${advice}`}
                    color="#fff"
                    overlayInnerStyle={{ color: 'rgba(0,0,0,0.85)' }}
                    overlayStyle={{ maxWidth: 400 }}
                >
                    <div className={styles.advice}>
                        <FontIcon
                            name="icon-shenheyijian"
                            type={IconType.COLOREDICON}
                        />
                    </div>
                </Tooltip>
            ) : null}
        </div>
    )
}

// ------------------------------
// 详情页基本信息组件
// 基本信息组件
export const BasicCantainer = (props: any) => {
    const { basicCantainerContent, labelWidth = '98px' } = props
    return basicCantainerContent.map((item) => {
        return (
            <div key={item.label}>
                <LabelTitle label={item.label} />
                <div className={styles.detailsLabelBox}>
                    <DetailsLabel
                        labelWidth={labelWidth}
                        wordBreak
                        detailsList={item.list}
                    />
                </div>
            </div>
        )
    })
}

export const transUnit = (limitSize = 10 * 1024 * 1024) => {
    let unit = 'B'
    let size = limitSize
    switch (true) {
        case limitSize < 1024:
            break
        case limitSize / 1024 < 1024:
            unit = 'KB'
            size = Math.round(limitSize / 1024)
            break
        case limitSize / (1024 * 1024) < 1024:
            unit = 'MB'
            size = Math.round(limitSize / (1024 * 1024))
            break
        default:
            unit = 'GB'
            size = Math.round(limitSize / (1024 * 1024 * 1024))
            break
    }

    return { size, unit }
}

export const getSuffix = (fileName) => {
    if (!fileName) return ''
    return fileName.substring(fileName.lastIndexOf('.') + 1)
}

// 文件列表table
const FilesTable = ({
    dataSource = [],
    allowRemove = true,
}: {
    dataSource: any[]
    allowRemove: boolean
}) => {
    const columns = [
        {
            title: '文件名称',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text) => {
                if (!text) return '--'
                const suffix = getSuffix(text)
                return (
                    <>
                        <FileIcon
                            suffix={suffix}
                            style={{ marginRight: 8, verticalAlign: 'middle' }}
                        />
                        {text}
                    </>
                )
            },
        },
        {
            title: '文件类型',
            dataIndex: 'type',
            key: 'type',
            ellipsis: true,
            render: (_, record) => {
                const { name } = record
                if (!name) return '--'
                return getSuffix(name)
            },
        },
        {
            title: '文件大小',
            dataIndex: 'size',
            key: 'size',
            ellipsis: true,
            render: (text) => {
                if (!text) return '--'
                const { size, unit } = transUnit(text)
                return `${size}${unit}`
            },
        },
        {
            title: '更新时间',
            dataIndex: 'updateTime',
            key: 'updateTime',
            ellipsis: true,
            render: (text) => {
                // if (!text) return '--'
                return moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: '操作',
            dataIndex: 'operate',
            key: 'operate',
            ellipsis: true,
            render: (text) => {
                const menus = [
                    {
                        title: '预览',
                        label: '预览',
                        key: 'preview',
                        menuType: OptionMenuType.Menu,
                    },
                    {
                        title: '移除',
                        label: '移除',
                        key: 'remove',
                        menuType: OptionMenuType.Menu,
                    },
                ]
                const buttonMenus = allowRemove
                    ? menus
                    : menus.filter((menuItem) => menuItem.key !== 'remove')

                return (
                    <OptionBarTool
                        menus={buttonMenus}
                        onClick={(key, e) => {
                            // console.log('key, e:', key, e)
                        }}
                        getPopupContainer={(node) => node}
                    />
                )
            },
        },
    ]

    return dataSource && dataSource.length > 0 ? (
        <Table columns={columns} dataSource={dataSource} pagination={false} />
    ) : (
        <div className={styles.emptyWrap}>
            <Empty
                description={
                    <span style={{ color: 'rgba(0, 0, 0, .65)' }}>
                        暂无数据，请先添加附件
                    </span>
                }
                image={dataEmpty}
            />
        </div>
    )
}

// 参数配置组件
export const FileTableContainer = (props: any) => {
    const { dataSource } = props

    return (
        // createPortal((
        <div className={styles.fileTableContainer}>
            <div className={styles.fileTableTitle}>{__('附件清单')}</div>
            <FilesTable dataSource={dataSource} allowRemove />
        </div>
        // ), document.getElementById('datafileupsert-content') || document.body)
    )
}

export const AttachmentContainer = (props: any) => {
    const { detailData, title } = props

    return (
        <div>
            <LabelTitle label={title} />
            <div className={styles.detailsLabelBox}>
                <FilesTable dataSource={detailData} allowRemove={false} />
            </div>
        </div>
    )
}

/**
 * 计算操作按钮, 按钮大于4个，则显示更多按钮
 * @param btnList
 * @returns
 */
export const calcOperationBtns = (btnList: any[]) => {
    if (btnList.length > 4) {
        const newBtnList = btnList.map((item, index) => {
            if (index > 2) {
                return {
                    ...item,
                    menuType: OptionMenuType.More,
                }
            }
            return {
                ...item,
                menuType: OptionMenuType.Menu,
            }
        })
        return newBtnList
    }
    return btnList
}
