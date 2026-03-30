import { FC, useEffect, useState } from 'react'
import { Drawer } from 'antd'
import moment from 'moment'
import { NodeType } from '@/core/consanguinity'
import __ from './locale'
import styles from './styles.module.less'
import { getDatasheetViewDetails, getDataViewBaseInfo } from '@/core'
import { BasicCantainer } from '../ApiServices/helper'
import { ExcelDetailConfig, TableConfig } from './const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { getState } from '../DatasheetView/helper'
import { onLineStatusList } from '../DatasheetView/const'
import { TimeRender } from '../DataAssetsCatlg/LogicViewDetail/helper'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

interface TableDetailProps {
    open: boolean
    onClose: () => void
    tableId: string
    type: NodeType
}
const TableDetail: FC<TableDetailProps> = ({
    open,
    onClose,
    tableId,
    type,
}) => {
    // 获取表详情
    const [detailInfo, setDetailInfo] = useState<any>(
        TableConfig[NodeType.FORM_VIEW],
    )

    const [{ using }] = useGeneralConfig()

    useEffect(() => {
        if (tableId && type) {
            getTableDetail()
        }
    }, [tableId, type])

    /**
     * 获取详情信息内容
     */
    const getDetailInfoContent = (
        configTemplate: any,
        baseInfo: any,
        detailData: any,
    ) => {
        const hasTimestamp = detailData?.fields?.some(
            (o) => o.business_timestamp,
        )
        const list = configTemplate.map((item) => {
            const detailsField =
                using === 1
                    ? item.list.filter((o) => o.key !== 'online_status')
                    : hasTimestamp
                    ? item.list
                    : item.list.filter((o) => o.key !== 'data_updated_at')
            return {
                ...item,
                list: detailsField.map((it) => {
                    let value: any
                    if (it.key === 'created_at' || it.key === 'updated_at') {
                        value = moment(baseInfo?.[it.key]).format(
                            'YYYY-MM-DD HH:mm:ss',
                        )
                    } else {
                        value = baseInfo?.[it.key] || ''
                    }
                    const obj = {
                        ...it,
                        value,
                        render: () =>
                            it.key === 'status' ? (
                                getState(
                                    baseInfo?.last_publish_time
                                        ? 'publish'
                                        : 'unpublished',
                                )
                            ) : it.key === 'online_status' ? (
                                getState(
                                    baseInfo?.online_status,
                                    onLineStatusList,
                                )
                            ) : it.key === 'data_updated_at' ? (
                                <TimeRender formViewId={baseInfo?.id} />
                            ) : undefined,
                    }
                    return obj
                }),
            }
        })
        setDetailInfo(
            list.map((item) => {
                return {
                    ...item,
                    list: item.list.map((it) => {
                        if (it.key === 'sheet') {
                            return {
                                ...it,
                                value: (
                                    <div className={styles.sheetWrapper}>
                                        {baseInfo?.sheet
                                            ?.split(',')
                                            .map((sheetName, index) => {
                                                return (
                                                    <div
                                                        key={index}
                                                        className={styles.item}
                                                        title={sheetName}
                                                    >
                                                        <FontIcon name="icon-sheetye" />
                                                        <span
                                                            className={
                                                                styles.text
                                                            }
                                                        >
                                                            {sheetName}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                ),
                            }
                        }
                        if (it.key === 'cell_range') {
                            return {
                                ...it,
                                value: `${baseInfo?.start_cell}-${baseInfo?.end_cell}`,
                            }
                        }
                        if (it.key === 'sheet_as_new_column') {
                            return {
                                ...it,
                                value: baseInfo?.sheet_as_new_column
                                    ? __('是')
                                    : __('否'),
                            }
                        }
                        if (it.key === 'has_headers') {
                            return {
                                ...it,
                                value: baseInfo?.has_headers
                                    ? __('选取首行字段')
                                    : __('自定义'),
                            }
                        }
                        if (it.key === 'excel_file_name') {
                            return {
                                ...it,
                                render: () => {
                                    return baseInfo?.[it.key] ? (
                                        <div
                                            className={styles.excelFileWrapper}
                                            title={baseInfo?.[it.key]}
                                        >
                                            <FontIcon
                                                name="icon-xls"
                                                type={IconType.COLOREDICON}
                                                className={styles.icon}
                                            />
                                            <span
                                                className={styles.excelFileText}
                                            >
                                                {baseInfo?.[it.key]}
                                            </span>
                                        </div>
                                    ) : (
                                        '--'
                                    )
                                },
                            }
                        }
                        return {
                            ...it,
                            value: baseInfo?.[it.key],
                        }
                    }),
                }
            }),
        )
    }

    /**
     * 获取表详情
     */
    const getTableDetail = async () => {
        if (type === NodeType.FORM_VIEW) {
            const resData = await getDatasheetViewDetails(tableId)
            const basInfo = await getDataViewBaseInfo(tableId)
            const configTemplate =
                resData.datasource_type === 'excel'
                    ? ExcelDetailConfig
                    : TableConfig[NodeType.FORM_VIEW]
            getDetailInfoContent(configTemplate, basInfo, resData)
        }
    }

    return (
        <div>
            <Drawer
                title={__('库表详情')}
                placement="right"
                onClose={onClose}
                open={open}
                width={400}
                getContainer={false}
                mask={false}
                destroyOnClose
            >
                <div>
                    <BasicCantainer
                        basicCantainerContent={detailInfo}
                        labelWidth="140px"
                    />
                </div>
            </Drawer>
        </div>
    )
}

export default TableDetail
