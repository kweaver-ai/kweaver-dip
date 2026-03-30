import React, { FC } from 'react'
import { Table, Form, Input, Select, TabsProps, Tooltip } from 'antd'
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
import { menuTypes } from '@/ui/OptionBarTool'
import { OptionMenuType } from '@/ui'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

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
    label: string | React.ReactNode
    extra?: React.ReactNode
}
export const LabelTitle = ({ label, extra }: ILabelTitle) => {
    return (
        <div className={styles.labelTitleWrapper}>
            <div className={styles.left}>
                <span className={styles.labelLine} />
                <span>{label}</span>
            </div>
            <div className={styles.right}>{extra}</div>
        </div>
    )
}
// 基本信息组件
export const BasicCantainer = (props: any) => {
    const { basicCantainerContent, labelWidth = 'auto' } = props
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
    {
        key: OperationType.SYNC_INTERFACE,
        label: __('同步接口'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.TEST,
        label: __('测试'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: OperationType.LOG,
        label: __('日志'),
        menuType: OptionMenuType.Menu,
    },
]

/**
 * button信息
 */
export interface ButtonGroupItem {
    // 状态组合，保存当前的数据所处状态
    StatusGroup: [PublishStatus, OnlineStatus]
    menus: Array<OperationType>
}

export const allAccessButtonList: Array<ButtonGroupItem> = [
    {
        //  未发布，未上线
        StatusGroup: [PublishStatus.UNPUBLISHED, OnlineStatus.NOT_ONLINE],
        menus: [],
    },
    {
        // 发布审核中， 未上线
        StatusGroup: [PublishStatus.PUB_AUDITING, OnlineStatus.NOT_ONLINE],
        menus: [OperationType.TEST],
    },
    {
        // 发布审核未通过， 未上线
        StatusGroup: [PublishStatus.PUB_REJECT, OnlineStatus.NOT_ONLINE],
        menus: [OperationType.TEST],
    },
    {
        // 已发布，未上线
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.NOT_ONLINE],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 变更审核中，未上线
        StatusGroup: [PublishStatus.CHANGE_AUDITING, OnlineStatus.NOT_ONLINE],
        menus: [OperationType.TEST, OperationType.LOG],
    },

    {
        // 变更审核未通过，未上线
        StatusGroup: [PublishStatus.CHANGE_REJECT, OnlineStatus.NOT_ONLINE],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 已发布，上线审核中
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.UP_AUDITING],
        menus: [OperationType.TEST, OperationType.LOG],
    },

    {
        // 已发布，上线审核未通过
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.UP_REJECT],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 变更审核中，上线审核未通过
        StatusGroup: [PublishStatus.CHANGE_AUDITING, OnlineStatus.UP_REJECT],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 变更审核未通过，上线审核未通过
        StatusGroup: [PublishStatus.CHANGE_REJECT, OnlineStatus.UP_REJECT],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 已发布, 已上线
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.ONLINE],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 已发布, 下线审核中
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.DOWN_AUDITING],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 已发布, 已下线
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.OFFLINE],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 已发布, 下线审核未通过
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.DOWN_REJECT],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 变更审核中, 下线审核未通过
        StatusGroup: [PublishStatus.CHANGE_AUDITING, OnlineStatus.DOWN_REJECT],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 变更审核未通过, 下线审核未通过
        StatusGroup: [PublishStatus.CHANGE_REJECT, OnlineStatus.DOWN_REJECT],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 变更审核中, 已上线
        StatusGroup: [PublishStatus.CHANGE_AUDITING, OnlineStatus.ONLINE],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 变更审核未通过, 已上线
        StatusGroup: [PublishStatus.CHANGE_REJECT, OnlineStatus.ONLINE],
        menus: [OperationType.TEST, OperationType.LOG],
    },

    {
        // 变更审核中, 已下线
        StatusGroup: [PublishStatus.CHANGE_AUDITING, OnlineStatus.OFFLINE],
        menus: [OperationType.TEST, OperationType.LOG],
    },
    {
        // 变更审核未通过, 已下线
        StatusGroup: [PublishStatus.CHANGE_REJECT, OnlineStatus.OFFLINE],
        menus: [OperationType.TEST, OperationType.LOG],
    },
]

/**
 * 状态管理
 */
export const ButtonGroupLists: Array<ButtonGroupItem> = [
    {
        //  未发布，未上线
        StatusGroup: [PublishStatus.UNPUBLISHED, OnlineStatus.NOT_ONLINE],
        menus: [OperationType.DETAIL, OperationType.EDIT, OperationType.DELETE],
    },
    {
        // 发布审核中， 未上线
        StatusGroup: [PublishStatus.PUB_AUDITING, OnlineStatus.NOT_ONLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.PUBLISH_AUDIT_RETRACT,
            OperationType.TEST,
        ],
    },
    {
        // 发布审核未通过， 未上线
        StatusGroup: [PublishStatus.PUB_REJECT, OnlineStatus.NOT_ONLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.EDIT,
            OperationType.DELETE,
            OperationType.TEST,
        ],
    },
    {
        // 已发布，未上线
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.NOT_ONLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.ONLINE,
            OperationType.CHANGE,
            OperationType.TEST,
            OperationType.LOG,
            OperationType.SYNC_INTERFACE,
            OperationType.DELETE,
        ],
    },
    {
        // 变更审核中，未上线
        StatusGroup: [PublishStatus.CHANGE_AUDITING, OnlineStatus.NOT_ONLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.CHANGE_AUDIT_RETRACT,
            OperationType.TEST,
            OperationType.LOG,
        ],
    },

    {
        // 变更审核未通过，未上线
        StatusGroup: [PublishStatus.CHANGE_REJECT, OnlineStatus.NOT_ONLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.ONLINE,
            OperationType.EDIT,
            OperationType.TEST,
            OperationType.LOG,
            OperationType.DELETE,
        ],
    },
    {
        // 已发布，上线审核中
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.UP_AUDITING],
        menus: [
            OperationType.DETAIL,
            OperationType.ONLINE_AUDIT_RETRACT,
            OperationType.TEST,
            OperationType.LOG,
        ],
    },

    {
        // 已发布，上线审核未通过
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.UP_REJECT],
        menus: [
            OperationType.DETAIL,
            OperationType.ONLINE,
            OperationType.CHANGE,
            OperationType.TEST,
            OperationType.LOG,
            OperationType.DELETE,
        ],
    },
    {
        // 变更审核中，上线审核未通过
        StatusGroup: [PublishStatus.CHANGE_AUDITING, OnlineStatus.UP_REJECT],
        menus: [
            OperationType.DETAIL,
            OperationType.CHANGE_AUDIT_RETRACT,
            OperationType.TEST,
            OperationType.LOG,
        ],
    },
    {
        // 变更审核未通过，上线审核未通过
        StatusGroup: [PublishStatus.CHANGE_REJECT, OnlineStatus.UP_REJECT],
        menus: [
            OperationType.DETAIL,
            OperationType.ONLINE,
            OperationType.EDIT,
            OperationType.TEST,
            OperationType.LOG,
            OperationType.DELETE,
        ],
    },
    {
        // 已发布, 已上线
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.ONLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.OFFLINE,
            OperationType.CHANGE,
            OperationType.TEST,
            OperationType.LOG,
        ],
    },
    {
        // 已发布, 下线审核中
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.DOWN_AUDITING],
        menus: [
            OperationType.DETAIL,
            OperationType.OFFLINE_AUDIT_RETRACT,
            OperationType.TEST,
            OperationType.LOG,
        ],
    },
    {
        // 已发布, 已下线
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.OFFLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.ONLINE,
            OperationType.CHANGE,
            OperationType.TEST,
            OperationType.LOG,
            OperationType.DELETE,
        ],
    },
    {
        // 已发布, 下线审核未通过
        StatusGroup: [PublishStatus.PUBLISHED, OnlineStatus.DOWN_REJECT],
        menus: [
            OperationType.DETAIL,
            OperationType.OFFLINE,
            OperationType.CHANGE,
            OperationType.TEST,
            OperationType.LOG,
        ],
    },
    {
        // 变更审核中, 下线审核未通过
        StatusGroup: [PublishStatus.CHANGE_AUDITING, OnlineStatus.DOWN_REJECT],
        menus: [OperationType.DETAIL, OperationType.CHANGE_AUDIT_RETRACT],
    },
    {
        // 变更审核未通过, 下线审核未通过
        StatusGroup: [PublishStatus.CHANGE_REJECT, OnlineStatus.DOWN_REJECT],
        menus: [
            OperationType.DETAIL,
            OperationType.OFFLINE,
            OperationType.EDIT,
        ],
    },
    {
        // 变更审核中, 已上线
        StatusGroup: [PublishStatus.CHANGE_AUDITING, OnlineStatus.ONLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.CHANGE_AUDIT_RETRACT,
            OperationType.TEST,
            OperationType.LOG,
        ],
    },
    {
        // 变更审核未通过, 已上线
        StatusGroup: [PublishStatus.CHANGE_REJECT, OnlineStatus.ONLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.OFFLINE,
            OperationType.EDIT,
            OperationType.TEST,
            OperationType.LOG,
        ],
    },

    {
        // 变更审核中, 已下线
        StatusGroup: [PublishStatus.CHANGE_AUDITING, OnlineStatus.OFFLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.CHANGE_AUDIT_RETRACT,
            OperationType.TEST,
            OperationType.LOG,
        ],
    },
    {
        // 变更审核未通过, 已下线
        StatusGroup: [PublishStatus.CHANGE_REJECT, OnlineStatus.OFFLINE],
        menus: [
            OperationType.DETAIL,
            OperationType.ONLINE,
            OperationType.EDIT,
            OperationType.TEST,
            OperationType.LOG,
            OperationType.DELETE,
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

/**
 * 根据按钮长度，改变按钮类型
 * @param btnList 按钮列表
 * @param length 按钮长度
 * @returns 按钮列表
 */
export const changeBtnListType = (
    btnList: Array<menuTypes>,
    length: number,
) => {
    if (length >= btnList.length) {
        return btnList
    }
    return btnList.map((item, index) => {
        return {
            ...item,
            menuType:
                length > index + 1 ? OptionMenuType.Menu : OptionMenuType.More,
        }
    })
}
