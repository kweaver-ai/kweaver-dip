import {
    Button,
    Col,
    Form,
    Input,
    Row,
    Select,
    Space,
    Table,
    message,
} from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { trim } from 'lodash'
import classNames from 'classnames'
import { useEffect, useState } from 'react'
import styles from './styles.module.less'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import __ from './locale'
import { ErrorInfo, keyboardReg, nameReg } from '@/utils'
import {
    AppCaseItem,
    checkAppCaseName,
    formatError,
    getAppCaseDetailById,
    getBusinessDomainProcessList,
    getCurUserDepartment,
    getSSZDProvinceApp,
    IBusinessDomainItem,
    IProvinceApp,
    ISSZDCatalogReportRecordItem,
    mountResource,
    reportAppCase,
} from '@/core'
import { CommonTitle, Return } from '@/ui'
import { AddOutlined, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import ChooseCatalog from './ChooseCatalog'
import Confirm from '../Confirm'
import { AppField, appFieldOptions, IMountResource } from './const'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'

const Create = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const id = searchParams.get('id') || ''
    const [form] = Form.useForm()
    const [open, setOpen] = useState(false)
    const [removeItem, setRemoveItem] = useState<ISSZDCatalogReportRecordItem>()

    const [detailInfo, setDetailInfo] = useState<AppCaseItem>()
    const [processList, setProcessList] = useState<IBusinessDomainItem[]>([])
    const [departmentId, setDepartmentId] = useState<string>('')
    const [mountResourceMap, setMountResourceMap] = useState<
        Record<string, IMountResource>
    >({})
    const [provinceApp, setProvinceApp] = useState<IProvinceApp[]>([])

    useEffect(() => {
        if (id) {
            getDetailInfo()
        }
    }, [id])

    const getDetailInfo = async () => {
        try {
            const res = await getAppCaseDetailById(id)
            const catalogs = res.resources.map((item) => ({
                catalog_id: item.id,
                catalog_title: item.catalog_name,
            }))
            getMountResource(catalogs)
            setDepartmentId(res.department_id)
            form.setFieldsValue({
                name: res.name,
                application_id: res.application_id,
                description: res.description,
                department_id: res.department_id,
                field_type: res.field_type,
                field_description: res.field_description,
                process_id: res.process_id,
                resource: catalogs,
            })
            setDetailInfo(res)
        } catch (error) {
            formatError(error)
        }
    }

    const returnToDemandList = () => {
        ReturnConfirmModal({
            onCancel: () => navigate(`/applicationCase/report`),
        })
    }

    const getProcessList = async (depId: string) => {
        try {
            const res = await getBusinessDomainProcessList({
                department_id: depId,
                limit: 1000,
                offset: 1,
                getall: true,
            })
            setProcessList(res.entries)
        } catch (error) {
            formatError(error)
        }
    }

    const getProvinceApp = async () => {
        try {
            const res = await getSSZDProvinceApp()
            setProvinceApp(res.entries)
        } catch (error) {
            formatError(error)
        }
    }

    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const res = await getCurUserDepartment()
            // 默认填充当前登录用户所属部门，如果属于多个部门，则需要用户选择
            if (res?.length === 1) {
                const [dept] = res
                form.setFieldsValue({ department_id: dept.id })
                getProcessList(dept.id)
                setDepartmentId(dept.id)
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getProvinceApp()
    }, [])

    useEffect(() => {
        if (!id) {
            getCurDepartment()
        }
    }, [id])

    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            const res = await checkAppCaseName({
                title: trimValue,
                id,
            })
            if (!res) {
                return Promise.reject(new Error(__('该名称已存在，请重新输入')))
            }
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        }
    }

    const onFinish = async (values) => {
        try {
            const { resource, ...rest } = values
            const params = {
                ...rest,
                resources: values.resource?.map((item) => ({
                    type:
                        mountResourceMap[item.catalog_id]
                            ?.mount_resource_type === 1
                            ? 'DB'
                            : 'API',
                    // 挂接资源类型 1库表 2 接口
                    id: mountResourceMap[item.catalog_id]?.mount_resource_id,
                })),
            }
            await reportAppCase(params)
            message.success(__('新建成功'))
            navigate(`/applicationCase/report`)
        } catch (error) {
            formatError(error)
        }
    }
    const columns = [
        {
            title: __('数据资源名称'),
            dataIndex: 'catalog_title',
            key: 'catalog_title',
            render: (name, record) => (
                <div className={styles['name-info-container']}>
                    <FontIcon
                        name={
                            mountResourceMap[record.catalog_id]
                                ?.mount_resource_type === 1
                                ? 'icon-shujubiaoshitu'
                                : 'icon-jiekoufuwuguanli'
                        }
                        type={IconType.COLOREDICON}
                        className={styles.icon}
                    />
                    <div className={styles.names}>
                        <div
                            className={classNames(styles.name)}
                            title={
                                mountResourceMap[record.catalog_id]
                                    ?.mount_resource_name
                            }
                        >
                            {
                                mountResourceMap[record.catalog_id]
                                    ?.mount_resource_name
                            }
                        </div>
                        {/* <div
                            className={styles['tech-name']}
                            title={record.catalog_code}
                        >
                            {record.catalog_code}
                        </div> */}
                    </div>
                </div>
            ),
        },
        {
            title: __('所属数据资源目录'),
            dataIndex: 'catalog_title',
            key: 'catalog_title',
        },
        {
            title: __('操作'),
            dataIndex: 'actions',
            key: 'actions',
            render: (_, record) => {
                return (
                    <a
                        onClick={() => {
                            setRemoveItem(record)
                        }}
                    >
                        {__('移除数据资源')}
                    </a>
                )
            },
        },
    ]

    const getMountResource = async (checkedCatalogs) => {
        const res = await Promise.all(
            checkedCatalogs.map((c) =>
                mountResourceMap[c.catalog_id]
                    ? Promise.resolve()
                    : mountResource(c.catalog_id),
            ),
        )
        setMountResourceMap(
            res.reduce((acc, cur, index) => {
                if (cur) {
                    if (cur.mount_resource?.[0]) {
                        acc[checkedCatalogs[index].catalog_id] = {
                            mount_resource_name: cur.mount_resource[0].name,
                            mount_resource_type:
                                cur.mount_resource[0].resource_type,
                            mount_department_path:
                                cur.mount_resource[0].department_path,
                            mount_resource_id:
                                cur.mount_resource[0].resource_id,
                        }
                    }
                }
                return acc
            }, {}),
        )
    }

    const getCatalogs = (catalogs) => {
        getMountResource(catalogs)
        form.setFieldValue('resource', catalogs)
    }

    const handleRemove = () => {
        if (!removeItem) return
        const res = form.getFieldValue('resource')
        form.setFieldsValue({
            resource: res.filter(
                (item) => item.catalog_id !== removeItem.catalog_id,
            ),
        })
        setRemoveItem(undefined)
    }

    return (
        <div className={styles['create-wrapper']}>
            <div className={styles.header}>
                <Return
                    onReturn={returnToDemandList}
                    title={id ? __('重新上报应用案例') : __('新建应用案例')}
                />
            </div>
            <div className={styles.body}>
                <div className={styles.content}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                        className={styles.form}
                    >
                        <Row gutter={40} className={styles.contentWrapper}>
                            <Col
                                span={24}
                                className={styles['title-container']}
                            >
                                <CommonTitle title={__('基本信息')} />
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('应用名称')}
                                    name="application_id"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择'),
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder={__('请选择')}
                                        options={provinceApp}
                                        fieldNames={{
                                            label: 'name',
                                            value: 'id',
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('应用案例名称')}
                                    name="name"
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
                            <Col span={24}>
                                <Form.Item
                                    label={__('应用案例描述')}
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
                            <Col span={12}>
                                <Form.Item
                                    label={__('组织架构')}
                                    name="department_id"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择'),
                                        },
                                    ]}
                                >
                                    <DepartmentAndOrgSelect
                                        defaultValue={departmentId}
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('所属领域')}
                                    name="field_type"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择'),
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder={__('请选择')}
                                        options={appFieldOptions}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    shouldUpdate={(pre, cur) =>
                                        pre.area !== cur.area
                                    }
                                    noStyle
                                >
                                    {({ getFieldValue }) => {
                                        return getFieldValue('field_type') ===
                                            AppField.OTHER ? (
                                            <Form.Item
                                                label={__('其他所属领域')}
                                                name="field_description"
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
                                                ]}
                                            >
                                                <Input
                                                    placeholder={__('请输入')}
                                                    maxLength={128}
                                                />
                                            </Form.Item>
                                        ) : null
                                    }}
                                </Form.Item>
                            </Col>
                            <Col
                                span={24}
                                className={styles['title-container']}
                            >
                                <CommonTitle title={__('应用场景')} />
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('业务事项')}
                                    name="process_id"
                                >
                                    <Select
                                        placeholder={__('请选择')}
                                        options={processList.map((item) => ({
                                            label: item.name,
                                            value: item.id,
                                        }))}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    noStyle
                                    shouldUpdate={(pre, cur) =>
                                        pre.resource !== cur.resource
                                    }
                                >
                                    {({ getFieldValue }) => {
                                        const existData =
                                            (getFieldValue('resource') || [])
                                                .length > 0
                                        return (
                                            <div
                                                className={
                                                    existData
                                                        ? styles[
                                                              'data-resource'
                                                          ]
                                                        : styles[
                                                              'data-resource-empty'
                                                          ]
                                                }
                                            >
                                                <div className={styles.label}>
                                                    {__('数据资源')}
                                                    {existData ? '' : __('：')}
                                                </div>
                                                <Button
                                                    type="primary"
                                                    icon={<AddOutlined />}
                                                    className={
                                                        styles['add-btn']
                                                    }
                                                    onClick={() => {
                                                        setOpen(true)
                                                    }}
                                                >
                                                    {__('选择数据资源')}
                                                </Button>
                                            </div>
                                        )
                                    }}
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    noStyle
                                    shouldUpdate={(pre, cur) =>
                                        pre.resource !== cur.resource
                                    }
                                >
                                    {({ getFieldValue }) => {
                                        return (getFieldValue('resource') || [])
                                            .length > 0 ? (
                                            <Form.Item
                                                label=""
                                                name="resource"
                                                valuePropName="dataSource"
                                            >
                                                <Table
                                                    className={
                                                        styles['res-table']
                                                    }
                                                    columns={columns}
                                                    pagination={false}
                                                />
                                            </Form.Item>
                                        ) : null
                                    }}
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </div>
                <div className={styles.footer}>
                    <Space size={16}>
                        <Button onClick={() => navigate(`/demand-application`)}>
                            {__('取消')}
                        </Button>
                        <Button type="primary" onClick={() => form.submit()}>
                            {id ? __('重新上报') : __('上报')}
                        </Button>
                    </Space>
                </div>
            </div>
            {open && (
                <ChooseCatalog
                    open={open}
                    onClose={() => setOpen(false)}
                    getCatalogs={getCatalogs}
                    initCatalogIds={form
                        .getFieldValue('resource')
                        ?.map((item) => item.catalog_id)}
                    departmentId={departmentId}
                />
            )}
            <Confirm
                title={__('确定要移除${name}吗', {
                    name: removeItem?.catalog_title,
                })}
                content=""
                open={!!removeItem}
                onOk={handleRemove}
                onCancel={() => setRemoveItem(undefined)}
            />
        </div>
    )
}

export default Create
