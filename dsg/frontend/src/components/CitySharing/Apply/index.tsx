import { ExclamationCircleFilled, PlusOutlined } from '@ant-design/icons'
import { useSize } from 'ahooks'
import {
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    message,
    Row,
    Select,
    Space,
} from 'antd'
import { RcFile } from 'antd/lib/upload'
import classnames from 'classnames'
import { trim } from 'lodash'
import moment from 'moment'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { confirm, info } from '@/utils/modalHelper'
import { getActualUrl, getPlatformNumber, useQuery } from '@/utils'
import { ReturnConfirmModal } from '@/ui'
import actionType from '@/redux/actionType'
import { useDict } from '@/hooks/useDict'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
    formatError,
    getApplicationCatalog,
    getAppRegisterList,
    getCityShareApplyDetail,
    getCityShareApplyNameRepeat,
    getCurUserDepartment,
    getFirmList,
    IAddShareApply,
    IApplicationCatalogItem,
    IAppRegisterListItem,
    IFirm,
    importDemandFile,
    LoginPlatform,
    postCityShareApply,
    putCityShareApply,
    reqDataCatlgBasicInfo,
    ShareApplySubmitType,
    SortType,
} from '@/core'
import DepartmentAndOrgSelect from '@/components/DepartmentAndOrgSelect'
import AddCatalogDrawer from '../component/AddCatalogDrawer'
import CatalogList from '../component/CatalogList'
import DrawerHeader from '../component/DrawerHeader'
import { ApplyResource, ConfigModeEnum } from '../const'
import { applyCatalogInfo, applyInfo, departmentInfo } from '../Details/helper'
import { GroupHeader, ResTypeEnum } from '../helper'
import __ from '../locale'
import ApplyAnchor from './ApplyAnchor'
import CatalogForm from './CatalogForm'
import CatalogTable from './CatalogTable'
import { appInfo, FieldData, NotFoundContent } from './helper'
import styles from './styles.module.less'
import UploadFiles from './UploadFiles'

interface IApply {
    catalogs: IApplicationCatalogItem[] // 目录信息
    onClose: () => void
    basicInfo?: any
}

/**
 * 共享申请
 */
const Apply: React.FC<IApply> = ({ catalogs = [], onClose, basicInfo }) => {
    const [form] = Form.useForm()
    const [catalogForm] = Form.useForm()
    const container = useRef(null)
    const catalogRef = useRef<HTMLDivElement>(null)
    const catalogInfoRef = useRef<HTMLDivElement>(null)
    const contentSize = useSize(catalogRef)
    const dispatch = useDispatch()
    const citySharingData = useSelector(
        (state: any) => state?.citySharingReducer,
    )
    const [dict, getDict] = useDict()
    const [userInfo] = useCurrentUser()
    const query = useQuery()
    const navigator = useNavigate()
    // 编辑 id
    const applyId = query.get('applyId')
    const platform = getPlatformNumber()

    const [saveLoading, setSaveLoading] = useState<boolean>(false)
    const [draftLoading, setDraftLoading] = useState<boolean>(false)
    // 是否有更改
    const [hasChange, setHasChange] = useState<boolean>(false)
    // 正在检查
    const [checking, setChecking] = useState<boolean>(false)
    // 目录数据
    const [catalogsData, setCatalogsData] = useState<any[]>([])
    // 选中的应用
    const [selectedApp, setSelectedApp] = useState<IAppRegisterListItem>()
    // 选中目录或接口id
    const [selectedCatalogId, setSelectedCatalogId] = useState<string>()
    // 目录表单字段数据
    const [catalogFields, setCatalogFields] = useState<
        {
            catalog_id?: string
            fields: FieldData[]
        }[]
    >([])

    const [configMode, setConfigMode] = useState<ConfigModeEnum>(
        ConfigModeEnum.Table,
    )

    const [addResourceOpen, setAddResourceOpen] = useState<boolean>(false)

    const [applicationCatalogs, setApplicationCatalogs] = useState<
        IApplicationCatalogItem[]
    >([])
    const [defaultDepartment, setDefaultDepartment] = useState<string>()
    const [firmOptions, setFirmOptions] = useState<IFirm[]>([])
    const [apps, setApps] = useState<IAppRegisterListItem[]>([])

    // 关联应用信息
    const appInfoList = useMemo(() => {
        return appInfo.map((item) => ({
            ...item,
            value: selectedApp?.[item.key],
        }))
    }, [selectedApp])

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getCityShareApplyDetail(applyId || '', {
                fields: 'base',
            })
            const {
                resources,
                finish_date,
                attachment_id,
                attachment_name,
                areas,
                ...rest
            } = res.base
            form.setFieldsValue({
                ...rest,
                areas: areas ? areas.split(',') : undefined,
                application_letter:
                    attachment_id && attachment_name
                        ? [{ id: attachment_id, name: attachment_name }]
                        : undefined,
                finish_date: finish_date
                    ? moment(finish_date * 1000)
                    : undefined,
            })
            setCatalogsData(
                resources?.map((item) => {
                    const {
                        view_apply_conf,
                        api_apply_conf,
                        ...otherApplyConf
                    } = item.apply_conf
                    return {
                        ...item,
                        configFinish: true,
                        apply_conf: {
                            ...otherApplyConf,
                            view_apply_conf: view_apply_conf
                                ? {
                                      ...view_apply_conf,
                                      columns:
                                          item.apply_conf.view_apply_conf?.column_ids
                                              ?.split(',')
                                              ?.map((id, idIdx) => ({
                                                  id,
                                                  // "["a","b"]"
                                                  business_name: JSON.parse(
                                                      item.apply_conf
                                                          ?.view_apply_conf
                                                          ?.column_names,
                                                  )?.[idIdx],
                                              })),
                                  }
                                : undefined,
                            api_apply_conf: api_apply_conf || undefined,
                        },
                    }
                }),
            )
            setSelectedCatalogId(resources?.[0]?.res_id)
        } catch (error) {
            formatError(error)
        }
    }

    const getFirm = async () => {
        try {
            const res = await getFirmList({
                offset: 1,
                limit: 1000,
                sort: SortType.NAME,
            })
            setFirmOptions(res.entries)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getFirm()
    }, [])

    useEffect(() => {
        if (basicInfo) {
            form.setFieldsValue({
                name: basicInfo.title,
                finish_date: basicInfo.finish_date
                    ? moment(basicInfo.finish_date)
                    : undefined,
                business_usage: basicInfo.description,
                apply_org_code: basicInfo.apply_org_code,
                applier: basicInfo.contact,
                phone: basicInfo.contact_phone,
            })
        }
    }, [basicInfo])

    useEffect(() => {
        if (catalogs.length > 0) {
            setSelectedCatalogId(catalogs[0]?.res_id)
            getMountResource(catalogs)
        }
    }, [catalogs])

    useEffect(() => {
        if (!applyId && userInfo) {
            form.setFieldsValue({ applier: userInfo.VisionName })
        }
    }, [userInfo])

    useEffect(() => {
        getCurDepartment()
        getApplicationCatalogs()
    }, [])

    useEffect(() => {
        if (applyId) {
            // 获取详情回显数据
            getDetails()
        }
    }, [applyId])

    // 获取待申请目录
    const getApplicationCatalogs = async () => {
        const res = await getApplicationCatalog()
        setApplicationCatalogs(res)
    }

    const getApps = async (depId: string) => {
        const res = await getAppRegisterList({
            offset: 1,
            limit: 2000,
            is_register_gateway: true,
            department_id: depId,
        })
        setApps(res.entries)
    }

    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const res = await getCurUserDepartment()
            // 当前树能根据id匹配到部门，根据id显示部门，不能匹配到，显示部门名称
            if (res?.length === 1) {
                const [dept] = res
                form.setFieldsValue({ apply_org_code: dept.id })
                setDefaultDepartment(dept.id)
                getApps(dept.id)
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 获取数据目录挂载资源
    const getMountResource = async (clgs: any[]) => {
        // 目录资源
        const clgArr = clgs.filter(
            (catalog) => catalog.res_type === ResTypeEnum.Catalog,
        )
        // 接口资源
        const interfaceArr = clgs.filter(
            (catalog) => catalog.res_type === ResTypeEnum.Api,
        )

        try {
            const catlgBasicRes: any[] = await Promise.allSettled(
                clgArr.map((catalog) => reqDataCatlgBasicInfo(catalog.res_id)),
            )

            const clgData = [
                ...(catalogsData || []),
                ...clgArr.map((c, idx) => ({
                    apply_item_id: '',
                    ...c,
                    org_path: catlgBasicRes[idx].value.department_path,
                    data_range: catlgBasicRes[idx].value.data_range,
                    update_cycle: catlgBasicRes[idx].value.update_cycle,
                    res_type: ResTypeEnum.Catalog,
                })),
                ...interfaceArr.map((item) => ({
                    ...item,
                    res_type: ResTypeEnum.Api,
                    org_path: item.org_path || item.department_path,
                })),
            ]
            if ((catalogsData || []).length === 0) {
                setSelectedCatalogId(clgData[0]?.res_id)
            }
            setCatalogsData(
                clgData.filter(
                    (item, index, self) =>
                        index ===
                        self.findIndex((o) => o.res_id === item.res_id),
                ),
            )
        } catch (e) {
            formatError(e)
        }
    }

    const checkCatalog = async () => {
        const [res, catalogRes] = await Promise.allSettled([
            form.validateFields(),
            catalogForm.validateFields(),
        ])
        if (res.status === 'rejected') {
            message.error(__('请完善申报信息'))
            form.scrollToField(res?.reason?.errorFields[0]?.name)
            return false
        }
        if (catalogRes.status === 'rejected') {
            message.error(__('请完善申报信息'))
            catalogForm.scrollToField(catalogRes?.reason?.errorFields[0]?.name)
            return false
        }

        if (catalogsData.length === 0) {
            message.error(__('请添加资源'))
            catalogInfoRef?.current?.scrollIntoView()
            return false
        }

        if (!catalogsData.every((item: any) => item.configFinish)) {
            const errCatalog = catalogsData.find(
                (item: any) => !item.configFinish,
            )
            setSelectedCatalogId(errCatalog!.res_id)
            // setConfigMode(ConfigModeEnum.Multiple)
            catalogRef?.current?.scrollIntoView()
            info({
                title: __('以下资源未完成申请配置，请完成后再提交'),
                icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
                content: catalogsData
                    .filter((item) => !item.configFinish)
                    .map((item) => item.res_name)
                    .join('、'),
                okText: __('确定'),
            })
            return false
        }
        return true
    }

    const checkName = async () => {
        try {
            await form.validateFields(['name'])
            return true
        } catch (error) {
            return false
        }
    }

    const handleConfirm = async (submitType: ShareApplySubmitType) => {
        // 暂存也需要填写全部数据
        let check = true
        if (submitType === ShareApplySubmitType.Submit) {
            check = await checkCatalog()
        } else {
            check = await checkName()
        }

        if (!check) {
            return
        }
        if (submitType === ShareApplySubmitType.Submit) {
            confirm({
                title: __('确认提交${name}吗？', {
                    name: form.getFieldValue('name'),
                }),
                icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
                content: __('提交后，需部门审核，请确认'),
                onOk: () => handleSave(submitType),
            })
        } else {
            handleSave(submitType)
        }
    }

    // 提交申请
    const handleSave = async (submitType: ShareApplySubmitType) => {
        try {
            if (submitType === ShareApplySubmitType.Draft) {
                setDraftLoading(true)
            } else {
                setSaveLoading(true)
            }
            const baseInfo = form.getFieldsValue()
            const { finish_date, application_letter, ...otherBaseInfo } =
                baseInfo

            let uploadFileRes: any[] = []
            if (!application_letter?.[0]?.id) {
                const applicationLetterFile = { file: application_letter?.[0] }
                const catalogsFileList = catalogFields.map((item) => ({
                    catalog_id: item.catalog_id,
                    file: item.fields.find((field: any) =>
                        field.name.includes('database_design_materials_ids'),
                    )?.value?.[0],
                }))

                uploadFileRes = await Promise.all(
                    [applicationLetterFile, ...catalogsFileList].map((item) => {
                        if (item?.file) {
                            const formData = new FormData()
                            formData.append(
                                'file',
                                item.file.originFileObj as RcFile,
                            )
                            return importDemandFile(formData)
                        }
                        return Promise.resolve(null)
                    }),
                )
            }

            const params: IAddShareApply = {
                ...otherBaseInfo,
                // name: applyId ? undefined : otherBaseInfo.name,
                finish_date: finish_date?.endOf('day').valueOf(),
                attachment_id:
                    application_letter?.[0]?.id || uploadFileRes?.[0]?.id,
                submit_type: submitType,
                areas: otherBaseInfo.areas?.join(','),
                resources:
                    !catalogsData ||
                    (submitType === ShareApplySubmitType.Draft &&
                        catalogsData.length === 0)
                        ? null
                        : catalogsData?.map((item) => {
                              const timeRange =
                                  item.apply_conf?.view_apply_conf?.time_range
                              const timeRangeType =
                                  item.apply_conf?.view_apply_conf
                                      ?.time_range_type
                              const timeRangeRes =
                                  timeRangeType === 'select'
                                      ? typeof timeRange === 'string'
                                          ? timeRange
                                          : Array.isArray(timeRange)
                                          ? `${timeRange[0].format(
                                                'YYYY-MM-DD',
                                            )}~${timeRange[1].format(
                                                'YYYY-MM-DD',
                                            )}`
                                          : timeRange
                                      : timeRange
                              return {
                                  res_id: item.res_id,
                                  res_type: item.res_type,
                                  apply_item_id: applicationCatalogs.find(
                                      (catalog) =>
                                          catalog.res_id === item.res_id,
                                  )?.id,
                                  apply_conf: {
                                      ...item.apply_conf,
                                      other_available_date: item.apply_conf
                                          ?.other_available_date
                                          ? item.apply_conf?.other_available_date
                                                .endOf('day')
                                                .valueOf()
                                          : undefined,
                                      view_apply_conf:
                                          item.apply_conf?.supply_type ===
                                          ApplyResource.Interface
                                              ? undefined
                                              : {
                                                    ...item.apply_conf
                                                        ?.view_apply_conf,
                                                    time_range: timeRangeRes,
                                                    columns: undefined,
                                                    column_ids:
                                                        item?.apply_conf?.view_apply_conf?.columns
                                                            ?.map(
                                                                (column: any) =>
                                                                    column.id,
                                                            )
                                                            .join(','),
                                                    column_names:
                                                        JSON.stringify(
                                                            item?.apply_conf?.view_apply_conf?.columns?.map(
                                                                (column: any) =>
                                                                    column.business_name,
                                                            ) || [],
                                                        ),
                                                },

                                      api_apply_conf:
                                          item.apply_conf?.supply_type ===
                                          ApplyResource.Interface
                                              ? item.apply_conf.api_apply_conf
                                              : undefined,
                                  },
                              }
                          }),
            }
            await (applyId
                ? putCityShareApply(applyId, params)
                : postCityShareApply(params))
            message.success(
                submitType === ShareApplySubmitType.Submit
                    ? __('提交申请成功')
                    : __('暂存申请成功'),
            )
            dispatch({
                type: actionType.CITY_SHARING,
                payload: {
                    data: citySharingData?.data.filter(
                        (cityItem) =>
                            !catalogs.find(
                                (catalog) =>
                                    cityItem.catalog_id === catalog.res_id,
                            ),
                    ),
                },
            })
            if (platform !== LoginPlatform.drmb) {
                window.open('/anyfabric/drmb/citySharing/apply', '_self')
            }
            onClose()
        } catch (err) {
            formatError(err)
        } finally {
            setSaveLoading(false)
            setDraftLoading(false)
        }
    }

    // 检查申请名称是否重复
    const checkNameRepeat = async (value: string) => {
        try {
            if (trim(value)) {
                const res = await getCityShareApplyNameRepeat({
                    name: value,
                    share_apply_id: applyId || undefined,
                })
                if (res.is_repeated) {
                    return Promise.reject(
                        new Error(__('该申请名称已存在，请重新输入')),
                    )
                }
            }
            return Promise.resolve()
        } catch (ex) {
            formatError(ex)
            return Promise.resolve()
        }
    }

    const normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e
        }
        return e?.fileList
    }

    // 申请信息
    const getFormApplyInfo = () => (
        <div id={applyInfo.key} className={styles.form_item}>
            <GroupHeader text={applyInfo.title} />
            <div className={styles['form_item-content']}>
                <Form.Item
                    name="name"
                    label={__('申请名称')}
                    required
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: __('请输入'),
                        },
                        {
                            validateTrigger: 'onBlur',
                            validator: (e, value) => checkNameRepeat(value),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入')}
                        maxLength={128}
                        // disabled={!!applyId}
                    />
                </Form.Item>
                <Row gutter={48}>
                    <Col span={12}>
                        <Form.Item
                            name="areas"
                            label={__('业务应用领域')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择'),
                                },
                            ]}
                        >
                            <Select
                                fieldNames={{
                                    label: 'dict_value',
                                    value: 'dict_key',
                                }}
                                options={dict
                                    ?.find(
                                        (item) =>
                                            item.dict_type === 'city-area',
                                    )
                                    ?.dict_item_resp.sort(
                                        (a, b) =>
                                            Number(a.dict_key) -
                                            Number(b.dict_key),
                                    )}
                                placeholder={__('请选择')}
                                mode="multiple"
                                notFoundContent={<NotFoundContent />}
                                getPopupContainer={(n) => n.parentNode}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="finish_date"
                            label={__('期望完成时间')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择日期'),
                                },
                            ]}
                        >
                            <DatePicker
                                placeholder={__('请选择日期')}
                                style={{ width: '100%' }}
                                getPopupContainer={(n) => n}
                                disabledDate={(current) => {
                                    return (
                                        current &&
                                        current < moment().startOf('day')
                                    )
                                }}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            name="matters"
                            label={__('关联业务事项')}
                            // required
                            // rules={[
                            //     {
                            //         required: true,
                            //         message: __('输入不能为空'),
                            //     },
                            // ]}
                        >
                            <Input placeholder={__('请填写关联业务事项')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="scene"
                            label={__('关联业务场景')}
                            // required
                            // rules={[
                            //     {
                            //         required: true,
                            //         message: __('输入不能为空'),
                            //     },
                            // ]}
                        >
                            <Input placeholder={__('请填写关联业务场景')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="app_id"
                            label={__('关联应用系统')}
                            // required
                            // rules={[
                            //     {
                            //         required: true,
                            //         message: __('请选择'),
                            //     },
                            // ]}
                            className={styles['app-form-item']}
                        >
                            <Select
                                options={apps}
                                placeholder={__(
                                    '请选择直属部门已注册的网关应用',
                                )}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.name ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                                fieldNames={{
                                    label: 'name',
                                    value: 'id',
                                }}
                                onChange={(value, option) => {
                                    const app = apps.find((a) => a.id === value)
                                    setSelectedApp(app)
                                }}
                            />
                        </Form.Item>
                        <Button
                            type="link"
                            className={styles['app-link']}
                            onClick={() =>
                                window.open(
                                    getActualUrl('/personal-center', true, 2),
                                    '_blank',
                                )
                            }
                        >
                            {__(
                                '找不到应用？请到个人中心-我的应用-网关应用中添加并注册>>',
                            )}
                        </Button>
                    </Col>
                </Row>

                {selectedApp && (
                    <div className={styles.appInfo}>
                        {appInfoList.map((it, idx) => (
                            <div key={idx} className={styles.appInfoItem}>
                                <span>
                                    {it.label}
                                    {__('：')}
                                </span>
                                <span
                                    title={it.value}
                                    className={styles.appInfoValue}
                                >
                                    {it.value || '--'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <Form.Item
                    name="business_usage"
                    label={__('业务用途')}
                    required
                    rules={[
                        {
                            required: true,
                            message: __('请输入'),
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
                        maxLength={500}
                    />
                </Form.Item>
                <Form.Item
                    name="expect_effect"
                    label={__('预期应用成效')}
                    required
                    rules={[
                        {
                            required: true,
                            message: __('请输入'),
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
                        maxLength={500}
                    />
                </Form.Item>
                <Form.Item
                    label={__('申请函件')}
                    name="application_letter"
                    required
                    rules={[{ required: true, message: __('请上传文件') }]}
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                >
                    <UploadFiles maxCount={1} />
                </Form.Item>
            </div>
        </div>
    )

    // 部门信息
    const getFormDepartmentInfo = () => (
        <div id={departmentInfo.key} className={styles.form_item}>
            <GroupHeader text={departmentInfo.title} />
            <div className={styles['form_item-content']}>
                <Row gutter={48}>
                    <Col span={12}>
                        <Form.Item
                            name="apply_org_code"
                            label={__('申请部门')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择'),
                                },
                            ]}
                        >
                            <DepartmentAndOrgSelect
                                placeholder={__('请选择')}
                                defaultValue={
                                    basicInfo?.apply_org_code ||
                                    defaultDepartment
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="applier"
                            label={__('申请人')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请输入'),
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={128} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="phone"
                            label={__('申请人联系电话')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请输入'),
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={128} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="firm_id"
                            label={__('技术厂商名称')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择'),
                                },
                            ]}
                        >
                            <Select
                                placeholder={__('请选择')}
                                options={firmOptions}
                                fieldNames={{
                                    label: 'name',
                                    value: 'id',
                                }}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.name ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                                onChange={(value, option) => {
                                    const res = firmOptions.find(
                                        (item) => item.id === value,
                                    )
                                    form.setFieldsValue({
                                        firm_contact: res?.legal_represent,
                                        firm_contact_phone: res?.contact_phone,
                                    })
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="firm_contact"
                            label={__('技术厂商联系人')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请输入'),
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={128} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="firm_contact_phone"
                            label={__('厂商联系人电话')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请输入'),
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={128} />
                        </Form.Item>
                    </Col>
                </Row>
                {/* getFirmList */}
            </div>
        </div>
    )

    // 切换目录
    const changeSelectCatalog = (step: 1 | -1) => {
        const currentIndex = catalogsData.findIndex(
            (c) => c.res_id === selectedCatalogId,
        )
        let nextIndex = 0
        if (step === 1) {
            // 找到未配置完成且比当前index大
            const nextUnFinishedIndex = catalogsData.findIndex(
                (c, i) => !c.configFinish && i > currentIndex,
            )
            if (nextUnFinishedIndex > -1) {
                nextIndex = nextUnFinishedIndex
            } else {
                nextIndex = currentIndex + 1
                if (nextIndex > catalogsData.length - 1) {
                    nextIndex = 0
                }
            }
        } else {
            // 找到未配置完成且比当前index小
            const nextUnFinishedIndex = catalogsData.findIndex(
                (c, i) => !c.configFinish && i < currentIndex,
            )
            if (nextUnFinishedIndex > -1) {
                nextIndex = nextUnFinishedIndex
            } else {
                nextIndex = currentIndex - 1
                if (nextIndex < 0) {
                    nextIndex = catalogsData.length - 1
                }
            }
        }
        setSelectedCatalogId(catalogsData[nextIndex].res_id)
    }

    const handleFormChange = (
        fields,
        selectedColumns,
        unRequiredFields?: string[],
    ) => {
        if (fields.length > 0) {
            const requiredFields = fields.filter(
                (field) =>
                    Array.isArray(field.name) &&
                    ![
                        'dst_data_source_id',
                        'dst_view_name',
                        'push_fields',
                        ...(unRequiredFields || []),
                    ].some(
                        (id) =>
                            Array.isArray(field.name) &&
                            field.name.includes(id),
                    ),
            )

            const formData = catalogForm.getFieldsValue()
            const {
                supply_type,
                available_date_type,
                other_available_date,
                ...rest
            } = formData
            // 注册接口资源 或 目录资源的提供方式选择接口
            const isApi =
                catalogsData.find((item) => item.res_id === selectedCatalogId)
                    .res_type === ResTypeEnum.Api ||
                supply_type === ApplyResource.Interface

            const configFinish =
                requiredFields.every((f) => {
                    if (typeof f.value === 'boolean') {
                        return true
                    }
                    if (f.value || f.value === 0) {
                        if (typeof f.value === 'number') {
                            return true
                        }
                        return f.errors?.length === 0
                    }

                    return false
                }) &&
                (isApi || selectedColumns.length > 0)

            setCatalogsData((prev) =>
                prev.map((c) =>
                    c.res_id === selectedCatalogId
                        ? {
                              ...c,
                              configFinish,
                              apply_conf: {
                                  supply_type,
                                  available_date_type,
                                  other_available_date,

                                  view_apply_conf: isApi
                                      ? undefined
                                      : { ...rest, columns: selectedColumns },
                                  api_apply_conf: isApi
                                      ? // 注册接口is_customized默认为false,data_res_id:注册接口id
                                        // 目录下的接口对接又用户选择决定（rest会覆盖is_customized）
                                        {
                                            is_customized: false,
                                            data_res_id: rest.is_customized
                                                ? undefined
                                                : c.res_id,
                                            ...rest,
                                        }
                                      : undefined,
                              },
                          }
                        : c,
                ),
            )
            setCatalogFields((prev) => [
                ...prev.filter((f) => f.catalog_id !== selectedCatalogId),
                {
                    catalog_id: selectedCatalogId,
                    fields,
                },
            ])
        }
    }

    // 申请目录
    const getFormApplyCatalogInfo = () => (
        <div
            id={applyCatalogInfo.key}
            className={styles.form}
            ref={catalogInfoRef}
        >
            <GroupHeader text={applyCatalogInfo.title} />
            <div className={styles.applyCatalogInfo}>
                <div className={styles['applyCatalogInfo-content']}>
                    {configMode === ConfigModeEnum.Table && (
                        <CatalogTable
                            items={catalogsData}
                            handleAddResource={() => {
                                setAddResourceOpen(true)
                            }}
                            handleRemove={(id: string) => {
                                const newCatalogsData = catalogsData.filter(
                                    (c) => c.res_id !== id,
                                )
                                setCatalogsData(newCatalogsData)
                                setSelectedCatalogId(newCatalogsData[0]?.res_id)
                            }}
                            handleConfig={(record) => {
                                if (record) {
                                    setSelectedCatalogId(record.res_id)
                                    setConfigMode(ConfigModeEnum.Single)
                                } else {
                                    setConfigMode(ConfigModeEnum.Multiple)
                                }
                            }}
                        />
                    )}
                    {configMode === ConfigModeEnum.Multiple && (
                        <div>
                            <div className={styles['list-top-info']}>
                                <div className={styles['list-title']}>
                                    {__('资源列表')}
                                </div>
                                <Button
                                    type="link"
                                    className={styles['list-add-btn']}
                                    onClick={() => {
                                        setAddResourceOpen(true)
                                    }}
                                >
                                    <PlusOutlined
                                        className={styles['list-add-btn-icon']}
                                    />
                                    {__('添加资源')}
                                </Button>
                            </div>
                            <CatalogList
                                items={catalogsData}
                                selectedCatalog={catalogsData.find(
                                    (c) => c.res_id === selectedCatalogId,
                                )}
                                onItemClick={(value) => {
                                    setSelectedCatalogId(value?.res_id)
                                    setCatalogFields((prev) =>
                                        prev.map((c) => ({
                                            ...c,
                                            fields: c.fields.map((f) => ({
                                                ...f,
                                                errors: [],
                                            })),
                                        })),
                                    )
                                }}
                                style={{ maxHeight: contentSize?.height || 0 }}
                            />
                        </div>
                    )}
                    {[ConfigModeEnum.Single, ConfigModeEnum.Multiple].includes(
                        configMode,
                    ) && (
                        <div className={styles['config-content-container']}>
                            {configMode === ConfigModeEnum.Multiple && (
                                <div className={styles['config-operate']}>
                                    <span className={styles['config-label']}>
                                        {__('已配置资源：')}
                                    </span>
                                    <span className={styles['config-count']}>
                                        {`${
                                            catalogsData.filter(
                                                (item) => item.configFinish,
                                            ).length
                                        } / ${catalogsData.length}`}
                                    </span>
                                    <Button
                                        onClick={() =>
                                            setConfigMode(ConfigModeEnum.Table)
                                        }
                                    >
                                        {__('保存并返回列表')}
                                    </Button>
                                </div>
                            )}
                            <div
                                ref={catalogRef}
                                className={
                                    styles['applyCatalogInfo-content-details']
                                }
                            >
                                <CatalogForm
                                    checking={checking}
                                    setChecking={setChecking}
                                    form={catalogForm}
                                    catalog={catalogsData.find(
                                        (c) => c.res_id === selectedCatalogId,
                                    )}
                                    handleSave={
                                        configMode === ConfigModeEnum.Single
                                            ? () => {
                                                  setConfigMode(
                                                      ConfigModeEnum.Table,
                                                  )
                                              }
                                            : undefined
                                    }
                                    fields={
                                        catalogFields.find(
                                            (f) =>
                                                f.catalog_id ===
                                                selectedCatalogId,
                                        )?.fields
                                    }
                                    onChange={handleFormChange}
                                    handleLast={() => changeSelectCatalog(-1)}
                                    handleNext={() => changeSelectCatalog(1)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    // 表单分组
    const config = useMemo(() => {
        return [applyInfo, departmentInfo, applyCatalogInfo]
    }, [])

    return (
        <div className={classnames(styles.apply)}>
            {/* 导航头部 */}
            <DrawerHeader
                title={__('共享申报')}
                onClose={() => {
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
            />
            {/* 内容 */}
            <div className={styles.bottom}>
                <div className={styles.content}>
                    <div className={styles.form_content}>
                        {/* 表单内容 */}
                        <div className={styles.applyForm} ref={container}>
                            <Form.Provider
                                onFormChange={(
                                    formName,
                                    { changedFields, forms },
                                ) => {
                                    setHasChange(true)
                                }}
                            >
                                <Form
                                    form={form}
                                    name="baseInfo"
                                    layout="vertical"
                                    autoComplete="off"
                                    scrollToFirstError
                                    className={styles.form}
                                >
                                    {getFormApplyInfo()}
                                    {getFormDepartmentInfo()}
                                </Form>
                                {getFormApplyCatalogInfo()}
                            </Form.Provider>
                        </div>
                        {/* 锚点 */}
                        <ApplyAnchor container={container} config={config} />
                    </div>

                    {/* 底部栏 */}
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
                                className={styles.btn}
                                onClick={() => {
                                    handleConfirm(ShareApplySubmitType.Draft)
                                }}
                                loading={draftLoading}
                            >
                                {__('暂存')}
                            </Button>
                            <Button
                                type="primary"
                                className={styles.btn}
                                loading={saveLoading}
                                onClick={() => {
                                    handleConfirm(ShareApplySubmitType.Submit)
                                }}
                            >
                                {__('提交')}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
            {/* 添加资源 */}
            {addResourceOpen && (
                <AddCatalogDrawer
                    open={addResourceOpen}
                    onClose={() => setAddResourceOpen(false)}
                    onOk={(data) => {
                        getMountResource(data)
                    }}
                    initData={catalogsData}
                />
            )}
        </div>
    )
}
export default Apply
