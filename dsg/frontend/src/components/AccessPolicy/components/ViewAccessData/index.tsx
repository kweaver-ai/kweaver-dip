import { useEffect, useMemo, useState } from 'react'
import { message, Table } from 'antd'
import { v4 as uuidv4 } from 'uuid'
import { useUnmount, useUpdateEffect } from 'ahooks'
import { cloneDeep } from 'lodash'
import { formatError, getCommonDataType, runSceneView } from '@/core'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import styles from './styles.module.less'
import FieldFilter from './FieldFilter'

interface IViewAccessData {
    allFields: any[]
    formData: any
    formId: string
    exampleData?: any
    openProbe?: boolean
    onDataChange: () => void
    initialParams?: any
    passParams?: (params: any) => void
}

const ViewAccessData = ({
    allFields,
    formData,
    formId,
    exampleData,
    openProbe,
    onDataChange,
    initialParams = {},
    passParams,
}: IViewAccessData) => {
    const { detail } = formData.subView
    const { fields, row_filters } = JSON.parse(detail || '{}')
    const [dataSource, setDataSource] = useState<any[]>([])
    const [searchParams, setSearchParams] = useState<any>({
        offset: 1,
        limit: 10,
        need_count: true,
        type: 'scene-analysis',
    })
    const [total, setTotal] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(false)
    const [rowFilterParams, setRowFilterParams] = useState<any>({})

    const showFields = useMemo(() => {
        if (fields.length === 0 || allFields.length === 0) return []
        return allFields.filter((field) =>
            fields.find((f) => f.id === field.id),
        )
    }, [allFields, formData])

    const canvasData = useMemo(() => {
        const id1 = uuidv4()
        const id2 = uuidv4()
        const outputFields1 = allFields.map((field) => ({
            alias: field.business_name,
            id: field.id,
            name: field.business_name,
            data_type: getCommonDataType(field.data_type),
            name_en: field.technical_name,
        }))
        const outputFields2 = showFields.map((field) => ({
            alias: field.business_name,
            id: field.id,
            name: field.business_name,
            data_type: getCommonDataType(field.data_type),
            name_en: field.technical_name,
            source_node_id: id1,
        }))

        const canvas: any[] = [
            {
                id: id1,
                name: '1',
                formula: [
                    {
                        type: 'form',
                        config: { form_id: formId },
                        output_fields: outputFields1,
                    },
                ],
                output_fields: outputFields1,
                src: [],
            },
            {
                id: id2,
                name: '2',
                formula: [
                    {
                        type: 'where',
                        config: {
                            ...row_filters,
                            where: row_filters.where.map((r) => ({
                                ...r,
                                member: r.member.map((m) => ({
                                    operator: m.operator,
                                    value: m.value,
                                    field: {
                                        id: m.id,
                                        name: m.name,
                                        alias: m.name,
                                        source_node_id: id1,
                                        data_type: getCommonDataType(
                                            m.data_type,
                                        ),
                                    },
                                })),
                                relation: r.relation || '',
                            })),
                        },
                        output_fields: outputFields1,
                    },
                ],
                output_fields: outputFields2,
                src: [id1],
            },
        ]

        return { canvas, id1, id2, outputFields1, outputFields2 }
    }, [formData, allFields])

    useEffect(() => {
        if (initialParams && Object.keys(initialParams).length > 0) {
            const tempRowFilterParams = {}
            fields.forEach((field) => {
                if (initialParams[field.id]) {
                    tempRowFilterParams[field.id] = initialParams[field.id]
                }
            })
            setRowFilterParams(tempRowFilterParams)
        } else {
            setRowFilterParams({})
        }
    }, [])

    useUpdateEffect(() => {
        const { canvas, id2, outputFields2 } = canvasData
        if (Object.keys(rowFilterParams).length === 0) {
            setSearchParams({
                ...searchParams,
                canvas,
            })
            return
        }

        const outputFields3 = outputFields2.map((f) => ({
            ...f,
            source_node_id: id2,
        }))
        const filterParams = {
            type: 'where',
            config: {
                where: [
                    {
                        relation: 'and',
                        member: Object.keys(rowFilterParams).map((key) => {
                            const { field, operator, value } =
                                rowFilterParams[key]
                            return {
                                operator,
                                value,
                                field: {
                                    alias: field.business_name,
                                    id: field.id,
                                    name: field.business_name,
                                    data_type: getCommonDataType(
                                        field.data_type,
                                    ),
                                    name_en: field.technical_name,
                                    source_node_id: id2,
                                },
                            }
                        }),
                    },
                ],
                where_relation: 'and',
            },
            output_fields: outputFields3,
        }

        const filterNode = {
            id: uuidv4(),
            name: '3',
            formula: [filterParams],
            output_fields: outputFields3,
            src: [id2],
        }
        const newCanvas = cloneDeep(canvas)
        newCanvas.push(filterNode)
        setSearchParams({
            ...searchParams,
            offset: 1,
            canvas: newCanvas,
        })
    }, [rowFilterParams])

    useUnmount(() => {
        passParams?.(rowFilterParams)
    })

    const columns = useMemo(() => {
        if (showFields.length === 0) return []

        return showFields.map((field) => ({
            title: (
                <div className={styles['table-title']}>
                    <div className={styles['table-title-left']}>
                        <div className={styles['business-name-item']}>
                            <span className={styles['name-icon']}>
                                {getFieldTypeEelment(
                                    { ...field, type: field.data_type },
                                    20,
                                    'left',
                                    false,
                                )}
                            </span>
                            <span
                                className={styles['business-name']}
                                title={field.business_name}
                            >
                                {field.business_name}
                            </span>
                        </div>
                        <div
                            className={styles['technical-name']}
                            title={field.technical_name}
                        >
                            {field.technical_name}
                        </div>
                    </div>
                    <div className={styles['table-title-right']}>
                        <FieldFilter
                            targetField={field}
                            initialValues={rowFilterParams[field.id]}
                            openProbe={openProbe}
                            exampleData={exampleData}
                            onOk={(vals) => {
                                if (vals.operator) {
                                    const params = {
                                        ...rowFilterParams,
                                        [field.id]: {
                                            ...vals,
                                            field,
                                        },
                                    }
                                    setRowFilterParams(params)
                                } else {
                                    delete rowFilterParams[field.id]
                                    setRowFilterParams({ ...rowFilterParams })
                                }
                            }}
                        />
                    </div>
                </div>
            ),

            key: field.technical_name,
            dataIndex: field.technical_name,
            ellipsis: true,
            width: 300,
            render: (val) =>
                val || typeof val === 'boolean' || val === 0 || val === ''
                    ? val.toString()
                    : '--',
        }))
    }, [showFields, rowFilterParams])

    const getSceneViewData = async () => {
        if (!searchParams.canvas) return
        try {
            setLoading(true)
            const res = await runSceneView(
                searchParams.limit,
                searchParams.offset,
                { canvas: searchParams.canvas },
                searchParams.need_count,
                searchParams.type,
            )

            if (
                res.err &&
                res.err.code === 'VirtualizationEngine.TableFieldError.'
            ) {
                message.error(res.err.description)
                return
            }
            const data = (res.data || []).map((item) => {
                const obj = {}
                showFields.forEach((field, index) => {
                    obj[field.technical_name] = item[index]
                })
                return obj
            })
            setTotal(res.count)
            setDataSource(data)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        getSceneViewData()
    }, [searchParams])

    return (
        <div>
            <Table
                columns={columns}
                dataSource={dataSource}
                bordered
                className={styles['data-table']}
                loading={loading}
                rowKey={() => uuidv4()}
                scroll={{ y: 'calc(100vh - 388px)', x: 'max-content' }}
                pagination={{
                    total,
                    pageSize: searchParams.limit,
                    current: searchParams.offset,
                    showTotal: (t) => `共 ${t} 条`,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                        setSearchParams({
                            ...searchParams,
                            offset: page,
                            limit: pageSize,
                        })
                    },
                }}
            />
        </div>
    )
}

export default ViewAccessData
