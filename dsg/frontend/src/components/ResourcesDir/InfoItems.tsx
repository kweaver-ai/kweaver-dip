/* eslint-disable no-param-reassign */
import React, {
    useState,
    forwardRef,
    useImperativeHandle,
    useEffect,
    useRef,
} from 'react'
import { Form, Modal, Table, message, Button } from 'antd'
import { cloneDeep, noop } from 'lodash'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import { getDatasheetViewDetails, dataTypeMapping } from '@/core'
import { typeOptoins, infoItemsFormData, infoItemsLabelTips } from './const'
import { IFormItem } from '@/components/SearchLayout/const'
import FormLayout from '../FormLayout'

interface Item {
    key: string
    id: string
    column_name: string
}

interface IInfoItems {
    metadataForm: any
    baseInfoForm: any
    ref?: any
    optionsType?: string
    defaultForm?: any[]
    isUpdataInfos?: boolean
    setIsUpdataInfos?: (flag: boolean) => void
    onDataChanged?: () => void
}
const InfoItems: React.FC<IInfoItems> = forwardRef((props: any, ref) => {
    const [form] = Form.useForm()
    const {
        defaultForm,
        optionsType,
        isUpdataInfos,
        metadataForm,
        baseInfoForm,
        setIsUpdataInfos,
        onDataChanged = noop,
    } = props
    const [data, setData] = useState<any[]>([])
    const [editOpen, setEditOpen] = useState<boolean>(false)
    const [formData, setFormData] = useState<IFormItem[]>(infoItemsFormData)
    // 增加提示信息
    // const [formData, setFormData] = useState<IFormItem[]>(
    //     infoItemsFormData.map((item) => {
    //         const obj = infoItemsLabelTips.find((it) => it.key === item.key)
    //         return {
    //             ...item,
    //             label: obj
    //                 ? TipsLabel({ label: item.label, tips: obj.tips })
    //                 : item.label,
    //         }
    //     }),
    // )
    const [editData, setEditData] = useState<any>({})
    const formLayoutRef: any = useRef()

    useEffect(() => {
        // isUpdataInfos 是否需要请求数据，依赖第一步元数据已选表格是否变更
        if (optionsType === 'edit' || !isUpdataInfos) {
            setData(
                defaultForm.map((item) => {
                    return {
                        ...item,
                        shared_type:
                            item.shared_type || baseInfoForm.sharedType,
                        open_type: item.open_type || baseInfoForm.openType,
                        shared_condition:
                            item.shared_condition ||
                            baseInfoForm.shared_condition,
                        open_condition:
                            item.open_condition || baseInfoForm.open_condition,
                    }
                }),
            )
        } else {
            getInfoList()
        }
    }, [])

    const getDataType = (type: string) => {
        let tempType = ''
        Object.keys(dataTypeMapping).forEach((key) => {
            if (dataTypeMapping[key].includes(type)) {
                tempType = key
            }
        })
        return typeOptoins.find((item) => item.strValue === tempType)?.value
    }

    const getInfoList = async () => {
        try {
            const res = await getDatasheetViewDetails(metadataForm.id)
            // 过滤被删除项
            // const fields = res?.fields?.filter(
            //     (item) => item.status !== stateType.delete,
            // )
            const table = res?.fields.map((item) => {
                const data_format = getDataType(
                    item?.data_type?.toLocaleLowerCase(),
                )
                const frontItem = defaultForm.find(
                    (info) => info.column_name === item.technical_name,
                )
                return {
                    ...item,
                    key: item.id,
                    null_flag: item.is_nullable === 'YES' ? 0 : 1,
                    primary_flag: item.primary_key ? 1 : 0,
                    field_precision: 1,
                    shared_type:
                        frontItem?.shared_type ?? baseInfoForm.shared_type,
                    shared_condition:
                        frontItem?.shared_condition ??
                        baseInfoForm.shared_condition,
                    sensitive_flag: frontItem?.sensitive_flag ?? 0,
                    classified_flag: frontItem?.classified_flag ?? 0,
                    open_type: frontItem?.open_type ?? baseInfoForm.open_type,
                    open_condition:
                        frontItem?.open_condition ??
                        baseInfoForm.open_condition,
                    data_format,
                    column_name: item.technical_name,
                    name_cn: item.business_name,
                    data_length: item.data_length,
                    description: item.field_comment,
                }
            })
            setData(table)
        } catch {
            message.error(__('获取元数据失败'))
        }
    }
    useImperativeHandle(ref, () => ({
        data,
    }))

    const onEdit = (record) => {
        onValuesChange({
            shared_type: record.shared_type,
            open_type: record.open_type,
            data_format: record.data_format,
        })
        setEditData(record)
        setEditOpen(true)
    }

    const getName = (infoName: string) => {
        const { infoColumns } = baseInfoForm

        if (infoColumns?.length > 0) {
            return (
                infoColumns.find((item) => item.column_name === infoName)
                    ?.name_cn || ''
            )
        }
        return ''
    }

    const columns = [
        {
            title: __('字段名称'),
            dataIndex: 'column_name',
            key: 'column_name',
            ellipsis: true,
            width: 160,
            render: (text, record) => {
                return (
                    <div className={styles.catlgName}>
                        <div className={classnames(styles.names)} title={text}>
                            {text || '--'}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('信息项名称'),
            dataIndex: 'name_cn',
            key: 'name_cn',
            ellipsis: true,
            editable: true,
            width: 160,
            render: (text, record) => {
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_format',
            key: 'data_format',
            ellipsis: true,
            editable: true,
            width: 130,
            render: (_) => {
                const text =
                    typeOptoins.find((item) => item.value === _)?.label || ''
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: __('数据长度'),
            dataIndex: 'data_length',
            key: 'data_length',
            ellipsis: true,
            editable: true,
            render: (text) => {
                return (
                    <span title={text}>{text === 0 ? text : text || '--'}</span>
                )
            },
        },
        // {
        //     title: __('数据值域'),
        //     dataIndex: 'ranges',
        //     key: 'ranges',
        //     ellipsis: true,
        //     editable: true,
        //     render: (text) => {
        //         return <span title={text}>{text || '--'}</span>
        //     },
        // },
        {
            title: __('涉密属性'),
            dataIndex: 'classified_flag',
            key: 'classified_flag',
            ellipsis: true,
            editable: true,
            render: (text) =>
                text === 1 ? __('涉密') : text === 0 ? __('非涉密') : '--',
        },
        {
            title: __('敏感属性'),
            dataIndex: 'sensitive_flag',
            key: 'sensitive_flag',
            ellipsis: true,
            editable: true,
            render: (text) =>
                text === 1 ? __('敏感') : text === 0 ? __('不敏感') : '--',
        },
        {
            title: __('共享属性'),
            dataIndex: 'shared_type',
            key: 'shared_type',
            ellipsis: true,
            render: (_) => {
                const text =
                    _ === 1
                        ? __('无条件共享')
                        : _ === 2
                        ? __('有条件共享')
                        : __('不予共享')
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: __('开放属性'),
            dataIndex: 'open_type',
            key: 'open_type',
            ellipsis: true,
            render: (_) => {
                const text = _ === 1 ? __('向公众开放') : __('不向公众开放')
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: __('是否主键'),
            dataIndex: 'primary_flag',
            key: 'primary_flag',
            ellipsis: true,
            render: (text) => (text === 1 ? __('是') : __('否')),
        },
        {
            title: __('是否必填'),
            dataIndex: 'null_flag',
            key: 'null_flag',
            ellipsis: true,
            render: (text) => (text === 1 ? __('是') : __('否')),
        },
        {
            title: __('操作'),
            dataIndex: 'option',
            key: 'option',
            width: 80,
            render: (_: any, record: Item) => {
                return (
                    <Button
                        type="link"
                        onClick={() => {
                            onEdit(record)
                        }}
                    >
                        {__('编辑')}
                    </Button>
                )
            },
        },
    ]

    // 编辑表格
    const editModalOk = () => {
        formLayoutRef?.current?.form?.validateFields().then((values) => {
            const obj = { ...editData, ...values }
            setData(
                data.map((item) => {
                    if (obj.data_length || obj.data_length === 0) {
                        obj.data_length = Number(obj.data_length)
                    } else {
                        obj.data_length = null
                    }
                    if (item.id === obj.id) {
                        const dataItem: any = {
                            ...item,
                            ...obj,
                        }
                        if (
                            obj.data_format !== 0 &&
                            obj.data_format !== 1 &&
                            obj.data_format !== 6
                        ) {
                            delete dataItem.data_length
                        }
                        return dataItem
                    }
                    return item
                }),
            )
            setEditOpen(false)
            setIsUpdataInfos(false)
        })
    }

    // antd form原生方法，监听输入值变化 切换参数，控制其他显示或者隐藏
    const onValuesChange = (values) => {
        onDataChanged()
        // 默认只有第一个参数 key; secKey ：open_type,thirdKey：data_format为编辑时传入多参数
        const [key, secKey, thirdKey] = Object.keys(values)
        const formList: IFormItem[] = cloneDeep(formData)
        formList.forEach((item) => {
            // 共享属性
            if (key === 'shared_type') {
                // 无条件共享，隐藏共享条件
                if (item.key === 'shared_condition') {
                    formLayoutRef?.current?.form?.setFieldValue(
                        'shared_condition',
                        '',
                    )
                    item.hidden = values[key] === 1
                    item.label =
                        values[key] === 3 ? __('不予共享依据') : __('共享条件')
                }
                if (item.key === 'open_type') {
                    // 不予共享 禁用开放属性
                    item.itemProps.disabled = values[key] === 3
                    if (values[key] === 3) {
                        formLayoutRef?.current?.form?.setFieldValue(
                            'open_type',
                            2,
                        )
                    }
                }
                // 不予共享 隐藏开放条件
                if (item.key === 'open_condition') {
                    item.hidden =
                        values[key] === 3 ||
                        formLayoutRef?.current?.form?.getFieldValue(
                            'open_type',
                        ) === 2
                }
            }
            // 不向公众开放，隐藏 开发条件
            if (
                item.key === 'open_condition' &&
                (secKey ? secKey === 'open_type' : key === 'open_type')
            ) {
                item.hidden = values[secKey || key] === 2
            }
            // 数据长度显示与隐藏
            // if (item.key === 'data_length' && thirdKey) {
            //     // 0,1,6 对应下面数据类型的值
            //     item.hidden = ![0, 1, 6].includes(values[thirdKey || key])
            // }
            // // 数据类型变更，控制数据长度属性变化
            // if (key === 'data_format' || thirdKey) {
            //     // 清空数据长度
            //     formLayoutRef?.current?.form?.setFieldValue('data_length', '')
            //     // 变更数据类型属性
            //     if (item.key === 'data_length') {
            //         if (values[key] === 0) {
            //             item.itemProps.max = 65
            //             item.itemProps.placeholder =
            //                 __('请输入 0 ~ 65 之间的整数')
            //             item.hidden = false
            //         } else if (values[key] === 1 || values[key] === 6) {
            //             item.itemProps.max = 65535
            //             item.itemProps.placeholder = __(
            //                 '请输入 0 ~ 65535 之间的整数',
            //             )
            //             item.hidden = false
            //         } else {
            //             item.hidden = true
            //         }
            //     }
            // }
        })

        setFormData(formList)
    }

    return (
        <>
            <Form form={form} autoComplete="off" component={false}>
                <Table
                    style={{ padding: '0 24px' }}
                    scroll={{ x: 1400, y: 'calc(100vh - 245px)' }}
                    dataSource={data}
                    columns={columns}
                    pagination={{
                        hideOnSinglePage: true,
                    }}
                    rowKey="id"
                    className={styles.infoItemBox}
                />
            </Form>

            {/* 编辑弹窗 */}
            <Modal
                title={`${__('编辑')}${__('信息项')}`}
                width={750}
                open={editOpen}
                onOk={editModalOk}
                onCancel={() => setEditOpen(false)}
                destroyOnClose
            >
                <FormLayout
                    ref={formLayoutRef}
                    formData={formData}
                    formInitialValues={editData}
                    onValuesChange={onValuesChange}
                />
            </Modal>
        </>
    )
})

export default InfoItems
