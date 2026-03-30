import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useMemo,
} from 'react'
import {
    Form,
    Modal,
    Input,
    Row,
    Col,
    Select,
    message,
    Result,
    Button,
} from 'antd'
import classnames from 'classnames'
import { trim } from 'lodash'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.less'
import {
    addCategories,
    editCategories,
    IMember,
    getCategoriesDetails,
    checkGlossaryName,
    getUserListByPermission,
    formatError,
} from '@/core'
import { AvatarOutlined } from '@/icons'
import __ from './locale'
import ObjType from './ObjType'
import { BusinessDomainType } from './const'
import {
    LoginPlatform,
    userInfo,
} from '@/core/apis/configurationCenter/index.d'
import { getPlatformNumber } from '@/utils'
import ChooseOwnerModal from '../ChooseOwnerModal'

const { TextArea } = Input

interface IGlossaryModal {
    ref?: any
    type?: string
    currentData?: any
    onOk?: (type: string, id: string) => void
}
interface IOwnersMember extends IMember {
    disabled?: boolean
}
const GlossaryModal: React.FC<IGlossaryModal> = forwardRef(
    (props: any, ref) => {
        const { type, currentData = {}, onOk } = props
        const navigator = useNavigate()
        const [open, setOpen] = useState<boolean>(false)
        const [searchOwnerValue, setSearchOwnerValue] = useState('')
        const [members, setMembers] = useState<userInfo[]>([])
        const [modalTitle, setModalTitle] = useState<string>('')
        const [form] = Form.useForm()
        const [successOpen, setSuccessOpen] = useState(false)
        const [newObjInfo, setNewObjInfo] = useState({
            id: '',
            name: '',
            ObjType: BusinessDomainType.business_activity,
        })
        const platformNumber = getPlatformNumber()
        const [loading, setLoading] = useState(false)
        const [chooseOwnerModalOpen, setChooseOwnerModalOpen] = useState(false)

        const isExistOwner = useMemo(
            () =>
                (type === 'addTerms' && currentData.type) ||
                (type === 'edit' &&
                    currentData.type !==
                        BusinessDomainType.subject_domain_group),
            [currentData, type],
        )

        const isExistObjType = useMemo(
            () =>
                (type === 'addTerms' &&
                    currentData.type === BusinessDomainType.subject_domain) ||
                (type === 'edit' &&
                    [
                        BusinessDomainType.business_activity,
                        BusinessDomainType.business_object,
                    ].includes(currentData.type)),
            [currentData, type],
        )

        const parentId = useMemo(() => {
            const ids = currentData?.path_id?.split('/') || []
            const index = ids.findIndex((id) => id === currentData.id)
            return ids?.[index - 1] || ''
        }, [currentData])

        useImperativeHandle(ref, () => ({
            setOpen,
        }))

        const getL2Details = async () => {
            try {
                const owernsRes = await getUserListByPermission({
                    permission_ids: ['167d41c2-4b37-47e1-9c29-d103c4873f4f'],
                })
                setMembers(owernsRes.entries)
                const res = await getCategoriesDetails(currentData.id)
                if (
                    !owernsRes.entries?.find(
                        (m) => m.id === res?.owners?.user_id,
                    )
                ) {
                    form.setFieldsValue({
                        owners: undefined,
                    })
                } else {
                    form.setFieldsValue({
                        owners: res?.owners?.user_id,
                    })
                }
            } catch (error) {
                if (
                    error.data.code ===
                    'BusinessGrooming.Glossary.ObjectNotExist'
                ) {
                    message.error(
                        __('${name}被删除，请刷新后重试', {
                            name: currentData.name,
                        }),
                    )
                    return
                }
                formatError(error)
            }
        }

        useEffect(() => {
            if (open) {
                switch (currentData.type) {
                    case '':
                        setModalTitle(
                            `${type === 'edit' ? __('编辑') : __('新建')}${
                                // platformNumber === LoginPlatform.default
                                //     ? __('主题域分组')
                                //     :
                                __('分组')
                            }`,
                        )
                        break
                    case BusinessDomainType.subject_domain_group:
                        setModalTitle(
                            `${type === 'edit' ? __('编辑') : __('新建')}${
                                // type === 'edit'
                                //     ? platformNumber === LoginPlatform.default
                                //         ? __('主题域分组')
                                //         : __('分组')
                                //     : platformNumber === LoginPlatform.default
                                //     ? __('主题域')
                                //     :
                                __('分组')
                            }`,
                        )
                        break
                    case BusinessDomainType.subject_domain:
                        setModalTitle(
                            `${type === 'edit' ? __('编辑') : __('新建')}${
                                type === 'edit' ? __('主题域') : __('业务对象')
                                // : platformNumber === LoginPlatform.default
                                // ? __('业务对象/业务活动')
                                // : __('业务对象')
                            }`,
                        )
                        break
                    default:
                        setModalTitle(
                            `${type === 'edit' ? __('编辑') : __('新建')}${
                                __('业务对象')
                                // platformNumber === LoginPlatform.default
                                //     ? __('业务对象/业务活动')
                                //     : __('业务对象')
                            }`,
                        )
                }
                if (type === 'edit') {
                    getDomainDetails()
                }
                // else if (
                //     currentData.type === BusinessDomainType.subject_domain
                // ) {
                //     getL2Details()
                // } else {
                //     getAllMembers()
                // }
            } else {
                form.resetFields()
                setSearchOwnerValue('')
            }
        }, [open, type])

        const getDomainDetails = async () => {
            try {
                // const owernsRes = await getUserListByPermission({
                //     permission_ids: ['167d41c2-4b37-47e1-9c29-d103c4873f4f'],
                // })

                const res = await getCategoriesDetails(currentData.id)
                const { name, owners, description, type: objType } = res
                setMembers([
                    {
                        id: owners.user_id,
                        name: owners.user_name,
                    },
                ])
                form.setFieldsValue({
                    owners: owners.user_id,
                })
                form.setFieldsValue({
                    name,
                    type: objType,
                    description,
                })
            } catch (error) {
                if (
                    error.data.code ===
                    'BusinessGrooming.Glossary.ObjectNotExist'
                ) {
                    message.error(
                        __('${name}被删除，请刷新后重试', {
                            name: currentData.name,
                        }),
                    )
                    return
                }
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

        // 校验重名
        const nameRepeatCb = async (value: string): Promise<void> => {
            const trimValue = trim(value)
            try {
                const regex = /\//
                if (regex.test(trimValue)) {
                    return Promise.reject(
                        new Error('不能包含发斜杠“/”，请重新输入'),
                        // new Error(__('不能包含发斜杠“/”，请重新输入')),
                    )
                }
                const res = await checkGlossaryName({
                    id: type === 'edit' ? currentData.id : undefined,
                    parent_id: type === 'edit' ? parentId : currentData.id,
                    name: trimValue,
                })
                if (res.repeat) {
                    return Promise.reject(
                        new Error(__('名称已存在，请重新输入')),
                    )
                }
                return Promise.resolve()
            } catch (error) {
                formatError(error)
                return Promise.resolve()
            }
        }
        // const nameRepeatCb = useCallback(
        //     () =>
        //         nameRepeatValidator({
        //             action: checkGlossaryName,
        //             repeatMessage: __('名称已存在，请重新输入'),
        //             validateMsg: __('仅支持中英文、数字、下划线及中划线'),
        //             showBackendTips: true,
        //             nameRegFlag: true,
        //             maxLength: 128,
        //             params: {
        //                 id: type === 'edit' ? currentData.id : undefined,
        //                 parent_id: type === 'edit' ? parentId : currentData.id,
        //             },
        //             throwErrorCallback: (error) => {
        //                 if (
        //                     error.data.code ===
        //                     'BusinessGrooming.Glossary.ObjectNotExist'
        //                 ) {
        //                     message.error(
        //                         __('${name}被删除，请刷新后重试', {
        //                             name: currentData.name,
        //                         }),
        //                     )
        //                 } else {
        //                     formatError(error)
        //                 }
        //             },
        //         }),
        //     [currentData, type],
        // )

        const getCreateType = () => {
            switch (currentData.type) {
                case '':
                    return BusinessDomainType.subject_domain_group
                case BusinessDomainType.subject_domain_group:
                    return BusinessDomainType.subject_domain
                case BusinessDomainType.subject_domain:
                    return BusinessDomainType.business_object
                default:
                    return ''
            }
        }

        const onFinish = async (values: any) => {
            setLoading(true)
            const obj: any = {
                // 新建L3时 values中的type会覆盖上一行的type
                type: type === 'edit' ? undefined : getCreateType(),
                ...values,
                owners: values.owners ? [values.owners] : undefined,
            }
            if (type === 'edit') {
                obj.id = currentData.id
                obj.parent_id = parentId
            } else {
                obj.parent_id = currentData.id
            }

            try {
                const actions = type === 'edit' ? editCategories : addCategories
                const res = await actions({
                    ...obj,
                    type: obj.type || currentData.type,
                })
                message.success(
                    `${type === 'edit' ? __('编辑') : __('新建')}${__('成功')}`,
                )
                // 新建业务对象/活动成功后弹窗
                if (
                    type === 'addTerms' &&
                    currentData.type === BusinessDomainType.subject_domain
                ) {
                    setOpen(false)
                    setSuccessOpen(true)
                    setNewObjInfo({
                        id: res.id,
                        name: values.name,
                        ObjType: values.type || currentData.type,
                    })
                    return
                }
                setOpen(false)
                onOk(type, {
                    ...obj,
                    id: res.id,
                    type: obj.type || currentData.type,
                })
            } catch (err) {
                formatError(err)
            } finally {
                setLoading(false)
            }
        }

        return (
            <div className={styles.modalWrapper}>
                <Modal
                    title={modalTitle}
                    open={open}
                    onCancel={() => setOpen(false)}
                    width={640}
                    onOk={() => form.submit()}
                    destroyOnClose
                    forceRender
                    maskClosable={false}
                    bodyStyle={{ paddingBottom: 0 }}
                    okButtonProps={{ disabled: loading }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <Row>
                            <Col span={24}>
                                <Form.Item
                                    label={__('名称')}
                                    rules={[
                                        {
                                            required: true,
                                            message: __('输入不能为空'),
                                            transform: (value) => trim(value),
                                        },
                                        {
                                            validator: (e, value) =>
                                                nameRepeatCb(value),
                                        },
                                    ]}
                                    validateFirst
                                    name="name"
                                >
                                    <Input
                                        placeholder={`${__('请输入')}${__(
                                            '名称',
                                        )}`}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        {isExistObjType &&
                            platformNumber === LoginPlatform.default && (
                                <Form.Item
                                    label={__('类型')}
                                    name="type"
                                    initialValue={
                                        BusinessDomainType.business_object
                                    }
                                >
                                    <ObjType />
                                </Form.Item>
                            )}
                        {isExistOwner && (
                            <Form.Item
                                label={
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: 600,
                                        }}
                                    >
                                        <div>{__('数据Owner')}</div>
                                        <Button
                                            type="link"
                                            onClick={() => {
                                                setChooseOwnerModalOpen(true)
                                            }}
                                        >
                                            {__('选择')}
                                        </Button>
                                    </div>
                                }
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
                                    allowClear
                                    open={false}
                                    suffixIcon={null}
                                    optionFilterProp="children"
                                    filterOption={filterOwner}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
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
                                        >
                                            <div
                                                className={classnames(
                                                    styles.ownerItem,
                                                )}
                                            >
                                                <div
                                                    className={
                                                        styles.avatarWrapper
                                                    }
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
                        )}

                        <Form.Item
                            label={__('描述')}
                            name="description"
                            // rules={[
                            //     {
                            //         validator: keyboardInputValidator(
                            //             __(
                            //                 '支持中英文、数字及键盘上的特殊字符',
                            //             ),
                            //         ),
                            //     },
                            // ]}
                        >
                            <TextArea
                                maxLength={255}
                                placeholder={`${__('请输入')}${__('描述')}`}
                                style={{ resize: 'none', height: 134 }}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
                <Modal
                    open={successOpen}
                    footer={null}
                    width={432}
                    closable={false}
                    bodyStyle={{ paddingTop: 10, paddingBottom: 0 }}
                >
                    <Result
                        status="success"
                        title={
                            <div className={styles.title}>{__('新建成功')}</div>
                        }
                        subTitle={
                            <div className={styles.infos}>
                                <div className={styles.name}>
                                    {`${
                                        newObjInfo.ObjType ===
                                        BusinessDomainType.business_activity
                                            ? __('业务活动')
                                            : __('业务对象')
                                    }「${newObjInfo.name}」`}
                                </div>
                                <div className={styles.tip}>
                                    {__('您可以继续定义${name}属性', {
                                        name:
                                            newObjInfo.ObjType ===
                                            BusinessDomainType.business_activity
                                                ? __('业务活动')
                                                : __('业务对象'),
                                    })}
                                </div>
                            </div>
                        }
                        extra={[
                            <Button
                                onClick={() => {
                                    setSuccessOpen(false)
                                    onOk(type, newObjInfo)
                                }}
                                className={styles.btn}
                            >
                                {__('关闭')}
                            </Button>,
                            <Button
                                type="primary"
                                className={styles.btn}
                                onClick={() => {
                                    navigator(
                                        `/standards/define?objId=${newObjInfo.id}&name=${newObjInfo.name}&type=${newObjInfo.ObjType}`,
                                    )
                                }}
                            >
                                {__('定义属性')}
                            </Button>,
                        ]}
                        className={styles.createSuccessModal}
                    />
                </Modal>
                <ChooseOwnerModal
                    open={chooseOwnerModalOpen}
                    value={
                        form.getFieldValue('owners')
                            ? {
                                  id: form.getFieldValue('owners'),
                                  name:
                                      members.find(
                                          (m) =>
                                              m.id ===
                                              form.getFieldValue('owners'),
                                      )?.name || '',
                              }
                            : undefined
                    }
                    onOk={(selectedUser) => {
                        form.setFieldsValue({
                            owners: selectedUser.id,
                        })
                        // 更新members列表，确保选中的用户在列表中
                        if (
                            selectedUser.name &&
                            !members.find((m) => m.id === selectedUser.id)
                        ) {
                            setMembers([
                                ...members,
                                {
                                    id: selectedUser.id,
                                    name: selectedUser.name,
                                },
                            ])
                        }
                    }}
                    onCancel={() => setChooseOwnerModalOpen(false)}
                />
            </div>
        )
    },
)
export default GlossaryModal
