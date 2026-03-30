import { useState, useEffect } from 'react'
import { Drawer, Radio, Form, Input, Row, Col, Select } from 'antd'
import { trim } from 'lodash'
import { useNavigate } from 'react-router-dom'
import { DetailsLabel, Loader, ReturnConfirmModal } from '@/ui'
import UploadFile from '@/ui/UploadFile'
import { numberReg } from '@/utils'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
    createSSZDDataObjection,
    formatError,
    ObjectionTypeEnum,
    ApplyObjectionTypeEnum,
    UseObjectionTypeEnum,
    getPrvcDataCatlgDetailById,
    getSSZDDict,
    SSZDDictTypeEnum,
    ISSZDDictItem,
    getCurUserDepartment,
} from '@/core'
import {
    directoryCorrectionInfo,
    DrawerTitle,
    DrawerFooter,
    DetailGroupTitle,
    objectionInfo,
    applyObjectionInfo,
    getConfirmModal,
    objectionTypeMap,
} from '../helper'
import styles from '../styles.module.less'
import __ from '../locale'

interface ICreateObjection {
    // 异议类型
    type: ObjectionTypeEnum
    // 是否打开
    open: boolean
    // 数据
    item: any
    // 关闭
    onCreateObjectionClose: () => void
}

const CreateObjection = ({
    type,
    open,
    item,
    onCreateObjectionClose,
}: ICreateObjection) => {
    const [form] = Form.useForm()
    const [userInfo] = useCurrentUser()
    const navigate = useNavigate()
    const [details, setDetails] = useState<any>(null)
    const [departmentList, setDepartmentList] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(false)

    // 每次 open 或 item 变化时重新获取数据
    useEffect(() => {
        if (open) {
            getData()
        } else {
            // 当抽屉关闭时，重置表单和状态
            form.resetFields()
            setDetails(null)
        }
    }, [open, item])

    const getData = async () => {
        setLoading(true)
        const departments = await getDepartmentList()
        let newItem = {}
        if (type === ObjectionTypeEnum.DirectoryCorrection) {
            newItem = {
                ...item,
                data_name: item.title,
                data_org_name: await getDict(item?.org_code),
                // 纠错场景中，data_id 为目录id
                data_id: item.id,
                data_org_code: item?.org_code,
            }
        } else {
            // 资源共享管理未提供 【数据资源提供部门】字段，所以需要通过接口获取
            const org_code: string = await getOrgCode()

            newItem = {
                ...item,
                data_name: item.resource_name,
                resource_type: item.resource_type,
                apply_org_name: item.user_org_name,
                data_org_name: await getDict(org_code),

                // 资源使用方编码
                apply_org_code: item.user_org_code,
                // 申请异议和使用异议场景中，data_id 为资源id
                data_id: item.resource_id,
                // 异议数据提供方编码
                data_org_code: org_code,
            }
        }
        setDetails(newItem)
        setLoading(false)
        form.setFieldsValue({
            title: objectionInfo[type].initTitleValue(newItem),
            apply_problem:
                type === ObjectionTypeEnum.ApplyObjection
                    ? ApplyObjectionTypeEnum.ApplyTime
                    : UseObjectionTypeEnum.ServiceResponseAbility,
            description: '',
            basic: '',
            attachment_id: '',
            org_code: departments[0]?.value,
            creator_phone: '',
            contact: userInfo?.VisionName || '',
            phone: '',
        })
    }

    // 获取目录id:catalog_id 获取目录提供方编码
    const getOrgCode = async () => {
        try {
            if (open) {
                // 获取 org_code
                const res = await getPrvcDataCatlgDetailById(item?.catalog_id)
                return res?.org_code || ''
            }
            return ''
        } catch (error) {
            formatError(error)
            return ''
        }
    }

    // 获取字典
    const getDict = async (org_code: string): Promise<string> => {
        try {
            // 获取 OrgCode 字典
            const dict = await getSSZDDict([SSZDDictTypeEnum.OrgCode])

            const entries = dict?.dicts?.find(
                (d) => d.dict_type === SSZDDictTypeEnum.OrgCode,
            )?.entries as ISSZDDictItem[] | undefined

            if (!entries || entries.length === 0) {
                return ''
            }

            // 查找与传入的 org_code 匹配的条目，并返回其 dict_value
            const matchingEntry = entries.find(
                (entry) => entry.dict_key === org_code,
            )

            if (!matchingEntry) {
                return ''
            }

            return matchingEntry.dict_value
        } catch (error) {
            formatError(error)
            return ''
        }
    }

    // 获取默认部门
    const getDepartmentList = async () => {
        try {
            const res = await getCurUserDepartment()
            const departmentRes = res.map((i: any) => ({
                label: i.name,
                value: i.id,
            }))
            setDepartmentList(departmentRes)
            return departmentRes
        } catch (error) {
            formatError(error)
            return ''
        }
    }

    // 展示值
    const showValue = {
        objection_type: objectionTypeMap[details?.objection_type]?.text,
    }

    // 刷新详情
    const refreshDetails = (list: any[]) =>
        details
            ? list.map((i) => ({
                  ...i,
                  value: showValue[i.key] ?? details[i.key] ?? '',
              }))
            : list

    // 提交
    const onFinish = async (values) => {
        const { data_id, data_org_code, apply_org_code } = details
        try {
            await createSSZDDataObjection({
                ...values,
                attachment_id: values.attachment_id?.id,
                apply_org_code,
                data_id,
                data_org_code,
                objection_type: type,
            })
            onCreateObjectionClose()
            navigate('/objection-mgt/objection-raise')
        } catch (error) {
            formatError(error)
        }
    }

    // 返回
    const handleReturn = async () => {
        ReturnConfirmModal({ onCancel: onCreateObjectionClose })
    }

    // 点击提交按钮
    const handleClickSubmit = async () => {
        try {
            const formValues = await form.validateFields()
            getConfirmModal({
                title: __('确定提交${name}吗？', { name: formValues?.title }),
                content: __('提交申请后将无法修改内容，请确认。'),
                onOk: () => form.submit(),
            })
        } catch (error) {
            // console.log(error)
        }
    }

    return (
        <Drawer
            open={open}
            closable={false}
            width="100%"
            maskClosable={false}
            drawerStyle={{
                backgroundColor: '#e9e9ed',
                paddingBottom: '24px',
            }}
            headerStyle={{
                backgroundColor: '#fff',
            }}
            footerStyle={{
                backgroundColor: '#fff',
                margin: '0 24px',
                display: 'flex',
                justifyContent: 'end',
            }}
            bodyStyle={{
                backgroundColor: '#e9e9ed',
                padding: 0,
                overflow: 'hidden',
            }}
            title={
                <DrawerTitle
                    name={objectionInfo[type].drawTitle(details)}
                    onClose={handleReturn}
                />
            }
            footer={
                <DrawerFooter
                    onClose={handleReturn}
                    onSubmit={handleClickSubmit}
                />
            }
            destroyOnClose
        >
            <div className={styles.objectionForm}>
                {loading ? (
                    <Loader />
                ) : (
                    <Form
                        name="objection"
                        form={form}
                        layout="vertical"
                        wrapperCol={{ span: 24 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        autoComplete="off"
                        className={styles.formWrapper}
                    >
                        <>
                            <DetailGroupTitle
                                title={objectionInfo[type].groupNameOne}
                            />
                            <div className={styles.contentWrapper}>
                                <div className={styles.catalogDetail}>
                                    <DetailsLabel
                                        wordBreak
                                        detailsList={refreshDetails(
                                            type ===
                                                ObjectionTypeEnum.DirectoryCorrection
                                                ? directoryCorrectionInfo
                                                : applyObjectionInfo,
                                        )}
                                        labelWidth="130px"
                                    />
                                </div>
                                <Row gutter={48}>
                                    <Col span={12}>
                                        <Form.Item
                                            label={
                                                objectionInfo[type].titleLabel
                                            }
                                            name="title"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('输入不能为空'),
                                                },
                                            ]}
                                        >
                                            <Input
                                                maxLength={100}
                                                placeholder={__('请输入')}
                                            />
                                        </Form.Item>
                                    </Col>

                                    {type ===
                                    ObjectionTypeEnum.ApplyObjection ? (
                                        <Col span={24}>
                                            <Form.Item
                                                label={__('异议分类')}
                                                name="apply_problem"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            __('输入不能为空'),
                                                    },
                                                ]}
                                            >
                                                <Radio.Group>
                                                    <Radio
                                                        value={
                                                            ApplyObjectionTypeEnum.ApplyTime
                                                        }
                                                    >
                                                        {__('审批时长')}
                                                    </Radio>
                                                    <Radio
                                                        value={
                                                            ApplyObjectionTypeEnum.ApplyOpinion
                                                        }
                                                    >
                                                        {__('审批意见')}
                                                    </Radio>
                                                    <Radio
                                                        value={
                                                            ApplyObjectionTypeEnum.Other
                                                        }
                                                    >
                                                        {__('其他')}
                                                    </Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                    ) : null}

                                    {type === ObjectionTypeEnum.UseObjection ? (
                                        <Col span={24}>
                                            <Form.Item
                                                label={__('异议分类')}
                                                name="apply_problem"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            __('输入不能为空'),
                                                    },
                                                ]}
                                            >
                                                <Radio.Group>
                                                    <Radio
                                                        value={
                                                            UseObjectionTypeEnum.ServiceResponseAbility
                                                        }
                                                    >
                                                        {__('服务响应能力')}
                                                    </Radio>
                                                    <Radio
                                                        value={
                                                            UseObjectionTypeEnum.DataQuality
                                                        }
                                                    >
                                                        {__('数据质量')}
                                                    </Radio>
                                                    <Radio
                                                        value={
                                                            UseObjectionTypeEnum.Other
                                                        }
                                                    >
                                                        {__('其他')}
                                                    </Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                    ) : null}

                                    <Col span={24}>
                                        <Form.Item
                                            label={
                                                objectionInfo[type]
                                                    .descriptionLabel
                                            }
                                            name="description"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('输入不能为空'),
                                                },
                                            ]}
                                        >
                                            <Input.TextArea
                                                style={{
                                                    height: 100,
                                                    resize: 'none',
                                                }}
                                                maxLength={255}
                                                placeholder={__('请输入')}
                                                showCount
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={
                                                objectionInfo[type].basisLabel
                                            }
                                            name="basic"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('输入不能为空'),
                                                },
                                            ]}
                                        >
                                            <Input.TextArea
                                                style={{
                                                    height: 100,
                                                    resize: 'none',
                                                }}
                                                maxLength={255}
                                                placeholder={__('请输入')}
                                                showCount
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={__('附件')}
                                            name="attachment_id"
                                        >
                                            <UploadFile
                                                url="/api/sszd-service/v1/file"
                                                titles={[
                                                    __(
                                                        '支持类型.doc、.docx、.xlsx、.xls、.pdf，文件不得超过10MB',
                                                    ),
                                                    __('仅支持上传一个文件'),
                                                ]}
                                                accept=".doc,.docx,.xlsx,.xls,.pdf"
                                                limitSize={10 * 1024 * 1024}
                                                maxCount={1}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        </>
                        <>
                            <DetailGroupTitle
                                title={objectionInfo[type].groupNameTwo}
                            />
                            <div className={styles.contentWrapper}>
                                <Row gutter={48}>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('提出部门')}
                                            name="org_code"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('输入不能为空'),
                                                },
                                            ]}
                                        >
                                            <Select
                                                disabled={
                                                    departmentList?.length === 1
                                                }
                                                options={departmentList}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('创建人电话')}
                                            name="creator_phone"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('联系电话不能为空'),
                                                },
                                                {
                                                    pattern: numberReg,
                                                    transform: (value) =>
                                                        trim(value),
                                                    message:
                                                        __('仅支持输入数字'),
                                                },
                                            ]}
                                        >
                                            <Input
                                                maxLength={11}
                                                placeholder={__('请输入')}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('提出人')}
                                            name="contact"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __(
                                                            '资源使用人不能为空',
                                                        ),
                                                },
                                            ]}
                                        >
                                            <Input
                                                maxLength={50}
                                                placeholder={__('请输入')}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('提出人电话')}
                                            name="phone"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('联系电话不能为空'),
                                                },
                                                {
                                                    pattern: numberReg,
                                                    transform: (value) =>
                                                        trim(value),
                                                    message:
                                                        __('仅支持输入数字'),
                                                },
                                            ]}
                                        >
                                            <Input
                                                maxLength={11}
                                                placeholder={__('请输入')}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        </>
                    </Form>
                )}
            </div>
        </Drawer>
    )
}

export default CreateObjection
