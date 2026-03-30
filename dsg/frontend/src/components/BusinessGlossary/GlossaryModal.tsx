import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useCallback,
} from 'react'
import { Form, Modal, Input, Row, Col, Select, message } from 'antd'
import { trim } from 'lodash'
import classnames from 'classnames'
import styles from './styles.module.less'
import { GlossaryType, ClossaryStatusList, GlossaryStatus } from './const'
import {
    formatError,
    addGlossary,
    editGlossary,
    addCategories,
    editCategories,
    addTerms,
    editTerms,
    getMembers,
    IMember,
    checkGlossaryName,
    getGlossaryDetails,
    getCategoriesDetails,
    termsDetails,
} from '@/core'
import { AvatarOutlined } from '@/icons'
import __ from '../BusinessDomain/locale'
import { keyboardInputValidator, nameRepeatValidator } from '@/utils/validate'
import { CommonStatusLabel } from '../CommonStatusLabel'

const { TextArea } = Input

interface IOwnersMember extends IMember {
    disabled?: boolean
}

interface IGlossaryModal {
    ref?: any
    type?: string
    currentData?: any
    onOk?: (type: string, id: string) => void
}
const GlossaryModal: React.FC<IGlossaryModal> = forwardRef(
    (props: any, ref) => {
        const { type, currentData = {}, onOk } = props
        const [open, setOpen] = useState<boolean>(false)
        const [searchOwnerValue, setSearchOwnerValue] = useState('')
        const [members, setMembers] = useState<IOwnersMember[]>([])
        const [modalTitle, setModalTitle] = useState<string>('')
        const [form] = Form.useForm()

        useImperativeHandle(ref, () => ({
            setOpen,
        }))

        useEffect(() => {
            if (open) {
                let title: string = ''
                switch (type) {
                    case 'addCategories':
                        title = __('新增类别')
                        break
                    case 'addTerms':
                        title = __('新增术语')
                        break
                    case 'edit':
                        title =
                            currentData.type === GlossaryType.CATEGORIES
                                ? __('编辑类别')
                                : currentData.type === GlossaryType.TERMS
                                ? __('编辑术语')
                                : __('编辑术语表')
                        break
                    default:
                        title = __('新增术语表')
                }
                setModalTitle(title)
                if (type === 'edit') {
                    getDomainDetails()
                } else {
                    form.resetFields()
                    form.setFieldValue('status', GlossaryStatus.Certified)
                }
                getAllMembers()
            }
        }, [open])

        const getDomainDetails = async () => {
            try {
                const action =
                    currentData.type === GlossaryType.GLOSSARY
                        ? getGlossaryDetails
                        : currentData.type === GlossaryType.CATEGORIES
                        ? getCategoriesDetails
                        : termsDetails
                const res = await action(currentData.id)
                const { name, certification_info, owners, description } = res
                form.setFieldValue('name', name)
                form.setFieldValue('status', certification_info?.status)
                form.setFieldValue(
                    'owners',
                    owners.map((item) => item.user_id),
                )
                form.setFieldValue('description', description)
            } catch (res) {
                formatError(res)
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
                const res = await getMembers()
                setMembers(res)
            } catch (error) {
                formatError(error)
            }
        }
        const getNameParams = () => {
            let checkType: string = ''
            switch (type) {
                case 'addCategories':
                    checkType = GlossaryType.CATEGORIES
                    break
                case 'addTerms':
                    checkType = GlossaryType.TERMS
                    break
                case 'edit':
                    checkType = currentData.type
                    break
                default:
                    checkType = GlossaryType.GLOSSARY
            }
            const obj = {
                action: checkGlossaryName,
                repeatMessage: __('名称已存在，请重新输入'),
                validateMsg: __('仅支持中英文、数字、下划线及中划线'),
                showBackendTips: true,
                nameRegFlag: true,
                maxLength: 64,
                params: {
                    id: type === 'edit' ? currentData.id : undefined,
                    type: checkType,
                    glossary_id: currentData.glossary_id,
                },
            }
            return obj
        }

        // 校验重名
        const nameRepeatCb = useCallback(
            () => nameRepeatValidator(getNameParams()),
            [currentData],
        )

        const onFinish = async (values: any) => {
            const obj: any = {
                ...values,
            }
            if (type === 'edit') {
                obj.id = currentData.id
            } else {
                obj.parent_id = currentData.id
            }
            try {
                let actions: any
                let title: string = ''
                switch (type) {
                    case 'addCategories':
                        actions = addCategories
                        title = __('类别')
                        break
                    case 'addTerms':
                        actions = addTerms
                        obj.glossary_id = currentData.glossary_id
                        title = __('术语')
                        break
                    case 'edit':
                        actions =
                            currentData.type === GlossaryType.CATEGORIES
                                ? editCategories
                                : currentData.type === GlossaryType.TERMS
                                ? editTerms
                                : editGlossary
                        break
                    default:
                        actions = addGlossary
                        title = __('术语表')
                }
                const res = await actions(obj)
                message.success(
                    `${type === 'edit' ? __('编辑') : __('添加')}${title}${__(
                        '成功',
                    )}`,
                )
                setOpen(false)
                onOk(type || 'addGlossary', res.id)
            } catch (err) {
                formatError(err)
            }
        }

        // 校验拥有者
        const ownersValidator = (rules, value, callback) => {
            if (value && value.length > 7) {
                callback(new Error(__('最多只能选择7个用户')))
            } else {
                callback()
            }
        }
        const ownersChange = (value) => {
            setSearchOwnerValue('')
            setMembers(
                members.map((item: any) => {
                    return {
                        ...item,
                        disabled:
                            value.length === 7
                                ? !value.includes(item.id)
                                : false,
                    }
                }),
            )
        }

        return (
            <div className={styles.modalWrapper}>
                <Modal
                    title={modalTitle}
                    open={open}
                    onCancel={() => setOpen(false)}
                    width={800}
                    onOk={() => form.submit()}
                    destroyOnClose
                    maskClosable={false}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <Row>
                            <Col span={12}>
                                <Form.Item
                                    label={__('名称')}
                                    rules={[
                                        {
                                            required: true,
                                            message: __('输入不能为空'),
                                        },
                                        {
                                            validator: nameRepeatCb(),
                                        },
                                    ]}
                                    validateFirst
                                    name="name"
                                    style={{ paddingRight: '24px' }}
                                >
                                    <Input
                                        placeholder={`${__('请输入')}${__(
                                            '名称',
                                        )}`}
                                        showCount
                                        maxLength={64}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('认证状态')}
                                    validateFirst
                                    name="status"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('输入不能为空'),
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder={`${__('请选择')}${__(
                                            '认证状态',
                                        )}`}
                                    >
                                        {ClossaryStatusList?.map((item) => (
                                            <Select.Option
                                                key={item.value}
                                                value={item.value}
                                            >
                                                <CommonStatusLabel
                                                    value={item.value}
                                                    infos={ClossaryStatusList}
                                                />
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            label={__('拥有者')}
                            validateFirst
                            name="owners"
                            rules={[
                                {
                                    validator: (rules, value, callback) =>
                                        ownersValidator(rules, value, callback),
                                },
                            ]}
                        >
                            <Select
                                placeholder={__('请选择拥有者')}
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
                                onChange={ownersChange}
                                mode="multiple"
                                getPopupContainer={(node) => node.parentNode}
                                notFoundContent={
                                    <div className={styles.notFoundContent}>
                                        {searchOwnerValue
                                            ? __('未找到匹配的结果')
                                            : __('暂无数据')}
                                    </div>
                                }
                            >
                                {members?.map((member) => (
                                    <Select.Option
                                        key={member.id}
                                        value={member.id}
                                        disabled={member.disabled}
                                    >
                                        <div
                                            className={classnames(
                                                styles.ownerItem,
                                                member.disabled &&
                                                    styles.disabled,
                                            )}
                                        >
                                            <div
                                                className={styles.avatarWrapper}
                                            >
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
                            rules={[
                                {
                                    required: true,
                                    message: __('输入不能为空'),
                                },
                                {
                                    validator: keyboardInputValidator(),
                                },
                            ]}
                        >
                            <TextArea
                                rows={3}
                                maxLength={255}
                                showCount
                                placeholder={`${__('请输入')}${__('描述')}`}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        )
    },
)
export default GlossaryModal
