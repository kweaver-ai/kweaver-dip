import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Form, Input, message, Checkbox, Drawer, Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { trim } from 'lodash'
import moment from 'moment'
import {
    QuestionCircleOutlined,
    InfoCircleOutlined,
    ExclamationCircleFilled,
} from '@ant-design/icons'
import styles from './styles.module.less'
import {
    ITagCategoryRes,
    formatError,
    getCategoryNameCheck,
    tagCategoryCreate,
    tagCategoryUpdate,
    TagDetailsType,
    getTagCategoryDetailsByType,
    getDataDictsByType,
    ItagCategoryCreate,
    getAuditProcessFromConfCenter,
    tagCategoryDraftRemoves,
    LoginPlatform,
} from '@/core'
import { commReg, getPlatformActualUrl, keyboardReg } from '@/utils'
import __ from './locale'
import {
    OperateType,
    SubjectTipsText,
    auditTypeMap,
    unpublishedList,
} from './const'
import { LabelTitle, submitTips } from './helper'
import { SortableTree } from './Tree/SortableTree'
import { compareAndUpdateTree, flattenTree } from './Tree/utilities'
import { TipsLabel } from '../BusinessTagAuthorization/helper'

interface ICreateTagClassify {
    // 显示/隐藏
    visible: boolean
    // 操作类型
    operate?: OperateType
    item?: ITagCategoryRes
    onClose: () => void
    onSure: (info?: any) => void
}

/**
 * 创建/编辑 类目
 */
const CreateTagClassify: React.FC<ICreateTagClassify> = ({
    visible,
    operate,
    item,
    onClose,
    onSure,
}) => {
    const navigator = useNavigate()
    const [form] = Form.useForm()
    const sortableTreeRef: any = useRef()
    const [loading, setLoading] = useState(false)
    const [showDraftTips, setShowDraftTips] = useState(true)
    const [isAllSelected, setIsAllSelected] = useState(false)
    const [indeterminate, setIndeterminate] = useState(false)
    const [suffixText, setSuffixText] = useState<string>('')
    const [category, setCategory] = useState<any>({})
    const [appSubjectList, setAppSubjectList] = useState<any[]>([])
    const [rangeTypes, setRangeTypes] = useState<string[]>([])

    useEffect(() => {
        if (visible && item?.id) {
            getDetails()
        }
    }, [visible])

    useEffect(() => {
        getSubjectList()
    }, [])

    useEffect(() => {
        if (
            category?.label_category_resp?.range_type &&
            appSubjectList?.length
        ) {
            const rangeType =
                category?.label_category_resp?.range_type?.split(',') || []
            form.setFieldValue('range_type_keys', rangeType)
        }
    }, [appSubjectList, category])

    useEffect(() => {
        if (!rangeTypes?.length) {
            setIsAllSelected(false)
            setIndeterminate(false)
            form.setFields([
                {
                    name: 'range_type_keys',
                    value: undefined,
                    errors: [__('适用对象不能为空')],
                },
            ])
        } else {
            setIsAllSelected(appSubjectList.length === rangeTypes.length)
            setIndeterminate(appSubjectList.length !== rangeTypes.length)
            form.setFields([
                {
                    name: 'range_type_keys',
                    value: rangeTypes,
                    errors: [],
                },
            ])
        }
    }, [rangeTypes])

    const drawerTitle = useMemo(() => {
        const title =
            operate === OperateType.CREATE
                ? __('新建标签类型')
                : __('编辑标签类型')
        const info = category?.label_category_resp
        return (
            <Space size={8}>
                <div>{title}</div>
                {item?.has_draft && (
                    <div className={styles.drawerTitleTag}>
                        {__('草稿 ${time} 由【${user}】编辑产生', {
                            time: moment(info?.updated_at).format(
                                'YYYY-MM-DD HH:mm:ss',
                            ),
                            user: info?.updated_name,
                        })}
                    </div>
                )}
            </Space>
        )
    }, [category, item])

    // 对话框onCancel
    const handleCancel = () => {
        onClose()
        form.resetFields()
    }

    const getDetails = async () => {
        try {
            const res = await getTagCategoryDetailsByType({
                id: item?.id || '',
                type: TagDetailsType.classify,
                is_draft: item?.has_draft || false,
            })
            setCategory(res)
            if (operate === OperateType.EDIT) {
                if (visible) {
                    const { name, description, range_type } =
                        res.label_category_resp
                    form.setFieldsValue({
                        name,
                        description,
                    })
                    setRangeTypes(range_type?.split(',') || [])
                }
                return
            }
            form.resetFields()
        } catch (err) {
            formatError(err)
        }
    }

    const getSubjectList = async () => {
        try {
            const res = await getDataDictsByType(10)
            setAppSubjectList(
                res?.map((info) => ({
                    value: info.key,
                    label: info.value,
                })) || [],
            )
        } catch (err) {
            formatError(err)
        }
    }

    // 对话框onOk
    const handleModalOk = async () => {
        try {
            setLoading(true)
            await form.validateFields()
            const { name, description } = form.getFieldsValue()
            let itemInfo
            const items = sortableTreeRef?.current?.items
            const label_tree = compareAndUpdateTree(
                items,
                item?.label_tree_resp || [],
            )
            const hasEmptyName =
                !label_tree?.length ||
                flattenTree(label_tree).some((node) => !node.name?.trim())
            if (hasEmptyName) {
                setSuffixText(__('业务标签不能为空'))
                return
            }
            if (flattenTree(label_tree)?.length > 200) {
                setSuffixText(__('标签总数不能超过200个'))
                return
            }
            if (!rangeTypes?.length) {
                setIsAllSelected(false)
                setIndeterminate(false)
                form.setFields([
                    {
                        name: 'range_type_keys',
                        value: undefined,
                        errors: [__('适用对象不能为空')],
                    },
                ])
                return
            }
            const auditRes = await getAuditProcessFromConfCenter({
                audit_type: auditTypeMap[operate || OperateType.CREATE],
            })
            const hasAuditProcess = auditRes.entries?.length > 0
            const params: ItagCategoryCreate = {
                name,
                description,
                label_tree,
                range_type_keys: rangeTypes,
            }
            if (operate === OperateType.CREATE) {
                itemInfo = await tagCategoryCreate(params)
            } else {
                itemInfo = await tagCategoryUpdate({
                    ...params,
                    id: item?.id,
                })
            }
            if (hasAuditProcess) {
                submitTips(operate || OperateType.CREATE, () => toAudit())
            } else {
                message.success(
                    operate === OperateType.CREATE
                        ? __('新建成功')
                        : __('变更成功'),
                )
            }
            onSure()
            onClose()
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    const checkNameRepeat = async (value: string, oldName?: string) => {
        try {
            if (trim(value) === oldName) {
                return Promise.resolve()
            }
            if (trim(value)) {
                const res = await getCategoryNameCheck({
                    id: item?.id,
                    name: value,
                })
                if (res?.repeat) {
                    return Promise.reject(
                        new Error(__('名称已存在，请重新输入')),
                    )
                }
            }
            return Promise.resolve()
        } catch (err) {
            formatError(err)
            return Promise.resolve()
        }
    }

    const toAudit = () => {
        const url = getPlatformActualUrl(
            '/personal-center/doc-audit-client/?target=apply',
            LoginPlatform.drmb, // 审核列表在资源管理平台
        )
        if (url.startsWith('/anyfabric')) {
            window.open(url, '_blank')
        } else {
            navigator(url)
        }
    }

    const deleteDraft = async () => {
        try {
            if (!item?.id) return
            await tagCategoryDraftRemoves(item?.id || '')
            message.success(__('恢复成功'))
            getDetails()
            onSure({ id: item?.id })
            setShowDraftTips(false)
        } catch (err) {
            formatError(err)
        }
    }
    const handleSelectAllChange = (checked: boolean) => {
        const ids = appSubjectList?.map((o) => o.value)
        const checkedKeys = checked ? ids : []
        setRangeTypes(checkedKeys)
    }

    return (
        <Drawer
            title={drawerTitle}
            width={800}
            maskClosable={false}
            open={visible}
            onClose={handleCancel}
            destroyOnClose
            // getContainer={false}
            bodyStyle={{ padding: '0' }}
            className={styles['create-tag']}
            footer={null}
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                initialValues={{ remember: true }}
                className={styles['create-form']}
                onFinish={() => handleModalOk()}
            >
                {item?.has_draft && showDraftTips && (
                    <div className={styles.draftBox}>
                        <Space size={8}>
                            <ExclamationCircleFilled className={styles.icon} />
                            <span>
                                {__('变更审核未通过，已产生草稿。')}
                                {item?.reject_reason
                                    ? __('审批意见：${text}', {
                                          text: item?.reject_reason,
                                      })
                                    : ''}
                            </span>
                        </Space>
                        <Button type="link" onClick={() => deleteDraft()}>
                            {__('恢复到已发布的内容')}
                        </Button>
                    </div>
                )}
                <LabelTitle label={__('基本属性')} />
                <Form.Item
                    label={__('标签类型')}
                    name="name"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            validateTrigger: ['onChange', 'onBlur'],
                            message: __('标签类型不能为空'),
                        },
                        // {
                        //     validateTrigger: 'onBlur',
                        //     validator: (e, value) =>
                        //         checkNameRepeat(value, item?.name),
                        // },
                    ]}
                >
                    <Input
                        placeholder={__('请输入业务标签类型名称')}
                        maxLength={50}
                        showCount
                    />
                </Form.Item>
                <Form.Item
                    label={__('用途描述')}
                    name="description"
                    rules={[
                        {
                            pattern: keyboardReg,
                            message: __(
                                '仅支持中英文、数字、及键盘上的特殊字符',
                            ),
                            transform: (value) => trim(value),
                        },
                    ]}
                >
                    {/* <Input.TextArea */}
                    <Input
                        // style={{ resize: 'none', height: 136 }}
                        placeholder={__('请输入业务标签的用途描述')}
                        maxLength={300}
                        showCount
                        // className={styles.desc}
                    />
                </Form.Item>
                <Form.Item
                    label={
                        <TipsLabel
                            label={__('适用对象')}
                            placement="bottomLeft"
                            maxWidth="482px"
                            icon={<QuestionCircleOutlined />}
                            tips={
                                <div>
                                    {SubjectTipsText.map((info, index) => {
                                        return (
                                            <div
                                                style={
                                                    index === 3
                                                        ? {
                                                              marginLeft:
                                                                  '22px',
                                                          }
                                                        : undefined
                                                }
                                                key={info}
                                            >
                                                {info}
                                            </div>
                                        )
                                    })}
                                </div>
                            }
                        />
                    }
                    name="range_type_keys"
                >
                    <div>
                        <Checkbox
                            checked={isAllSelected}
                            indeterminate={indeterminate}
                            onChange={(e) =>
                                handleSelectAllChange(e.target.checked)
                            }
                            style={{ marginBottom: '10px' }}
                        >
                            {__('全选')}
                        </Checkbox>
                        <Checkbox.Group
                            style={{ width: '100%' }}
                            options={appSubjectList}
                            value={rangeTypes}
                            onChange={(val: any[]) => {
                                setRangeTypes(val)
                            }}
                        />
                    </div>
                </Form.Item>
                <LabelTitle
                    label={__('业务标签')}
                    isRequired
                    suffix={
                        suffixText && (
                            <span
                                style={{
                                    color: '#FF4D4F',
                                    fontWeight: 'normal',
                                    fontSize: '14px',
                                }}
                            >
                                <InfoCircleOutlined />
                                <span style={{ marginLeft: '8px' }}>
                                    {suffixText}
                                </span>
                            </span>
                        )
                    }
                />
                <SortableTree
                    category={category!}
                    onConfiged={() =>
                        setSuffixText(
                            !sortableTreeRef?.current?.items
                                ? __('业务标签不能为空')
                                : '',
                        )
                    }
                    isEdit={!!item?.id}
                    ref={sortableTreeRef}
                />
            </Form>
            <div className={styles.footer}>
                <Button onClick={handleCancel}>{__('取消')}</Button>
                <Button
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                >
                    {unpublishedList.includes(
                        category?.label_category_resp?.audit_status,
                    )
                        ? __('更新')
                        : __('发布')}
                </Button>
            </div>
        </Drawer>
    )
}

export default CreateTagClassify
