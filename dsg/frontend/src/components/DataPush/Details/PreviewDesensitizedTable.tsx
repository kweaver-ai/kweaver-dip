import React, { memo, useEffect, useRef, useState } from 'react'
import { Popover, Table } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import { VIEWERRORCODElIST } from '@/components/DatasheetView/const'
import {
    formatError,
    postDataViewDesensitizationFieldDataPreview,
} from '@/core'
import { renderEmpty, renderLoader } from '../helper'

export const PreviewBtn = ({ fieldData }: any) => {
    const [visible, setVisible] = useState(false)

    return (
        <Popover
            content={
                <PreviewDesensitizedTable
                    fieldData={fieldData}
                    open={visible}
                />
            }
            placement="right"
            trigger="click"
            onOpenChange={setVisible}
        >
            <a style={{ marginLeft: 6 }}>{__('预览')}</a>
        </Popover>
    )
}

interface IPreviewDesensitizedTable {
    fieldData: any
    open: boolean
}

const PreviewDesensitizedTable = ({
    fieldData,
    open,
}: IPreviewDesensitizedTable) => {
    const [loading, setLoading] = useState(false)
    const [tableData, setTableData] = useState<any[]>([])
    const [columns, setColumns] = useState<Array<any>>([])
    const abortControllerRef = useRef<AbortController | null>()
    const [lastData, setLastData] = useState<any>()

    useEffect(() => {
        if (
            open &&
            (lastData?.desensitization_rule_id !==
                fieldData?.desensitization_rule_id ||
                tableData.length === 0)
        ) {
            setLastData(fieldData)
            setTableData([])
            getPreviewData()
        } else if (abortControllerRef?.current) {
            abortControllerRef.current.abort()
        }
    }, [fieldData?.id, fieldData?.desensitization_rule_id, open])

    const getPreviewData = async () => {
        if (abortControllerRef?.current) {
            abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()
        try {
            setLoading(true)
            const data = await postDataViewDesensitizationFieldDataPreview(
                {
                    form_view_field_id: fieldData.id,
                    desensitization_rule_id: fieldData.desensitization_rule_id,
                },
                {
                    signal: abortControllerRef.current.signal,
                },
            )
            const list: any[] = []
            const resColumns =
                data?.columns?.map((item) => {
                    return {
                        ...item,
                        technical_name: fieldData.technical_name,
                        business_name: fieldData?.business_name,
                    }
                }) || []
            const names = data?.columns?.map((item) => item.name)
            data?.data.forEach((item) => {
                const obj: any = {}
                names.forEach((it, inx) => {
                    // 二进制大对象不显示
                    obj[it] = it === 'long_blob_data' ? '[Record]' : item[inx]
                })
                list.push(obj)
            })

            setColumns(
                resColumns.map((cItem) => {
                    return {
                        title: (
                            <div>
                                <div className={styles.tableTDContnet}>
                                    <span className={styles.nameIcon}>
                                        {getFieldTypeEelment(cItem, 20)}
                                    </span>
                                    <span
                                        title={`${cItem.business_name}`}
                                        className={styles.businessTitle}
                                    >
                                        {cItem.business_name}
                                    </span>
                                </div>
                                <div
                                    className={classnames(
                                        styles.tableTDContnet,
                                        styles.subTableTDContnet,
                                    )}
                                    title={`${cItem.technical_name}`}
                                >
                                    {cItem.technical_name}
                                </div>
                            </div>
                        ),
                        dataIndex: cItem.technical_name,
                        key: cItem.technical_name,
                        ellipsis: true,
                        render: (text) => {
                            const name =
                                text === ''
                                    ? '--'
                                    : text === false ||
                                      text === true ||
                                      text === 0
                                    ? `${text}`
                                    : text
                            return (
                                <div className={styles.tableTDContnet}>
                                    <span
                                        title={`${name}`}
                                        className={styles.businessTitle}
                                    >
                                        {name}
                                    </span>
                                </div>
                            )
                        },
                    }
                }) || [],
            )
            setTableData(list?.slice(0, 5))
            setLoading(false)
        } catch (err) {
            if (err?.data?.code === 'ERR_CANCELED') {
                return
            }
            if (err?.data?.code === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                return
            }
            formatError(err)
            setLoading(false)
        } finally {
            if (abortControllerRef?.current) {
                abortControllerRef.current = null
            }
        }
    }

    return (
        <div className={styles.previewDesensitizedTable}>
            <div className={styles.title}>{__('预览效果')}</div>
            {loading ? (
                renderLoader(48)
            ) : tableData.length > 0 ? (
                <Table
                    dataSource={tableData}
                    columns={columns}
                    className={styles.sampleTable}
                    pagination={false}
                    bordered={false}
                />
            ) : (
                renderEmpty(0, 104)
            )}
        </div>
    )
}

export default memo(PreviewDesensitizedTable)
