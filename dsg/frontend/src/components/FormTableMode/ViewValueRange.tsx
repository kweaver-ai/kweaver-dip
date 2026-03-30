import { FC, useEffect, useRef, useState, CSSProperties } from 'react'
import { Tooltip } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { CodeStatus, ValueRangeType, exChangeRangeDataToObj } from './const'
import DataEleDetails from '../DataEleManage/Details'
import {
    CatalogType,
    formatError,
    getCodeRuleDetails,
    getDataEleDetailById,
    getDictDetailById,
} from '@/core'
import __ from './locale'
import styles from './styles.module.less'

import ViewRuleRegular from './ViewRuleRegular'
import CodeStatusLabel from './CodeStatusLabel'
import { StateType } from '@/utils'

/**
 * 选择“编码规则/码表”
 */
interface ISelectValueRange {
    type: ValueRangeType
    value?: string
    style?: CSSProperties
    showLabel?: boolean
}

const ViewValueRange: FC<ISelectValueRange> = ({
    type,
    value,
    style,
    showLabel = true,
}) => {
    // 当前选择的数据结果
    const [selectedData, setSelectedData] = useState<any>()

    // 标准类型
    const [catalogViewType, setCatalogViewType] = useState<
        CatalogType.CODETABLE | CatalogType.CODINGRULES | CatalogType.DATAELE
    >(CatalogType.CODINGRULES)

    // 预览详情的信息
    const [codeViewId, setCodeViewId] = useState<string>('')
    // 当前选择的数据详情
    const [selectedDataDetail, setSelectedDataDetail] = useState<any>()
    const [deleted, setDeleted] = useState<boolean>(false)

    useEffect(() => {
        if (value) {
            const objInfo = exChangeRangeDataToObj(value)
            if (objInfo.id) {
                getCodeRuleDetail(objInfo.id)
            }
            setSelectedData(objInfo)
        } else {
            setSelectedData(undefined)
        }
    }, [value])

    /**
     * 获取当前编码规则的详情
     * @param id
     */
    const getCodeRuleDetail = async (id) => {
        try {
            if (type === ValueRangeType.CodeRule) {
                const res = await getCodeRuleDetails(id)
                setSelectedDataDetail(res.data)
            } else if (type === ValueRangeType.DataElement) {
                const res = await getDataEleDetailById({ type: 2, value: id })
                setSelectedData({ ...selectedData, id: res.data.id })
                setSelectedDataDetail(res.data)
            } else {
                const res = await getDictDetailById(id)
                setSelectedDataDetail(res.data)
            }
        } catch (ex) {
            if (ex.data.code === 'Standardization.ResourceError.DataNotExist') {
                setDeleted(true)
            } else {
                formatError(ex)
            }
        }
    }

    const getEditComponent = () => {
        switch (type) {
            case ValueRangeType.CodeRule:
                return (
                    <div className={styles.viewRulerWrapper} style={style}>
                        {showLabel && (
                            <span className={styles.shrinkEle}>
                                {__('编码规则')}
                            </span>
                        )}
                        <div className={styles.nameBox}>
                            <span
                                className={styles.shrinkEle}
                                hidden={!showLabel}
                            >
                                (
                            </span>
                            <div
                                onClick={() => {
                                    if (deleted) {
                                        return
                                    }
                                    setCatalogViewType(CatalogType.CODINGRULES)
                                    setCodeViewId(selectedData.id)
                                }}
                                className={
                                    deleted
                                        ? styles.flexBoxNotData
                                        : selectedData?.id
                                        ? styles.flexBox
                                        : styles.normalBox
                                }
                                title={
                                    selectedDataDetail?.ch_name ||
                                    selectedDataDetail?.name ||
                                    selectedData?.name
                                }
                            >
                                {selectedDataDetail?.ch_name ||
                                    selectedDataDetail?.name ||
                                    selectedData?.name}
                            </div>
                            {deleted ? (
                                <Tooltip
                                    title={__('该数据不存在!')}
                                    color="#fff"
                                    overlayInnerStyle={{ color: '#e60012' }}
                                >
                                    <ExclamationCircleOutlined
                                        style={{
                                            color: '#e60012',
                                            margin: '0 4px',
                                            flexShrink: '0',
                                        }}
                                    />
                                </Tooltip>
                            ) : (
                                <div className={styles.shrinkEle}>
                                    {selectedDataDetail ? (
                                        <CodeStatusLabel
                                            status={
                                                selectedDataDetail.deleted
                                                    ? CodeStatus.Deleted
                                                    : selectedDataDetail.state ===
                                                      StateType.DISABLE
                                                    ? CodeStatus.Disabled
                                                    : CodeStatus.Normal
                                            }
                                        />
                                    ) : null}
                                </div>
                            )}

                            <span
                                className={styles.shrinkEle}
                                hidden={!showLabel}
                            >
                                )
                            </span>
                        </div>
                    </div>
                )
            case ValueRangeType.CodeTable:
                return (
                    <div className={styles.viewRulerWrapper}>
                        {showLabel && (
                            <span className={styles.shrinkEle}>
                                {__('码表')}
                            </span>
                        )}
                        <div className={styles.nameBox}>
                            <span
                                className={styles.shrinkEle}
                                hidden={!showLabel}
                            >
                                (
                            </span>
                            <div
                                onClick={() => {
                                    if (deleted) {
                                        return
                                    }
                                    setCatalogViewType(CatalogType.CODETABLE)
                                    setCodeViewId(selectedData.id)
                                }}
                                className={
                                    deleted
                                        ? styles.flexBoxNotData
                                        : styles.flexBox
                                }
                                style={
                                    deleted
                                        ? {
                                              color: 'rgba(0,0,0,0.45)',
                                              cursor: 'default',
                                          }
                                        : undefined
                                }
                                title={
                                    selectedDataDetail?.ch_name ||
                                    selectedDataDetail?.name ||
                                    selectedData?.name
                                }
                            >
                                {selectedDataDetail?.ch_name ||
                                    selectedDataDetail?.name ||
                                    selectedData?.name}
                            </div>
                            {deleted ? (
                                <Tooltip
                                    title={__('该数据不存在!')}
                                    color="#fff"
                                    overlayInnerStyle={{ color: '#e60012' }}
                                >
                                    <ExclamationCircleOutlined
                                        style={{
                                            color: '#e60012',
                                            margin: '0 4px',
                                            flexShrink: '0',
                                        }}
                                    />
                                </Tooltip>
                            ) : (
                                <div className={styles.shrinkEle}>
                                    {selectedDataDetail ? (
                                        <CodeStatusLabel
                                            status={
                                                selectedDataDetail.deleted
                                                    ? CodeStatus.Deleted
                                                    : selectedDataDetail.state ===
                                                      StateType.DISABLE
                                                    ? CodeStatus.Disabled
                                                    : CodeStatus.Normal
                                            }
                                        />
                                    ) : null}
                                </div>
                            )}

                            <span
                                className={styles.shrinkEle}
                                hidden={!showLabel}
                            >
                                )
                            </span>
                        </div>
                    </div>
                )
            case ValueRangeType.DataElement:
                return (
                    <div className={styles.viewRulerWrapper}>
                        <div className={styles.nameBox}>
                            <div
                                onClick={() => {
                                    if (deleted) {
                                        return
                                    }
                                    setCatalogViewType(CatalogType.DATAELE)
                                    setCodeViewId(selectedData.id)
                                }}
                                className={
                                    deleted
                                        ? styles.flexBoxNotData
                                        : styles.flexBox
                                }
                                style={
                                    deleted
                                        ? {
                                              color: 'rgba(0,0,0,0.45)',
                                              cursor: 'default',
                                          }
                                        : undefined
                                }
                                title={
                                    selectedDataDetail?.name_cn ||
                                    selectedDataDetail?.name ||
                                    selectedData?.name
                                }
                            >
                                {selectedDataDetail?.name_cn ||
                                    selectedDataDetail?.name ||
                                    selectedData?.name}
                            </div>
                            {deleted ? (
                                <Tooltip
                                    title={__('该数据不存在!')}
                                    color="#fff"
                                    overlayInnerStyle={{ color: '#e60012' }}
                                >
                                    <ExclamationCircleOutlined
                                        style={{
                                            color: '#e60012',
                                            margin: '0 4px',
                                            flexShrink: '0',
                                        }}
                                    />
                                </Tooltip>
                            ) : (
                                <div className={styles.shrinkEle}>
                                    {selectedDataDetail ? (
                                        <CodeStatusLabel
                                            status={
                                                selectedDataDetail.deleted
                                                    ? CodeStatus.Deleted
                                                    : selectedDataDetail.state ===
                                                      StateType.DISABLE
                                                    ? CodeStatus.Disabled
                                                    : CodeStatus.Normal
                                            }
                                        />
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                )
            case ValueRangeType.Custom:
                return (
                    <div className={styles.viewRulerWrapper} style={style}>
                        <span className={styles.shrinkEle}>{__('自定义')}</span>
                        <div className={styles.nameBox}>
                            <span className={styles.shrinkEle}>(</span>
                            <div
                                className={styles.normalBox}
                                title={selectedData?.name}
                            >
                                {selectedData?.name}
                            </div>
                            <span className={styles.shrinkEle}>)</span>
                        </div>
                    </div>
                )
            default:
                return __('无')
        }
    }

    return (
        <div className={styles.viewRulerContainer} style={style}>
            {getEditComponent()}
            {/* 选择码表/编码规则 */}
            {codeViewId && catalogViewType !== CatalogType.DATAELE && (
                <ViewRuleRegular
                    onClose={() => {
                        setCodeViewId('')
                    }}
                    codeRuleId={codeViewId}
                    open={!!codeViewId}
                    regularType={catalogViewType}
                />
            )}

            {/* 查看数据元详情 */}
            {catalogViewType === CatalogType.DATAELE && !!codeViewId && (
                <DataEleDetails
                    visible={!!codeViewId}
                    dataEleId={codeViewId}
                    onClose={() => {
                        setCodeViewId('')
                    }}
                    getContainer={false}
                />
            )}
        </div>
    )
}

export default ViewValueRange
