import { FC } from 'react'
import { Table, Form, Input, Select, TabsProps, Tooltip } from 'antd'
import { RescCatlgType, operatorList, maskingList } from '../ApiServices/const'
import DetailsLabel from '../../ui/DetailsLabel'
import __ from './locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { PublishStatus } from '@/core'
import styles from './styles.module.less'

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

// 审核代办 下样式不加载，不能使用class，全局使用style行内样式
export interface ILabelTitle {
    label: string
}
export const LabelTitle = ({ label }: ILabelTitle) => {
    return (
        <div
            style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                padding: '5px 0',
                margin: '20px 0',
                background: 'rgb(0 55 150 / 2%)',
                color: 'rgb(0 0 0 / 85%)',
                fontSize: '16px',
                fontWeight: '550',
            }}
        >
            <span
                style={{
                    display: ' inline-block',
                    width: ' 2px',
                    height: ' 20px',
                    marginRight: '18px',
                    background: ' #126ee3',
                }}
            />
            <span>{label}</span>
        </div>
    )
}
// 基本信息组件
export const BasicCantainer = (props: any) => {
    const { basicCantainerContent } = props
    return basicCantainerContent.map((item) => {
        return (
            <div key={item.label}>
                <LabelTitle label={item.label} />
                <div
                    style={{
                        marginLeft: '12px',
                    }}
                >
                    <DetailsLabel wordBreak detailsList={item.list} />
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
        <div>
            <LabelTitle label="参数配置" />
            <div
                style={{
                    marginLeft: '12px',
                }}
            >
                <div
                    style={{
                        marginBottom: '24px',
                        color: '#000',
                        fontSize: '16px',
                        fontWeight: '550',
                    }}
                >
                    已选择的请求参数
                </div>
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
                            style={{
                                marginBottom: '24px',
                                color: '#000',
                                fontSize: '16px',
                                fontWeight: '550',
                                marginTop: '24px',
                            }}
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
        <div>
            <LabelTitle label="分页设置" />
            <div
                style={{
                    marginLeft: '12px',
                }}
            >
                <div
                    style={{
                        marginTop: ' 10px',
                        marginBottom: ' 18px',
                        color: ' rgb(0 0 0 / 85%)',
                        fontSize: ' 14px',
                    }}
                >
                    返回结果每页显示&nbsp;
                    {detailData?.service_response?.page_size || 5000} 条
                </div>
            </div>
            <LabelTitle label="过滤规则" />
            <div
                style={{
                    marginLeft: '12px',
                }}
            >
                <div
                    style={{
                        marginTop: ' 10px',
                        marginBottom: ' 18px',
                        color: ' rgb(0 0 0 / 85%)',
                        fontSize: ' 14px',
                    }}
                >
                    设置规则，可获取指定条件的数据，条件之间均为“且”的关系
                </div>
                {detailData?.service_response?.rules.map((item, index) => {
                    return (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginLeft: ' -6px',
                            }}
                            key={index}
                        >
                            <Input
                                disabled
                                value={item.param}
                                style={{
                                    width: '220px',
                                    margin: '6px',
                                    height: '32px',
                                }}
                            />
                            <Select
                                disabled
                                value={item.operator}
                                options={operatorList}
                                style={{
                                    margin: '6px',
                                }}
                            />
                            <Input
                                disabled
                                value={item.value}
                                style={{
                                    width: '220px',
                                    margin: '6px',
                                    height: '32px',
                                }}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

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
 * 发布状态文案
 */
export const PublishStatusText = {
    [PublishStatus.UNPUBLISHED]: __('未发布'),
    [PublishStatus.PUBLISHED]: __('已发布'),
    [PublishStatus.PUB_AUDITING]: __('发布审核中'),
    [PublishStatus.CHANGE_AUDITING]: __('变更审核中'),
    [PublishStatus.CHANGE_REJECT]: __('变更审核未通过'),
    [PublishStatus.PUB_REJECT]: __('发布审核未通过'),
}

/**
 * 发布状态颜色
 */
export const PublishStatusColors = {
    [PublishStatus.UNPUBLISHED]: '#D8D8D8',
    [PublishStatus.PUBLISHED]: '#52C41B',
    [PublishStatus.PUB_AUDITING]: '#3A8FF0',
    [PublishStatus.CHANGE_AUDITING]: '#3A8FF0',
    [PublishStatus.CHANGE_REJECT]: '#E60012',
    [PublishStatus.PUB_REJECT]: '#E60012',
}
