import React, { useState, useEffect, useRef, Key, useMemo } from 'react'
import {
    Form,
    message,
    Input,
    Select,
    Space,
    Button,
    Anchor,
    Col,
    Row,
    Radio,
    Upload,
    UploadProps,
    DatePicker,
    TreeSelect,
    Spin,
} from 'antd'
import moment from 'moment'
import lodash, { trim } from 'lodash'
import { RcFile } from 'antd/es/upload'
import { DownOutlined } from '@ant-design/icons'
import CustomDrawer from '../CustomDrawer'
import CodeTableDetails from '../CodeTableManage/Details'
import CodeRuleDetails from '../CodeRulesComponent/CodeRuleDetails'
import {
    ErrorInfo,
    keyboardCharactersReg,
    Operate,
    OperateType,
    stardOrignizeTypeList,
    validateEmpty,
    validateValueLegitimacy,
    getFileExtension,
} from '@/utils'
import {
    addFile,
    AttachmentType,
    CatalogType,
    checkFileNumOrNameRepeat,
    editFile,
    getFileDetailById,
    IDataItem,
    IDirItem,
    IDirQueryType,
    formatError,
    getDirDataBySearch,
    getDirDataByTypeOrId,
    CatalogOption,
} from '@/core'
import __ from './locale'
import styles from './styles.module.less'

import { DeadlineOutlined, DeleteColored } from '@/icons'
import EditDirModal from '../Directory/EditDirModal'
import SelDataByTypeModal from '../SelDataByTypeModal'
import { FileIconType, fileTypeOptions, supportFileTypeList } from './helper'
import FileIcon from '../File/FileIcon'
import { findDirByKey, StdTreeDataOpt } from '../StandardDirTree/const'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const { Link } = Anchor
const { Option } = Select

interface IEditFormModel {
    type: OperateType
    visible: boolean
    fileId?: string
    selectedDir: IDirItem
    // setOprDirItem: (newItem: IDirItem) => void
    getTreeList: (query?: IDirQueryType, optType?: StdTreeDataOpt) => void
    onClose?: (operate: Operate) => void
    update?: (newSelectedDir?: IDirItem) => void
    selCatlgClass: CatalogOption
}

/**
 * @param type OperateType 操作类型
 * @param visible boolean 显示/隐藏
 * @param fileId number? 文件id
 * @param selectedDir IDirItem? 当前选中目录
 * @param getTreeList 获取目录方法
 * @param onClose operate 取值-确定:Operate.OK 取消:Operate.CANCEL
 * @param update
 */
const EditFileForm: React.FC<IEditFormModel> = ({
    visible,
    type = OperateType.CREATE,
    fileId,
    selectedDir,
    getTreeList,
    onClose = (operate: Operate) => {},
    update = (newSelectedDir?: IDirItem) => {},
    selCatlgClass,
}) => {
    const [form] = Form.useForm()

    const ref = useRef<HTMLDivElement>(null)

    const [userInfo] = useCurrentUser()

    const anchorItems = [
        {
            key: 'basicInfo',
            href: `#basicInfo`,
            title: __('文件信息'),
        },
        {
            key: 'techInfo',
            href: `#techInfo`,
            title: __('基本属性'),
        },
    ]

    const formRef = useRef<HTMLDivElement>(null)

    const [oprDirItem, setOprDirItem] = useState<IDirItem>(selectedDir)

    // 自定义目录
    const [treeData, setTreeData] = useState<Array<IDirItem>>()

    // 获取详情loading
    const [loading, setLoading] = useState(false)

    const [catlgKeyword, setCatlgKeyword] = useState<string>('')
    const [selectLoading, setSelectLoading] = useState<boolean>(true)
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<Key[]>([])

    // 保存文件请求Detail
    const [originDetail, setOriginDetail] = useState<any>({})

    // 码表/编码规则详情id
    const [detailIds, setDetailIds] = useState<Array<any>>([])

    const [mulDetailIds, setMulDetailIds] = useState<Array<any>>([])

    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)

    // 编码规则详情
    const [codeRuleDetailVisible, setCodeRuleDetailVisible] =
        useState<boolean>(false)

    const userFirstDepartmentId = useMemo(() => {
        const firstDepartmentId = userInfo?.ParentDeps?.[0]?.path_id.split('/')
        return firstDepartmentId[firstDepartmentId.length - 1]
    }, [userInfo])

    useEffect(() => {
        if (visible) {
            // 获取文件所属自定义目录
            getFileTreeList()
            if (type === OperateType.EDIT && fileId) {
                getFileDetail(fileId)
                return
            }
            if (type === OperateType.CREATE) {
                setOprDirItem(selectedDir)

                // 新建默认值
                form.setFieldsValue({
                    catalog_id: oprDirItem?.id ?? undefined,
                    act_date: null,
                    attachment_type: fileTypeOptions[0].value,
                    attachment_url: {
                        prefix: 'http://',
                        website: '',
                    },
                })
                // 保存原始form值
                setOriginDetail(form.getFieldsValue())
            }
        } else {
            setSelDataItems([])
            setOprDirItem(selectedDir)
        }
    }, [fileId, visible])

    useEffect(() => {
        setDefaultDirVal(oprDirItem.catalog_name)
        if (selCatlgClass !== CatalogOption.DEPARTMENT) {
            form.setFieldValue('catalog_id', oprDirItem?.id ?? '44')
            form.setFieldValue(
                'department_ids',
                userFirstDepartmentId || undefined,
            )
        } else {
            form.setFieldValue('catalog_id', '44')
            form.setFieldValue(
                'department_ids',
                oprDirItem?.id || userFirstDepartmentId || undefined,
            )
        }
    }, [oprDirItem, selCatlgClass, userFirstDepartmentId])

    // 获取表单详细信息(其中，dict_id为码表中对应的f_code字段，与新增/修改时字段不同)
    const getFileDetail = async (fId: string) => {
        if (!fId || fId === '') return
        try {
            const res = await getFileDetailById(fId)
            if (res?.data) {
                const {
                    id,
                    catalog_id,
                    catalog_name,
                    name,
                    number,
                    org_type,
                    act_date,
                    attachment_type,
                    attachment_url = '',
                    file_name,
                    description,
                    department_id,
                } = res.data
                const reg = /^(http|https):\/\//
                const website = attachment_url.replace(reg, '')
                let urlPrefix = ''
                if (reg.test(res.data.attachment_url)) {
                    if (res.data.attachment_url?.slice(0, 7) === 'http://') {
                        urlPrefix = 'http://'
                    } else {
                        urlPrefix = 'https://'
                    }
                }
                const new_attachment_url = {
                    prefix: urlPrefix,
                    website,
                }
                // 保存form原始值
                const detail = {
                    catalog_id,
                    name,
                    number: number || '',
                    org_type,
                    act_date: act_date ? moment(act_date) : null,
                    attachment_type,
                    attachment_url: new_attachment_url || {
                        prefix: '',
                        website: '',
                    },
                    description,
                    uploadedFile:
                        attachment_type === AttachmentType.FILE
                            ? [{ uid: id, name: file_name }]
                            : undefined,
                    department_ids: department_id,
                    // uploadedFile: [{ uid: id, name: file_name }],
                }

                form.setFieldsValue(detail)

                // 保存原始form值
                setOriginDetail({
                    ...detail,
                    department_id,
                })

                // setOprDirItem({
                //     id: catalog_id,
                //     catalog_name,
                //     parent_id: '',
                // })
            }
        } catch (e) {
            formatError(e)
        }
    }

    // 提交状态
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 修改/新增确认请求(其中，dict_id对应码表中的f_id，与修改获取时时不同)
    const onFinish = async (values: any) => {
        const {
            name,
            number,
            catalog_id,
            org_type,
            act_date,
            description,
            attachment_type,
            attachment_url,
            fileList,
            uploadedFile,
            department_ids,
        } = values

        const { prefix = '', website = '' } = attachment_url || {}
        const query = {
            name,
            number: number || '',
            catalog_id,
            org_type,
            act_date: act_date ? moment(act_date).format('YYYY-MM-DD') : '',
            description: (description && description.trim()) || '',
            attachment_type,
            attachment_url: prefix + website || '',
            uploadedFile:
                attachment_type === AttachmentType.FILE
                    ? uploadedFile
                    : undefined,
            department_ids,
        }

        try {
            setIsSubmitting(true)
            const fileData = new FormData()
            Object.keys(query)?.forEach((itemKey) => {
                if (itemKey === 'uploadedFile') {
                    fileData.append('file', (uploadedFile?.[0] || {}) as RcFile)
                    return
                }
                fileData.append(itemKey, query[itemKey])
            })
            if (type === OperateType.CREATE) {
                await addFile(fileData)
                message.success('新建成功')
            } else if (fileId) {
                await editFile(fileId, fileData)
                message.success('编辑成功')
            }
            update(oprDirItem)
        } catch (error: any) {
            if (error.status === 400) {
                // 消息队列异常，特殊处理
                if (
                    error.data &&
                    error.data.code &&
                    error.data.code === 'Standardization.Incorrect'
                ) {
                    message.error(error.data.description)
                    return
                }
                const details = error.data.detail
                if (details?.length) {
                    details.forEach((dItem: any) => {
                        message.error(dItem.Message)
                    })
                    return
                }
            }
            formatError(error)
        } finally {
            setIsSubmitting(false)
            if (footerOprBtnType) {
                onClose(footerOprBtnType)
                if (footerOprBtnType === Operate.OK_AND_CONTINUEOPR) {
                    form.resetFields()
                    // 新建默认值
                    form.setFieldsValue({
                        catalog_id: oprDirItem?.id ?? undefined,

                        attachment_type: fileTypeOptions[0].value,
                    })
                }
            }
        }
    }

    const onValuesChange = (currentValue: any, allValues: any) => {
        const key = Object.keys(currentValue)[0]
        // 校验多项输入值
        if (['synonym'].includes(key)) {
            allValues[key].forEach((_: any, index: number) => {
                form.validateFields([[key, index]])
            })
        }
    }

    /**
     * 展示详情页面（如编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id
     */
    const handleShowDataDetail = (dataType: CatalogType, dataId?: string) => {
        let myDetailIds: any[] = []
        let firstId: string
        switch (dataType) {
            case CatalogType.CODETABLE:
                // 码表详情
                if (dataId) {
                    // 选择对话框中选择列表中码表查看详情
                    myDetailIds = [{ key: dataId }]
                } else {
                    // form表单中查看详情
                    myDetailIds = form.getFieldValue('dict_id')
                }
                firstId = myDetailIds.length > 0 ? myDetailIds[0] : ''
                if (myDetailIds.length && firstId !== '') {
                    setDetailIds(myDetailIds)
                    setCodeTbDetailVisible(true)
                }
                break
            case CatalogType.CODINGRULES:
                // 编码规则详情
                if (dataId) {
                    // 选择对话框中选择列表中码表查看详情
                    myDetailIds = [{ key: dataId }]
                    setMulDetailIds([])
                } else {
                    // form表单中查看详情
                    myDetailIds = form.getFieldValue('rule_ids')
                    setMulDetailIds(myDetailIds)
                }
                firstId = myDetailIds.length > 0 ? myDetailIds[0] : ''
                if (myDetailIds.length && firstId !== '') {
                    setDetailIds(myDetailIds)

                    setCodeRuleDetailVisible(true)
                }
                break
            default:
                break
        }
    }

    const stdTypeList = stardOrignizeTypeList.slice(1)

    // 编辑目录对话框
    const [editDirVisible, setEditDirVisible] = useState(false)

    // 编辑选择数据对话框（用于码表/编码规则/标准文件的选择对话框）
    const [selDataByTypeVisible, setSelDataByTypeVisible] = useState(false)

    // 选择数据对话框ref
    const selDataRef = useRef({
        reloadData: () => {},
    })

    // 选择数据对话框的类型（取值：码表/编码规则/标准文件）
    const [selDataType, setSelDataType] = useState<CatalogType>(
        CatalogType.DATAELE,
    )

    // 选择数据对话框标题
    const [selDataTypeName, setSelDataTypeName] = useState('')
    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])

    useEffect(() => {
        switch (selDataType) {
            case CatalogType.CODETABLE:
                form.setFieldValue('dict_id', selDataItems)
                break
            case CatalogType.CODINGRULES:
                form.setFieldValue('rule_ids', selDataItems)
                break
            case CatalogType.FILE:
                form.setFieldValue('stdFile', selDataItems)
                break
            default:
                break
        }
    }, [selDataItems])

    useEffect(() => {
        let selDict
        let selRules: any[] = []
        let selFiles
        // 设置码表/编码规则/文件选中项（form当前值）
        switch (selDataType) {
            case CatalogType.CODETABLE:
                setSelDataTypeName('码表')
                selDict = form.getFieldValue('dict_id')
                if (selDict && selDict.length) {
                    setSelDataItems(
                        selDict.map((item: { key: any; label: any }) => {
                            return {
                                key: item.key,
                                value: item.label,
                                label: item.label,
                            }
                        }),
                    )
                } else {
                    setSelDataItems([])
                }
                break
            case CatalogType.CODINGRULES:
                setSelDataTypeName('编码规则')
                selRules = form.getFieldValue('rule_ids')
                if (selRules && selRules.length) {
                    setSelDataItems(
                        selRules.map((item: { key: any; label: any }) => {
                            return {
                                key: item.key,
                                value: item.label,
                                label: item.label,
                            }
                        }),
                    )
                } else {
                    setSelDataItems([])
                }
                break
            case CatalogType.FILE:
                setSelDataTypeName('文件')
                selFiles = form.getFieldValue('std_file_code')
                if (selRules && selRules.length) {
                    setSelDataItems(
                        selFiles.map((item: { key: any; label: any }) => {
                            return {
                                key: item.key,
                                value: item.label,
                                label: item.label,
                            }
                        }),
                    )
                } else {
                    setSelDataItems([])
                }
                break
            default:
                break
        }
    }, [selDataType, selDataByTypeVisible])

    const onEditClose = () => {
        setEditDirVisible(false)
    }

    const onSelDataTypeClose = () => {
        setSelDataByTypeVisible(false)
    }

    const dirRef: any = useRef(null)

    const handleDeleteFile = (fileItem: any) => {
        form.setFieldValue('uploadedFile', undefined)
        form.setFieldsValue({
            ...form.getFieldsValue(),
            name: '',
            number: '',
            uploadedFile: undefined,
        })
    }

    const normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e
        }
        return e?.fileList
    }

    const handleChange: UploadProps['onChange'] = async (info) => {
        const { file } = info
        const uploadType = (getFileExtension(file.name) as FileIconType) || ''
        if (!supportFileTypeList.includes(uploadType)) {
            message.error('上传的文件格式支持.pdf  .doc  .docx；大小不超过10M')
            form.setFieldsValue({
                ...form.getFieldsValue(),
                name: '',
                number: '',
                uploadedFile: [],
            })
            return
        }

        const limit = (file?.size || 0) / 1024 / 1024
        // 为空或者大于10M，提示错误
        if (!limit) {
            message.warning(__('上传文件不能为空'))
            form.setFieldsValue({
                ...form.getFieldsValue(),
                name: '',
                number: '',
                uploadedFile: [],
            })
            return
        }
        if (limit > 10) {
            message.error('文件不可超过10MB')
            form.setFieldsValue({
                ...form.getFieldsValue(),
                name: '',
                number: '',
                uploadedFile: [],
            })
            return
        }

        form.setFieldValue('fileList', file)
        const fileName = file.name?.split('.').slice(0, -1).join('.') || ''
        // 文件名称
        const name =
            fileName.split('_')?.length > 1
                ? fileName.split('_').slice(1).join('_')
                : fileName
        // 文件编号
        const number =
            fileName.split('_')?.length > 1 ? fileName.split('_')[0] : ''

        form.setFieldsValue({
            ...form.getFieldsValue(),
            name,
            number,
            uploadedFile: [file],
        })
    }

    // 文件上传限制
    const uploadProps: UploadProps = {
        accept: supportFileTypeList.map((t: string) => `.${t}`).join(','),
        maxCount: 1,
        fileList: form.getFieldValue('fileList')
            ? [form.getFieldValue('fileList')]
            : [],
        // eslint-disable-next-line react/no-unstable-nested-components
        itemRender: (_node: any, fileItem, currFileList) => {
            return (
                <div key={fileItem.uid} className={styles.fileInfoWrapper}>
                    <div className={styles.fileInfo}>
                        <FileIcon
                            type={getFileExtension(fileItem.name)}
                            style={{ fontSize: 16, marginRight: 8 }}
                        />
                        <div className={styles.fileName} title={fileItem.name}>
                            {fileItem.name}
                        </div>
                    </div>
                    <DeleteColored
                        className={styles.deleteIcon}
                        onClick={() => handleDeleteFile(fileItem)}
                    />
                </div>
            )
        },
        beforeUpload: (file: RcFile) => {
            const uploadType =
                (getFileExtension(file.name) as FileIconType) || ''
            if (supportFileTypeList.includes(uploadType)) {
                // const newFileList = form.getFieldValue('fileList') || []
                // newFileList.push(file)
                form.setFieldValue('fileList', file)
            }
            return false
        },
        // 上传文件改变时的回调，上传每个阶段都会触发该事件
        onChange: handleChange,
        showUploadList: {
            showDownloadIcon: false,
            showRemoveIcon: true,
        },
    }

    // 校验标准编号或名称唯一
    const validateFileNumOrNameRepeat = async (params: any): Promise<void> => {
        let res: any
        let reqParams = { ...params }
        // 编辑
        if (type === OperateType.EDIT) {
            reqParams = { ...params, filter_id: fileId }
        }
        // 校验名称
        if (reqParams.name) {
            const stdTypeListValues = stdTypeList.map((sItem) => sItem.value)
            if (stdTypeListValues.includes(reqParams.org_type)) {
                res = await checkFileNumOrNameRepeat(reqParams)
            }
        } else if (reqParams.number) {
            // 校验编号
            res = await checkFileNumOrNameRepeat(reqParams)
        }
        if (res?.data) {
            if (reqParams.number) {
                return Promise.reject(new Error(__('编号已存在，请重新输入')))
            }

            return Promise.reject(new Error(__('名称已存在，请重新输入')))
        }

        return Promise.resolve()
    }

    // 标准文件测试链接是否可用
    const validateURL = async (website: string): Promise<void> => {
        const url =
            (form.getFieldValue('attachment_url')?.prefix || 'http://') +
            trim(website)
        try {
            const response = await fetch(url)
            return Promise.resolve()
        } catch {
            return Promise.reject(new Error(__('链接无法访问，请检查地址')))
        }
    }

    const [defaultDirVal, setDefaultDirVal] = useState(oprDirItem.catalog_name)

    // 获取自定义目录
    const getFileTreeList = async (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
    ) => {
        try {
            setSelectLoading(true)
            let res

            if (query) {
                res = await getDirDataBySearch(query)
            } else {
                res = await getDirDataByTypeOrId(CatalogType.FILE, undefined)
            }
            const data = res.data ? res.data : []
            const parentId = data.length > 0 ? data[0].id.toString() : ''
            setTreeData(data)
        } catch (error) {
            formatError(error)
        } finally {
            setSelectLoading(false)
        }
    }

    // eslint-disable-next-line no-undef
    const onTreeExpand = (eks: Key[]) => {
        setTreeExpandedKeys(eks)
    }

    // 对话框按钮类型
    const [footerOprBtnType, setFooterOprBtnType] = useState<Operate>()

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

        // 内容不变
        // if (lodash.isEqual(originDetail, form.getFieldsValue())) {
        //     onClose(Operate.OK)
        // } else {
        //     onClose(Operate.CANCEL)
        // }
    }

    return (
        <div className={styles.editFileWrapper}>
            <CustomDrawer
                open={visible}
                onClose={handleCancel}
                loading={isSubmitting}
                headerWidth="100%"
                rootClassName={styles.editFileDrawerWrapper}
                title={`${type === OperateType.CREATE ? '新建' : '编辑'}文件`}
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
                <div className={styles.bodyShadow} />
                <div className={styles.fileBodyWrapper} ref={ref}>
                    <div ref={formRef} className={styles.fileFormWrapper}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            autoComplete="off"
                            onValuesChange={onValuesChange}
                        >
                            <div
                                className={styles.formSortTitle}
                                id="basicInfo"
                            >
                                {__('文件信息')}
                            </div>
                            <Form.Item
                                name="attachment_type"
                                required
                                rules={[
                                    {
                                        validator:
                                            validateEmpty('输入不能为空'),
                                    },
                                ]}
                            >
                                <Radio.Group options={fileTypeOptions} />
                            </Form.Item>

                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, curValues) => {
                                    return (
                                        prevValues.attachment_type !==
                                        curValues.attachment_type
                                    )
                                }}
                            >
                                {({ getFieldValue }) => {
                                    const attachmenType =
                                        getFieldValue('attachment_type')

                                    return attachmenType ===
                                        AttachmentType.URL ? (
                                        <Form.Item
                                            label="链接"
                                            requiredMark
                                            required
                                        >
                                            <Space.Compact
                                                className={styles.attachmentUrl}
                                            >
                                                <Form.Item
                                                    name={[
                                                        'attachment_url',
                                                        'prefix',
                                                    ]}
                                                >
                                                    <Select
                                                        defaultValue="http://"
                                                        style={{
                                                            width: '100px',
                                                        }}
                                                        onChange={() => {
                                                            form.validateFields(
                                                                [
                                                                    'attachment_url',
                                                                ],
                                                            )
                                                        }}
                                                    >
                                                        <Option value="http://">
                                                            http://
                                                        </Option>
                                                        <Option value="https://">
                                                            https://
                                                        </Option>
                                                    </Select>
                                                </Form.Item>
                                                <Form.Item
                                                    noStyle
                                                    shouldUpdate={(
                                                        prevValues,
                                                        curValues,
                                                    ) => {
                                                        return (
                                                            prevValues
                                                                .attachment_url
                                                                ?.prefix !==
                                                            curValues
                                                                .attachment_url
                                                                ?.prefix
                                                        )
                                                    }}
                                                >
                                                    {() => {
                                                        const urlPrefix =
                                                            getFieldValue(
                                                                'attachment_url',
                                                            )?.prefix
                                                        return (
                                                            <Form.Item
                                                                name={[
                                                                    'attachment_url',
                                                                    'website',
                                                                ]}
                                                                noStyle
                                                                dependencies={[
                                                                    [
                                                                        'attachment_url',
                                                                        'prefix',
                                                                    ],
                                                                ]}
                                                                validateFirst
                                                                validateTrigger={[
                                                                    'onChange',
                                                                    'onBlur',
                                                                ]}
                                                                rules={[
                                                                    {
                                                                        required:
                                                                            true,
                                                                        message:
                                                                            ErrorInfo.NOTNULL,
                                                                        transform:
                                                                            (
                                                                                value,
                                                                            ) =>
                                                                                trim(
                                                                                    value,
                                                                                ),
                                                                    },
                                                                    {
                                                                        validator:
                                                                            validateValueLegitimacy(
                                                                                keyboardCharactersReg,
                                                                                ErrorInfo.EXCEPTEMOJI,
                                                                            ),
                                                                    },
                                                                    {
                                                                        validateTrigger:
                                                                            [
                                                                                'onBlur',
                                                                            ],
                                                                        validator:
                                                                            (
                                                                                e,
                                                                                value,
                                                                            ) =>
                                                                                validateURL(
                                                                                    value,
                                                                                ),
                                                                    },
                                                                ]}
                                                            >
                                                                <Input
                                                                    placeholder="请输入文件链接地址"
                                                                    maxLength={
                                                                        urlPrefix ===
                                                                        'http://'
                                                                            ? 2041
                                                                            : 2040
                                                                    }
                                                                />
                                                            </Form.Item>
                                                        )
                                                    }}
                                                </Form.Item>
                                            </Space.Compact>
                                        </Form.Item>
                                    ) : (
                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(
                                                prevValues,
                                                curValues,
                                            ) => {
                                                return (
                                                    prevValues.uploadedFile !==
                                                    curValues.uploadedFile
                                                )
                                            }}
                                        >
                                            <Form.Item
                                                label="文件"
                                                name="uploadedFile"
                                                valuePropName="fileList"
                                                getValueFromEvent={normFile}
                                                className={
                                                    styles.formItemUpload
                                                }
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: '输入不能为空',
                                                    },
                                                ]}
                                            >
                                                <Upload
                                                    {...uploadProps}
                                                    className={
                                                        styles.fileUpload
                                                    }
                                                >
                                                    <Button
                                                        type="primary"
                                                        className={
                                                            styles.uploadBtn
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.operateText
                                                            }
                                                        >
                                                            上传文件
                                                        </span>
                                                    </Button>
                                                    <div
                                                        className={
                                                            styles.fileDesc
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.fileOrder
                                                            }
                                                        >
                                                            ·
                                                        </div>
                                                        支持扩展名：.pdf .doc
                                                        .docx
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.fileDesc
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.fileOrder
                                                            }
                                                        >
                                                            ·
                                                        </div>
                                                        文件名称建议为：编号_名称，例如：GB/T1900-2003_中国XXXXXXX国家标准
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.fileDesc
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.fileOrder
                                                            }
                                                        >
                                                            ·
                                                        </div>
                                                        每次仅支持上传一个文件，大小不超过10M
                                                    </div>
                                                </Upload>
                                            </Form.Item>
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                            <div className={styles.formSortTitle} id="techInfo">
                                {__('基本属性')}
                            </div>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('所属标准文件目录')}
                                        name="catalog_id"
                                        required
                                        rules={[
                                            {
                                                validator:
                                                    validateEmpty('请选择目录'),
                                            },
                                        ]}
                                    >
                                        {/* <Select
                                            ref={dirRef}
                                            labelInValue
                                            className={styles.formsBase}
                                            open={false}
                                            onClick={() => {
                                                // 新建
                                                if (
                                                    type === OperateType.CREATE
                                                ) {
                                                    setOprDirItem(selectedDir)
                                                }
                                                setEditDirVisible(true)
                                                dirRef?.current?.blur()
                                            }}
                                        /> */}
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
                                            notFoundContent={
                                                selectLoading ? (
                                                    <Spin />
                                                ) : catlgKeyword ? (
                                                    __('未找到匹配的结果')
                                                ) : (
                                                    __('暂无数据')
                                                )
                                            }
                                            treeExpandedKeys={treeExpandedKeys}
                                            onTreeExpand={onTreeExpand}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('所属组织结构')}
                                        name="department_ids"
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    __('请选择所属组织结构'),
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
                                                      userFirstDepartmentId
                                                    : userFirstDepartmentId) ||
                                                undefined
                                            }
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
                                                validator:
                                                    validateEmpty(
                                                        '请选择标准分类',
                                                    ),
                                            },
                                        ]}
                                    >
                                        <Select
                                            className={styles.formsBase}
                                            placeholder="请选择标准分类"
                                            options={stdTypeList}
                                            getPopupContainer={(node) =>
                                                node.parentNode
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(
                                            prevValues,
                                            curValues,
                                        ) => {
                                            return (
                                                prevValues.uploadedFile !==
                                                curValues.uploadedFile
                                            )
                                        }}
                                    >
                                        {() => {
                                            return (
                                                <Form.Item
                                                    label={__('标准文件名称')}
                                                    name="name"
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
                                                            validateTrigger: [
                                                                'onBlur',
                                                            ],
                                                            validator: (
                                                                e,
                                                                value,
                                                            ) =>
                                                                validateFileNumOrNameRepeat(
                                                                    {
                                                                        name: value,
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
                                                        className={
                                                            styles.formsBase
                                                        }
                                                        placeholder="请输入标准文件名称"
                                                        maxLength={255}
                                                    />
                                                </Form.Item>
                                            )
                                        }}
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(
                                            prevValues,
                                            curValues,
                                        ) => {
                                            return (
                                                prevValues.uploadedFile !==
                                                curValues.uploadedFile
                                            )
                                        }}
                                    >
                                        {() => {
                                            return (
                                                <Form.Item
                                                    label={__('标准编号')}
                                                    name="number"
                                                    // required
                                                    validateFirst
                                                    validateTrigger={[
                                                        'onChange',
                                                        'onBlur',
                                                    ]}
                                                    rules={[
                                                        {
                                                            validator:
                                                                validateValueLegitimacy(
                                                                    keyboardCharactersReg,
                                                                    ErrorInfo.EXCEPTEMOJI,
                                                                ),
                                                        },
                                                        {
                                                            validateTrigger: [
                                                                'onBlur',
                                                            ],
                                                            validator: (
                                                                e,
                                                                value,
                                                            ) =>
                                                                validateFileNumOrNameRepeat(
                                                                    {
                                                                        number: value,
                                                                    },
                                                                ),
                                                        },
                                                    ]}
                                                >
                                                    <Input
                                                        className={
                                                            styles.formsBase
                                                        }
                                                        placeholder="请输入标准编号"
                                                        maxLength={128}
                                                    />
                                                </Form.Item>
                                            )
                                        }}
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        label={__('实施日期')}
                                        name="act_date"
                                    >
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            placeholder={__('请选择截止时间')}
                                            getPopupContainer={(node) =>
                                                node.parentNode as HTMLElement
                                            }
                                            suffixIcon={<DeadlineOutlined />}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={32}>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('说明')}
                                        name="description"
                                        rules={[
                                            {
                                                validator:
                                                    validateValueLegitimacy(
                                                        keyboardCharactersReg,
                                                        ErrorInfo.EXCEPTEMOJI,
                                                    ),
                                            },
                                        ]}
                                    >
                                        <Input.TextArea
                                            className={styles.showCount}
                                            style={{
                                                height: 80,
                                                resize: `none`,
                                            }}
                                            placeholder="请输入说明"
                                            showCount
                                            maxLength={300}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
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
            </CustomDrawer>
            {/* 编辑目录 */}
            {oprDirItem && (
                <EditDirModal
                    title="选择目录"
                    visible={editDirVisible}
                    dirType={CatalogType.FILE}
                    onClose={onEditClose}
                    oprType={OperateType.SELECT}
                    oprItem={oprDirItem}
                    setOprItem={setOprDirItem}
                    afterOprReload={getTreeList}
                />
            )}
            {/* 选择码表/编码规则 */}
            <SelDataByTypeModal
                visible={selDataByTypeVisible}
                ref={selDataRef}
                onClose={onSelDataTypeClose}
                dataType={selDataType}
                oprItems={selDataItems}
                setOprItems={setSelDataItems}
                handleShowDataDetail={handleShowDataDetail}
            />
            {/* 查看码表详情 */}
            {detailIds && detailIds.length > 0 && codeTbDetailVisible && (
                <CodeTableDetails
                    visible={codeTbDetailVisible}
                    title={__('码表详情')}
                    dictId={detailIds[0].key}
                    onClose={() => setCodeTbDetailVisible(false)}
                    handleError={(errorKey: string) => {
                        // 码表不存在(status:400, code:Standardization.ResourceError.DataNotExist)，不显示详情页
                        if (
                            errorKey ===
                            'Standardization.ResourceError.DataNotExist'
                        ) {
                            // 清空码表
                            form.setFieldValue('dict_id', [])
                            selDataRef?.current?.reloadData()
                            setDetailIds([])
                        }
                    }}
                />
            )}
            {/* 查看编码规则详情，支持多选框查看详情 */}
            {detailIds && detailIds.length > 0 && codeRuleDetailVisible && (
                <CodeRuleDetails
                    visible={codeRuleDetailVisible}
                    id={detailIds[0].key}
                    mulDetailIds={mulDetailIds}
                    onClose={() => {
                        setCodeRuleDetailVisible(false)
                    }}
                    handleError={(errorKey: string, ruleId: string) => {
                        // 码表不存在(status:400, code:Standardization.ResourceError.DataNotExist)，不显示详情页
                        if (
                            errorKey ===
                            'Standardization.ResourceError.DataNotExist'
                        ) {
                            // 清空码表
                            if (ruleId) {
                                // 选择框数据对话框选中行中剔除被删ruleId
                                const selDataItemsTemp = selDataItems.filter(
                                    (item: any) => item.key !== ruleId,
                                )
                                setSelDataItems(selDataItemsTemp)
                            }
                            if (codeRuleDetailVisible) {
                                // 刷新数据
                                selDataRef?.current?.reloadData()
                            }
                        }
                    }}
                />
            )}
        </div>
    )
}

export default EditFileForm
