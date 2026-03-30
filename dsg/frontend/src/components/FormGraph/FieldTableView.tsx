import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Button, Input, Modal, ModalProps, Table } from 'antd'
import { Node } from '@antv/x6'
import { CloseOutlined, SearchOutlined } from '@ant-design/icons'
import { useDebounce } from 'ahooks'
import type { ColumnsType } from 'antd/es/table'
import styles from './styles.module.less'
import __ from './locale'
import { XlsColored } from '@/icons'
import {
    getFormInfo,
    getFormQueryItem,
    formsEnumConfig,
    IFormEnumConfigModel,
    transformQuery,
} from '@/core'
import { StandardStatusLabel } from '../Forms/helper'
import {
    OpenAttributeOption,
    SecurityClassificationOption,
    SensibilityOption,
    SharedAttributeOption,
} from './helper'
import Empty from '@/ui/Empty'
import dataEmpty from '../../assets/dataEmpty.svg'
import { SearchInput } from '@/ui'
import ViewFieldsTable from '../FormTableMode/ViewFieldsTable'
import { StandardDataDetail } from '../FormTableMode/const'
import { FormTableKind } from '../Forms/const'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

interface FieldTableViewType extends ModalProps {
    visible?: boolean
    formId: string
    items: Array<any>
    quoteKeys?: Array<string>
    onClose: () => void
    model: string
    node?: Node
    // 流程图预览表字段
    isDrawio?: boolean
}

const FieldTableView = ({
    visible = true,
    formId,
    items,
    onClose,
    quoteKeys,
    model,
    node,
    isDrawio,
    ...props
}: FieldTableViewType) => {
    const [formInfo, setFormInfo] = useState<any>(null)
    const [searchKey, setSearchKey] = useState<string>('')
    const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number>>([])
    const [tableData, setTableData] = useState<Array<any>>([])
    const [dataTypeOptions, setDataTypeOptions] =
        useState<IFormEnumConfigModel | null>(null)
    const [formulateBasisOptions, setFormulateBasisOptions] = useState<
        Array<any>
    >([])
    // 编码规则/码表集合
    const standardRuleDetail: StandardDataDetail = new StandardDataDetail(
        [],
        [],
    )
    const { isDraft, selectedVersion, getDragData } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        // 优先使用拖拽数据中的 is_draft，如果没有则使用全局的 isDraft
        const dragData = getDragData ? getDragData(formId) : {}
        const currentIsDraft =
            dragData?.is_draft !== undefined ? dragData.is_draft : isDraft
        return transformQuery({ isDraft: currentIsDraft, selectedVersion })
    }, [isDraft, selectedVersion, getDragData, formId])

    // const columns: ColumnsType<any> = [
    //     {
    //         title: __('中英文名称'),
    //         key: 'name',
    //         width: 240,
    //         fixed: 'left',
    //         render: (_, record) => (
    //             <div>
    //                 <div className={styles.nameTypeStyle} title={record.name}>
    //                     {record.name}
    //                 </div>
    //                 <div className={styles.enName} title={record.name_en}>
    //                     {record.name_en}
    //                 </div>
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('标准化状态'),
    //         key: 'standard_status',
    //         width: 120,
    //         render: (_, record) => (
    //             <div>
    //                 <StandardStatusLabel value={record.standard_status} />
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('本业务产生'),
    //         width: 150,
    //         key: 'is_current_business_generation',
    //         render: (_, record) => (
    //             <div>
    //                 {record.is_current_business_generation
    //                     ? __('是')
    //                     : __('否')}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('标准分类'),
    //         width: 120,
    //         key: 'formulate_basis',
    //         render: (_, record) => (
    //             <div>
    //                 {(formulateBasisOptions.length > 0 &&
    //                     formulateBasisOptions.find((item) => {
    //                         return item.value_en === record.formulate_basis
    //                     })?.value) ||
    //                     '--'}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('数据类型'),
    //         width: 150,
    //         key: 'data_type',
    //         render: (_, record) => (
    //             <div>
    //                 {(dataTypeOptions.length > 0 &&
    //                     dataTypeOptions.find((item) => {
    //                         return item.value_en === record.data_type
    //                     })?.value) ||
    //                     '--'}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('数据长度'),
    //         width: 150,
    //         key: 'data_length',
    //         render: (_, record) => (
    //             <div>
    //                 {(record.data_type === 'number' ||
    //                     record.data_type === 'char') &&
    //                 record.data_length !== null
    //                     ? record.data_length
    //                     : '--'}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('数据精度'),
    //         width: 100,
    //         key: 'data_accuracy',
    //         render: (_, record) => (
    //             <div>
    //                 {record.data_type === 'number' &&
    //                 record.data_length !== null
    //                     ? record.data_accuracy
    //                     : '--'}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('计量单位'),
    //         width: 100,
    //         key: 'unit',
    //         render: (_, record) => (
    //             <div className={styles.nameTypeStyle} title={record.unit}>
    //                 {record.unit || '--'}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('主键'),
    //         key: 'is_primary_key',
    //         width: 70,
    //         render: (_, record) => (
    //             <div>{record.is_primary_key ? __('是') : __('否')}</div>
    //         ),
    //     },
    //     {
    //         title: __('增量字段'),
    //         key: 'is_incremental_field',
    //         width: 100,
    //         render: (_, record) => (
    //             <div>{record.is_incremental_field ? __('是') : __('否')}</div>
    //         ),
    //     },
    //     {
    //         title: __('必填'),
    //         width: 70,
    //         key: 'is_required',
    //         render: (_, record) => (
    //             <div>{record.is_required ? __('是') : __('否')}</div>
    //         ),
    //     },
    //     {
    //         title: __('需标准化'),
    //         width: 100,
    //         key: 'is_standardization_required',
    //         render: (_, record) => (
    //             <div>
    //                 {record.is_standardization_required ? __('是') : __('否')}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('码表'),
    //         key: 'code_table',
    //         width: 100,
    //         render: (_, record) => (
    //             <div
    //                 className={styles.nameTypeStyle}
    //                 title={record.code_table || ''}
    //             >
    //                 {record.code_table || '--'}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('值域'),
    //         key: 'value_range',
    //         width: 100,
    //         render: (_, record) => (
    //             <div
    //                 className={styles.nameTypeStyle}
    //                 title={record.value_range || ''}
    //             >
    //                 {record.value_range || '--'}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('编码规则'),
    //         key: 'encoding_rule',
    //         width: 100,
    //         render: (_, record) => (
    //             <div
    //                 className={styles.nameTypeStyle}
    //                 title={record.encoding_rule || ''}
    //             >
    //                 {record.encoding_rule || '--'}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('字段关系'),
    //         key: 'field_relationship',
    //         width: 100,
    //         render: (_, record) => (
    //             <div
    //                 className={styles.nameTypeStyle}
    //                 title={record.field_relationship || ''}
    //             >
    //                 {record.field_relationship || '--'}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('敏感属性'),
    //         key: 'sensitive_attribute',
    //         width: 100,
    //         render: (_, record) => (
    //             <div className={styles.nameTypeStyle}>
    //                 {
    //                     SensibilityOption.find(
    //                         (option) =>
    //                             option.value === record.sensitive_attribute,
    //                     )?.label
    //                 }
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('涉密属性'),
    //         key: 'confidential_attribute',
    //         width: 100,
    //         render: (_, record) => (
    //             <div className={styles.nameTypeStyle}>
    //                 {
    //                     SecurityClassificationOption.find(
    //                         (option) =>
    //                             option.value === record.confidential_attribute,
    //                     )?.label
    //                 }
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('共享属性'),
    //         key: 'shared_attribute',
    //         width: 120,
    //         render: (_, record) => (
    //             <div className={styles.nameTypeStyle}>
    //                 {
    //                     SharedAttributeOption.find(
    //                         (option) =>
    //                             option.value === record.shared_attribute,
    //                     )?.label
    //                 }
    //             </div>
    //         ),
    //     },
    //     {
    //         title: __('开放属性'),
    //         key: 'open_attribute',
    //         width: 150,
    //         render: (_, record) => (
    //             <div className={styles.nameTypeStyle}>
    //                 {
    //                     OpenAttributeOption.find(
    //                         (option) => option.value === record.open_attribute,
    //                     )?.label
    //                 }
    //             </div>
    //         ),
    //     },
    // ]
    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys)
    }
    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => {
            return {
                disabled: !!quoteKeys?.includes(`${record.id}`),
                defaultChecked: node?.data.selectedFiledsId.includes(
                    `${record.id}`,
                ),
            }
        },
    }

    useEffect(() => {
        getEnumConfig()
        setTableData(items)
        setSearchKey('')
        setSelectedRowKeys(node?.data.selectedFiledsId || [])
        if (visible) {
            initGetFormInfo()
        }
    }, [items])

    useEffect(() => {
        onSearch()
    }, [searchKey])

    /**
     * 搜索
     */
    const onSearch = () => {
        if (searchKey) {
            const searchData = items.filter((item) => {
                return (
                    item.name.includes(searchKey) ||
                    item.name_en.includes(searchKey) ||
                    item.name_en.match(new RegExp(searchKey, 'ig'))
                )
            })
            setTableData(searchData)
        } else {
            setTableData(items)
        }
    }

    /**
     * 初始化获取表单信息
     * @param mid
     */
    const initGetFormInfo = async () => {
        const info = await getFormQueryItem(formId, versionParams)
        setFormInfo(info)
    }

    const getEnumConfig = async () => {
        const enumConfig = await formsEnumConfig()
        setDataTypeOptions(enumConfig)
        setFormulateBasisOptions(enumConfig?.formulate_basis)
    }

    return (
        <Modal
            width="calc(100% - 48px)"
            open={visible}
            onCancel={onClose}
            bodyStyle={{
                padding: 0,
            }}
            style={{ top: 24, height: 'calc(100% - 24px)' }}
            title={
                <div className={styles.tableFormTitle}>
                    <div className={styles.formTitleLabel}>
                        <XlsColored />
                        <span
                            className={styles.formTitleText}
                            title={formInfo?.name || ''}
                        >
                            {formInfo?.name || ''}
                        </span>
                    </div>
                </div>
            }
            footer={null}
            // footer={
            //     node?.data.type === 'origin' && model === 'edit' ? (
            //         <div
            //             style={{
            //                 width: '100%',
            //                 height: '100%',
            //                 display: 'flex',
            //                 justifyContent: 'flex-end',
            //             }}
            //         >
            //             <Button
            //                 style={{
            //                     width: '80px',
            //                     height: '36px',
            //                 }}
            //                 onClick={onClose}
            //             >
            //                 {__('取消')}
            //             </Button>
            //             <Button
            //                 type="primary"
            //                 style={{
            //                     width: '80px',
            //                     height: '36px',
            //                 }}
            //                 // loading={loading}
            //                 onClick={() => {
            //                     if (node) {
            //                         node.replaceData({
            //                             ...node.data,
            //                             selectedFiledsId: selectedRowKeys,
            //                         })
            //                     }
            //                     onClose()
            //                 }}
            //             >
            //                 {__('确定')}
            //             </Button>
            //         </div>
            //     ) : null
            // }
            wrapClassName={styles.formViewWrapper}
            {...props}
        >
            {!tableData.length ? (
                <div style={{ marginTop: '120px' }}>
                    <Empty
                        desc={
                            <div style={{ textAlign: 'center' }}>
                                <div>{__('暂无数据')}</div>
                                {isDrawio && (
                                    <div>
                                        {__('完善业务表信息后可查看详情数据')}
                                    </div>
                                )}
                            </div>
                        }
                        iconSrc={dataEmpty}
                    />
                </div>
            ) : (
                <div className={styles.viewTableContent}>
                    <div>
                        <ViewFieldsTable
                            fields={tableData}
                            dataEnumOptions={dataTypeOptions}
                            standardRuleDetail={standardRuleDetail}
                            formType={
                                formInfo?.table_kind || FormTableKind.BUSINESS
                            }
                        />
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default FieldTableView
