import { InfoCircleFilled, QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, Radio, Row, Select, Tooltip } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import { noop, trim } from 'lodash'
import { pinyin } from 'pinyin-pro'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { confirm } from '@/utils/modalHelper'
import {
    beginningIsNotASlashReg,
    cnEnPathReg,
    getPlatformNumber,
    keyboardCharactersReg,
    keyboardReg,
    pathNameReg,
} from '@/utils'
import UploadFile from '@/ui/UploadFile'
import { NumberType } from '@/ui/NumberInput/const'
import NumberInput from '@/ui/NumberInput'
import {
    checkServerNameRepeated,
    checkServerPathRepeated,
    formatError,
    getApplyScopeConfig,
    getCurUserDepartment,
    getDatasheetViewDetails,
    getFirmList,
    getRescTree,
    getUserByDepartId,
    getUserListByPermission,
    LoginPlatform,
    ScopeModuleCategory,
    SortDirection,
    SortType,
    userInfo,
} from '@/core'
import CategorySelects from '../CategorySelects'
import DataOwnerCompositeComponent from '../DataOwnerCompositeComponent'
import { CombinedComponentType } from '../DataOwnerCompositeComponent/const'
import ChooseBizTable from '../DimensionModel/components/ChooseBizTable'
import { SYSTEM_CATEGORY_ID, SYSTEM_STATUS } from './const'
import FormTitle from './FormTitle'
import { checkCategoryExist } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface ServiceMarketType {
    onChange?: (value) => void
    value?: string
}

interface BasicInfoFormType {
    defaultServiceInfo: any
    form: FormInstance<any>
    onFinsh: (values) => void
    getDepartment?: (values) => void
    getOwner?: (values) => void
    // getDepartmentOrOrg?: (values) => void
    serviceId?: string
    departments: any[]
    ModeType?: 'create' | 'registry'
    onDataChange?: () => void
    getDatasheet?: (data) => void
    needShowTip?: boolean
    onDataSheetChange?: () => void
    isShowChoose?: boolean
}
const ServiceMarket = ({
    onChange = noop,
    value = 'yes',
}: ServiceMarketType) => {
    return (
        <div className={styles.serverMarket}>
            <span className={styles.labelText}>
                {__('是否同步到数据服务超市')}
            </span>
            <Radio.Group
                onChange={(e) => {
                    onChange(e.target.value)
                }}
                value={value}
            >
                <Radio value="yes">{__('同步')}</Radio>
                <Radio value="no">{__('不同步')}</Radio>
            </Radio.Group>
        </div>
    )
}

const BasicInfoForm = ({
    defaultServiceInfo,
    form,
    needShowTip = false,
    onDataSheetChange,
    onFinsh,
    getDepartment,
    // getDepartmentOrOrg,
    getDatasheet,
    getOwner,
    serviceId = '',
    departments = [],
    ModeType = 'create',
    onDataChange = noop,
    isShowChoose = true,
}: BasicInfoFormType) => {
    const [departmentOptions, setDepartmentOptions] =
        useState<Array<any>>(departments)
    const [categoryOptions, setCategoryOptions] = useState<Array<any>>([])
    // const [appOptions, setAppOptions] = useState<Array<any>>([])
    // const [systemOptions, setSystemOptions] = useState<Array<any>>([])
    const [autoPathStatus, setAutoPathStatus] = useState<boolean>(true)
    const [developerOptions, setDeveloperOptions] = useState<Array<any>>([])
    const [searchParams, setSearchParams] = useSearchParams()
    const catlgId = searchParams.get('catlgId') || ''
    const [depId, setDepId] = useState('')
    const [searchOwnerValue, setSearchOwnerValue] = useState('')
    const [currentDepart, setCurrentDepart] = useState<any>()
    const [ownerId, setOwnerId] = useState('')
    const [selectedOwner, setSelectedOwner] = useState<any>({})
    const [members, setMembers] = useState<userInfo[]>([])
    const departmentRef: any = useRef()
    const [ownerSelectState, setOwnerSelectState] = useState<any>('')
    const [orgSelectState, setOrgSelectState] = useState<any>('')
    const [isSearchMembers, setIsSearchMembers] = useState<boolean>(false)
    const [categoryKeyword, setCategoryKeyword] = useState<string>('')
    const [datasheetName, setDatasheetName] = useState<string>('')
    const [bizChooseVisible, setBizChooseVisible] = useState<boolean>(false)
    const [checkedNode, setCheckedNode] = useState<any>()
    const [selectLoading, setSelectLoading] = useState<boolean>(true)
    const [datasheetValidateInfo, setDatasheetValidateInfo] = useState<{
        state: '' | 'success' | 'error' | 'warning' | 'validating' | undefined
        message: string
    }>({ state: '', message: '' })

    const [defaultSubjectDomainName, setDefaultSubjectDomainName] =
        useState<string>('')
    const [dataCompositeConfigs, setDataCompositeConfigs] = useState<any[]>([])
    const platformNumber = getPlatformNumber()
    const [categorys, setCategorys] = useState<any[]>([])
    const [systemInfoRequired, setSystemInfoRequired] = useState<SYSTEM_STATUS>(
        SYSTEM_STATUS.REQUIRED,
    )

    // useEffect(() => {
    //     getAllOwnerUsers()
    // }, [])

    // useEffect(() => {

    // }, [departments])

    useEffect(() => {
        form.setFieldsValue(defaultServiceInfo)
        // setDepartmentOptions(departments)
        if (defaultServiceInfo?.subject_domain_id) {
            setDefaultSubjectDomainName(defaultServiceInfo.subject_domain_id)
        }

        if (catlgId) {
            // 默认选中第一个所属应用
            // if (appOptions.length > 0) {
            //     form.setFieldsValue({ app: appOptions[0].value })
            // }
            // 若资源目录未选信息系统 则默认选中第一个信息系统
            // if (!defaultServiceInfo.system && systemOptions.length > 0) {
            //     form.setFieldsValue({ system: systemOptions[0].value })
            // }
            combinPath()
        }
        initOptions()

        // 新建查询当前部门
        if (!serviceId && !catlgId) {
            getCurDepartment()
        }
        if (
            defaultServiceInfo?.departmentOrOrg ||
            defaultServiceInfo?.department
        ) {
            getCurDepartmentUsers(
                defaultServiceInfo?.departmentOrOrg?.id ||
                    defaultServiceInfo?.department,
            )
        }

        if (defaultServiceInfo?.owner_id && defaultServiceInfo?.owner_name) {
            setOwnerId(defaultServiceInfo?.owner_id)
            const ownerObj = selectedOwner?.id
                ? selectedOwner
                : {
                      id: defaultServiceInfo?.owner_id,
                      name: defaultServiceInfo?.owner_name,
                  }
            getOwner?.(ownerObj)
        }
        if (defaultServiceInfo?.data_view_id) {
            setCheckedNode({
                id: defaultServiceInfo?.data_view_id,
                business_name: defaultServiceInfo?.data_view_name,
            })
            // 用于表单校验，提交不取值
            form.setFieldValue('datasheet_id', defaultServiceInfo?.data_view_id)
            validateDatasheet(defaultServiceInfo?.data_view_id)
        }
    }, [defaultServiceInfo])

    useEffect(() => {
        const configs: any[] = [
            {
                name: 'subject_domain_id',
                type: CombinedComponentType.THEME_DOMAIN_TREE,
                label: __('所属业务对象'),
                required: false,
                defaultDisplay: defaultSubjectDomainName,
            },

            {
                name: 'department',
                type: CombinedComponentType.DEPARTMENT,
                label: __('所属部门'),
                required: true,
                defaultDisplay: defaultServiceInfo.department,
            },
            {
                name: 'info_system_id',
                type: CombinedComponentType.INFO_SYSTEM,
                label: __('所属系统'),
                required: systemInfoRequired,
                defaultDisplay: defaultServiceInfo.info_system_id,
            },
        ].filter((item) => {
            return (
                item.type !== CombinedComponentType.INFO_SYSTEM ||
                systemInfoRequired !== SYSTEM_STATUS.NOT_EXIST
            )
        })
        if (platformNumber === LoginPlatform.default) {
            // configs.push({
            //     name: 'owners',
            //     type: CombinedComponentType.DATAOWNER,
            //     mode: 'multiple',
            //     required: false,
            //     perm: 'manageDataResourceAuthorization',
            // })
        } else if (systemInfoRequired !== SYSTEM_STATUS.NOT_EXIST) {
            configs.push({
                name: 'apps_id',
                type: CombinedComponentType.APPLICATION,
                label: __('所属应用'),
                required: systemInfoRequired,
                defaultDisplay: defaultServiceInfo.apps_id,
            })
        }
        setDataCompositeConfigs(configs)
    }, [
        defaultServiceInfo,
        platformNumber,
        defaultSubjectDomainName,
        systemInfoRequired,
    ])

    // useEffect(() => {
    //     if (ownerId && isSearchMembers) {
    //         const state = members.find((item) => item.id === ownerId)
    //         form.setFieldValue('owner_id', !state ? undefined : ownerId)
    //         setOwnerSelectState(state ? '' : 'error')
    //     }
    // }, [members, ownerId, isSearchMembers])

    useEffect(() => {
        getSystemInfoRequired()
    }, [])

    const initOptions = async () => {
        setSelectLoading(true)
        const [categorysData, developers] = await Promise.all([
            getRescTree({ recursive: true }),
            // getSystems(),
            getFirmList({
                limit: 1000,
                offset: 1,
                sort: SortType.NAME,
                direction: SortDirection.ASC,
            }),
        ])
        setSelectLoading(false)
        setCategoryOptions(categorysData.entries)

        setDeveloperOptions(
            developers.entries?.map((developer) => ({
                label: developer.name,
                value: developer.id,
            })) || [],
        )
        if (
            defaultServiceInfo.category &&
            !checkCategoryExist(
                categorysData.entries || [],
                defaultServiceInfo.category,
            )
        ) {
            form.setFields([
                {
                    name: ['category'],
                    errors: [__('已被删除，请重新选择')],
                    value: null,
                },
            ])
        }
    }

    const getSystemInfoRequired = async () => {
        try {
            const config = await getApplyScopeConfig()
            const systemCategory = config.categories.find((category) => {
                return category.id === SYSTEM_CATEGORY_ID
            })
            if (systemCategory) {
                setSystemInfoRequired(
                    systemCategory?.modules?.find((module) => {
                        return (
                            module.apply_scope_id ===
                            '00000000-0000-0000-0000-000000000001'
                        )
                    })?.required
                        ? SYSTEM_STATUS.REQUIRED
                        : SYSTEM_STATUS.NOT_REQUIRED,
                )
            } else {
                setSystemInfoRequired(SYSTEM_STATUS.NOT_EXIST)
            }
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 组合路径
     */
    const combinPath = () => {
        const fields = form.getFieldsValue()
        const reg = /[\u4e00-\u9fa5]/g
        const result = trim(fields.service_name)?.replace(reg, (match) => {
            return pinyin(match, {
                pattern: 'first',
                nonZh: 'consecutive',
                toneType: 'none',
            })
        })

        form.setFields([
            {
                name: 'service_path',
                errors: [],
                value: `${result ? `${result}` : ''}`,
            },
        ])
    }

    /**
     *  检查接口名重复
     * @param ruler
     * @param name
     * @returns
     */
    const checkServerNameRepeat = async (ruler, name) => {
        try {
            return await checkServerNameRepeated({
                service_id: serviceId,
                service_name: name,
            })
        } catch (ex) {
            if (
                ex.data.code ===
                'DataApplicationService.Service.ServiceNameExist'
            ) {
                return Promise.reject(new Error('该名称已存在，请重新输入'))
            }
            return Promise.resolve()
        }
    }

    /**
     *  检查接口路径重复
     * @param ruler
     * @param name
     * @returns
     */
    const checkServerPathRepeat = async (ruler, path) => {
        try {
            return await checkServerPathRepeated({
                service_id: serviceId,
                service_path: `/${trim(path)}`,
            })
        } catch (ex) {
            if (
                ex.data.code ===
                'DataApplicationService.Service.ServicePathExist'
            ) {
                return Promise.reject(new Error('该路径已存在，请重新输入'))
            }
            return Promise.resolve()
        }
    }

    /**
     * 检查地址合法性
     */
    const checkHostCurrent = (ruler, url: string) => {
        try {
            if (!cnEnPathReg.test(url)) {
                return Promise.reject(
                    __(
                        '仅支持以http://或https://开头的域名或IP，IP支持PV4、IPV6 示例: https://www.x.cn ',
                    ),
                )
            }
            const urlData = new URL(url)
            return Promise.resolve()
        } catch {
            return Promise.reject(
                __(
                    '仅支持以http://或https://开头的域名或IP，IP支持PV4、IPV6 示例: https://www.x.cn ',
                ),
            )
        }
    }

    const ownersChange = (value) => {
        setSearchOwnerValue('')
        setOwnerSelectState('')
        const ownerObj: any = members.find((item) => item.id === value)
        setSelectedOwner(ownerObj)
        if (getOwner) {
            getOwner(ownerObj)
        }
    }

    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const res = await getCurUserDepartment()
            // 当前树能根据id匹配到部门，根据id显示部门，不能匹配到，显示部门名称
            if (res?.length === 1) {
                const [dept] = res
                setCurrentDepart(dept)
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 获取所有数据owner用户
    const getAllOwnerUsers = async () => {
        try {
            const res = await getUserListByPermission({
                permission_ids: ['afbcdb6c-cb85-4a0c-82ee-68c9f1465684'],
            })
            setIsSearchMembers(true)
            setMembers(res?.entries)
        } catch (error) {
            setMembers([])
            formatError(error)
        }
    }

    // 检测部门是否存在
    const getCurDepartmentUsers = async (depart_id: string) => {
        try {
            await getUserByDepartId({ depart_id })
        } catch (error) {
            if (
                error?.data?.code ===
                'ConfigurationCenter.User.DrivenUserManagementDepartIdNotExist'
            ) {
                form.setFieldValue('department', undefined)
                setOrgSelectState('error')
            }
            formatError(error)
        }
    }

    const sureDataAndClearParam = (o) => {
        // 用于表单校验，提交不取值
        // form.setFieldValue('datasheet_id', o.id)
        const currentDepartmentId = form.getFieldValue('department')

        form.setFields([
            {
                name: 'service_name',
                errors: [],
                value: o?.business_name || '',
            },
            {
                name: 'datasheet_id',
                errors: [],
                value: o?.id || '',
            },
        ])
        if (o?.department_id !== currentDepartmentId) {
            setDataCompositeConfigs(
                dataCompositeConfigs.map((item) =>
                    item.name !== 'department'
                        ? item
                        : {
                              ...item,
                              defaultDisplay: o.department_id,
                          },
                ),
            )
        }
        if (o.department_id) {
            form.setFields([
                {
                    name: 'department',
                    errors: [],
                    value: o.department_id,
                },
            ])
        }
        getDatasheet?.(o)
        setCheckedNode(o)
        setDatasheetValidateInfo({
            state: '',
            message: '',
        })
    }

    const handleDataViewSure = (o) => {
        setBizChooseVisible(false)
        if (!needShowTip) {
            sureDataAndClearParam(o)
            return
        }

        confirm({
            title: __('确认切换数据源库表吗？'),
            icon: <InfoCircleFilled style={{ color: '#faac14' }} />,
            content: __('切换后，现有参数配置信息将被清空。'),
            okText: __('确定'),
            cancelText: __('取消'),
            onOk() {
                sureDataAndClearParam(o)
                onDataSheetChange?.()
            },
        })
    }

    const validateDatasheet = async (id: string) => {
        try {
            await getDatasheetViewDetails(id)
            setDatasheetValidateInfo({
                state: '',
                message: '',
            })
            form.setFields([
                {
                    name: 'datasheet_id',
                    errors: [],
                    value: id || '',
                },
            ])
        } catch (err) {
            setDatasheetValidateInfo({
                state: 'error',
                message: __('库表不存在，请重新选择'),
            })

            form.setFields([
                {
                    name: 'datasheet_id',
                    errors: [__('库表不存在，请重新选择')],
                    value: null,
                },
            ])
            // form.setFieldValue('datasheet_id', '')
        }
    }

    return (
        <>
            <Form
                form={form}
                layout="vertical"
                className={styles.basicContent}
                initialValues={defaultServiceInfo}
                onFinish={onFinsh}
                autoComplete="off"
                scrollToFirstError
                onValuesChange={(values) => {
                    onDataChange()
                    const keys = Object.keys(values)
                    if (keys.includes('info_system_id')) {
                        form.setFieldValue('apps_id', undefined)
                    }
                }}
            >
                <FormTitle title={__('基本信息')} />
                <div className={styles.formInfoContent}>
                    {ModeType === 'create' && (
                        <Row gutter={40}>
                            <Col span={12}>
                                <div className={styles.formInfoDataSheet}>
                                    <Form.Item
                                        name="datasheet_id"
                                        label={__('库表')}
                                        required
                                        validateFirst
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择库表'),
                                            },
                                        ]}
                                        // validateStatus={
                                        //     datasheetValidateInfo.state
                                        // }
                                        // help={datasheetValidateInfo.message}
                                        style={{ flex: '1', maxWidth: '100%' }}
                                    >
                                        <Select
                                            placeholder={__('请选择库表')}
                                            value={checkedNode?.business_name}
                                            open={false}
                                            options={
                                                checkedNode?.id
                                                    ? [
                                                          {
                                                              label: checkedNode?.business_name,
                                                              value: checkedNode?.id,
                                                          },
                                                      ]
                                                    : []
                                            }
                                            showArrow={false}
                                        />
                                    </Form.Item>
                                    {isShowChoose && (
                                        <Button
                                            className={styles.btn}
                                            onClick={() =>
                                                setBizChooseVisible(true)
                                            }
                                        >
                                            {__('选择')}
                                        </Button>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    )}

                    <Form.Item
                        name="service_name"
                        label={__('接口名称')}
                        required
                        validateFirst
                        rules={[
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                            {
                                pattern: keyboardCharactersReg,
                                message: __(
                                    '仅支持中英文、数字、及键盘上的特殊字符',
                                ),
                                transform: (value) => trim(value),
                            },
                            {
                                validateTrigger: ['onBlur', 'onChange'],
                                validator: checkServerNameRepeat,
                            },
                        ]}
                    >
                        <Input
                            placeholder={__('请输入接口名称')}
                            autoComplete="off"
                            maxLength={128}
                        />
                    </Form.Item>

                    <Form.Item
                        shouldUpdate={(prevValue, curValue) =>
                            prevValue.service_name !== curValue.service_name
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const serviceName = getFieldValue('service_name')
                            return (
                                <div className={styles.indicatorNameContainer}>
                                    <Form.Item
                                        name="service_path"
                                        label={__('接口路径')}
                                        required
                                        validateFirst
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请输入接口路径'),
                                            },
                                            {
                                                pattern:
                                                    beginningIsNotASlashReg,
                                                message: __(
                                                    '仅支特英文数字、健盘上的特殊符号，不能以/开头，不支持空格',
                                                ),
                                                transform: (value) => value,
                                            },
                                            {
                                                validateTrigger: [
                                                    'onBlur',
                                                    'onChange',
                                                ],
                                                validator:
                                                    checkServerPathRepeat,
                                            },
                                        ]}
                                        style={{
                                            flex: 1,
                                        }}
                                    >
                                        <Input
                                            addonBefore="/"
                                            placeholder={__('请输入接口路径')}
                                            maxLength={255}
                                        />
                                    </Form.Item>
                                    <Button
                                        onClick={() => {
                                            combinPath()
                                        }}
                                        className={styles.autoNameButton}
                                        disabled={!serviceName}
                                    >
                                        {__('通过接口名称生成')}
                                    </Button>
                                </div>
                            )
                        }}
                    </Form.Item>
                    <DataOwnerCompositeComponent
                        form={form}
                        componentsConfig={dataCompositeConfigs}
                        defaultDomainId={
                            defaultServiceInfo?.subject_domain_id instanceof
                            Array
                                ? defaultServiceInfo?.subject_domain_id?.[1] ||
                                  null
                                : null
                        }
                        numberPerLine={[12, 12, 12, 12, 12]}
                    />
                    {ModeType === 'registry' ? (
                        <Row gutter={40}>
                            <Col span={12}>
                                <Form.Item
                                    name="backend_service_host"
                                    label={__('后台服务域名/IP')}
                                    required
                                    validateFirst
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                __('请输入后台服务域名/IP'),
                                        },
                                        {
                                            validateTrigger: [
                                                'onBlur',
                                                'onChange',
                                            ],
                                            validator: checkHostCurrent,
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={__(
                                            '请输入后台服务域名/IP',
                                        )}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="backend_service_path"
                                    label={__('后台服务路径')}
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择后台服务路径'),
                                        },
                                        {
                                            pattern: pathNameReg,
                                            message: __(
                                                '仅支持英文数字、键盘上的特殊符号，必须以/开头',
                                            ),
                                            transform: (value) => trim(value),
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={__('请选择后台服务路径')}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    ) : null}
                </div>
                {categorys?.length > 0 ? (
                    <FormTitle title={__('服务分类')} />
                ) : null}
                <div className={styles.formInfoContent}>
                    <CategorySelects
                        form={form}
                        formName="category_info"
                        gutter={40}
                        scopeModuleCategory={ScopeModuleCategory.Interface}
                        updateCategorys={setCategorys}
                        initData={defaultServiceInfo?.category_info}
                        applyScopeId="00000000-0000-0000-0000-000000000001"
                    />
                </div>
                <FormTitle title={__('接口定义')} />
                <div className={styles.formInfoContent}>
                    <Row gutter={40}>
                        <Col span={12}>
                            <Form.Item
                                name="http_method"
                                label={__('请求方式')}
                                initialValue="post"
                                required
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择请求方式'),
                                    },
                                ]}
                            >
                                <Select
                                    notFoundContent={__('暂无数据')}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                    placeholder={__('请选择')}
                                    options={[
                                        {
                                            value: 'post',
                                            label: 'POST',
                                        },
                                        {
                                            value: 'get',
                                            label: 'GET',
                                        },
                                        {
                                            value: 'put',
                                            label: 'PUT',
                                        },
                                        {
                                            value: 'delete',
                                            label: 'DELETE',
                                        },
                                    ].filter((item) =>
                                        ModeType === 'registry'
                                            ? true
                                            : item.value !== 'put' &&
                                              item.value !== 'delete',
                                    )}
                                />
                            </Form.Item>
                        </Col>
                        {/* <Col span={12}>
                            <Form.Item
                                name="return_type"
                                label={__('返回类型')}
                                initialValue="json"
                                required
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择返回类型'),
                                    },
                                ]}
                            >
                                <Select
                                    notFoundContent={__('暂无数据')}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                    placeholder={__('请选择')}
                                    options={[
                                        {
                                            value: 'json',
                                            label: 'JSON',
                                        },
                                    ]}
                                    open={false}
                                    showArrow={false}
                                />
                            </Form.Item>
                        </Col> */}
                    </Row>
                    {/* <Row gutter={40}>
                        <Col span={12}>
                            <Form.Item
                                name="protocol"
                                label={__('协议')}
                                initialValue="http"
                                required
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择协议类型'),
                                    },
                                ]}
                            >
                                <Select
                                    notFoundContent={__('暂无数据')}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                    placeholder={__('请选择')}
                                    options={[
                                        {
                                            value: 'http',
                                            label: 'HTTP',
                                        },
                                    ]}
                                    open={false}
                                    showArrow={false}
                                />
                            </Form.Item>
                        </Col>
                    </Row> */}
                    {ModeType === 'registry' ? (
                        <Form.Item name="file" label={__('接口文档')}>
                            <UploadFile
                                url="/api/data-application-service/v1/files"
                                titles={[
                                    __(
                                        '支持格式doc、docx、xls、xlsx、ppt、pptx、pdf，大小不得超过10MB',
                                    ),
                                    __('只能上传一个文件'),
                                ]}
                                accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf"
                                limitSize={10 * 1024 * 1024}
                                maxCount={1}
                            />
                        </Form.Item>
                    ) : null}
                    {/* <Row gutter={40}>
                    <Col span={12}>
                        <Form.Item
                            name="interface_type"
                            label={__('接口类型')}
                            initialValue="query"
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择接口类型'),
                                },
                            ]}
                        >
                            <Select
                                notFoundContent={__('暂无数据')}
                                getPopupContainer={(node) => node.parentNode}
                                placeholder={__('请选择')}
                                options={[
                                    {
                                        value: 'query',
                                        label: __('查询接口'),
                                    },
                                    {
                                        value: 'verify',
                                        label: __('核验接口'),
                                    },
                                    {
                                        value: 'push',
                                        label: __('订阅推送'),
                                    },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="network_region"
                            label={__('网络区域')}
                            initialValue="gov_intranet"
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择网络区域'),
                                },
                            ]}
                        >
                            <Select
                                notFoundContent={__('暂无数据')}
                                getPopupContainer={(node) => node.parentNode}
                                placeholder={__('请选择')}
                                options={[
                                    {
                                        value: 'gov_intranet',
                                        label: __('政务内网'),
                                    },
                                    {
                                        value: 'gov_private',
                                        label: __('政务专网'),
                                    },
                                    {
                                        value: 'gov_internet',
                                        label: __('政务外网'),
                                    },
                                    {
                                        value: 'internet',
                                        label: __('公网'),
                                    },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                </Row> */}
                    <Form.Item
                        name="description"
                        label={__('接口说明')}
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
                        <Input.TextArea
                            placeholder={__('请输入接口说明')}
                            style={{
                                height: `76px`,
                                resize: 'none',
                            }}
                            maxLength={255}
                        />
                    </Form.Item>
                </div>
                <FormTitle title={__('接口拓展信息')} />
                <div className={styles.formInfoContent}>
                    {/* <Row gutter={40}>
                    <Col span={12}>
                        
                        <Form.Item name="developer" label={__('开发商名称')}>
                            <Select
                                notFoundContent={__('暂无数据')}
                                getPopupContainer={(node) => node.parentNode}
                                placeholder={__('请选择')}
                                options={developerOptions}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="service_instance"
                            label={__('服务实例')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择服务案例'),
                                },
                            ]}
                            initialValue="default_instance"
                        >
                            <Select
                                notFoundContent={__('暂无数据')}
                                getPopupContainer={(node) => node.parentNode}
                                placeholder={__('请选择')}
                                options={[
                                    {
                                        value: 'default_instance',
                                        label: __('默认实例'),
                                    },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                </Row> */}
                    <Form.Item name="developer" label={__('开发商名称')}>
                        <Select
                            notFoundContent={__('暂无数据')}
                            getPopupContainer={(node) => node.parentNode}
                            placeholder={__('请选择开发商名称')}
                            options={developerOptions}
                            allowClear
                        />
                    </Form.Item>

                    <Row gutter={40}>
                        <Col span={12}>
                            <Form.Item
                                name="rate_limiting"
                                label={
                                    <div>
                                        {__('调用频率')}{' '}
                                        <Tooltip
                                            placement="top"
                                            title={__('“0”表示不限制调用频率')}
                                        >
                                            <QuestionCircleOutlined
                                                style={{ marginLeft: '4px' }}
                                            />
                                        </Tooltip>
                                    </div>
                                }
                                required
                                validateTrigger={['onChange', 'onBlur']}
                                validateFirst
                                rules={[
                                    {
                                        required: true,
                                        message: __('输入不能为空'),
                                    },
                                ]}
                            >
                                <NumberInput
                                    placeholder={__('请输入调用频率')}
                                    addonAfter={__('次/秒')}
                                    type={NumberType.Natural}
                                    min={0}
                                    max={100000}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="timeout"
                                label={
                                    // <div>
                                    //     {__('超时时间')}
                                    //     <Tooltip
                                    //         placement="top"
                                    //         title={__('“0”表示不限制调用频率')}
                                    //     >
                                    //         <QuestionCircleOutlined
                                    //             style={{ marginLeft: '4px' }}
                                    //         />
                                    //     </Tooltip>
                                    // </div>
                                    __('超时时间')
                                }
                                required
                                validateTrigger={['onChange', 'onBlur']}
                                validateFirst
                                rules={[
                                    {
                                        required: true,
                                        message: __('输入不能为空'),
                                    },
                                ]}
                            >
                                <NumberInput
                                    placeholder={__('请输入超时时间')}
                                    addonAfter={__('秒')}
                                    type={NumberType.Natural}
                                    min={1}
                                    max={86400}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/* <Form.Item name="market_publish" initialValue="yes" noStyle>
                    <ServiceMarket />
                </Form.Item> */}
                </div>
            </Form>

            <ChooseBizTable
                title={__('选择库表')}
                visible={bizChooseVisible}
                onClose={() => setBizChooseVisible(false)}
                checked={
                    datasheetValidateInfo?.message ? undefined : checkedNode
                }
                onSure={handleDataViewSure}
            />
        </>
    )
}

export default BasicInfoForm
