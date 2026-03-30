import { Button, Input, Modal, Form, message } from 'antd'
import { v4 as uuidv4 } from 'uuid'
import {
    EditableProTable,
    ProColumns,
    ActionType,
    EditableFormInstance,
} from '@ant-design/pro-components'
import { ExclamationCircleFilled } from '@ant-design/icons'
import * as React from 'react'
import {
    useState,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { Node } from '@antv/x6'
import { noop, trim } from 'lodash'
import { configResponsive } from 'ahooks'
import { checkNumberRanage } from '../FormGraph/helper'
import __ from './locale'
import { entendNameEnReg } from '@/utils'
import styles from './styles.module.less'
import { AddOutlined } from '@/icons'
import { getDataLengthValidate } from './helper'
import { PasteSourceChecked } from './const'

interface InputNameComponentsType {
    value?: string
    onChange?: () => void
    ref: any
}
const InputNameComponents: React.FC<InputNameComponentsType> = forwardRef(
    (props: any, ref) => {
        const devRef = useRef<any>()
        useImperativeHandle(ref, () => ({
            devRefCurrent: devRef.current,
        }))
        return (
            <div ref={devRef}>
                <Input
                    placeholder={__('请输入')}
                    maxLength={255}
                    autoComplete="off"
                    value={props?.value || ''}
                    onChange={props?.onChange || noop}
                />
            </div>
        )
    },
)
interface AddPasteFormFieldType {
    onConfirm: () => void
    onCancel: () => void
    node: Node | null
    onReCreateForm: (node: Node) => void
}
const AddPasteFormField = ({
    onConfirm,
    onCancel,
    node,
    onReCreateForm,
}: AddPasteFormFieldType) => {
    const [fieldData, setFieldData] = useState<Array<any>>([])
    const editorFormRef = useRef<EditableFormInstance>()
    const actionRef = useRef<ActionType>()
    const refCurrentInput = useRef<any>()
    const [newForm] = Form.useForm()
    useEffect(() => {
        if (
            editorFormRef.current &&
            Object.keys(editorFormRef.current?.getFieldsValue()).length
        ) {
            actionRef.current?.cancelEditable(
                Object.keys(editorFormRef.current?.getFieldsValue())[0],
            )
            editorFormRef.current?.resetFields()
        }

        setFieldData([])
    }, [node])

    /**
     * 检查重名
     */
    const checkNameRepeat = (e, value, id) => {
        if (
            node?.data.items.find((fieldsItem) => fieldsItem.name === value) ||
            fieldData.find(
                (fieldsItem) =>
                    fieldsItem.name === value && fieldsItem.id !== id,
            )
        ) {
            return Promise.reject(
                new Error(__('该字段名已存在当前数据表或待添加的表格中')),
            )
        }
        return Promise.resolve()
    }
    const columns: ProColumns<any>[] = [
        {
            title: __('字段名称'),
            dataIndex: 'name',
            renderFormItem: (record) => {
                return <InputNameComponents ref={refCurrentInput} />
            },
            formItemProps: (form, record) => {
                return {
                    validateFirst: true,
                    rules: [
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) =>
                                checkNameRepeat(
                                    e,
                                    value,
                                    record?.entity?.id || '',
                                ),
                        },
                    ],
                    hasFeedback: false,
                }
            },
            render: (dom, { name }) => {
                return (
                    <div title={name} className={styles.fieldName}>
                        {name}
                    </div>
                )
            },
            width: '25%',
        },
        {
            title: __('数据类型'),
            key: 'type',
            dataIndex: 'type',
            valueType: 'select',
            formItemProps: (form, { rowIndex, ...others }) => {
                return {
                    validateFirst: true,
                    rules: [
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                    ],
                    hasFeedback: false,
                }
            },
            fieldProps: (form, { rowIndex, entity }) => {
                return {
                    onSelect: () => {
                        editorFormRef.current?.setRowData?.(entity.id, {
                            length: null,
                            field_precision: null,
                        })
                    },
                }
            },
            valueEnum: {
                string: {
                    text: 'string',
                },
                char: {
                    text: 'char',
                },
                varchar: {
                    text: 'varchar',
                },
                tinyint: {
                    text: 'tinyint',
                },
                smallint: {
                    text: 'smallint',
                },
                int: {
                    text: 'int',
                },
                bigint: {
                    text: 'bigint',
                },
                float: {
                    text: 'float',
                },
                double: {
                    text: 'double',
                },
                decimal: {
                    text: 'decimal',
                },
                boolean: {
                    text: 'boolean',
                },
                date: {
                    text: 'date',
                },
                datetime: {
                    text: 'datetime',
                },
                timestamp: {
                    text: 'timestamp',
                },
                binary: {
                    text: 'binary',
                },
            },
            width: '15%',
        },
        {
            title: __('长度/精度'),
            key: 'length',
            dataIndex: 'length',
            renderFormItem: (currentConfig, { record }, form) => {
                const existDataLength = ['char', 'varchar', 'decimal', 'binary']
                if (existDataLength.includes(record.type)) {
                    return (
                        <Input
                            placeholder={__('请输入')}
                            type="number"
                            autoComplete="off"
                        />
                    )
                }
                return <div>--</div>
            },
            formItemProps: (form, config) => {
                const existDataLength = ['char', 'varchar', 'decimal', 'binary']
                const data = form.getFieldsValue()
                const { type } = data[config?.entity?.id] || ''
                return existDataLength.includes(type)
                    ? {
                          validateFirst: true,
                          rules: [
                              {
                                  required: type !== 'binary',
                                  message: __('输入不能为空'),
                              },
                              ...getDataLengthValidate(type),
                          ],
                          hasFeedback: false,
                      }
                    : {}
            },
            render: (dom, { length }) => {
                return length || '--'
            },
            width: '15%',
        },
        {
            title: __('标度'),
            key: 'field_precision',
            dataIndex: 'field_precision',
            renderFormItem: (currentConfig, { record }) => {
                if (record.type === 'decimal') {
                    return (
                        <Input
                            placeholder={__('请输入')}
                            type="number"
                            autoComplete="off"
                        />
                    )
                }
                return <div>--</div>
            },
            formItemProps: (form, config) => {
                const data = form.getFieldsValue()
                const { type, length } = data[config?.entity?.id] || {
                    type: '',
                    length: 38,
                }
                return type === 'decimal'
                    ? {
                          validateFirst: true,
                          rules: [
                              {
                                  required: true,
                                  message: __('输入不能为空'),
                              },
                              {
                                  validateTrigger: ['onBlur'],
                                  validator: (e, value) =>
                                      checkNumberRanage(
                                          e,
                                          value,
                                          {
                                              max: length,
                                              min: 0,
                                          },
                                          __(
                                              '仅支持 ${min}~${max} 之间的整数且数值小于精度',
                                              {
                                                  min: '0',
                                                  max: 38,
                                              },
                                          ),
                                      ),
                              },
                          ],
                          hasFeedback: false,
                      }
                    : {}
            },
            render: (dom, { field_precision }) => {
                return field_precision || '--'
            },
            width: '15%',
        },
        {
            title: __('字段注释'),
            key: 'description',
            dataIndex: 'description',
            renderFormItem: (record) => {
                return <Input placeholder={__('请输入')} maxLength={255} />
            },
            render: (dom, { description }) => {
                return (
                    <div
                        className={styles.fieldDescription}
                        title={description || ''}
                    >
                        {description || '--'}
                    </div>
                )
            },
            width: '20%',
        },
        {
            title: '操作',
            valueType: 'option',
            render: (text, record, _, action) => [
                <a
                    key="editable"
                    onClick={() => {
                        action?.startEditable?.(record.id)
                    }}
                >
                    {__('编辑')}
                </a>,
                <a
                    key="delete"
                    onClick={() => {
                        setFieldData(
                            fieldData.filter((item) => item.id !== record.id),
                        )
                    }}
                >
                    {__('删除')}
                </a>,
            ],
        },
    ]

    return (
        <Modal
            title={__('添加字段')}
            footer={
                <div className={styles.modalFooterContent}>
                    {node?.data.formInfo.checked !== PasteSourceChecked.New ? (
                        <div className={styles.tips}>
                            <ExclamationCircleFilled className={styles.icon} />
                            {__('“已采集”的数据表添加字段后，数据表需重新采集')}
                        </div>
                    ) : (
                        <div />
                    )}
                    <div>
                        <Button onClick={onCancel}>{__('取消')}</Button>
                        <Button
                            type="primary"
                            onClick={async () => {
                                const result =
                                    await editorFormRef.current?.validateFields()
                                const editingData =
                                    editorFormRef.current?.getFieldsValue()
                                if (
                                    !fieldData.length &&
                                    !Object.keys(editingData).length
                                ) {
                                    message.error('请至少添加一个字段')
                                    return
                                }
                                if (result) {
                                    let saveData: Array<any> = []
                                    if (
                                        node &&
                                        node?.data.formInfo.checked !==
                                            PasteSourceChecked.New
                                    ) {
                                        onReCreateForm(node)
                                    }
                                    if (Object.keys(editingData).length) {
                                        const dataId =
                                            Object.keys(editingData)[0]
                                        if (
                                            fieldData.find(
                                                (currentData) =>
                                                    currentData.id === dataId,
                                            )
                                        ) {
                                            saveData = fieldData.map(
                                                (currentData) =>
                                                    currentData.id === dataId
                                                        ? {
                                                              id: dataId,
                                                              ...editingData[
                                                                  dataId
                                                              ],
                                                          }
                                                        : currentData,
                                            )
                                        } else {
                                            saveData = [
                                                ...fieldData,
                                                {
                                                    id: dataId,
                                                    ...editingData[dataId],
                                                },
                                            ]
                                        }
                                    } else {
                                        saveData = fieldData
                                    }

                                    node?.replaceData({
                                        ...node.data,
                                        items: [
                                            ...saveData.map(
                                                ({ index, ...field }) => {
                                                    const targetData = {
                                                        ...field,
                                                        length: field?.length
                                                            ? Number(
                                                                  field.length,
                                                              )
                                                            : null,
                                                        field_precision:
                                                            field?.field_precision
                                                                ? Number(
                                                                      field.field_precision,
                                                                  )
                                                                : null,
                                                    }
                                                    return targetData
                                                },
                                            ),
                                            ...node.data.items,
                                        ],
                                        version: 'draft',
                                    })
                                    onConfirm()
                                }
                            }}
                        >
                            {__('确定')}
                        </Button>
                    </div>
                </div>
            }
            bodyStyle={{
                height: '444px',
            }}
            width={1000}
            open={!!node}
            maskClosable={false}
            onCancel={onCancel}
            className={styles.pasteFormContainer}
        >
            <EditableProTable
                columns={columns}
                rowKey="id"
                editableFormRef={editorFormRef}
                actionRef={actionRef}
                recordCreatorProps={{
                    position: 'bottom',
                    record: () => {
                        return {
                            id: uuidv4(),
                        }
                    },
                    creatorButtonText: __('添加字段'),
                    icon: <AddOutlined />,
                }}
                editable={{
                    type: 'single',
                    form: newForm,
                    actionRender: (row, config, defaultDom) => {
                        return [defaultDom.save, defaultDom.cancel]
                    },
                    onChange: (editKeys, eidtableRows) => {
                        const devRefCurrent =
                            refCurrentInput?.current?.devRefCurrent
                        if (devRefCurrent?.scrollIntoView) {
                            devRefCurrent?.scrollIntoView()
                        }
                    },
                    onSave: (key, row) => {
                        if (
                            fieldData.find(
                                (currentField) => currentField.id === key,
                            )
                        ) {
                            setFieldData(
                                fieldData.map((currentField) =>
                                    currentField.id === key
                                        ? row
                                        : currentField,
                                ),
                            )
                        } else {
                            setFieldData([...fieldData, row])
                        }
                        return Promise.resolve()
                    },
                    onDelete: (key, row) => {
                        setFieldData(
                            fieldData.filter(
                                (currentField) => currentField.id !== key,
                            ),
                        )
                        return Promise.resolve()
                    },
                    saveText: __('确定'),
                }}
                columnEmptyText={false}
                controlled
                value={fieldData}
                locale={{
                    emptyText: <div />,
                }}
                scroll={{ y: 320 }}
            />
        </Modal>
    )
}

export default AddPasteFormField
