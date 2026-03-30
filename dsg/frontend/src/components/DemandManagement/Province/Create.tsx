import {
    Anchor,
    Button,
    Col,
    Form,
    Input,
    Radio,
    Row,
    Select,
    Space,
    Tooltip,
    message,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import { trim } from 'lodash'
import classNames from 'classnames'
import { useContext, useEffect, useRef, useState } from 'react'
import styles from '../styles.module.less'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import __ from '../locale'
import {
    ErrorInfo,
    cnOrEnBeginAndNumberName,
    emailReg,
    nameReg,
    numberReg,
} from '@/utils'
import {
    ISSZDCatalog,
    ISSZDCatalogInfoItem,
    ISSZDDict,
    SSZDDictTypeEnum,
    checkSSZDDemandName,
    createSSZDDemand,
    deleteSSZDDemandFile,
    downloadSSZDDemandFile,
    formatError,
    getCurUserDepartment,
    getSSZDDict,
} from '@/core'
import UploadAttachment from '../Upload'
import { MicroWidgetPropsContext } from '@/context'
import CommonTitle from '../CommonTitle'
import { AddOutlined, FontIcon } from '@/icons'
import Tags from './Tags'
import { Return } from '@/ui'
import SelectDataResource from './SelectDataResource'
import { IconType } from '@/icons/const'
import ApplyConfig from './ApplyConfig'
import { DemandTypeOptions, ResoureMode } from './const'

import ProvinceOrganSelect from '@/components/ProvincialOriganizationalStructure/ProvinceOrganSelect'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import Confirm from '@/components/Confirm'
import Catalog from './Catalog'
import DepartmentAndOrgSelect from '@/components/DepartmentAndOrgSelect'

const { Link } = Anchor

const Create = ({ inProvince = false }: { inProvince?: boolean }) => {
    const navigate = useNavigate()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const container = useRef<any>(null)
    const [selectResOpen, setSelectResOpen] = useState(false)
    const [applyConfigOpen, setApplyConfigOpen] = useState(false)
    const [dict, setDict] = useState<ISSZDDict>()
    const [currentUser] = useCurrentUser()
    const [shareType, setShareType] = useState<string>('')
    const [infoItems, setInfoItems] = useState<ISSZDCatalogInfoItem[]>([])
    const [selectedInfoItems, setSelectedInfoItems] = useState<
        ISSZDCatalogInfoItem[]
    >([])
    const [submitOpen, setSubmitOpen] = useState(false)
    const [removeOpen, setRemoveOpen] = useState(false)
    const [defaultOrg, setDefaultOrg] = useState<string>('')

    useEffect(() => {
        form.setFieldsValue({ contact: currentUser.VisionName || '' })
    }, [currentUser])

    const getDict = async () => {
        try {
            const res = await getSSZDDict([
                SSZDDictTypeEnum.Scene,
                SSZDDictTypeEnum.SceneType,
                SSZDDictTypeEnum.UpdateCycle,
                SSZDDictTypeEnum.OneThing,
            ])
            setDict(res)
        } catch (error) {
            formatError(error)
        }
    }

    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const res = await getCurUserDepartment()
            // 当前树能根据id匹配到部门，根据id显示部门，不能匹配到，显示部门名称
            if (res?.length === 1) {
                const [dept] = res
                setDefaultOrg(dept.id)
                form.setFieldsValue({ org_code: dept.id })
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getDict()
        getCurDepartment()
    }, [])

    const returnToDemandList = () => {
        ReturnConfirmModal({
            microWidgetProps,
            onCancel: () => {
                navigate(
                    `/${
                        inProvince
                            ? 'province-demand-application'
                            : 'demand-application'
                    }`,
                )
            },
        })
    }

    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            const res = await checkSSZDDemandName({
                title: trimValue,
            })
            // if (res.repeat) {
            //     return Promise.reject(new Error(__('该名称已存在，请重新输入')))
            // }
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        }
    }

    const onFinish = async (values) => {
        const params = {
            ...values,
            attachment_id: values?.attachment?.id,
        }
        if (values.mode === ResoureMode.Select) {
            params.columns = selectedInfoItems
                .map((item) => item.column_name_cn)
                .join(',')
            params.catalog_id = values.catalog.id
            delete params.catalog
        } else {
            params.columns = params.columns.join(',')
            params.duty_org_credit_code = values.org.id
            params.duty_org_name = values.org.name
        }
        delete params.attachment
        try {
            await createSSZDDemand(params)
            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast.success(__('新建成功'))
            } else {
                message.success(__('新建成功'))
            }
            navigate(
                `/${
                    inProvince
                        ? 'province-demand-application'
                        : 'demand-application'
                }`,
            )
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    const formItemLayout = {
        labelCol: { span: 3 },
        wrapperCol: { span: 14 },
    }

    const columns = [
        {
            title: (
                <div>
                    {__('需求数据资源目录')}
                    <span className={styles['title-code']}>{__('(编码)')}</span>
                </div>
            ),
            dataIndex: 'title',
            key: 'title',
            render: (title, record) => (
                <div className={styles['name-info-container']}>
                    <FontIcon
                        name="icon-shujumuluguanli1"
                        type={IconType.COLOREDICON}
                        className={styles.icon}
                    />
                    <div className={styles.names}>
                        <div
                            className={classNames(styles.name)}
                            title={record.title}
                        >
                            {record.title}
                        </div>
                        <div
                            className={styles['tech-name']}
                            title={record.org_code}
                        >
                            {record.org_code}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: __('挂接数据资源'),
            dataIndex: 'res',
            key: 'res',
        },
        {
            title: __('责任部门'),
            dataIndex: 'dept_name',
            key: 'dept_name',
        },
        {
            title: __('描述'),
            dataIndex: 'abstract',
            key: 'abstract',
        },
        {
            title: __('操作'),
            dataIndex: 'actions',
            key: 'actions',
            render: () => {
                return (
                    <Space size={32}>
                        <a onClick={() => setApplyConfigOpen(true)}>
                            {__('申请配置')}
                        </a>
                        <a onClick={() => form.setFieldsValue({ catalog: [] })}>
                            {__('移除目录')}
                        </a>
                    </Space>
                )
            },
        },
    ]

    const handleSelectRes = () => {
        setSelectResOpen(true)
    }

    const handleRemoveRes = () => {
        form.setFieldsValue({
            catalog: undefined,
        })
        setRemoveOpen(false)
    }

    const getRes = (res: ISSZDCatalog) => {
        form.setFieldsValue({
            catalog: res,
        })

        // setInfoItems(res.info_items)
        // setSelectedInfoItems(res.info_items)
    }

    const handleConfigOk = (items: ISSZDCatalogInfoItem[], st: string) => {
        setShareType(st)
        setSelectedInfoItems(items)
    }

    const handleSubmit = async () => {
        await form.validateFields()
        setSubmitOpen(true)
    }

    return (
        <div
            className={classNames(
                styles['create-wrapper'],
                styles['create-province-wrapper'],
            )}
        >
            <div className={styles.header}>
                <Return onReturn={returnToDemandList} title={__('新建需求')} />
            </div>
            <div className={styles.body}>
                <div className={styles.anchor}>
                    <Anchor
                        targetOffset={188}
                        getContainer={() =>
                            (container.current as HTMLElement) || window
                        }
                    >
                        <Link
                            href="#province-demand-basic"
                            title={__('需求信息')}
                        />
                        <Link
                            href="#province-demand-catalog"
                            title={__('数据资源目录')}
                        />
                        <Link
                            href="#province-demand-department"
                            title={__('部门信息')}
                        />
                        <Link
                            href="#province-demand-scene"
                            title={__('业务场景')}
                        />
                    </Anchor>
                </div>
                <div className={styles.content} ref={container}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                        className={styles.form}
                    >
                        <div id="province-demand-basic">
                            <div className={styles['common-title-container']}>
                                <CommonTitle title={__('需求信息')} />
                            </div>
                            <Row gutter={40} className={styles.contentWrapper}>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('需求名称')}
                                        name="title"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
                                        rules={[
                                            {
                                                required: true,
                                                message: ErrorInfo.NOTNULL,
                                            },
                                            {
                                                pattern: nameReg,
                                                message: ErrorInfo.ONLYSUP,
                                            },
                                            {
                                                validateTrigger: ['onBlur'],
                                                validator: (e, value) =>
                                                    validateNameRepeat(value),
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder={__('请输入')}
                                            maxLength={128}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('需求类型')}
                                        name="demand_type"
                                        initialValue="0"
                                        rules={[
                                            {
                                                required: true,
                                                message: __('需求类型不能为空'),
                                            },
                                        ]}
                                    >
                                        <Select
                                            placeholder={__('请选择')}
                                            options={DemandTypeOptions}
                                            disabled
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('期望更新周期')}
                                        name="update_cycle"
                                    >
                                        <Select
                                            placeholder={__('请选择')}
                                            options={
                                                dict?.dicts.find(
                                                    (d) =>
                                                        d.dict_type ===
                                                        SSZDDictTypeEnum.UpdateCycle,
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
                                        shouldUpdate={(pre, cur) =>
                                            pre.update_cycle !==
                                            cur.update_cycle
                                        }
                                        noStyle
                                    >
                                        {({ getFieldValue }) => {
                                            return getFieldValue(
                                                'update_cycle',
                                            ) === '8' ? (
                                                <Form.Item
                                                    label={__('其他更新周期')}
                                                    name="other_update_cycle"
                                                    validateTrigger={[
                                                        'onChange',
                                                        'onBlur',
                                                    ]}
                                                    validateFirst
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                ErrorInfo.NOTNULL,
                                                        },
                                                        {
                                                            pattern:
                                                                cnOrEnBeginAndNumberName,
                                                            message:
                                                                __(
                                                                    '仅支持中英文、数字',
                                                                ),
                                                        },
                                                    ]}
                                                >
                                                    <Input
                                                        placeholder={__(
                                                            '请输入',
                                                        )}
                                                        maxLength={128}
                                                    />
                                                </Form.Item>
                                            ) : null
                                        }}
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('需求描述')}
                                        name="description"
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: ErrorInfo.NOTNULL,
                                            },
                                        ]}
                                    >
                                        <Input.TextArea
                                            placeholder={__('请输入')}
                                            maxLength={800}
                                            className={styles['text-area']}
                                            showCount
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('数据来源依据')}
                                        name="data_source_basic"
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: ErrorInfo.NOTNULL,
                                            },
                                        ]}
                                    >
                                        <Input.TextArea
                                            placeholder={__('请输入')}
                                            maxLength={255}
                                            className={styles['text-area']}
                                            showCount
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('附件')}
                                        name="attachment"
                                    >
                                        <UploadAttachment
                                            path="/api/sszd-service/v1/file"
                                            downloadApi={downloadSSZDDemandFile}
                                            delApi={deleteSSZDDemandFile}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                        <div id="province-demand-catalog">
                            <div className={styles['common-title-container']}>
                                <CommonTitle title={__('需求数据资源')} />
                            </div>
                            <div style={{ padding: '0 16px' }}>
                                <Form.Item
                                    label={__('添加资源目录')}
                                    name="mode"
                                    initialValue={ResoureMode.Select}
                                    colon
                                    {...formItemLayout}
                                    className={styles['catalog-form-item']}
                                >
                                    <Radio.Group>
                                        <Radio value={ResoureMode.Select}>
                                            {__('选择资源目录')}
                                            <Tooltip
                                                title={__(
                                                    '请选择未挂接资源的目录',
                                                )}
                                            >
                                                <FontIcon
                                                    name="icon-xinxitishi"
                                                    className={
                                                        styles[
                                                            'catalog-form-item-icon'
                                                        ]
                                                    }
                                                />
                                            </Tooltip>
                                        </Radio>
                                        <Radio value={ResoureMode.Custom}>
                                            {__('自定义资源目录')}
                                        </Radio>
                                    </Radio.Group>
                                </Form.Item>
                                <Form.Item
                                    noStyle
                                    shouldUpdate={(pre, cur) =>
                                        pre.mode !== cur.mode ||
                                        pre.catalog !== cur.catalog
                                    }
                                >
                                    {({ getFieldValue }) => {
                                        return getFieldValue('mode') ===
                                            ResoureMode.Select ? (
                                            getFieldValue('catalog') ? (
                                                <Form.Item
                                                    label=""
                                                    name="catalog"
                                                >
                                                    <Catalog
                                                        chooseResource={
                                                            handleSelectRes
                                                        }
                                                        removeResource={
                                                            handleRemoveRes
                                                        }
                                                    />
                                                </Form.Item>
                                            ) : (
                                                <div
                                                    className={
                                                        styles['resource-empty']
                                                    }
                                                >
                                                    <Button
                                                        icon={<AddOutlined />}
                                                        type="primary"
                                                        onClick={() =>
                                                            handleSelectRes()
                                                        }
                                                    >
                                                        {__('选择资源目录')}
                                                    </Button>
                                                </div>
                                            )
                                        ) : (
                                            <>
                                                <Row>
                                                    <Col span={12}>
                                                        <Form.Item
                                                            label={__(
                                                                '需求信息项',
                                                            )}
                                                            name="columns"
                                                            validateTrigger={[
                                                                'onChange',
                                                                'onBlur',
                                                            ]}
                                                            validateFirst
                                                            rules={[
                                                                {
                                                                    required:
                                                                        true,
                                                                    message:
                                                                        __(
                                                                            '需求信息项不能为空',
                                                                        ),
                                                                },
                                                            ]}
                                                        >
                                                            <Tags />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col span={12}>
                                                        <Form.Item
                                                            label={__(
                                                                '责任部门',
                                                            )}
                                                            name="org"
                                                            validateTrigger={[
                                                                'onChange',
                                                                'onBlur',
                                                            ]}
                                                            validateFirst
                                                            rules={[
                                                                {
                                                                    required:
                                                                        true,
                                                                },
                                                            ]}
                                                        >
                                                            <ProvinceOrganSelect />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </>
                                        )
                                    }}
                                </Form.Item>
                            </div>
                        </div>
                        <div id="province-demand-department">
                            <div className={styles['common-title-container']}>
                                <CommonTitle title="部门信息" />
                            </div>
                            <Row gutter={40} className={styles.contentWrapper}>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('需求部门')}
                                        name="org_code"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
                                        rules={[
                                            {
                                                required: true,
                                                message: ErrorInfo.NOTNULL,
                                            },
                                        ]}
                                    >
                                        <DepartmentAndOrgSelect
                                            defaultValue={defaultOrg}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('需求联系人')}
                                        name="contact"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
                                        rules={[
                                            {
                                                required: true,
                                                message: ErrorInfo.NOTNULL,
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder={__('请输入')}
                                            maxLength={128}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('联系电话')}
                                        name="phone"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
                                        rules={[
                                            {
                                                required: true,
                                                message: ErrorInfo.NOTNULL,
                                            },
                                            {
                                                pattern: numberReg,
                                                message: __('仅支持输入数字'),
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder={__('请输入')}
                                            maxLength={11}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('邮箱')}
                                        name="mail"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
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
                                        <Input
                                            placeholder={__('请输入')}
                                            maxLength={128}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                        <div id="province-demand-scene">
                            <div className={styles['common-title-container']}>
                                <CommonTitle title="业务场景" />
                            </div>
                            <Row gutter={40} className={styles.contentWrapper}>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('应用场景类型')}
                                        name="scene_type"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择'),
                                            },
                                        ]}
                                    >
                                        <Select
                                            placeholder={__('请选择')}
                                            options={
                                                dict?.dicts.find(
                                                    (d) =>
                                                        d.dict_type ===
                                                        SSZDDictTypeEnum.SceneType,
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
                                            pre.scene_type !== cur.scene_type
                                        }
                                    >
                                        {({ getFieldValue }) => {
                                            return (
                                                <Form.Item
                                                    label={__('应用场景')}
                                                    name="scene"
                                                    validateTrigger={[
                                                        'onChange',
                                                        'onBlur',
                                                    ]}
                                                    validateFirst
                                                    rules={[
                                                        {
                                                            required:
                                                                getFieldValue(
                                                                    'scene_type',
                                                                ) === '0',
                                                        },
                                                    ]}
                                                >
                                                    <Select
                                                        placeholder={__(
                                                            '请选择',
                                                        )}
                                                        options={
                                                            dict?.dicts.find(
                                                                (d) =>
                                                                    d.dict_type ===
                                                                    SSZDDictTypeEnum.Scene,
                                                            )?.entries || []
                                                        }
                                                        fieldNames={{
                                                            label: 'dict_value',
                                                            value: 'dict_key',
                                                        }}
                                                    />
                                                </Form.Item>
                                            )
                                        }}
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(pre, cur) =>
                                            pre.scene_type !== cur.scene_type
                                        }
                                    >
                                        {({ getFieldValue }) => {
                                            return (
                                                <Form.Item
                                                    label={__(
                                                        '高效办成“一件事”',
                                                    )}
                                                    name="one_thing_code"
                                                    validateTrigger={[
                                                        'onChange',
                                                        'onBlur',
                                                    ]}
                                                    validateFirst
                                                    rules={[
                                                        {
                                                            required:
                                                                getFieldValue(
                                                                    'scene_type',
                                                                ) === '15',
                                                        },
                                                    ]}
                                                >
                                                    <Select
                                                        placeholder={__(
                                                            '请选择',
                                                        )}
                                                        options={
                                                            dict?.dicts.find(
                                                                (d) =>
                                                                    d.dict_type ===
                                                                    SSZDDictTypeEnum.OneThing,
                                                            )?.entries || []
                                                        }
                                                        fieldNames={{
                                                            label: 'dict_value',
                                                            value: 'dict_key',
                                                        }}
                                                    />
                                                </Form.Item>
                                            )
                                        }}
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(pre, cur) =>
                                            pre.one_thing_code !==
                                            cur.one_thing_code
                                        }
                                    >
                                        {({ getFieldValue }) => {
                                            return (
                                                <Form.Item
                                                    label={__('其他“一件事”')}
                                                    name="other_one_thing_desc"
                                                    validateTrigger={[
                                                        'onChange',
                                                        'onBlur',
                                                    ]}
                                                    validateFirst
                                                    rules={[
                                                        {
                                                            required:
                                                                getFieldValue(
                                                                    'one_thing_code',
                                                                ) === '0',
                                                            message:
                                                                ErrorInfo.NOTNULL,
                                                        },
                                                        {
                                                            pattern: nameReg,
                                                            message:
                                                                ErrorInfo.ONLYSUP,
                                                        },
                                                    ]}
                                                >
                                                    <Input
                                                        placeholder={__(
                                                            '请输入',
                                                        )}
                                                        maxLength={128}
                                                    />
                                                </Form.Item>
                                            )
                                        }}
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    </Form>
                </div>
                <div className={styles.footer}>
                    <Space size={16}>
                        <Button
                            onClick={() =>
                                navigate(
                                    `/${
                                        inProvince
                                            ? 'province-demand-application'
                                            : 'demand-application'
                                    }`,
                                )
                            }
                        >
                            {__('取消')}
                        </Button>
                        <Button type="primary" onClick={handleSubmit}>
                            {__('提交')}
                        </Button>
                    </Space>
                </div>
            </div>
            {selectResOpen && (
                <SelectDataResource
                    open={selectResOpen}
                    onClose={() => setSelectResOpen(false)}
                    getRes={getRes}
                />
            )}
            {applyConfigOpen && (
                <ApplyConfig
                    open={applyConfigOpen}
                    onClose={() => setApplyConfigOpen(false)}
                    infoItems={infoItems}
                    selectedInfoItems={selectedInfoItems}
                    onOk={handleConfigOk}
                    shareTypeOptions={dict?.dicts[0].entries || []}
                    initShareType={shareType}
                />
            )}
            <Confirm
                open={submitOpen}
                title={__('确定要提交${name}需求吗？', {
                    name: form.getFieldValue('title'),
                })}
                content={__('需求信息提交后将无法修改，请确认。')}
                onOk={() => form.submit()}
                onCancel={() => {
                    setSubmitOpen(false)
                }}
                width={432}
            />
            {/* <Confirm
                open={removeOpen}
                title={__('是否移除${name}资源吗？', {
                    name: form.getFieldValue('catalog')?.title,
                })}
                content=""
                onOk={handleRemoveRes}
                onCancel={() => {
                    setRemoveOpen(false)
                }}
                width={432}
            /> */}
        </div>
    )
}

export default Create
