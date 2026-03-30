import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Tooltip, Table } from 'antd'
import classnames from 'classnames'
import { v4 } from 'uuid'
import styles from '../styles.module.less'
import __ from '../locale'
import {
    DetailsType,
    IDetailsData,
    IconsType,
    ListType,
    thirdLineData,
} from '../const'
import { TabKey } from '@/components/BusinessModeling/const'
import {
    getIcons,
    getColumnDataInfo,
    detailsTypeMap,
    listTypeMap,
} from '../helper'
import { BusinessFormOutlined, BusinessProcessColored } from '@/icons'
import { ColumnMap, PieGraph } from '../g2plotConfig'
import { getActualUrl } from '@/utils'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { TitleTipsLabel } from './TitleTipsLabel'

interface IDetailsInfoModal {
    open: boolean
    onClose: () => void
    detailData?: any
    modalData: IDetailsData | undefined
}

const DetailsInfoModal: React.FC<IDetailsInfoModal> = ({
    open,
    onClose,
    detailData,
    modalData,
}) => {
    const [pieMapInfo, setPieMapInfo] = useState<any>(thirdLineData[0])
    const {
        type = DetailsType.standardizationFieldDistribution,
        data,
        mapData,
    } = modalData || {}
    const typeMap = detailsTypeMap[type]
    // 列表选中项
    const [selectListItem, setSelectListItem] = useState<any>()

    // 左侧列表数据
    const listData = useMemo(() => {
        if (typeMap.listType) {
            if (typeMap.listType === ListType.Field) {
                return detailData?.evaluation?.consistencyEvaluation
                    ?.standard_consistency?.fields
            }
            if (typeMap.listType === ListType.FlowchartNode) {
                return detailData?.evaluation?.consistencyEvaluation
                    ?.flowchart_consistency?.consistency_nodes
            }
            if (typeMap.listType === ListType.Metric) {
                return detailData?.evaluation?.consistencyEvaluation
                    ?.metric_consistency?.indicators
            }
            if (typeMap.listType === ListType.BusinessProcess) {
                return detailData?.processes
            }
        }
        return undefined
    }, [detailData])

    useEffect(() => {
        if (open && type !== undefined) {
            const info: any = {}

            switch (type) {
                // case DetailsType.requiredFields:
                //     info = thirdLineData.find(
                //         (item) => item.key === 'requiredFields',
                //     )
                //     setPieMapInfo(info)
                //     break
                // case DetailsType.noBusinessFields:
                //     info = thirdLineData.find(
                //         (item) => item.key === 'noBusinessFields',
                //     )
                //     setPieMapInfo(info)
                //     break
                case DetailsType.noFields:
                    setSelectListItem(data)
                    break
                default:
                    if (typeMap.listType) {
                        if (typeMap.listType === ListType.Field) {
                            setSelectListItem(
                                detailData?.evaluation?.consistencyEvaluation
                                    ?.standard_consistency?.fields?.[0],
                            )
                        } else if (
                            typeMap.listType === ListType.FlowchartNode
                        ) {
                            setSelectListItem(
                                detailData?.evaluation?.consistencyEvaluation
                                    ?.flowchart_consistency
                                    ?.consistency_nodes?.[0],
                            )
                        } else if (typeMap.listType === ListType.Metric) {
                            setSelectListItem(
                                detailData?.evaluation?.consistencyEvaluation
                                    ?.metric_consistency?.indicators?.[0],
                            )
                        } else {
                            setSelectListItem(detailData?.processes?.[0])
                        }
                    } else {
                        setSelectListItem(detailData)
                    }
                    break
            }
        }
    }, [typeMap, open])

    // 跳转指定业务模型页面
    const toBusinessModel = (record) => {
        if (!record.businessModelID || record.businessModelLocked) return
        const url = getActualUrl(
            `/coreBusiness/${record.businessModelID}?domainId=${record.id}&departmentId=&targetTab=${TabKey.FORM}&viewType=business-architecture`,
        )
        window.open(url, '_blank')
    }

    const getTitle = () => {
        if (!selectListItem) return ''
        const title = typeMap.topTitle(selectListItem)
        const modelDisbaled =
            !selectListItem.businessModelID ||
            selectListItem.businessModelLocked
        return (
            <div className={styles['modalBox-title']}>
                <div title={title} className={styles['modalBox-title-text']}>
                    {title}
                </div>
                {(typeMap.listType === ListType.BusinessProcess ||
                    type === DetailsType.noFields) && (
                    <div
                        onClick={() => toBusinessModel(selectListItem)}
                        className={styles['modalBox-title-btn']}
                    >
                        {getIcons(
                            IconsType.details,
                            modelDisbaled,
                            selectListItem?.businessModelLocked,
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <Modal
            title={typeMap.title}
            width={typeMap.width}
            open={open}
            onCancel={onClose}
            bodyStyle={{ padding: 0, height: 545, display: 'flex' }}
            className={styles.fieldsTableWrapper}
            maskClosable={false}
            footer={null}
            destroyOnClose
        >
            {!listData && !selectListItem && (
                <Empty
                    iconSrc={dataEmpty}
                    desc={__('暂无数据')}
                    style={{ width: '100%', marginTop: '100px' }}
                />
            )}
            {/* 左侧列表 */}
            {listData && (
                <div className={styles.processesList}>
                    <div className={styles.processesList_title}>
                        {listTypeMap[typeMap.listType].name}
                    </div>
                    <div className={styles.listWrap}>
                        {listData.map((item) => (
                            <div
                                key={item.id}
                                className={classnames(
                                    styles.processesList_item,
                                    selectListItem?.id === item.id &&
                                        styles.selected,
                                )}
                                onClick={() => {
                                    setSelectListItem(item)
                                }}
                            >
                                {typeMap.listType ===
                                    ListType.BusinessProcess && (
                                    <BusinessProcessColored
                                        className={styles.icon}
                                    />
                                )}
                                <span className={styles.text} title={item.name}>
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {selectListItem && (
                <div className={styles.modalBox}>
                    {getTitle()}
                    <div
                        className={classnames(styles['modalBox-content'], {
                            [styles.modalBoxMargin]:
                                type ===
                                DetailsType.standardizationFieldDistribution,
                        })}
                    >
                        {type === DetailsType.noFields && (
                            <div className={styles.tagsBox}>
                                {selectListItem?.completeness?.businessFormWithoutInfoItem?.map(
                                    (item: any, index) => {
                                        return (
                                            <div
                                                className={styles.tagsItem}
                                                key={`${item}-${index}`}
                                                title={item}
                                            >
                                                <BusinessFormOutlined
                                                    className={styles.tagsIcon}
                                                />
                                                <span
                                                    className={styles.tagsText}
                                                >
                                                    {item}
                                                </span>
                                            </div>
                                        )
                                    },
                                )}
                            </div>
                        )}
                        {type ===
                            DetailsType.standardizationFieldDistribution && (
                            // ||
                            // type === DetailsType.requiredFields ||
                            // type === DetailsType.noBusinessFields
                            <>
                                <div>
                                    {type ===
                                        DetailsType.standardizationFieldDistribution && (
                                        <>
                                            <div
                                                className={
                                                    styles['modalBox-title']
                                                }
                                            >
                                                {__(
                                                    '业务标准表字段数量分布如下：',
                                                )}
                                            </div>

                                            <div
                                                className={
                                                    styles['content-second']
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles[
                                                            'content-second-title'
                                                        ]
                                                    }
                                                >
                                                    <TitleTipsLabel
                                                        label={__(
                                                            '业务表标准字段数量分布',
                                                        )}
                                                        showDot
                                                    />
                                                </div>
                                                <ColumnMap
                                                    dataInfo={getColumnDataInfo(
                                                        selectListItem
                                                            ?.businessFormComplexity
                                                            ?.forms,
                                                    )}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {/* {(type === DetailsType.requiredFields ||
                                        type ===
                                            DetailsType.noBusinessFields) && (
                                        <PieGraph
                                            dataInfo={mapData || []}
                                            color={pieMapInfo?.color}
                                            lengends={pieMapInfo?.lengend}
                                            title={pieMapInfo?.title}
                                            tips={pieMapInfo?.tips}
                                            height={278}
                                        />
                                    )} */}
                                </div>
                                <div>
                                    <div
                                        className={
                                            styles[
                                                'modalBox-content-secondTitle'
                                            ]
                                        }
                                    >
                                        {__('每张表字段分布如下：')}
                                    </div>
                                </div>
                            </>
                        )}
                        {typeMap.columns && (
                            <Table
                                pagination={{
                                    hideOnSinglePage: true,
                                    pageSize: 10,
                                    size: 'small',
                                }}
                                rowKey={v4()}
                                dataSource={
                                    typeMap.tableData(selectListItem) || []
                                }
                                columns={typeMap.columns || []}
                                scroll={{
                                    y: 384,
                                }}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            iconSrc={dataEmpty}
                                            desc={__('暂无数据')}
                                        />
                                    ),
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default DetailsInfoModal
