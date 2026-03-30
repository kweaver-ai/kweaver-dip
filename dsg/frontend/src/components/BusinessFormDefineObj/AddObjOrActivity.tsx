import { Form, Input, message, Modal, Select } from 'antd'
import React, { useEffect, useState } from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { trim } from 'lodash'
import { useNavigate } from 'react-router-dom'
import {
    addCategories,
    checkGlossaryName,
    editCategories,
    formatError,
    getCategoriesDetails,
    getUserListByPermission,
    ISubjectDomainItem,
    LoginPlatform,
    userInfo,
} from '@/core'
import { AvatarOutlined } from '@/icons'
import { ErrorInfo, getPlatformNumber, OperateType } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import { BusinessDomainType } from '../BusinessDomain/const'
import ObjType from '../BusinessDomain/ObjType'
import __ from './locale'
import styles from './styles.module.less'
import SubjectDomainSelect from './SubjectDomainSelect'

const { TextArea } = Input

interface IAddObjOrActivity {
    open: boolean
    onClose: () => void
    type?: OperateType
    onSuccess?: (obj: ISubjectDomainItem) => void
}

const AddObjOrActivity: React.FC<IAddObjOrActivity> = ({
    type = OperateType.CREATE,
    open,
    onClose,
    onSuccess,
}) => {
    const navigator = useNavigate()
    const [searchOwnerValue, setSearchOwnerValue] = useState('')
    const [members, setMembers] = useState<userInfo[]>([])
    const [form] = Form.useForm()
    const platformNumber = getPlatformNumber()

    useEffect(() => {
        if (open) {
            // getDomainDetails()
            getAllMembers()
        } else {
            form.resetFields()
            setSearchOwnerValue('')
        }
    }, [open])

    const getDomainDetails = async () => {
        try {
            const owernsRes = await getUserListByPermission({
                permission_ids: ['167d41c2-4b37-47e1-9c29-d103c4873f4f'],
            })
            setMembers(owernsRes.entries)
            const res = await getCategoriesDetails('')
            const { name, owners, description, type: objType } = res
            if (!owernsRes.entries?.find((m) => m.id === owners.user_id)) {
                form.setFields([
                    {
                        name: 'owners',
                        value: undefined,
                        errors:
                            type === OperateType.EDIT
                                ? ['已被删除，请重新选择']
                                : undefined,
                    },
                ])
            } else {
                form.setFieldsValue({
                    owners: owners.user_id,
                })
            }
            form.setFieldsValue({
                name,
                type: objType,
                description,
            })
        } catch (error) {
            formatError(error)
        }
    }

    // 搜索过滤项目负责人
    const filterOwner = (inputValue: string, option) => {
        const res = members
            .filter(
                (m) =>
                    m.name &&
                    m.name
                        .toLowerCase()
                        .includes(trim(inputValue.toLowerCase())),
            )
            .filter((m) => m.id === option?.value)
        return res.length > 0
    }

    // 获取所有成员
    const getAllMembers = async () => {
        try {
            const res = await getUserListByPermission({
                permission_ids: ['167d41c2-4b37-47e1-9c29-d103c4873f4f'],
            })
            setMembers(res.entries)
        } catch (error) {
            formatError(error)
        }
    }

    const validateNameRepeat = async (value: string): Promise<void> => {
        const pId = form.getFieldValue('parent_id')
        if (!pId) return Promise.resolve()
        try {
            const res = await checkGlossaryName({
                parent_id: pId,
                name: trim(value),
            })
            if (res.repeat) {
                return Promise.reject(new Error(__('该名称已存在，请重新输入')))
            }
            return Promise.resolve()
        } catch (error) {
            return Promise.reject(new Error(error.data.description))
        }
    }

    const handleConfirm = async () => {
        const vals = await form.validateFields()
        confirm({
            title: __('请确认信息'),
            icon: (
                <ExclamationCircleFilled style={{ color: 'rgb(250,173,20)' }} />
            ),
            content: (
                <div className={styles['confirm-content-container']}>
                    <div className={styles['confirm-content']}>
                        <div className={styles['confirm-content-label']}>
                            {__('名称')}：
                        </div>
                        <div className={styles['confirm-content-value']}>
                            {vals.name}
                        </div>
                    </div>
                    <div className={styles['confirm-content']}>
                        <div className={styles['confirm-content-label']}>
                            {__('类型')}：
                        </div>
                        <div className={styles['confirm-content-value']}>
                            {vals.type === BusinessDomainType.business_object
                                ? __('业务对象')
                                : __('业务活动')}
                        </div>
                    </div>
                    <div className={styles['confirm-content']}>
                        <div className={styles['confirm-content-label']}>
                            {__('数据Owner')}：
                        </div>
                        <div className={styles['confirm-content-value']}>
                            {members.find((m) => m.id === vals.owners)?.name}
                        </div>
                    </div>
                </div>
            ),
            onOk: form.submit,
            onCancel() {},
            okText: __('确定'),
            cancelText: __('取消'),
        })
    }
    const onFinish = async (values: any) => {
        try {
            const actions =
                type === OperateType.EDIT ? editCategories : addCategories
            const res = await actions({ ...values, owners: [values.owners] })
            message.success(
                type === OperateType.EDIT ? __('编辑成功') : __('新建成功'),
            )
            onSuccess?.({ ...values, id: res.id })
            onClose()
        } catch (err) {
            formatError(err)
        }
    }

    const onFieldsChange = (fields) => {
        if (fields[0].name[0] === 'parent_id') {
            form.validateFields(['name'])
        }
    }

    return (
        <div className={styles.modalWrapper}>
            <Modal
                title={
                    type === OperateType.CREATE
                        ? platformNumber === LoginPlatform.default
                            ? __('新建业务对象/业务活动')
                            : __('新建业务对象')
                        : platformNumber === LoginPlatform.default
                        ? __('编辑业务对象/业务活动')
                        : __('编辑业务对象')
                }
                open={open}
                onCancel={onClose}
                width={640}
                onOk={() => handleConfirm()}
                destroyOnClose
                forceRender
                maskClosable={false}
                bodyStyle={{ paddingBottom: 0 }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    onFieldsChange={onFieldsChange}
                >
                    <Form.Item
                        label={__('名称')}
                        rules={[
                            {
                                required: true,
                                message: ErrorInfo.NOTNULL,
                            },
                            // {
                            //     pattern: nameReg,
                            //     message: ErrorInfo.ONLYSUP,
                            // },
                            {
                                validator: (e, val) =>
                                    validateNameRepeat(trim(val)),
                            },
                        ]}
                        validateFirst
                        name="name"
                    >
                        <Input placeholder={__('请输入名称')} maxLength={128} />
                    </Form.Item>
                    <Form.Item
                        label={__('所属主题')}
                        rules={[
                            {
                                required: true,
                                message: __('请选择所属主题'),
                            },
                        ]}
                        validateFirst
                        name="parent_id"
                    >
                        <SubjectDomainSelect
                            placeholder={__('请选择所属主题')}
                            getDisabledNode={(item) => {
                                return {
                                    disable:
                                        item.type ===
                                        BusinessDomainType.subject_domain_group,
                                    message:
                                        item.type ===
                                        BusinessDomainType.subject_domain_group
                                            ? __('不支持的类型')
                                            : '',
                                }
                            }}
                        />
                    </Form.Item>
                    <Form.Item
                        label={__('类型')}
                        name="type"
                        initialValue={BusinessDomainType.business_object}
                    >
                        <ObjType />
                    </Form.Item>
                    <Form.Item
                        label={__('数据Owner')}
                        validateFirst
                        name="owners"
                        rules={[
                            {
                                required: true,
                                message: __('请选择数据Owner'),
                            },
                        ]}
                    >
                        <Select
                            placeholder={__('请选择数据Owner')}
                            searchValue={searchOwnerValue}
                            showSearch
                            allowClear
                            optionFilterProp="children"
                            filterOption={filterOwner}
                            onSearch={(value) =>
                                setSearchOwnerValue(value.substring(0, 128))
                            }
                            onDropdownVisibleChange={(state) => {
                                if (!state) {
                                    setSearchOwnerValue('')
                                }
                            }}
                            getPopupContainer={(node) => node.parentNode}
                            notFoundContent={
                                searchOwnerValue
                                    ? __('未找到匹配的结果')
                                    : __('暂无数据')
                            }
                        >
                            {members?.map((member) => (
                                <Select.Option
                                    key={member.id}
                                    value={member.id}
                                >
                                    <div
                                        className={classnames(styles.ownerItem)}
                                    >
                                        <div className={styles.avatarWrapper}>
                                            <AvatarOutlined />
                                        </div>
                                        <div
                                            className={styles.ownerName}
                                            title={member.name}
                                        >
                                            {member.name}
                                        </div>
                                    </div>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label={__('描述')}
                        name="description"
                        // rules={[
                        //     {
                        //         validator: keyboardInputValidator(
                        //             ErrorInfo.EXCEPTEMOJI,
                        //         ),
                        //     },
                        // ]}
                    >
                        <TextArea
                            maxLength={255}
                            placeholder={__('请输入描述')}
                            style={{ resize: 'none', height: 134 }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default AddObjOrActivity
