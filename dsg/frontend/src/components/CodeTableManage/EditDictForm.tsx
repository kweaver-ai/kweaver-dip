import React, { useState, useEffect, useRef, Key, useMemo } from 'react'
import {
    Form,
    message,
    Input,
    Select,
    FormItemProps,
    Button,
    FormListFieldData,
    Col,
    Row,
    Anchor,
    Space,
    Divider,
    TreeSelect,
    Spin,
} from 'antd'
import lodash, { slice, trim } from 'lodash'
import { useSize, useUpdateEffect } from 'ahooks'
import { ColumnGroupType, ColumnType } from 'antd/es/table'
import { RowSelectionType } from 'antd/lib/table/interface'
import {
    DownOutlined,
    MinusCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons'
import VirtualList, { ListRef } from 'rc-virtual-list'
import {
    commReg,
    entendNameEnReg,
    entendEnumEnReg,
    ErrorInfo,
    keyboardRegEnter,
    nameEnReg,
    Operate,
    OperateType,
    stardOrignizeTypeList,
} from '@/utils'
import {
    addDict,
    CatalogType,
    editDict,
    getDictDetailById,
    IDataItem,
    IDictItem,
    IDirItem,
    IDirQueryType,
    formatError,
    getDirDataBySearch,
    getDirDataByTypeOrId,
    getDictAssociatedFile,
    checkDictNameUnique,
    CatalogOption,
} from '@/core'
import CustomDrawer from '../CustomDrawer'
import styles from './styles.module.less'
import __ from './locale'

import { validateEmpty, validateValueLegitimacy } from './validate'
import { AddOutlined } from '@/icons'
import Loader from '@/ui/Loader'
import FileDetails from '../File/Details'
import { findDirByKey, StdTreeDataOpt } from '../StandardDirTree/const'
import SelDataByTypeModal from '../SelDataByTypeModal'
import { findParents } from '../StandardDirTree'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const { Link } = Anchor

// 初始码值
const initCodeValue = [
    {
        code: '',
        value: '',
        description: '',
    },
]

/**
 * setTreeData 移动目录之后重新设置数据
 */
interface IEditFormModel {
    type: OperateType
    visible: boolean
    dictId?: string
    selectedDir?: IDirItem
    showShadow?: boolean
    contentWrapperStyle?: React.CSSProperties
    // setTreeData: (data: IDirItem[]) => void
    // 更新码表模块左侧状态树
    getTreeList?: (query?: IDirQueryType, optType?: StdTreeDataOpt) => void

    onClose?: (operate: Operate) => void
    update?: (newSelectedDir?: IDirItem, newDict?: IDictItem) => void
    selCatlgClass?: CatalogOption
}

/**
 * 编辑/新建码表
 * @param type OperateType 操作类型
 * @param visible boolean 显示/隐藏
 * @param dictId number? 码表id
 * @param selectedDir IDirItem? 当前选中目录
 * @param onClose operate 取值-确定:Operate.OK 取消:Operate.CANCEL
 * @param update
 */
const EditDictForm: React.FC<IEditFormModel> = ({
    visible,
    type = OperateType.CREATE,
    dictId,
    selectedDir,
    showShadow = true,
    contentWrapperStyle = {
        width: '100%',
        boxShadow: 'none',
    },
    // setTreeData,
    getTreeList,
    onClose = (operate: Operate) => {},
    update = (newSelectedDir?: IDirItem, newDict?: IDictItem) => {},
    selCatlgClass,
}) => {
    const [form] = Form.useForm()
    const [info] = useCurrentUser()

    const ref = useRef<HTMLDivElement>(null)

    const virtualListRef = useRef<ListRef | null>(null)

    const anchorItems = [
        {
            key: 'basicInfo',
            href: `#basicInfo`,
            title: __('基本属性'),
        },
        {
            key: 'codeValue',
            href: `#codeValue`,
            title: __('码值信息'),
        },
    ]

    const [oprDirItem, setOprDirItem] = useState<IDirItem | undefined>(
        selectedDir,
    )

    // 自定义目录
    const [treeData, setTreeData] = useState<Array<IDirItem>>()

    // 保存码表请求Detail
    const [originDetail, setOriginDetail] = useState<any>({})

    // 保存搜索前的原始码值
    const [originEnums, setOriginEnums] = useState([])

    // 获取详情loading
    const [loading, setLoading] = useState(false)

    const [catlgKeyword, setCatlgKeyword] = useState<string>('')
    const [selectLoading, setSelectLoading] = useState<boolean>(true)
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<Key[]>([])

    // 对话框按钮类型
    const [footerOprBtnType, setFooterOprBtnType] = useState<Operate>()

    const useFirstDepartmentId = useMemo(() => {
        const firstDepartmentId = info?.ParentDeps?.[0]?.path_id.split('/')
        return firstDepartmentId[firstDepartmentId.length - 1]
    }, [info])

    // 获取自定义目录
    const getDictTreeList = async (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
    ) => {
        try {
            setSelectLoading(true)
            let res

            if (query) {
                res = await getDirDataBySearch(query)
            } else {
                res = await getDirDataByTypeOrId(
                    CatalogType.CODETABLE,
                    undefined,
                )
            }
            const data = res.data ? res.data : []
            const parentId = data.length > 0 ? data[0].id.toString() : ''
            setTreeData(data)

            // 展开节点
            const oprDirItemTemp = findDirByKey(
                oprDirItem?.id || '',
                data || [],
            )
            const allParents = findParents(
                data as any,
                oprDirItemTemp?.parent_id || '',
            )
            const treeExpandedKeysTemp = [...(treeExpandedKeys || [])]
            allParents?.forEach((node) => {
                const { id } = node
                if (!treeExpandedKeys.includes(id)) {
                    treeExpandedKeysTemp.push(id)
                }
            })
            setTreeExpandedKeys(treeExpandedKeysTemp)
        } catch (error) {
            formatError(error)
        } finally {
            setSelectLoading(false)
        }
    }

    const onTreeExpand = (eks: Key[]) => {
        setTreeExpandedKeys(eks)
    }

    useEffect(() => {
        // form.resetFields()
        setSelDataItems([])
        if (visible) {
            // 获取码表所属自定义目录
            getDictTreeList()
            if (type === OperateType.EDIT && dictId) {
                getDictDetail()
                return
            }
            if (type === OperateType.CREATE) {
                const { id, catalog_name } = selectedDir ?? {}
                // setFormProps(undefined)
                setOprDirItem(selectedDir)
                setTreeExpandedKeys([id || ''])
                const initFormValues = {
                    catalog_id: id ?? undefined,

                    ch_name: '',
                    description: undefined,
                    en_name: '',
                    enums: initCodeValue,
                    org_type: undefined,
                    std_files: [],
                }
                form.setFieldsValue(initFormValues)
                // 保存原始form值
                setOriginDetail(initFormValues)
            }
        }
    }, [dictId, visible])

    useEffect(() => {
        if (selCatlgClass !== CatalogOption.DEPARTMENT) {
            form.setFieldValue('catalog_id', oprDirItem?.id ?? undefined)
            form.setFieldValue(
                'department_ids',
                useFirstDepartmentId || undefined,
            )
        } else {
            form.setFieldValue('catalog_id', '22')
            form.setFieldValue(
                'department_ids',
                oprDirItem?.id || useFirstDepartmentId || undefined,
            )
        }
    }, [oprDirItem, selCatlgClass, useFirstDepartmentId])

    // 获取码表详细信息
    const getDictDetail = async () => {
        if (!dictId || dictId === '') return
        try {
            setLoading(true)
            const [dictDetail, stdFiles] = await Promise.all([
                getDictDetailById(dictId),
                // 获取码表关联文件
                getDictAssociatedFile(dictId, {
                    offset: 1,
                    limit: 10000,
                }),
            ])
            if (dictDetail.data) {
                const {
                    id,
                    ch_name,
                    en_name,
                    description,
                    catalog_id,
                    catalog_name,
                    department_id,
                    status,
                    org_type,
                    // std_file_code,
                    enums,
                } = dictDetail.data
                const detail = {
                    ch_name,
                    en_name,
                    description: description || '',
                    catalog_id,
                    org_type,
                    department_ids: department_id,
                    enums:
                        enums?.map((item: any) => {
                            return {
                                ...item,
                                description: item.description,
                            }
                        }) || [],
                    std_files: stdFiles?.data?.map((fItem) => {
                        return {
                            key: fItem.id,
                            label: fItem.name,
                        }
                    }),
                }
                form.setFieldsValue(detail)

                // 保存原始form值
                setOriginDetail({
                    ...detail,
                    department_id,
                })
                setOprDirItem({
                    id: catalog_id,
                    catalog_name,
                    parent_id: '',
                })
            }
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    // 提交状态
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 修改/新增确认请求(其中，dict_id对应码表中的f_id，与修改获取时时不同)
    const onFinish = async (values: any) => {
        setIsSubmitting(true)
        const {
            id,
            ch_name,
            en_name,
            description,
            catalog_id,
            org_type,
            enums,
            std_files,
        } = values

        const query = {
            ...values,
            catalog_id,
            std_files: std_files?.map((fItem) => fItem.key),
            enums: enums || [],
        }

        try {
            let res = query
            if (type === OperateType.CREATE) {
                res = await addDict(query)
                message.success('新建成功')
            } else if (dictId) {
                await editDict(dictId, query)
                message.success('编辑成功')
            }
            update(oprDirItem, res?.data)
            if (footerOprBtnType) {
                if (footerOprBtnType === Operate.OK_AND_CONTINUEOPR) {
                    form.resetFields()
                    // 新建默认值
                    form.setFieldsValue({
                        catalog_id: oprDirItem?.id ?? undefined,
                        ch_name: '',
                        description: undefined,
                        en_name: '',
                        enums: initCodeValue,
                        org_type: undefined,
                    })
                } else {
                    onClose(footerOprBtnType)
                }
            }
        } catch (error: any) {
            if (error.status === 400) {
                const details = error.data.detail
                if (details?.length) {
                    // 目录相关错误,更新树结构
                    if (details[0].Key === 'catalog_id') {
                        getTreeList?.({ type: CatalogType.CODETABLE })
                    }
                    details.forEach((dItem: any) => {
                        message.error(dItem.Message)
                    })
                    return
                }
            }
            formatError(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    // 检测码值/码值描述是否重复
    const validateRepeat = (
        value: string,
        label: string,
        field: string,
    ): Promise<void> => {
        const fieldData = form.getFieldValue(field)

        if (Array.isArray(fieldData)) {
            const temp = fieldData.filter(
                (item) => item && value && trim(item[label]) === trim(value),
            )
            if (temp.length > 1) {
                return Promise.reject(new Error('名称已存在，请重新输入'))
            }
        }
        return Promise.resolve()
    }

    // 表单布局
    const formItemLayout = {
        labelCol: {
            span: 4,
        },
        wrapperCol: {
            span: 16,
        },
    }

    /**
     * 展示详情页面（如编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id
     */
    const handleShowDataDetail = (dataType: CatalogType, dataId?: string) => {
        const myDetailIds: any[] = []
        let firstId: string

        if (dataType === CatalogType.FILE && dataId) {
            //  处理单个/多个文件详情
            // if (dataId) {
            //     // 选择对话框中选择列表中码表查看详情
            //     myDetailIds = [{ key: dataId }]
            // } else {
            //     // form表单中查看详情
            //     myDetailIds = form.getFieldValue('file')
            // }
            // firstId = myDetailIds.length > 0 ? myDetailIds[0] : ''
            // if (myDetailIds.length && firstId !== '') {
            //     // setDetailIds(myDetailIds)
            //     setFileDetailVisible(true)
            // }
            setFileDetailVisible(true)
            setDetailId(dataId)
        }
    }

    // label信息
    const labelText = (text: string) => {
        return <div className={styles.textSecondaryColor}>{text}</div>
    }

    const stdTypeList = stardOrignizeTypeList.slice(1)

    // 编辑目录对话框
    const [editDirVisible, setEditDirVisible] = useState(false)

    // 文件详情
    const [fileDetailVisible, setFileDetailVisible] = useState<boolean>(false)

    // 编辑选择数据对话框（用于码表/编码规则/标准文件的选择对话框）
    const [selDataByTypeVisible, setSelDataByTypeVisible] = useState(false)

    // 选择数据对话框ref
    const selDataRef = useRef({
        reloadData: () => {},
    })

    // 文件id
    const [detailId, setDetailId] = useState<string>('')

    // 选择数据对话框的类型（取值：码表/编码规则/标准文件）
    const [selDataType, setSelDataType] = useState<CatalogType>(
        CatalogType.FILE,
    )

    // 选择数据对话框数据选择类型-单选/多选
    const [rowSelectionType, setRowSelectionType] =
        useState<RowSelectionType>('radio')

    // 选择数据对话框标题
    const [selDataTypeName, setSelDataTypeName] = useState('')
    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])

    useUpdateEffect(() => {
        switch (selDataType) {
            // case CatalogType.CODETABLE:
            //     form.setFieldValue('dict_id', selDataItems)
            //     break
            // case CatalogType.CODINGRULES:
            //     form.setFieldValue('rule_ids', selDataItems)
            //     break
            case CatalogType.FILE:
                form.setFieldValue('std_files', selDataItems)
                break
            default:
                break
        }
    }, [selDataItems])

    useEffect(() => {
        let selFiles
        if (selDataByTypeVisible) {
            if (selDataType === CatalogType.FILE) {
                selFiles = form.getFieldValue('std_files')
                setSelDataItems(selFiles)
            }
        }
    }, [selDataType, selDataByTypeVisible])

    // 码表
    const [dictCode, setDictCode] = useState<IDataItem[]>([])
    // 编码规则
    const [ruleList, setRuleList] = useState<IDataItem[]>([])
    // 关联标准文件列表
    const [stdFileList, setStdFileList] = useState<IDataItem[]>([])

    // 码值搜索是否回车搜索
    const [isEnterSearch, setIsEnterSearching] = useState(false)

    const onEditClose = () => {
        setEditDirVisible(false)
    }

    // 滚动到底部的函数
    const scrollToBottom = () => {
        setTimeout(() => {
            if (virtualListRef.current?.nativeElement) {
                const container =
                    virtualListRef.current.nativeElement.querySelector(
                        '.rc-virtual-list-holder',
                    )
                if (container) {
                    container.scrollTop = container.scrollHeight
                }
            }
        }, 100) // 延迟执行，确保新项已渲染
    }

    const onSelDataTypeClose = () => {
        setSelDataByTypeVisible(false)
    }

    const dirRef: any = useRef(null)
    const dictCodeRef: any = useRef(null)
    const ruleRef: any = useRef(null)
    const fileRef: any = useRef(null)

    const handleValidateRepeat = async (
        key: string,
        params: any,
    ): Promise<void> => {
        let res: any = {}
        let reqParams = { ...params }
        // 编辑
        if (type === OperateType.EDIT) {
            reqParams = { ...params, filter_id: dictId }
        }

        switch (key) {
            case 'ch_name':
            case 'en_name':
                if (stdTypeList.find((t) => t.value === params.org_type)) {
                    res = await checkDictNameUnique(reqParams)
                }
                break
            case 'code':
            // 码值
            // eslint-disable-next-line no-fallthrough
            case 'value':
                // 码值描述
                res.data =
                    form
                        .getFieldValue('enums')
                        ?.filter(
                            (cItem: any) =>
                                params[key] && cItem?.[key] === params[key],
                        )?.length === 2

                break
            default:
                break
        }

        if (res?.data) {
            return Promise.reject(new Error(__('名称已存在，请重新输入')))
        }

        return Promise.resolve()
    }

    // const validateTrigSelDataEmpty = (msg: string) => {
    //     return (_: any, value: string | number) => {
    //         const valueTemp =
    //             selDataType === CatalogType.FILE
    //                 ? form.getFieldValue('std_files')
    //                 : value
    //         const newValue =
    //             typeof valueTemp === 'string' ? valueTemp.trim() : valueTemp
    //         return new Promise((resolve, reject) => {
    //             // 如果填入或选中的值为0，仍通过校验
    //             if (typeof newValue === 'number' && newValue === 0) {
    //                 resolve(1)
    //             } else if (
    //                 !newValue ||
    //                 (Array.isArray(newValue) && newValue.length === 0)
    //             ) {
    //                 // 值为空或值为空数组
    //                 reject(new Error(msg))
    //             }
    //             resolve(1)
    //         })
    //     }
    // }

    const handleCancel = () => {
        const values = form.getFieldsValue()
        let isSame = true
        Object.keys(values).forEach((key) => {
            if (!lodash.isEqual(originDetail[key], values[key])) {
                isSame = false
            }
        })
        // 内容不变
        if (isSame) {
            onClose(Operate.OK)
        } else {
            onClose(Operate.CANCEL)
        }
    }

    const handleFooterBtnClick = async (oprType: Operate) => {
        setFooterOprBtnType(oprType)
        if ([Operate.OK, Operate.OK_AND_CONTINUEOPR].includes(oprType)) {
            form.submit()
        } else {
            handleCancel()
        }
    }

    const footer = (
        <Space>
            <Button
                className={styles.cancelBtn}
                onClick={() => handleFooterBtnClick(Operate.CANCEL)}
            >
                取消
            </Button>
            {type === OperateType.CREATE && (
                <Button
                    className={styles.okBtn}
                    type="primary"
                    htmlType="submit"
                    onClick={() =>
                        handleFooterBtnClick(Operate.OK_AND_CONTINUEOPR)
                    }
                    disabled={isSubmitting}
                >
                    确认并继续添加
                </Button>
            )}
            <Button
                className={styles.okBtn}
                type="primary"
                htmlType="submit"
                onClick={() => handleFooterBtnClick(Operate.OK)}
                disabled={isSubmitting}
            >
                确定
            </Button>
        </Space>
    )

    return (
        <div className={styles.editFormsWrapper}>
            <CustomDrawer
                open={visible}
                onClose={handleCancel}
                handleOk={() => form.submit()}
                loading={isSubmitting}
                headerWidth="100%"
                rootClassName={styles.editDrawerWrapper}
                title={`${type === OperateType.CREATE ? '新建' : '编辑'}码表`}
                contentWrapperStyle={contentWrapperStyle}
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
                customBodyStyle={{
                    height: 'auto',
                    flex: 1,
                }}
                customHeaderStyle={{
                    padding: '0 24px',
                }}
                customTitleStyle={{
                    height: 20,
                    width: 'auto',
                    maxWidth: 1146,
                    margin: '16px auto 24px',
                }}
                footerExtend={footer}
            >
                {showShadow && <div className={styles.bodyShadow} />}
                {loading ? (
                    <div className={styles.showEmpty}>
                        <Loader />
                    </div>
                ) : (
                    <div className={styles.editDraweBodyWrapper} ref={ref}>
                        <div className={styles.formWrapper}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                            >
                                <div
                                    className={styles.formSortTitle}
                                    id="basicInfo"
                                >
                                    {__('基本属性')}
                                </div>
                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText(__('码表名称'))}
                                            name="ch_name"
                                            required
                                            validateFirst
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            dependencies={['org_type']}
                                            rules={[
                                                {
                                                    validator:
                                                        validateEmpty(
                                                            '输入不能为空',
                                                        ),
                                                    transform: (
                                                        value: string,
                                                    ) => trim(value),
                                                },
                                                // {
                                                //     validator:
                                                //         validateValueLegitimacy(
                                                //             commReg,
                                                //             ErrorInfo.EXTENDCNNAME,
                                                //         ),
                                                // },
                                                {
                                                    validateTrigger: ['onBlur'],
                                                    validator: (e, value) =>
                                                        handleValidateRepeat(
                                                            'ch_name',
                                                            {
                                                                ch_name: value,
                                                                org_type:
                                                                    form.getFieldValue(
                                                                        'org_type',
                                                                    ),
                                                            },
                                                        ),
                                                },
                                            ]}
                                        >
                                            <Input
                                                className={styles.formsBase}
                                                placeholder="请输入码表名称"
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText(__('英文名称'))}
                                            name="en_name"
                                            required
                                            validateFirst
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            dependencies={['org_type']}
                                            rules={[
                                                {
                                                    validator:
                                                        validateEmpty(
                                                            '输入不能为空',
                                                        ),
                                                },
                                                {
                                                    validator:
                                                        validateValueLegitimacy(
                                                            entendNameEnReg,
                                                            ErrorInfo.EXTENDENNAME,
                                                        ),
                                                },
                                                {
                                                    validateTrigger: ['onBlur'],
                                                    validator: (e, value) =>
                                                        handleValidateRepeat(
                                                            'en_name',
                                                            {
                                                                en_name: value,
                                                                org_type:
                                                                    form.getFieldValue(
                                                                        'org_type',
                                                                    ),
                                                            },
                                                        ),
                                                },
                                            ]}
                                        >
                                            <Input
                                                className={styles.formsBase}
                                                placeholder="请输入英文名称"
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText(
                                                __('所属自定义目录'),
                                            )}
                                            name="catalog_id"
                                            required
                                            rules={[
                                                {
                                                    validator:
                                                        validateEmpty(
                                                            '输入不能为空',
                                                        ),
                                                },
                                            ]}
                                        >
                                            <TreeSelect
                                                treeData={treeData}
                                                fieldNames={{
                                                    value: 'id',
                                                    label: 'catalog_name',
                                                    children: 'children',
                                                }}
                                                className={styles.formsBase}
                                                popupClassName={
                                                    styles.selectTreeBox
                                                }
                                                switcherIcon={<DownOutlined />}
                                                style={{ width: '100%' }}
                                                getPopupContainer={(n) => n}
                                                showSearch
                                                //   value={value}
                                                dropdownStyle={{
                                                    maxHeight: 400,
                                                    overflow: 'auto',
                                                }}
                                                onSearch={(value) => {
                                                    setCatlgKeyword(value)
                                                }}
                                                treeNodeFilterProp="catalog_name"
                                                placeholder={__(
                                                    '请选择所属自定义目录',
                                                )}
                                                // allowClear
                                                notFoundContent={
                                                    selectLoading ? (
                                                        <Spin />
                                                    ) : catlgKeyword ? (
                                                        __('未找到匹配的结果')
                                                    ) : (
                                                        __('暂无数据')
                                                    )
                                                }
                                                treeExpandedKeys={
                                                    treeExpandedKeys
                                                }
                                                onTreeExpand={onTreeExpand}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText(
                                                __('所属组织结构'),
                                            )}
                                            name="department_ids"
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __(
                                                            '请选择所属组织结构',
                                                        ),
                                                },
                                            ]}
                                        >
                                            <DepartmentAndOrgSelect
                                                placeholder={__(
                                                    '请选择所属组织结构',
                                                )}
                                                defaultValue={
                                                    originDetail?.department_id ||
                                                    (selCatlgClass ===
                                                    CatalogOption.DEPARTMENT
                                                        ? oprDirItem?.id ||
                                                          useFirstDepartmentId
                                                        : useFirstDepartmentId) ||
                                                    undefined
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText(
                                                __('关联标准文件'),
                                            )}
                                            name="std_files"
                                            // validateFirst
                                            // validateTrigger={[
                                            //     'onChange',
                                            //     'onBlur',
                                            // ]}
                                            // rules={[
                                            //     {
                                            //         validator:
                                            //             validateTrigSelDataEmpty(
                                            //                 __('输入不能为空'),
                                            //             ),
                                            //     },
                                            // ]}
                                        >
                                            <Select
                                                ref={ruleRef}
                                                labelInValue
                                                mode="tags"
                                                className="formsBase hideSelectEmpty"
                                                placeholder="请选择关联标准文件"
                                                open={false}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelDataType(
                                                        CatalogType.FILE,
                                                    )
                                                    setRowSelectionType(
                                                        'checkbox',
                                                    )
                                                    setSelDataByTypeVisible(
                                                        true,
                                                    )
                                                    ruleRef?.current?.blur()
                                                }}
                                                maxTagTextLength={10}
                                                maxTagCount={3}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('标准分类')}
                                            name="org_type"
                                            required
                                            validateFirst
                                            rules={[
                                                {
                                                    validator: validateEmpty(
                                                        __('请选择标准分类'),
                                                    ),
                                                },
                                            ]}
                                        >
                                            <Select
                                                className={styles.formsBase}
                                                placeholder={__(
                                                    '请选择标准分类',
                                                )}
                                                options={stdTypeList}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={__('说明')}
                                            name="description"
                                            // rules={[
                                            //     {
                                            //         validator:
                                            //             validateValueLegitimacy(
                                            //                 keyboardRegEnter,
                                            //                 ErrorInfo.EXCEPTEMOJI,
                                            //             ),
                                            //     },
                                            // ]}
                                        >
                                            <Input.TextArea
                                                className={styles.showCount}
                                                style={{
                                                    height: 80,
                                                    resize: `none`,
                                                }}
                                                placeholder={__('请输入说明')}
                                                showCount
                                                maxLength={300}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div
                                    className={styles.formSortTitle}
                                    id="codeValue"
                                >
                                    {__('码值信息')}
                                </div>

                                <div className={styles.codeValueHeader}>
                                    <div>{__('码值')}</div>
                                    <div>{__('码值描述')}</div>
                                    <div>{__('说明')}</div>
                                </div>

                                <Form.List name="enums">
                                    {(fields, { add, remove }) => (
                                        <>
                                            <VirtualList
                                                ref={virtualListRef}
                                                data={fields}
                                                height={560}
                                                itemHeight={56}
                                                itemKey={(item) => item.key}
                                                styles={{
                                                    verticalScrollBarThumb: {
                                                        right: -20,
                                                    },
                                                }}
                                            >
                                                {({
                                                    key,
                                                    name,
                                                    ...restField
                                                }) => (
                                                    <Space
                                                        key={key}
                                                        size={12}
                                                        align="baseline"
                                                        className={
                                                            styles.codeValueWrapper
                                                        }
                                                    >
                                                        <Form.Item
                                                            {...restField}
                                                            name={[
                                                                name,
                                                                'code',
                                                            ]}
                                                            validateTrigger={[
                                                                'onChange',
                                                                'onBlur',
                                                            ]}
                                                            rules={[
                                                                {
                                                                    required:
                                                                        true,
                                                                    message:
                                                                        __(
                                                                            '输入不能为空',
                                                                        ),
                                                                },
                                                                // 校验合法性
                                                                // {
                                                                //     validator:
                                                                //         validateValueLegitimacy(
                                                                //             entendEnumEnReg,
                                                                //             ErrorInfo.ENUMNAME,
                                                                //         ),
                                                                // },
                                                                {
                                                                    validateTrigger:
                                                                        [
                                                                            'onBlur',
                                                                        ],
                                                                    validator: (
                                                                        e,
                                                                        value,
                                                                    ) =>
                                                                        handleValidateRepeat(
                                                                            'code',
                                                                            {
                                                                                code: value,
                                                                            },
                                                                        ),
                                                                },
                                                            ]}
                                                            style={{
                                                                width: 200,
                                                            }}
                                                        >
                                                            <Input
                                                                placeholder={__(
                                                                    '请输入码值',
                                                                )}
                                                                maxLength={64}
                                                            />
                                                        </Form.Item>
                                                        <Divider
                                                            type="horizontal"
                                                            className={
                                                                styles.itemDivider
                                                            }
                                                        />
                                                        <Form.Item
                                                            {...restField}
                                                            name={[
                                                                name,
                                                                'value',
                                                            ]}
                                                            validateTrigger={[
                                                                'onChange',
                                                                'onBlur',
                                                            ]}
                                                            rules={[
                                                                {
                                                                    required:
                                                                        true,
                                                                    message:
                                                                        __(
                                                                            '输入不能为空',
                                                                        ),
                                                                },
                                                                {
                                                                    validateTrigger:
                                                                        [
                                                                            'onBlur',
                                                                        ],
                                                                    validator: (
                                                                        e,
                                                                        value,
                                                                    ) =>
                                                                        handleValidateRepeat(
                                                                            'value',
                                                                            {
                                                                                value,
                                                                            },
                                                                        ),
                                                                },
                                                            ]}
                                                            style={{
                                                                width: 200,
                                                            }}
                                                        >
                                                            <Input
                                                                placeholder={__(
                                                                    '请输入码值描述',
                                                                )}
                                                                maxLength={64}
                                                            />
                                                        </Form.Item>
                                                        <Divider
                                                            type="horizontal"
                                                            className={
                                                                styles.itemDivider
                                                            }
                                                        />
                                                        <Form.Item
                                                            {...restField}
                                                            name={[
                                                                name,
                                                                'description',
                                                            ]}
                                                            style={{ flex: 1 }}
                                                        >
                                                            <Input.TextArea
                                                                style={{
                                                                    resize: `none`,
                                                                    height: 32,
                                                                }}
                                                                placeholder={__(
                                                                    '请输入说明',
                                                                )}
                                                                maxLength={200}
                                                            />
                                                        </Form.Item>
                                                        {fields?.length > 1 && (
                                                            <MinusCircleOutlined
                                                                onClick={() =>
                                                                    remove(name)
                                                                }
                                                                className={
                                                                    styles.cvMinusBtn
                                                                }
                                                            />
                                                        )}
                                                    </Space>
                                                )}
                                            </VirtualList>

                                            <Form.Item
                                                style={{
                                                    marginTop:
                                                        fields.length < 10
                                                            ? -(
                                                                  (10 -
                                                                      fields.length) *
                                                                  56
                                                              )
                                                            : 'unset',
                                                }}
                                            >
                                                <Button
                                                    type="dashed"
                                                    onClick={() => {
                                                        add()
                                                        scrollToBottom()
                                                    }}
                                                    block
                                                    className={
                                                        styles.addCodeValueBtn
                                                    }
                                                    icon={
                                                        <AddOutlined
                                                            className={
                                                                styles.operateIcon
                                                            }
                                                        />
                                                    }
                                                >
                                                    {__('添加')}
                                                </Button>
                                            </Form.Item>
                                        </>
                                    )}
                                </Form.List>
                            </Form>
                        </div>
                        <Anchor
                            getContainer={() => {
                                return (ref?.current as HTMLElement) || window
                            }}
                            onClick={(e: any) => e.preventDefault()}
                            className={styles.anchorWrapper}
                            // items={anchorItems}
                        >
                            {anchorItems?.map((link) => {
                                return (
                                    <Link
                                        href={link.href}
                                        title={link.title}
                                        key={link.key}
                                    />
                                )
                            })}
                        </Anchor>
                    </div>
                )}
            </CustomDrawer>

            {/* 选择码表/编码规则 */}
            <SelDataByTypeModal
                visible={selDataByTypeVisible}
                ref={selDataRef}
                onClose={onSelDataTypeClose}
                dataType={selDataType}
                rowSelectionType={rowSelectionType}
                oprItems={selDataItems}
                setOprItems={setSelDataItems}
                handleShowDataDetail={handleShowDataDetail}
            />

            {/* 文件详情 */}
            {fileDetailVisible && !!detailId && (
                <FileDetails
                    visible={fileDetailVisible && !!detailId}
                    fileId={detailId}
                    onClose={() => setFileDetailVisible(false)}
                />
            )}
        </div>
    )
}

export default EditDictForm
