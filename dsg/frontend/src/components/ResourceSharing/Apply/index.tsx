import React, { useEffect, useState, useRef, useMemo } from 'react'
import {
    Button,
    Col,
    Form,
    Input,
    Row,
    Select,
    Space,
    TimePicker,
    Upload,
    message,
} from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { omit } from 'lodash'
import { RcFile, UploadProps } from 'antd/es/upload'
import __ from '../locale'
import styles from './styles.module.less'
import GlobalMenu from '@/components/GlobalMenu'
import {
    SSZDDictTypeEnum,
    formatError,
    getCurUserDepartment,
    getSSZDProvinceAppList,
    importSSZDFile,
    postShareApply,
} from '@/core'
import { GroupHeader, PromptModal } from '../helper'
import { ApplyResource } from '../const'
import { ReturnConfirmModal } from '@/ui'
import ApplyAnchor from './ApplyAnchor'
import DetailsGroup from '../Details/DetailsGroup'
import {
    applyTypeOps,
    details1,
    details2,
    details3,
    details4,
    details5,
    details6,
} from '../Details/const'
import { DeleteColored, UploadOutlined } from '@/icons'
import {
    ErrorInfo,
    cnOrEnBeginAndNumberName,
    emailReg,
    getFileExtension,
    numberReg,
} from '@/utils'
import FileIcon from '@/components/FileIcon'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useResShareDrawerContext } from '../ResShareDrawerProvider'
import DepartmentAndOrgSelect from '@/components/DepartmentAndOrgSelect'

interface IApply {
    data: {
        catalog_id: string
        catalog_title: string
        resource_id: string
        resource_name: string
        resource_type: string
        [key: string]: any
    }
    onClose: () => void
}

/**
 * 共享申请
 */
const Apply: React.FC<IApply> = ({ data, onClose }) => {
    const [userInfo] = useCurrentUser()
    const [form] = Form.useForm()
    const container = useRef(null)
    const [saveLoading, setSaveLoading] = useState<boolean>(false)
    // 是否有更改
    const [hasChange, setHasChange] = useState<boolean>(false)

    // 关联应用系统选项
    const [applySystemOps, setApplySystemOps] = useState<any>([])
    const [applySystemLoading, setApplySystemLoading] = useState<boolean>(false)

    const { dict } = useResShareDrawerContext()

    useEffect(() => {
        form.setFieldsValue({ apply_name: userInfo.VisionName || '' })
    }, [userInfo])

    useEffect(() => {
        getApplySystemData()
        getCurDepartment()
    }, [])

    // 提交申请
    const handleSave = async () => {
        try {
            setSaveLoading(true)
            const values = form.getFieldsValue()
            const { use_time, attachment } = values
            const { catalog_id, resource_id } = data
            let attachment_id
            // 上传文件
            if (attachment) {
                const formData = new FormData()
                formData.append('file', attachment.file as RcFile)
                const fileRes = await importSSZDFile(formData)
                attachment_id = fileRes?.id
            }
            await postShareApply({
                ...omit(values, ['attachment']),
                use_time: use_time
                    ? `${use_time[0].format('HH:mm')}-${use_time[1].format(
                          'HH:mm',
                      )}`
                    : undefined,
                attachment_id,
                catalog_id,
                resource_id,
            })
            message.success(__('提交申请成功'))
            onClose()
        } catch (err) {
            formatError(err)
        } finally {
            setSaveLoading(false)
        }
    }

    // 获取关联应用系统
    const getApplySystemData = async () => {
        try {
            setApplySystemLoading(true)
            const res = await getSSZDProvinceAppList()
            setApplySystemOps(res?.entries || [])
        } catch (error) {
            formatError(error)
        } finally {
            setApplySystemLoading(false)
        }
    }

    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const res = await getCurUserDepartment()
            // 当前树能根据id匹配到部门，根据id显示部门，不能匹配到，显示部门名称
            if (res?.length === 1) {
                const [dept] = res
                form.setFieldsValue({ user_org_code: dept.id })
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 文件上传限制
    const uploadProps: UploadProps = {
        accept: '.doc,.docx,.xlsx,.xls,.pdf',
        maxCount: 1,
        beforeUpload: (file: RcFile) => {
            const limit = file.size / 1024 / 1024
            if (limit > 10) {
                form.setFieldValue('attachment', undefined)
                message.error(__('文件不可超过10MB'))
                return false
            }
            const type = getFileExtension(file.name)
            if (type && ['xlsx', 'doc', 'docx', 'pdf', 'xls'].includes(type)) {
                return false
            }
            form.setFieldValue('attachment', undefined)
            message.error(__('不支持的文件类型'))

            return false
        },
        showUploadList: false,
    }

    const getForm1 = (item) => {
        return (
            <div id={item.key} className={styles.form_item}>
                <GroupHeader text={item.title} />
                <div className={styles.group}>
                    <DetailsGroup
                        config={item.content}
                        data={data}
                        labelWidth="100px"
                        gutter={24}
                    />
                </div>
            </div>
        )
    }

    const getForm2 = (item) => (
        <div id={item.key} className={styles.form_item}>
            <GroupHeader text={item.title} />
            <div className={styles['form_item-content']}>
                <Row gutter={48}>
                    <Col span={12}>
                        <Form.Item
                            name="apply_type"
                            label={__('申请类型')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('申请类型不能为空'),
                                },
                            ]}
                        >
                            <Select
                                options={applyTypeOps}
                                placeholder={__('请选择')}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="app_id"
                            label={__('关联应用系统')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('关联应用系统不能为空'),
                                },
                            ]}
                        >
                            <Select
                                options={applySystemOps}
                                placeholder={__('请选择')}
                                fieldNames={{
                                    label: 'name',
                                    value: 'app_id',
                                }}
                                loading={applySystemLoading}
                                notFoundContent={
                                    applySystemLoading ? '' : __('暂无数据')
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item
                    name="apply_basis"
                    label={__('申请依据')}
                    required={data?.resource_type === ApplyResource.Interface}
                    rules={[
                        {
                            required:
                                data?.resource_type === ApplyResource.Interface,
                            message: __('申请依据不能为空'),
                        },
                    ]}
                    style={{ marginBottom: 40 }}
                >
                    <Input.TextArea
                        placeholder={__('请输入')}
                        autoSize={{
                            minRows: 4,
                            maxRows: 4,
                        }}
                        showCount
                        maxLength={300}
                    />
                </Form.Item>
                <Form.Item
                    label={__('附件')}
                    shouldUpdate={(pre, cur) =>
                        pre.attachment !== cur.attachment
                    }
                >
                    {({ getFieldValue }) => {
                        const file = getFieldValue('attachment')?.file
                        return (
                            <div className={styles.uploadBody}>
                                <div className={styles.fileDesc}>
                                    <div className={styles.fileOrder} />
                                    {__(
                                        '支持类型.doc、docx、.xlsx 、 .xls、.pdf，文件不得超过10MB',
                                    )}
                                </div>
                                <div className={styles.fileDesc}>
                                    <div className={styles.fileOrder} />
                                    {__('仅支持上传一个文件')}
                                </div>
                                <Form.Item noStyle name="attachment">
                                    <Upload {...uploadProps}>
                                        <Button
                                            type="primary"
                                            className={styles.uploadBtn}
                                            icon={<UploadOutlined />}
                                        >
                                            {__('上传文件')}
                                        </Button>
                                    </Upload>
                                </Form.Item>

                                {/* 上传的文件 */}
                                {file && (
                                    <div className={styles.uploadedFile}>
                                        <FileIcon
                                            suffix={getFileExtension(file.name)}
                                        />
                                        <div
                                            className={styles.fileName}
                                            title={file.name}
                                        >
                                            {file.name}
                                        </div>
                                        <DeleteColored
                                            className={styles.deleteIcon}
                                            onClick={() =>
                                                form.setFieldValue(
                                                    'attachment',
                                                    undefined,
                                                )
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    }}
                </Form.Item>
            </div>
        </div>
    )

    const getForm3 = (item) => (
        <div id={item.key} className={styles.form_item}>
            <GroupHeader text={item.title} />
            <div className={styles['form_item-content']}>
                <Row gutter={48}>
                    <Col span={12}>
                        <Form.Item
                            name="use_scope"
                            label={__('使用范围说明')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('使用范围说明不能为空'),
                                },
                            ]}
                        >
                            <Select
                                placeholder={__('请选择')}
                                options={
                                    dict?.dicts?.find(
                                        (d) =>
                                            d.dict_type ===
                                            SSZDDictTypeEnum.UseScope,
                                    )?.entries || []
                                }
                                fieldNames={{
                                    label: 'dict_value',
                                    value: 'dict_key',
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) =>
                                pre.use_scope !== cur.use_scope
                            }
                        >
                            {({ getFieldValue }) => {
                                const useScope = getFieldValue('use_scope')
                                return (
                                    <Form.Item
                                        name="other_use_scope"
                                        label={__('其他范围说明')}
                                        required={useScope === '0'}
                                        rules={[
                                            {
                                                required: useScope === '0',
                                                message:
                                                    __('其他范围说明不能为空'),
                                            },
                                            {
                                                pattern:
                                                    cnOrEnBeginAndNumberName,
                                                message:
                                                    __('仅支持中英文、数字'),
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder={__('请输入')}
                                            maxLength={128}
                                        />
                                    </Form.Item>
                                )
                            }}
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item
                    name="work_scene"
                    label={__('办事场景')}
                    required
                    rules={[
                        {
                            required: true,
                            message: __('办事场景不能为空'),
                        },
                    ]}
                    style={{ marginBottom: 44 }}
                >
                    <Input.TextArea
                        placeholder={__('请输入')}
                        autoSize={{
                            minRows: 3,
                            maxRows: 3,
                        }}
                        showCount
                        maxLength={255}
                    />
                </Form.Item>
            </div>
        </div>
    )

    const getForm4 = (item) => (
        <div id={item.key} className={styles.form_item}>
            <GroupHeader text={item.title} />
            <div className={styles['form_item-content']}>
                <Row gutter={48}>
                    <Col span={12}>
                        <Form.Item
                            name="peak_frequency"
                            label={__('每天最高调用频次')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('每天最高调用频次不能为空'),
                                },
                            ]}
                        >
                            <NumberInput
                                placeholder={__('请输入')}
                                type={NumberType.Natural}
                                maxLength={10}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="avg_frequency"
                            label={__('每天平均调用频次')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('每天平均调用频次不能为空'),
                                },
                            ]}
                        >
                            <NumberInput
                                placeholder={__('请输入')}
                                type={NumberType.Natural}
                                maxLength={10}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={48}>
                    <Col span={12}>
                        <Form.Item
                            name="use_days"
                            label={__('接口使用期限（天）')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('接口使用期限不能为空'),
                                },
                            ]}
                        >
                            <NumberInput
                                placeholder={__('请输入')}
                                type={NumberType.Natural}
                                maxLength={10}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="use_time"
                            label={__('使用时间段')}
                            rules={[
                                {
                                    required: true,
                                    message: __('使用时间段不能为空'),
                                },
                            ]}
                        >
                            <TimePicker.RangePicker format="HH:mm" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item
                    name="other_reqs"
                    label={__('其他技术请求')}
                    style={{ marginBottom: 44 }}
                >
                    <Input.TextArea
                        placeholder={__('请输入')}
                        autoSize={{
                            minRows: 3,
                            maxRows: 3,
                        }}
                        showCount
                        maxLength={255}
                    />
                </Form.Item>
            </div>
        </div>
    )

    const getForm5 = (item) => (
        <div id={item.key} className={styles.form_item}>
            <GroupHeader text={item.title} />
            <div className={styles['form_item-content']}>
                <Row gutter={48}>
                    <Col span={12}>
                        <Form.Item
                            name="user_org_code"
                            label={__('资源使用部门')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('资源使用部门不能为空'),
                                },
                            ]}
                        >
                            <DepartmentAndOrgSelect
                                placeholder={__('请选择')}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="user_name"
                            label={__('资源使用人')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('资源使用人不能为空'),
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={32} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={48}>
                    <Col span={12}>
                        <Form.Item
                            name="user_phone"
                            label={__('资源使用人电话')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('联系电话不能为空'),
                                },
                                {
                                    pattern: numberReg,
                                    message: ErrorInfo.ONLYSUPNUM,
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={11} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="user_mail"
                            label={__('资源使用人邮箱')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('邮箱不能为空'),
                                },
                                {
                                    pattern: emailReg,
                                    message: ErrorInfo.EMAIL,
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={32} />
                        </Form.Item>
                    </Col>
                </Row>
            </div>
        </div>
    )

    const getForm6 = (item) => (
        <div id={item.key} className={styles.form_item}>
            <GroupHeader text={item.title} />
            <div className={styles['form_item-content']}>
                <Row gutter={48}>
                    <Col span={12}>
                        <Form.Item
                            name="apply_name"
                            label={__('资源申请人')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('资源申请人不能为空'),
                                },
                                // {
                                //     pattern: chineseEnglishReg,
                                //     message: __('仅支持中英文'),
                                // },
                            ]}
                        >
                            <Input placeholder={__('请输入')} disabled />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="apply_phone"
                            label={__('资源申请人电话')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('联系电话不能为空'),
                                },
                                {
                                    pattern: numberReg,
                                    message: ErrorInfo.ONLYSUPNUM,
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={11} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={48}>
                    <Col span={12}>
                        <Form.Item
                            name="apply_mail"
                            label={__('资源申请人邮箱')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('邮箱不能为空'),
                                },
                                {
                                    pattern: emailReg,
                                    message: ErrorInfo.EMAIL,
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={32} />
                        </Form.Item>
                    </Col>
                </Row>
            </div>
        </div>
    )

    const getForm = (item) => {
        switch (item.key) {
            case 'ResourceSharing_1':
                return getForm1(item)
            case 'ResourceSharing_2':
                return getForm2(item)
            case 'ResourceSharing_3':
                return getForm3(item)
            case 'ResourceSharing_4':
                return getForm4(item)
            case 'ResourceSharing_5':
                return getForm5(item)
            case 'ResourceSharing_6':
                return getForm6(item)

            default:
                return null
        }
    }

    // 表单分组
    const config = useMemo(() => {
        let all = [details1, details2, details3, details4, details5, details6]
        if (data) {
            // 不是接口类型过滤掉相关配置
            if (data.resource_type !== ApplyResource.Interface) {
                all = all.filter((item) => item.key !== details4.key)
            }
        }
        return all
    }, [data])

    return (
        <div className={classnames(styles.apply)}>
            {/* 导航头部 */}
            <div className={styles.detialHeader}>
                <Space className={styles.returnWrappper} size={12}>
                    <div className={styles.returnInfo}>
                        <GlobalMenu />
                        <div
                            onClick={() => {
                                if (hasChange) {
                                    ReturnConfirmModal({
                                        onCancel: () => {
                                            onClose()
                                        },
                                    })
                                } else {
                                    onClose()
                                }
                            }}
                        >
                            <LeftOutlined className={styles.returnArrow} />
                            <span className={styles.returnText}>
                                {__('返回')}
                            </span>
                        </div>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.titleText} title="ffff">
                        {__('申请${name}', {
                            name: data?.catalog_title,
                        })}
                    </div>
                </Space>
            </div>

            <div className={styles.bottom}>
                <div className={styles.content}>
                    <div className={styles.form_content}>
                        {/* 表单内容 */}
                        <div className={styles.applyForm} ref={container}>
                            <Form
                                form={form}
                                layout="vertical"
                                autoComplete="off"
                                onValuesChange={(changedValues) => {
                                    setHasChange(true)
                                }}
                                scrollToFirstError
                                className={styles.form}
                            >
                                {config.map((item) => getForm(item))}
                            </Form>
                        </div>
                        {/* 锚点 */}
                        <ApplyAnchor container={container} config={config} />
                    </div>

                    {/* 底部按钮 */}
                    <div className={styles.footer}>
                        <Space>
                            <Button
                                className={styles.btn}
                                onClick={() => {
                                    onClose()
                                }}
                            >
                                {__('取消')}
                            </Button>
                            <Button
                                type="primary"
                                className={styles.btn}
                                loading={saveLoading}
                                onClick={async () => {
                                    try {
                                        await form.validateFields()
                                        PromptModal({
                                            title: `${__(
                                                '确定申请${name}吗？',
                                                {
                                                    name: data?.catalog_title,
                                                },
                                            )}`,
                                            content:
                                                __(
                                                    '提交申请后将无法修改内容，请确认。',
                                                ),
                                            onOk() {
                                                handleSave()
                                            },
                                        })
                                    } catch (err) {
                                        //
                                    }
                                }}
                            >
                                {__('提交')}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Apply
