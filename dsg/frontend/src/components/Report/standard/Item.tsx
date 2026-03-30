import React, { useEffect, useState } from 'react'
import { Button, Table, message } from 'antd'
import {
    CheckCircleFilled,
    ExclamationOutlined,
    CheckOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import styles from '../styles.module.less'
import __ from '../locale'
import {
    IFieldsCheckResult,
    editBusinessStandard,
    formatError,
    updateConsistentStatus,
    ConsistentStatus,
    getMainBusinesses,
    IAttributes,
} from '@/core'
import InconsistentFormsModal from './InconsistentFormsModal'
import DereferenceModal, { IDereferenceForm } from './DereferenceModal'
import ViewValueRange from '../../FormTableMode/ViewValueRange'

export interface IField extends IFieldsCheckResult {
    hide?: boolean
}

interface IData extends IAttributes {
    // 字段id
    field_id?: string

    // 引用id
    ref_id?: string

    // 字段所属业务表id
    fields_info: string[]

    // 标准id
    standard_id: string
}

interface IItem {
    modelId: string
    formId: string
    formName: string
    field: IField
    onChecked?: (field) => void
    onReselect?: (field) => void
}

const transformFormulateBasis = (formulate_basis) => {
    switch (formulate_basis) {
        case 0:
            return __('')
        case 1:
            return __('团体标准')
        case 2:
            return __('企业标准')
        case 3:
            return __('行业标准')
        case 4:
            return __('地方标准')
        case 5:
            return __('国家标准')
        case 6:
            return __('国际标准')
        case 7:
            return __('其他标准')

        default:
            return __('')
    }
}

const Item: React.FC<IItem> = ({
    modelId,
    formId,
    formName,
    field,
    onChecked,
    onReselect,
}) => {
    const [data, setData] = useState<IData[]>()
    const [inconsistentForms, setInconsistentForms] = useState([])
    const [dereferenceForms, setDereferenceForms] = useState<
        IDereferenceForm[]
    >([])
    const {
        attributes,
        field_id,
        fields_info,
        standard_id,
        ref_id,
        inconsistent,
        hide,
    } = field

    const getData = () => {
        const self = {
            ...attributes,
            field_id,
            fields_info,
            standard_id,
            ref_id,
        }

        const others = inconsistent.map((item) => {
            return {
                ...item?.attributes,
                fields_info: item?.fields_info,
                standard_id: item?.standard_id,
            }
        })

        return [self, ...others]
    }

    useEffect(() => {
        setData(getData())
    }, [])

    const handleReselect = async () => {
        // 重新选择，用字段的原标准，还原。并将字段标记为未进行一致性操作
        try {
            await editBusinessStandard(modelId, formId, {
                standards: [
                    {
                        sid: field_id,
                        name: attributes?.name,
                        name_en: attributes?.name_en,
                        data_accuracy: attributes?.data_accuracy,
                        data_length: attributes?.data_length,
                        data_type: attributes?.data_type,
                        formulate_basis: attributes?.formulate_basis,
                        value_range: attributes?.value_range,
                        standard_id,
                    },
                ],
            })
            await updateConsistentStatus(modelId, {
                object_id: field_id,
                status: ConsistentStatus.Inconsistent,
            })
            if (onReselect) {
                onReselect(field)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleIgnore = async () => {
        // 继续使用，即忽略。只是修改一致性状态，并且通知父组件隐藏该项
        try {
            await updateConsistentStatus(modelId, {
                object_id: field_id,
                status: ConsistentStatus.Consistent,
            })
            if (onChecked) {
                onChecked(field)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleChangeStandards = async (record) => {
        // 如果字段是引用的，则无法修改标准
        if (ref_id?.length > 0) {
            return
        }

        try {
            // 用当前选择的标准，去更新字段
            const ref = await editBusinessStandard(modelId, formId, {
                standards: [
                    {
                        sid: field_id,
                        name: record?.name,
                        name_en: record?.name_en,
                        data_accuracy: record?.data_accuracy,
                        data_length: record?.data_length,
                        data_type: record?.data_type,
                        formulate_basis: record?.formulate_basis,
                        value_range: record?.value_range,
                        standard_id: record.standard_id,
                    },
                ],
            })

            if (ref?.length > 0) {
                const formNames = ref.map((item) => {
                    return item.name
                })
                if (formNames.length > 3) {
                    message.warning(
                        <span>
                            {__(
                                '${formNameString}中${fieldNameString}字段已自动解除引用关系',
                                {
                                    formNameString: formNames
                                        .slice(0, 3)
                                        .join('、'),
                                    fieldNameString: attributes?.name,
                                },
                            )}
                            <span
                                style={{
                                    marginLeft: 8,
                                    cursor: 'pointer',
                                    color: '#126ee3',
                                }}
                                onClick={() => {
                                    setDereferenceForms(ref)
                                }}
                            >
                                {__('查看更多')}
                            </span>
                        </span>,
                    )
                } else {
                    message.warning(
                        __(
                            '${formNameString}中${fieldNameString}字段已自动解除引用关系',
                            {
                                formNameString: formNames.join('、'),
                                fieldNameString: attributes?.name,
                            },
                        ),
                    )
                }
            }
            // 标记字段为已选择
            await updateConsistentStatus(modelId, {
                object_id: field_id,
                status: ConsistentStatus.Consistent,
            })
            if (onChecked) {
                onChecked(field)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleShowAllTable = async (record) => {
        try {
            const res = await getMainBusinesses(record?.fields_info)
            setInconsistentForms(res)
        } catch (error) {
            formatError(error)
        }
    }

    const handleHideAllTable = () => {
        setInconsistentForms([])
    }

    const renderDifferentField = ({
        selfField,
        otherField,
        record,
        tableField,
    }: any) => {
        if (!otherField) {
            return '--'
        }
        return (
            <span className={styles.fieldWrapper}>
                {tableField === 'value_range' && (
                    <ViewValueRange
                        type={record.value_range_type}
                        value={record.value_range}
                        style={{
                            maxWidth: 'calc(100% - 22px)',
                        }}
                    />
                )}
                {tableField === 'formulate_basis' &&
                    transformFormulateBasis(otherField)}
                {!tableField && otherField}
                {selfField !== otherField ? (
                    <ExclamationOutlined
                        style={{
                            color: '#FAAC14',
                            marginLeft: 8,
                        }}
                    />
                ) : null}
            </span>
        )
    }

    const columns = [
        {
            title: __('选择'),
            dataIndex: 'option',
            key: 'option',
            width: '80px',
            render: (_, record) => {
                return (
                    <div>
                        {record?.field_id ? (
                            <CheckCircleFilled
                                style={{ color: '#126ee3', fontSize: '16px' }}
                            />
                        ) : (
                            <div
                                className={classnames(
                                    styles.circleWrapper,
                                    ref_id?.length > 0 && styles.disablechecked,
                                )}
                                onClick={() => handleChangeStandards(record)}
                            >
                                <CheckOutlined
                                    className={styles.checkOutlined}
                                    style={{ fontSize: '10px' }}
                                />
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('标准'),
            dataIndex: 'field_id',
            key: 'field_id',
            width: '100px',
            render: (_, record, index) => {
                const length = record?.fields_info?.length
                return (
                    <div>
                        <div>
                            {__('标准')}
                            {index + 1}
                        </div>
                        {length > 0 ? (
                            <div
                                onClick={() => handleShowAllTable(record)}
                                className={styles.tableCount}
                            >
                                {__('${total}张业务表使用', {
                                    total: length,
                                })}
                            </div>
                        ) : null}
                    </div>
                )
            },
        },
        {
            title: __('字段名称'),
            dataIndex: 'name',
            key: 'name',
            width: '150px',
            ellipsis: true,
            render: (name) =>
                renderDifferentField({
                    selfField: attributes?.name,
                    otherField: name,
                }),
        },
        {
            title: __('英文名称'),
            dataIndex: 'name_en',
            key: 'name_en',
            ellipsis: true,
            width: '150px',
            render: (name_en) =>
                renderDifferentField({
                    selfField: attributes?.name_en,
                    otherField: name_en,
                }),
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            width: '100px',
            render: (data_type) =>
                renderDifferentField({
                    selfField: attributes?.data_type,
                    otherField: data_type,
                }),
        },
        {
            title: __('数据长度'),
            dataIndex: 'data_length',
            key: 'data_length',
            width: '100px',
            render: (data_length) =>
                renderDifferentField({
                    selfField: attributes?.data_length,
                    otherField: data_length,
                }),
        },
        {
            title: __('数据精度'),
            dataIndex: 'data_accuracy',
            key: 'data_accuracy',
            width: '100px',
            render: (data_accuracy) =>
                renderDifferentField({
                    selfField: attributes?.data_accuracy,
                    otherField: data_accuracy,
                }),
        },
        {
            title: __('值域'),
            dataIndex: 'value_range',
            key: 'value_range',
            ellipsis: true,
            width: '150px',
            render: (value_range, record) =>
                renderDifferentField({
                    selfField: attributes?.value_range,
                    otherField: value_range,
                    record,
                    tableField: 'value_range',
                }),
        },
        {
            title: __('标准分类'),
            dataIndex: 'formulate_basis',
            key: 'formulate_basis',
            width: '100px',
            render: (formulate_basis) =>
                renderDifferentField({
                    selfField: attributes?.formulate_basis,
                    otherField: formulate_basis,
                    tableField: 'formulate_basis',
                }),
        },
    ]

    const getTotal = () => {
        let count = 0
        inconsistent?.forEach((item) => {
            count += item?.fields_info?.length || 0
        })

        return count
    }

    return (
        <div>
            {hide ? (
                <div className={styles.itemWrapper}>
                    <span>{__('业务表')}</span>
                    <span className={styles.weight}>{formName}</span>
                    <span>{__('中的字段')}</span>
                    <span className={styles.weight}>{attributes?.name}</span>
                    <span>{__('已确定标准')}</span>
                    <Button
                        type="link"
                        className={styles.chooseButton}
                        onClick={handleReselect}
                    >
                        {__('重新选择')}
                    </Button>
                </div>
            ) : (
                <div>
                    {data && (
                        <div className={styles.itemWrapper}>
                            <div className={styles.tipsWrapper}>
                                <span>{__('业务表')}</span>
                                <span className={styles.weight}>
                                    {formName}
                                </span>
                                <span>{__('中的字段')}</span>
                                <span className={styles.weight}>
                                    {attributes?.name}
                                </span>
                                <span>
                                    {__(
                                        '与其他${total}张业务表中字段标准不一致',
                                        {
                                            total: getTotal(),
                                        },
                                    )}
                                </span>
                                <Button
                                    className={styles.chooseButton}
                                    onClick={handleIgnore}
                                    type="link"
                                >
                                    {__('继续使用')}
                                </Button>
                                {ref_id?.length > 0 ? (
                                    <span className={styles.weight}>
                                        {__('引用字段，不可更改')}
                                    </span>
                                ) : null}
                            </div>
                            <Table
                                columns={columns}
                                dataSource={data}
                                pagination={false}
                                className={styles.table}
                            />
                        </div>
                    )}
                </div>
            )}
            {inconsistentForms.length > 0 ? (
                <InconsistentFormsModal
                    inconsistentForms={inconsistentForms}
                    onCancelModal={handleHideAllTable}
                />
            ) : null}
            {dereferenceForms?.length > 0 ? (
                <DereferenceModal
                    fieldNameString={attributes?.name}
                    dereferenceForms={dereferenceForms}
                    onCancel={() => setDereferenceForms([])}
                />
            ) : null}
        </div>
    )
}

export default Item
