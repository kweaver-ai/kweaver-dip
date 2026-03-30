import { FC, useEffect, useState } from 'react'
import { Input, Modal, Space, Spin, Table } from 'antd'
import { noop } from 'lodash'
import { LeftOutlined } from '@ant-design/icons'
import {
    CatalogType,
    formatError,
    getCodeRuleDetails,
    getCodeTableByIds,
    getDictDetailById,
} from '@/core'
import { CodeStatus } from './const'
import __ from './locale'
import {
    RuleCustomType,
    RuleMethod,
    RuleTypeOptions,
} from '../CodeRulesComponent/const'
import CodeStatusLabel from './CodeStatusLabel'
import { StateType } from '@/utils'
import styles from './styles.module.less'

interface IViewRuleRegular {
    open: boolean
    codeRuleId: string
    onClose: () => void
    regularType: CatalogType.CODINGRULES | CatalogType.CODETABLE
}

const ViewRuleRegular: FC<IViewRuleRegular> = ({
    open,
    codeRuleId,
    onClose = noop,
    regularType,
}) => {
    // 数据详情
    const [details, setDetails] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)

    const [recommendCodeTable, setRecommendCodeTable] = useState<Array<any>>([])

    const [historyDetail, setHistoryDetail] = useState<any>()

    const [codeType, setCodeType] = useState<
        CatalogType.CODINGRULES | CatalogType.CODETABLE
    >(regularType)

    useEffect(() => {
        if (codeRuleId) {
            getCodeRuleDetail(codeRuleId, regularType)
        }
        setRecommendCodeTable([])
    }, [codeRuleId])

    useEffect(() => {
        setCodeType(regularType)
    }, [regularType])

    /**
     * 编码规则的规则表头
     */
    const codeRuleColumns = [
        {
            title: __('分段长度'),
            key: 'segment_length',
            width: 120,
            ellipsis: true,
            render: (_, record) => record.segment_length,
        },
        {
            title: __('规则名称'),
            key: 'name',
            width: 120,
            ellipsis: true,
            render: (_, record) => record.name || '--',
        },
        {
            title: __('规则类型'),
            key: 'type',
            width: 120,
            ellipsis: true,
            render: (_, record) =>
                RuleTypeOptions.find(
                    (currentRuleType) => record.type === currentRuleType.value,
                )?.label || '--',
        },
        {
            title: __('规则格式/值'),
            key: 'value',
            width: 120,
            ellipsis: true,
            render: (_, record) => {
                if (record.type === RuleCustomType.CodeTable) {
                    const codeTable = recommendCodeTable.find(
                        (currentCode) => currentCode.id === record.value,
                    )
                    return (
                        <span
                            onClick={async () => {
                                if (codeTable) {
                                    setHistoryDetail(details)
                                    await getCodeRuleDetail(
                                        codeTable.id,
                                        CatalogType.CODETABLE,
                                    )
                                    setCodeType(CatalogType.CODETABLE)
                                }
                            }}
                            className={
                                codeTable?.ch_name ? styles.valueText : ''
                            }
                        >
                            {codeTable?.ch_name || '--'}
                        </span>
                    )
                }
                return <span>{record.value}</span>
            },
        },
    ]
    // 码表的表头
    const codeTableColumns = [
        {
            title: __('码值'),
            key: 'code',
            width: 120,
            ellipsis: true,
            render: (_, record) => record.code || '--',
        },
        {
            title: __('码值描述'),
            key: 'value',
            width: 120,
            ellipsis: true,
            render: (_, record) => record.value || '--',
        },
        {
            title: __('说明'),
            key: 'description',
            width: 120,
            ellipsis: true,
            render: (_, record) => record.description || '--',
        },
    ]

    /**
     * 获取当前编码规则的详情
     * @param id
     */
    const getCodeRuleDetail = async (id, type) => {
        try {
            setLoading(true)
            if (type === CatalogType.CODINGRULES) {
                const { data } = await getCodeRuleDetails(id)
                if (data.rule_type === RuleMethod.Customer) {
                    const codeTableIds: Array<string> =
                        data.custom?.reduce(
                            (preData: Array<string>, currentData) => {
                                if (
                                    currentData.type ===
                                    RuleCustomType.CodeTable
                                ) {
                                    return [...preData, currentData.value]
                                }
                                return preData
                            },
                            [],
                        ) || []
                    if (codeTableIds.length) {
                        const codeTableData = await getCodeTableByIds(
                            codeTableIds,
                        )
                        setRecommendCodeTable(codeTableData?.data || [])
                    }
                }
                setDetails(data)
            } else {
                const { data } = await getDictDetailById(id)
                setDetails(data)
            }
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title={
                codeType === CatalogType.CODETABLE ? __('码表') : __('编码规则')
            }
            width={640}
            open={open}
            bodyStyle={{
                padding: '24px',
            }}
            onCancel={onClose}
            getContainer={false}
            footer={null}
        >
            {loading ? (
                <div className={styles.spinCodeViewBody}>
                    <Spin />
                </div>
            ) : (
                <div className={styles.codeViewWrapper}>
                    <div className={styles.titleBox}>
                        {historyDetail ? (
                            <div className={styles.shrinkEle}>
                                <Space
                                    onClick={() => {
                                        // 返回到历史
                                        setDetails(historyDetail)
                                        // 清空历史
                                        setHistoryDetail(undefined)
                                        setCodeType(CatalogType.CODINGRULES)
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <LeftOutlined />
                                    <span>{__('返回')}</span>
                                    <span>|</span>
                                </Space>
                            </div>
                        ) : null}

                        <div className={styles.flexBox}>
                            <span
                                className={styles.titleName}
                                title={details?.name || details?.ch_name || ''}
                            >
                                {details?.name || details?.ch_name || ''}
                            </span>
                        </div>
                        <div className={styles.shrinkEle}>
                            <CodeStatusLabel
                                status={
                                    details?.deleted
                                        ? CodeStatus.Deleted
                                        : details?.state === StateType.DISABLE
                                        ? CodeStatus.Disabled
                                        : CodeStatus.Normal
                                }
                            />
                        </div>
                    </div>
                    {details?.rule_type === RuleMethod.Regular ? (
                        <div className={styles.regularText}>
                            {details.regex}
                        </div>
                    ) : (
                        <div className={styles.regularTable}>
                            <Table
                                columns={
                                    codeType === CatalogType.CODETABLE
                                        ? codeTableColumns
                                        : codeRuleColumns
                                }
                                dataSource={
                                    codeType === CatalogType.CODETABLE
                                        ? details.enums
                                        : details.custom
                                }
                                scroll={{
                                    x: 580,
                                    y: 424,
                                }}
                                pagination={false}
                            />
                        </div>
                    )}
                </div>
            )}
        </Modal>
    )
}

export default ViewRuleRegular
