import { Checkbox, Select, Spin, Tooltip, message } from 'antd'
import classnames from 'classnames'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DownOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import DimensionLinkOutlined from '@/icons/DimensionLinkOutlined'
import { DeleteOutLined } from '@/icons'
// import { FormatType } from '../../const'
import { useCatalogColumn } from '../../helper'
import __ from '../../locale'
import BizSelect, { ISelectType } from '../BizSelect'
import { FieldLabel } from '../FieldLabel'
import { OptDimType, useDimConfContext } from './DimConfProvider'
import styles from './styles.module.less'
import { useGraphContext } from '@/context'
import { NodeType } from '../Nodes'
import { changeFormatToType } from '@/components/IndicatorManage/const'

/**
 * 字段选项
 * @returns
 */
const FieldItem = ({ item, checked, handleCheck, handleRemove }: any) => {
    const {
        removeDimById,
        fieldIdTypes,
        errorTypeFields,
        optErrorTypeField,
        checkAndUpdateFields,
    } = useGraphContext()
    const { dimConf, factConf, fieldArr, error, setError, optDimConf } =
        useDimConfContext()
    const { loading, getColumnsById } = useCatalogColumn()
    const [dimFields, setDimFields] = useState<any[]>()
    const [isFieldTypeError, setIsFieldTypeError] = useState<boolean>()
    const [selectedField, setSelectedField] = useState<any>()
    const [searchKey, setSearchKey] = useState<string>()
    const options = useMemo(() => {
        return dimFields?.map((it) => {
            return {
                value: it.dimFieldId,
                label: (
                    <FieldLabel
                        type={it.dimFieldType}
                        title={it.dimFieldCNName}
                    />
                ),
                disabled:
                    changeFormatToType(
                        item.factFieldType || getTypeById(item.factFieldId),
                    ) !== changeFormatToType(it.dimFieldType),
            }
        })
    }, [dimFields])

    const isError: any = useMemo(() => {
        if (error.dimension && !error.dimension?.success) {
            const it = (error.dimension?.errors || [])?.find(
                (o) => o.factFieldId === item.factFieldId,
            )
            return it
                ? {
                      bizError: !it?.id || !it?.cnName,
                      fieldError: !it?.dimFieldId || !it?.dimFieldCNName,
                  }
                : false
        }
        return false
    }, [error.dimension, item])

    const bindIds = useMemo(() => {
        const dimIds = dimConf?.map((o) => o.id)
        const factId = factConf.id
        return [factId, ...(dimIds || [])]
    }, [dimConf])

    const validateFieldType = useCallback(
        (fields: any[]) => {
            const ids = Object.keys(fieldIdTypes)

            fields
                ?.filter((o) =>
                    ids?.some((it) => it === `${item.id}:${o.dimFieldId}`),
                )
                .forEach((it) => {
                    if (
                        it.dimFieldType !==
                        fieldIdTypes[`${item.id}:${it.dimFieldId}`]
                    ) {
                        optErrorTypeField(
                            'ADD',
                            `${item.id}:${it.dimFieldId}`,
                            NodeType.Dimension,
                        )
                    }
                })
        },
        [item, fieldIdTypes, optErrorTypeField, factConf.id],
    )

    const getFields = async (tableId: string) => {
        const result = await getColumnsById(tableId)
        const columns = result.data
        const list = columns.map((o) => ({
            dimFieldId: o.id,
            dimFieldCNName: o.business_name,
            dimFieldENName: o.technical_name,
            dimFieldType: o.data_type,
            factFieldType: item.factFieldType,
        }))
        setDimFields(list)
        checkAndUpdateFields(tableId, NodeType.Dimension, columns)
        validateFieldType(list)

        if (!result.state) {
            // 维度表下线
            removeDimById(item.id)
        }
    }

    const loadField = (conf: any, reset?: boolean) => {
        const resetData = reset
            ? {
                  dimFieldId: '',
                  dimFieldType: '',
                  dimFieldCNName: '',
                  dimFieldENName: '',
              }
            : {}

        if (isError?.bizError) {
            const errorList = error.dimension.errors?.map((o) => {
                if (o.factFieldId === item.factFieldId) {
                    return {
                        ...o,
                        ...conf,
                        ...resetData,
                    }
                }
                return o
            })
            setError((prev) => ({
                ...prev,
                dimension: {
                    ...prev.dimension,
                    errors: errorList,
                },
            }))
        }
    }

    const handleSelectTable = (dimTable: any) => {
        const conf = {
            cnName: dimTable.business_name,
            enName: dimTable.technical_name,
            path: `${dimTable.view_source_catalog_name}.${dimTable.technical_name}`,
            id: dimTable.id,
        }
        setDimFields([])
        loadField(conf, true)

        setSelectedField(undefined)
        optDimConf(
            OptDimType.UPDATE,
            {
                ...conf,
                dimFieldId: '',
                dimFieldType: '',
                dimFieldCNName: '',
                dimFieldENName: '',
            },
            item.factFieldId,
        )
    }

    const curConf = useMemo(() => {
        const it = dimConf?.find((o) => o.factFieldId === item.factFieldId)

        return it.id
            ? {
                  cnName: it.cnName,
                  enName: it.enName,
                  path: it.path,
                  id: it.id,
              }
            : undefined
    }, [dimConf])

    useEffect(() => {
        const it = dimConf?.find((o) => o.factFieldId === item.factFieldId)
        if (it.dimFieldId) {
            loadField(it)
            setSelectedField({
                value: it.dimFieldId,
                label: (
                    <FieldLabel
                        type={it.dimFieldType}
                        title={it.dimFieldCNName}
                    />
                ),
            })

            setIsFieldTypeError(
                errorTypeFields?.includes(`${item.id}:${it.dimFieldId}`),
            )
        }
    }, [dimConf, errorTypeFields])

    // 筛选
    const filterField = (val: string, option) => {
        return (option.label?.props?.title || '')?.includes((val || '').trim())
    }

    const handleSelectField = (fieldId: string) => {
        const field = dimFields?.find((o) => o.dimFieldId === fieldId)

        setSelectedField({
            value: field.dimFieldId,
            label: (
                <FieldLabel
                    type={field.dimFieldType}
                    title={field.dimFieldCNName}
                />
            ),
        })

        if (field) {
            const { type, ...partItem } = field
            optDimConf(OptDimType.UPDATE, partItem, item.factFieldId)

            if (isError?.fieldError) {
                const errorList = error.dimension?.errors?.map((o) => {
                    if (o.factFieldId === item.factFieldId) {
                        return {
                            ...o,
                            ...partItem,
                        }
                    }
                    return o
                })
                setError((prev) => ({
                    ...prev,
                    dimension: {
                        ...prev.dimension,
                        errors: errorList,
                    },
                }))
            }
        }
    }

    const getTypeById = useCallback(
        (id: string) => {
            const it = fieldArr?.find((o) => o.id === id)
            return it?.data_type
        },
        [fieldArr],
    )

    const onClearField = () => {
        setSelectedField(undefined)
        const conf = dimConf?.find((o) => o.factFieldId === item.factFieldId)
        optDimConf(
            OptDimType.UPDATE,
            {
                ...conf,
                dimFieldId: '',
                dimFieldType: '',
                dimFieldCNName: '',
                dimFieldENName: '',
            },
            item.factFieldId,
        )
    }

    const EmptyView = useMemo(
        () =>
            loading ? (
                <Spin size="small" />
            ) : (
                <div
                    style={{
                        color: 'rgba(0, 0, 0, 0.45)',
                    }}
                >
                    {searchKey ? __('抱歉，没有找到相关内容') : __('暂无数据')}
                </div>
            ),
        [searchKey, loading],
    )

    return (
        <div className={styles['item-wrapper']}>
            <div className={styles['item-wrapper-left']}>
                <Checkbox
                    checked={checked}
                    onChange={(e) => {
                        handleCheck?.(e.target.checked, item)
                    }}
                >
                    <span className={styles['item-wrapper-left-title']}>
                        <FieldLabel
                            type={
                                item.factFieldType ||
                                getTypeById(item.factFieldId)
                            }
                            title={item.factFieldCNName}
                        />
                    </span>
                </Checkbox>
            </div>
            <div className={styles['item-wrapper-right']}>
                <span
                    className={styles['opt-icon']}
                    style={{ cursor: 'default' }}
                >
                    <DimensionLinkOutlined />
                </span>
                <div
                    className={classnames({
                        [styles['opt-select']]: true,
                        [styles['is-table-error']]: isError?.bizError,
                    })}
                >
                    <BizSelect
                        title={__('选择维度表')}
                        type={ISelectType.Dimension}
                        placeholder={__('请选择关联维度表')}
                        border
                        checkedNode={curConf ? { id: curConf.id } : undefined}
                        selected={curConf}
                        bindIds={bindIds}
                        onSelected={handleSelectTable}
                    />
                </div>

                <span> — </span>
                <div
                    className={classnames({
                        [styles['opt-select']]: true,
                        [styles['is-type-error']]: isFieldTypeError,
                    })}
                >
                    <Select
                        value={selectedField}
                        placeholder={__('请选择关联字段')}
                        allowClear
                        showSearch
                        loading={loading}
                        onClear={onClearField}
                        // getPopupContainer={(node: any) => {
                        //     // eslint-disable-next-line no-param-reassign
                        //     node.parentNode.parentNode.style.overflow =
                        //         'visible'
                        //     return node.parentNode || document.body
                        // }}
                        status={
                            isError?.fieldError || isFieldTypeError
                                ? 'error'
                                : undefined
                        }
                        filterOption={filterField}
                        onSelect={handleSelectField}
                        suffixIcon={
                            <>
                                {isFieldTypeError && (
                                    <Tooltip
                                        title={__(
                                            '该字段与维度字段数据类型不一致',
                                        )}
                                        placement="right"
                                    >
                                        <ExclamationCircleOutlined
                                            style={{
                                                color: '#F5222D',
                                                fontSize: '14px',
                                                marginRight: '5px',
                                            }}
                                        />
                                    </Tooltip>
                                )}
                                <DownOutlined
                                    style={{
                                        fontSize: '13px',
                                    }}
                                />
                            </>
                        }
                        onFocus={() => {
                            if (!item?.id) {
                                message.warn(__('请先关联维度表'))
                                return
                            }
                            if (!dimFields?.length) {
                                getFields(item.id)
                            }
                        }}
                        onSearch={(val) => setSearchKey((val || '')?.trim())}
                        options={options}
                        notFoundContent={EmptyView}
                    />
                </div>
                <Tooltip title="移除">
                    <span
                        className={styles['opt-icon']}
                        onClick={() => handleRemove?.(checked, item)}
                    >
                        <DeleteOutLined />
                    </span>
                </Tooltip>
            </div>
        </div>
    )
}

export default memo(FieldItem)
