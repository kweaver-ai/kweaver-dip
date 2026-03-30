import {
    Button,
    Divider,
    Drawer,
    Form,
    Input,
    InputNumber,
    Select,
    Space,
    Tooltip,
} from 'antd'
import { FC, useEffect, useState } from 'react'
import { useDebounce } from 'ahooks'
import { pinyin } from 'pinyin-pro'
import { trim } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { InfoCircleOutlined } from '@ant-design/icons'
import styles from '../styles.module.less'
import __ from '../locale'
import {
    checkoutAppName,
    checkoutPassIdName,
    findDataByValue,
    FormConfigInfo,
    FormConfigInfoOfCS,
    PasswordModel,
    PermissionsOptions,
    reFormatDataToForm,
} from '../const'
import PasswordEditor from './PasswordEditor'

import { getPlatformNumber, invalidCharsRegex } from '@/utils'
import BlockContainer from '../BlockContainer'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import {
    allRoleList,
    AppTypeEnum,
    formatError,
    getAppsDetail,
    getObjectDetails,
    getUserListByPermission,
    LoginPlatform,
    reqInfoSystemList,
} from '@/core'
import { AvatarOutlined, FontIcon } from '@/icons'
import { getDictData } from '../mock'
import DepartmentAndOrgSelect from '../../DepartmentAndOrgSelect'
import { Loader } from '@/ui'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { IconType } from '@/icons/const'

/**
 * 配置表单的属性接口
 *
 * 该接口定义了配置表单组件所需的属性，包括表单的唯一标识符、开启状态、账户标识符，
 * 以及关闭和确认表单的回调函数
 */
interface ConfigFormProps {
    // 表单的唯一标识符，可选
    appId?: string
    // 表单的开启状态，必填
    open: boolean
    // 账户标识符，可选
    accountId?: string
    // 关闭表单的回调函数，必填
    onClose: () => void
    // 确认表单的回调函数，必填
    onConfirm: (data) => void

    // 是否是系统管理员
    isSystemManger?: boolean
    isCS?: boolean
}
// 定义一个React无状态函数组件ConfigForm，用于显示配置表单
const ConfigForm: FC<ConfigFormProps> = ({
    appId,
    open,
    accountId,
    onClose,
    onConfirm,
    isSystemManger = false,
    isCS = false,
}) => {
    // 使用Form的hook来管理表单
    const [form] = Form.useForm()
    // 定义一个用于编辑密码的状态变量，初始状态为创建密码
    const [editPasswordModel, setEditPasswordModel] = useState<PasswordModel>(
        PasswordModel.CREATE,
    )
    const [loading, setLoading] = useState<boolean>(true)

    // 使用useGeneralConfig钩子获取通用配置，主要包含当前使用的配置和政府模式开关
    const [{ using, governmentSwitch, local_app }] = useGeneralConfig()

    const platform = getPlatformNumber()

    // 定义一个用于政府模式状态的变量，初始值为false，表示政府模式未开启
    const [governmentStatus, setGovernmentStatus] = useState<boolean>(false)

    const [systemsOptions, setSystemsOptions] = useState<Array<any>>([])

    const [appDevelopersOptions, setAppDevelopersOptions] = useState<
        Array<any>
    >([])

    const [filterKeys, setFilterKeys] = useState<Array<string>>([
        appId ? '' : 'token',
    ])

    // 应用领域
    const [appAreaOptions, setAppAreaOptions] = useState<Array<any>>([])

    // 应用范围
    const [appRangeOptions, setAppRangeOptions] = useState<Array<any>>([])

    // 定义一个状态变量 defaultOrg，用于存储默认组织的信息，初始值为空字符串
    const [defaultOrg, setDefaultOrg] = useState<string>('')

    // 定义一个状态变量 systemSearchKey，用于存储系统搜索的关键字，初始值为空字符串
    const [systemSearchKey, setSystemSearchKey] = useState<string>('')

    // 使用 useDebounce Hook 对 systemSearchKey 进行防抖处理，等待时间为500毫秒
    // 这是为了避免快速连续搜索，提高系统搜索的效率和稳定性
    const debounceSystemKey = useDebounce(systemSearchKey, {
        wait: 500,
    })

    // 定义一个状态变量 developerSearchKey，用于存储开发者搜索的关键字，初始值为空字符串
    const [developerSearchKey, setDeveloperSearchKey] = useState<string>('')

    // 使用 useDebounce Hook 对 developerSearchKey 进行防抖处理，等待时间为500毫秒
    // 同样是为了避免快速连续搜索，提高开发者搜索的效率和稳定性
    const debounceDeveloperKey = useDebounce(developerSearchKey, {
        wait: 500,
    })

    const [expandStatus, setExpandStatus] = useState<boolean>(false)

    const [appInfo, setAppInfo] = useState<any>()

    const [userInfo] = useCurrentUser()

    // 当 "using" 或 "governmentSwitch" 值改变时执行副作用
    useEffect(() => {
        // 检查 "using" 的值和 "governmentSwitch" 的状态，以确定启用政府模式
        if (using === 1 && governmentSwitch.on) {
            setGovernmentStatus(true)
            // 如果当前账户id 不存在，开关为关闭
        }
    }, [using, governmentSwitch, appInfo])

    useEffect(() => {
        getAppDevelopers(debounceDeveloperKey)
    }, [debounceDeveloperKey])

    useEffect(() => {
        getSystems(debounceSystemKey)
    }, [debounceSystemKey])

    useEffect(() => {
        if (appId) {
            getAppInfoDetail(appId)
        } else {
            setLoading(false)
        }
    }, [appId])

    useEffect(() => {
        if (governmentStatus || isCS) {
            getAreaRangeOptions()
        }
    }, [governmentStatus, isCS])

    /**
     * 异步获取区域和范围的选项数据
     *
     * 本函数通过调用getDictData函数从远程获取字典数据，然后处理这些数据来设置应用的区域和范围选项
     * 使用map方法来映射获取的数据，以便于在用户界面中使用下拉选择框展示
     * 如果获取数据失败，将调用formatError函数来处理错误
     */
    const getAreaRangeOptions = async () => {
        try {
            // 调用getDictData函数获取字典数据
            const res = await getDictData()

            // 设置应用区域选项，将获取的area_name数据映射为label和value形式
            setAppAreaOptions(
                res?.area_name?.map((item) => ({
                    label: item.value,
                    value: item.id,
                })) || [],
            )

            // 设置应用范围选项，将获取的range_name数据映射为label和value形式
            setAppRangeOptions(
                res?.range_name?.map((item) => ({
                    label: item.value,
                    value: item.id,
                })) || [],
            )
        } catch (err) {
            // 如果发生错误，调用formatError函数进行处理
            formatError(err)
        }
    }

    useEffect(() => {
        if (appInfo) {
            checkDetailAttrExist()
        }
    }, [appInfo, appDevelopersOptions, systemsOptions])

    const checkDetailAttrExist = () => {
        if (
            appInfo?.application_developer?.id &&
            !appDevelopersOptions.find(
                (item) => item.value === appInfo?.application_developer?.id,
            )
        ) {
            form.setFields([
                {
                    name: 'application_developer_id',
                    errors: [
                        __(
                            '所选的用户已不再具备“应用开发者”角色，请进行更换。',
                        ),
                    ],
                    value: undefined,
                },
            ])
        } else {
            form.setFields([
                {
                    name: 'application_developer_id',
                    errors: [],
                    value: appInfo?.application_developer?.id || undefined,
                },
            ])
        }
        if (
            appInfo?.info_systems?.id &&
            !systemsOptions.find(
                (item) => item.value === appInfo?.info_systems?.id,
            )
        ) {
            form.setFields([
                {
                    name: 'info_system_id',
                    errors: [
                        __('所选的信息系统已不存在，可重新选择（非必填）'),
                    ],
                    value: undefined,
                },
            ])
        } else {
            form.setFields([
                {
                    name: 'info_system_id',
                    errors: [],
                    value: appInfo?.info_systems?.id || undefined,
                },
            ])
        }
    }
    /**
     * 异步获取应用详细信息
     * @param id 应用的唯一标识符
     */
    const getAppInfoDetail = async (id) => {
        try {
            // 尝试根据应用ID获取应用信息详情
            const res = await getAppsDetail(id, { version: 'editing' })
            const { province_app_info, ...other } = res

            setAppInfo(res)
            if (res?.account_name) {
                setEditPasswordModel(PasswordModel.VIEW)
            }
            if (governmentSwitch?.on || isCS) {
                form.setFieldsValue(reFormatDataToForm(res, true, isCS))
                if (province_app_info?.org_info?.department_id) {
                    setDefaultOrg(province_app_info?.org_info?.department_id)
                }
            } else {
                form.setFieldsValue(reFormatDataToForm(res, false, isCS))
            }
            setLoading(false)
        } catch (err) {
            // 处理可能发生的错误
            formatError(err)
            setLoading(false)
        }
    }

    /**
     * 异步获取系统列表
     *
     * 此函数通过发送异步请求来获取信息系统的列表，并将这些信息系统的名称和ID
     * 映射为选项，设置到系统选项中如果请求失败，将格式化错误信息
     *
     * 参数: 无
     * 返回值: 无
     */
    const getSystems = async (keyword) => {
        try {
            // 发起请求，获取信息系统列表，限制为2000条，从第一条开始
            const res = await reqInfoSystemList({
                limit: 2000,
                offset: 1,
                keyword,
                is_register_gateway: isCS ? true : undefined,
            })

            // 将获取的系统列表映射为选项，每个选项包含系统名称和ID
            // 如果响应中没有entries字段，则使用空数组
            setSystemsOptions(
                res.entries?.map((item) => ({
                    label: item.name,
                    value: item.id,
                    department_id: item.department_id,
                })) || [],
            )
        } catch (error) {
            // 如果发生错误，格式化并处理错误信息
            formatError(error)
        }
    }
    /**
     * 异步函数 getAppDevelopers，用于获取应用开发者的列表
     * 该函数通过调用 getUserListByPermission 方法，以 ApplicationDeveloper 角色为条件，获取相关用户列表
     * 然后将这些用户转换为可供选择的选项格式，并更新应用开发者选项
     */
    const getAppDevelopers = async (keyword) => {
        try {
            // 发起请求，获取信息系统列表，限制为2000条，从第一条开始
            const res = await getUserListByPermission({
                innerRoleId: allRoleList.ApplicationDeveloper,
            })

            // 将获取的系统列表映射为选项，每个选项包含系统名称和ID
            // 如果响应中没有entries字段，则使用空数组
            setAppDevelopersOptions(
                res.entries?.map((item) => ({
                    label: (
                        <div className={styles.optionItem}>
                            <span className={styles.userIcon}>
                                <AvatarOutlined className={styles.icon} />
                            </span>

                            <span className={styles.text} title={item.name}>
                                {item.name}
                            </span>
                        </div>
                    ),
                    value: item.id,
                    name: item.name,
                })) || [],
            )
        } catch (error) {
            // 如果发生错误，格式化并处理错误信息
            formatError(error)
        }
    }

    const getFirstLetters = (str: string) => {
        const reg = /[\u4e00-\u9fa5]/g
        const result = str?.replace(reg, (match) => {
            return pinyin(match, {
                pattern: 'first',
                nonZh: 'consecutive',
                toneType: 'none',
            })
        })
        // 只保留数字和英文字母，并限制为128位
        const filteredResult = result?.replace(/[^a-zA-Z0-9]/g, '') || ''
        return filteredResult.substring(0, 128).toLocaleLowerCase()
    }

    // 定义模板配置对象，用于配置表单的各个字段
    const TemplateConfig = {
        // 应用名称的配置项
        name: (
            <Form.Item
                name="name"
                label={__('应用名称')}
                required
                validateTrigger={['onBlur', 'onChange']}
                rules={[
                    {
                        required: true,
                        message: __('请输入应用名称'),
                        transform: (value) => trim(value),
                    },

                    {
                        validateTrigger: ['onBlur'],
                        validator: (ruler, value) => {
                            // 调用接口做重名检查
                            if (trim(value)) {
                                return checkoutAppName(trim(value), appInfo?.id)
                            }
                            return Promise.resolve()
                        },
                    },
                ]}
            >
                <Input
                    placeholder={__('请输入应用名称')}
                    maxLength={32}
                    onChange={(e) => {
                        form.setFieldsValue({
                            pass_id: e.target.value
                                ? getFirstLetters(e.target.value)
                                : undefined,
                        })
                    }}
                />
            </Form.Item>
        ),
        pass_id: (
            <Form.Item
                name="pass_id"
                label="PassID"
                required
                validateTrigger={['onBlur', 'onChange']}
                rules={[
                    {
                        required: true,
                        message: __('请输入'),
                        transform: (value) => trim(value),
                    },
                    {
                        pattern: /^[a-z0-9]+$/,
                        message: __('PassID只能包含小写英文字母和数字'),
                    },
                    {
                        validateTrigger: ['onBlur', 'onChange'],
                        validator: (ruler, value) => {
                            if (trim(value)) {
                                return checkoutPassIdName(
                                    trim(value),
                                    appInfo?.id,
                                )
                            }
                            return Promise.resolve()
                        },
                    },
                ]}
            >
                <Input placeholder={__('请输入')} maxLength={128} />
            </Form.Item>
        ),
        token: (
            <Form.Item
                name="token"
                label={
                    <div>
                        Token
                        <Button
                            type="link"
                            style={{ marginLeft: 400 }}
                            onClick={() => {
                                const newToken = uuidv4().split('-').join('')
                                form.setFieldsValue({ token: newToken })
                            }}
                        >
                            {__('重新生成Token')}
                        </Button>
                    </div>
                }
                required
                validateTrigger={['onBlur', 'onChange']}
                rules={[
                    {
                        required: true,
                        message: __('请输入'),
                        transform: (value) => trim(value),
                    },
                ]}
            >
                <Input placeholder={__('请输入')} disabled />
            </Form.Item>
        ),
        app_type: (
            <Form.Item
                name="app_type"
                label={__('应用类型')}
                required
                validateTrigger={['onBlur', 'onChange']}
                rules={[
                    {
                        required: true,
                        message: __('请选择应用类型'),
                        transform: (value) => trim(value),
                    },
                ]}
            >
                <Select placeholder={__('请选择应用类型')}>
                    <Select.Option value={AppTypeEnum.NON_MICRO_TYPE}>
                        {__('非微应用')}
                    </Select.Option>
                    <Select.Option value={AppTypeEnum.MICRO_TYPE}>
                        {__('微应用')}
                    </Select.Option>
                </Select>
            </Form.Item>
        ),
        ip_addr: (
            <Form.List name="ip_addr" initialValue={[{ ip: '', port: '' }]}>
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }, fIndex) => {
                            return (
                                <Space
                                    key={key}
                                    style={{ display: 'flex' }}
                                    align="center"
                                    className={styles.ipAndPortItems}
                                >
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'ip']}
                                        label="IP"
                                        labelCol={{ span: 24 }}
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请输入'),
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder={__('请输入')}
                                            style={{ width: 240 }}
                                            maxLength={30}
                                        />
                                    </Form.Item>
                                    <div style={{ width: 16 }}>
                                        <Divider
                                            style={{ borderColor: '#D9D9D9' }}
                                        />
                                    </div>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'port']}
                                        label={__('端口')}
                                        labelCol={{ span: 24 }}
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请输入'),
                                            },
                                        ]}
                                    >
                                        <InputNumber
                                            placeholder={__('请输入')}
                                            style={{ width: 240 }}
                                            maxLength={16}
                                        />
                                    </Form.Item>
                                    {fIndex + 1 === fields.length &&
                                    fields.length > 1 ? (
                                        <FontIcon
                                            name="icon-jian1"
                                            type={IconType.FONTICON}
                                            style={{
                                                marginTop: 8,
                                                color: 'rgba(0, 0, 0, 0.45)',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => remove(name)}
                                        />
                                    ) : (
                                        <div />
                                    )}
                                </Space>
                            )
                        })}
                        <Form.Item style={{ marginTop: -20 }}>
                            <Button type="link" onClick={() => add()}>
                                +{__('添加')}
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>
        ),
        // 应用描述的配置项
        description: (
            <Form.Item name="description" label={__('应用描述')}>
                <Input.TextArea
                    maxLength={64}
                    className={styles.textArea}
                    placeholder={__('请输入应用描述')}
                    showCount
                    autoSize
                />
            </Form.Item>
        ),
        // 账户名称的配置项
        account_name: (
            <Form.Item
                name="account_name"
                label={__('账户名称')}
                validateTrigger={['onBlur', 'onChange']}
                required
                rules={[
                    { required: true, message: __('请输入账户名称') },
                    {
                        pattern: invalidCharsRegex,
                        message: __(
                            '账户名称不能包含 空格 或  / : * ? " < > | 特殊字符',
                        ),
                        transform: (value) => trim(value),
                    },
                    // {
                    //     validateTrigger: ['onBlur'],
                    //     validator: (ruler, value) => {
                    //         // 调用接口做重名检查
                    //         if (trim(value)) {
                    //             return checkoutAccountName(
                    //                 trim(value),
                    //                 accountId,
                    //             )
                    //         }
                    //         return Promise.resolve()
                    //     },
                    // },
                ]}
            >
                <Input placeholder={__('请输入账户名称')} maxLength={128} />
            </Form.Item>
        ),
        // 密码的配置项
        password: (
            <PasswordEditor
                type={editPasswordModel}
                onChangeModel={setEditPasswordModel}
                form={form}
            />
        ),

        // 账户ID的显示项，根据id参数决定显示内容
        account_id: (
            <div className={styles.accountIdWrapper}>
                <span>{__('账户ID：')}</span>
                {appInfo?.account_id ? (
                    <span>{appInfo?.account_id}</span>
                ) : (
                    <span className={styles.create}>
                        {__('无需填写，创建成功后自动生成')}
                    </span>
                )}
            </div>
        ),
        // 权限范围的配置项
        authority_scope: (
            <Form.Item name="authority_scope" label={__('权限范围')}>
                <Select
                    placeholder={__('请选择权限范围')}
                    mode="tags"
                    options={PermissionsOptions.map((item) => ({
                        label: (
                            <div className={styles.selectOption}>
                                <div className={styles.itemLabel}>
                                    {item.label}
                                </div>
                                <div className={styles.itemDescription}>
                                    {item.description}
                                </div>
                            </div>
                        ),
                        value: item.value,
                        name: item.label,
                    }))}
                    optionLabelProp="name"
                />
            </Form.Item>
        ),
        // 注册ID
        app_id: (
            <div className={styles.accountIdWrapper}>
                <span>{__('注册ID：')}</span>
                {appInfo?.province_app_info?.app_id ? (
                    <span>{appInfo?.province_app_info?.app_id}</span>
                ) : (
                    <span className={styles.create}>
                        {__('无需填写，创建成功后自动生成')}
                    </span>
                )}
            </div>
        ),
        // 注册key
        access_key: (
            <div className={styles.accountIdWrapper}>
                <span>Key：</span>
                {appInfo?.province_app_info?.access_key ? (
                    <span>{appInfo?.province_app_info?.access_key}</span>
                ) : (
                    <span className={styles.create}>
                        {__('无需填写，创建成功后自动生成')}
                    </span>
                )}
            </div>
        ),
        access_secret: (
            <div className={styles.accountIdWrapper}>
                <span>Secret：</span>
                {appInfo?.province_app_info?.access_secret ? (
                    <span>{appInfo?.province_app_info?.access_secret}</span>
                ) : (
                    <span className={styles.create}>
                        {__('无需填写，创建成功后自动生成')}
                    </span>
                )}
            </div>
        ),
        province_url: (
            <Form.Item
                name="province_url"
                label="URL"
                required
                rules={[{ required: true, message: __('请输入URL') }]}
            >
                <Input placeholder={__('请输入URL')} maxLength={300} />
            </Form.Item>
        ),
        province_ip: (
            <Form.Item
                name="province_ip"
                label="IP"
                required
                rules={[{ required: true, message: __('请输入IP') }]}
            >
                <Input
                    placeholder={__('请输入IP')}
                    maxLength={30}
                    disabled={isCS}
                />
            </Form.Item>
        ),
        contact_name: (
            <Form.Item
                name="contact_name"
                label={__('联系人姓名')}
                required
                rules={[{ required: true, message: __('请输入联系人姓名') }]}
            >
                <Input placeholder={__('请输入联系人姓名')} maxLength={100} />
            </Form.Item>
        ),
        contact_phone: (
            <Form.Item
                name="contact_phone"
                label={__('联系方式')}
                required
                rules={[{ required: true, message: __('请输入联系方式') }]}
            >
                <Input placeholder={__('请输入联系方式')} maxLength={50} />
            </Form.Item>
        ),
        area_id: (
            <Form.Item
                name="area_id"
                label={__('应用领域')}
                required
                rules={[{ required: true, message: __('请选择应用领域') }]}
            >
                <Select
                    placeholder={__('请选择应用领域')}
                    options={appAreaOptions}
                />
            </Form.Item>
        ),
        range_id: (
            <Form.Item
                name="range_id"
                label={__('应用范围')}
                required
                rules={[{ required: true, message: __('请选择应用范围') }]}
            >
                <Select
                    placeholder={__('请选择应用范围')}
                    options={appRangeOptions}
                />
            </Form.Item>
        ),

        deploy_place: (
            <Form.Item name="deploy_place" label={__('部署地点')}>
                <Input placeholder={__('请输入部署地点')} maxLength={100} />
            </Form.Item>
        ),

        has_resource: (
            <div className={styles.displayFormItemWrapper}>
                <div>{__('可用资源：')}</div>
                {appInfo?.has_resource ? (
                    <div>
                        <div>
                            <span>{__('已授权可用资源')}</span>
                            <Tooltip
                                placement="bottomLeft"
                                title={
                                    <div>
                                        <div>
                                            {__(
                                                '1、可用资源由资源的数据 Owner 进行授权。若配置了权限申请审核策略，则“应用开发者”也可以从数据服务超市申请资源。',
                                            )}
                                        </div>
                                        <div>
                                            {__(
                                                '2、您可在【我的】查看应用的可用资源详情。',
                                            )}
                                        </div>
                                    </div>
                                }
                                color="#fff"
                                overlayInnerStyle={{
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                                overlayStyle={{ maxWidth: 650 }}
                                arrowPointAtCenter
                            >
                                <InfoCircleOutlined
                                    style={{
                                        color: 'rgba(0, 0, 0, 0.65)',
                                        marginLeft: 8,
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </div>
                ) : (
                    <div>
                        <span>{__('暂无')}</span>
                        <Tooltip
                            placement="bottomLeft"
                            title={
                                <div>
                                    <div>
                                        {__(
                                            '1、可用资源由资源的数据 Owner 进行授权。若配置了权限申请审核策略，则“应用开发者”也可以从数据服务超市申请资源。',
                                        )}
                                    </div>
                                    <div>
                                        {__(
                                            '2、您可在【我的】查看应用的可用资源详情。',
                                        )}
                                    </div>
                                </div>
                            }
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                            }}
                            overlayStyle={{ maxWidth: 650 }}
                            arrowPointAtCenter
                        >
                            <InfoCircleOutlined
                                style={{
                                    color: 'rgba(0, 0, 0, 0.65)',
                                    marginLeft: 8,
                                }}
                            />
                        </Tooltip>
                    </div>
                )}
            </div>
        ),
        application_developer_id: appId ? (
            <Form.Item
                shouldUpdate={(prev, current) =>
                    userInfo?.ID &&
                    userInfo.ID !== current.application_developer_id
                }
                noStyle
            >
                {({ getFieldValue }) => {
                    const application_developer_id = getFieldValue(
                        'application_developer_id',
                    )
                    return (
                        <div className={styles.formItemWrapper}>
                            <Form.Item
                                name="application_developer_id"
                                label={__('应用开发者（管理者）')}
                                style={
                                    application_developer_id &&
                                    userInfo.ID !== application_developer_id
                                        ? { marginBottom: 0 }
                                        : {}
                                }
                                required
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择应用开发者'),
                                    },
                                ]}
                            >
                                <Select
                                    placeholder={__('请选择应用开发者')}
                                    options={appDevelopersOptions}
                                    showSearch
                                    filterOption={false}
                                    onSearch={(keyword) => {
                                        setDeveloperSearchKey(keyword)
                                    }}
                                />
                            </Form.Item>
                            {application_developer_id &&
                                userInfo.ID !== application_developer_id && (
                                    <div className={styles.developerMessage}>
                                        {__(
                                            '更改人员后，将由新的应用开发者来管理应用，此应用将从您的管理列表移除',
                                        )}
                                    </div>
                                )}
                        </div>
                    )
                }}
            </Form.Item>
        ) : (
            <div className={styles.developerWrapper}>
                <span className={styles.label}>
                    {__('应用开发者（管理者）：')}
                </span>
                <span title={userInfo.VisionName} className={styles.name}>
                    {userInfo.VisionName}
                </span>
            </div>
        ),
        info_system_id: (
            <Form.Item
                name="info_system_id"
                label={__('信息系统')}
                required
                rules={[{ required: true, message: __('请选择信息系统') }]}
            >
                <Select
                    placeholder={__('请选择信息系统')}
                    options={systemsOptions}
                    allowClear
                    showSearch
                    filterOption={false}
                    onSearch={(keyword) => {
                        setSystemSearchKey(keyword)
                    }}
                />
            </Form.Item>
        ),

        department_id: (
            <Form.Item
                name="department_id"
                label={__('所属部门')}
                required
                rules={[
                    {
                        required: true,
                        message: __('请选择所属部门'),
                    },
                ]}
            >
                <DepartmentAndOrgSelect
                    defaultValue={defaultOrg}
                    getInitValueError={(errorMessage) => {
                        form?.setFields([
                            {
                                name: 'department_id',
                                errors: [errorMessage],
                                value: null,
                            },
                        ])
                    }}
                    disabled={isCS}
                />
            </Form.Item>
        ),

        org_code: (
            <Form.Item
                name="org_code"
                label={__('所属部门编码')}
                required
                rules={[{ required: true, message: __('请输入所属部门编码') }]}
            >
                <Input
                    placeholder={__('请输入所属部门编码')}
                    maxLength={128}
                    disabled={isCS}
                />
            </Form.Item>
        ),
    }

    /**
     * 根据类型生成表单块标题
     * 此函数用于根据不同的类型生成带有特定工具提示的标题，以及一个用于切换的开关
     * 主要用于展示不同部分的表单标题，并提供一个开关来控制对应部分的状态
     *
     * @param type 表单块的类型，用于决定标题的内容和相关的工具提示信息
     * @param title 默认的标题文本，当类型不匹配任何已定义的类型时使用
     * @returns 返回一个 React 元素，根据类型展示不同的标题和工具提示，或返回默认标题
     */
    const formBlockTitle = (type: string, title: string) => {
        switch (type) {
            case 'auth_info':
                // 当类型为 'auth_info' 时，返回授权信息的标题和相关的工具提示，以及一个开关
                return (
                    <div className={styles.titleWrapper}>
                        <div>
                            <span>{title}</span>
                            <Tooltip
                                placement="bottomLeft"
                                title={__(
                                    '开发者使用应用账号进行认证后，可调用应用内可用资源的 OpenAPI 接口。',
                                )}
                                color="#fff"
                                overlayInnerStyle={{
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                                overlayStyle={{ maxWidth: 650 }}
                                arrowPointAtCenter
                            >
                                <InfoCircleOutlined
                                    style={{
                                        color: 'rgba(0, 0, 0, 0.65)',
                                        marginLeft: 8,
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </div>
                )
            case 'province_app_info':
                // 当类型为 'province_registry' 时，返回省平台注册信息的标题和相关的工具提示，以及一个开关
                return (
                    <div className={styles.titleWrapper}>
                        <div>
                            <span>{title}</span>
                            <Tooltip
                                placement="bottomLeft"
                                title={__(
                                    '应用注册到省平台后，可以为已注册应用申请省共享资源。',
                                )}
                                color="#fff"
                                overlayInnerStyle={{
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                                overlayStyle={{ maxWidth: 650 }}
                                arrowPointAtCenter
                            >
                                <InfoCircleOutlined
                                    style={{
                                        color: 'rgba(0, 0, 0, 0.65)',
                                        marginLeft: 8,
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </div>
                )
            default:
                // 当类型不匹配任何已定义的类型时，返回默认标题
                return title
        }
    }

    /**
     * 合并所有信息数据。
     * 该函数接收输入值，并结合来自不同选项的附加信息，返回一个包含综合信息的对象。
     *
     * @param values 输入值对象，包含系统、开发者、应用领域和应用范围等信息。
     * @returns 返回一个包含所有合并后信息的对象。
     */
    const combAllInfoData = (values) => {
        // 将输入值与来自不同选项的附加信息进行合并
        return {
            // 直接包含输入值中的所有属性和值
            ...values,
            // 根据 values 中的系统信息从系统选项中查找系统名称，并将其包含在结果中
            system_name: findDataByValue(values.info_system, systemsOptions)
                ?.label,
            // 根据 values 中的开发者信息从开发者选项中查找开发者名称，并将其包含在结果中
            developer_name: findDataByValue(
                values.developer,
                appDevelopersOptions,
            )?.name,
            // 根据 values 中的应用领域信息从应用领域选项中查找应用领域标签，并将其包含在结果中
            area_name: findDataByValue(values.area_id, appAreaOptions)?.label,
            // 根据 values 中的应用范围信息从应用范围选项中查找应用范围标签，并将其包含在结果中
            range_name: findDataByValue(values.range_id, appRangeOptions)
                ?.label,
        }
    }

    /**
     * 异步获取部门详情并更新表单字段
     * @param id 部门ID，用于查询特定部门的详细信息
     */
    const getDepartmentDetail = async (id: string) => {
        try {
            // 尝试根据ID获取部门详情
            const res = await getObjectDetails(id)

            // 如果响应中包含'uniform_credit_code'，则设置表单字段'org_code'的值
            if (res?.attributes?.uniform_credit_code) {
                form?.setFields([
                    {
                        name: 'org_code',
                        errors: [],
                        value: res.attributes.uniform_credit_code,
                    },
                ])
            }
            if (isCS) {
                form?.setFieldsValue({
                    org_code: res.dept_tag,
                })
            }
        } catch (err) {
            // 如果发生错误，执行错误格式化处理
            formatError(err)
        }
    }

    /**
     * 处理表单值的变化
     * @param {Object} values - 表单的值对象
     */
    const handleValuesChange = (values) => {
        // 获取表单的键
        const formKeys = Object.keys(values)

        // 检查是否存在'info_system_id'键
        if (formKeys.includes('info_system_id')) {
            // 根据'info_system_id'的值查找相关信息

            // 检查找到的信息中是否存在'department_id'
            if (values?.info_system_id) {
                updateOrgInfoBySystem(values.info_system_id)
            }
        }
        // 检查是否存在'department_id'键
        if (formKeys.includes('department_id') && values.department_id) {
            // 获取部门详细信息
            getDepartmentDetail(values.department_id)
        }
        if (formKeys.includes('ip_addr')) {
            // cs 默认取第一个IP
            if (
                platform !== LoginPlatform.default &&
                values.ip_addr[0] &&
                values.ip_addr[0].ip
            ) {
                form.setFieldsValue({
                    province_ip: values.ip_addr[0].ip,
                })
            }
        }
    }

    /**
     * 通过系统ID更新组织信息
     * @param systemId 系统ID，用于查找对应的组织信息
     */
    const updateOrgInfoBySystem = async (systemId: string) => {
        // 根据系统ID查找对应的组织信息
        const info_system = findDataByValue(systemId, systemsOptions)
        // 设置hasFromSystemOrg状态为true，表示组织信息来源于系统
        if (info_system.department_id) {
            // 设置默认org_id为查找到的组织ID
            setDefaultOrg(info_system.department_id)
            // 设置表单字段'org_id'的值为部门ID，以关联组织信息
            form?.setFields([
                {
                    name: 'department_id',
                    errors: [],
                    value: info_system.department_id,
                },
            ])

            // 获取并展示部门的详细信息
            getDepartmentDetail(info_system.department_id)
        }
    }

    // 返回配置表单的UI结构
    return (
        <Drawer
            open={open}
            title={
                <span style={{ fontWeight: 550, fontSize: 16 }}>
                    {appId ? __('编辑应用') : __('新建应用')}
                </span>
            }
            onClose={onClose}
            maskClosable={false}
            width={640}
            footer={
                <div className={styles.drawerFootWrapper}>
                    <Space size={8}>
                        <Button onClick={onClose} className={styles.btn}>
                            {__('取消')}
                        </Button>
                        <Button
                            onClick={() => {
                                // 手动展开
                                setExpandStatus(true)
                                form.submit()
                            }}
                            type="primary"
                            className={styles.btn}
                            disabled={loading}
                        >
                            {__('确定')}
                        </Button>
                    </Space>
                </div>
            }
        >
            {loading ? (
                <div className={styles.loadingContainer}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.configFormWrapper}>
                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={(values) => {
                            onConfirm(combAllInfoData(values))
                        }}
                        onValuesChange={handleValuesChange}
                        autoComplete="off"
                        scrollToFirstError
                    >
                        <div className={styles.formContentWrapper}>
                            {(isCS
                                ? FormConfigInfoOfCS
                                : FormConfigInfo.filter((item) => {
                                      if (
                                          !governmentStatus &&
                                          item.key === 'province_app_info'
                                      ) {
                                          return false
                                      }
                                      if (
                                          !local_app &&
                                          item.key === 'auth_info'
                                      ) {
                                          return false
                                      }
                                      return true
                                  })
                            ).map((item, index) => {
                                return (
                                    <div key={index}>
                                        <BlockContainer
                                            title={formBlockTitle(
                                                item.key,
                                                item.title,
                                            )}
                                            handleExpandStatus={expandStatus}
                                            resetHandleExpandStatus={
                                                setExpandStatus
                                            }
                                        >
                                            {item.configItems
                                                .filter(
                                                    (current) =>
                                                        !filterKeys.includes(
                                                            current,
                                                        ),
                                                )
                                                .map(
                                                    (configItem) =>
                                                        TemplateConfig[
                                                            configItem
                                                        ],
                                                )}
                                        </BlockContainer>
                                    </div>
                                )
                            })}
                        </div>
                    </Form>
                </div>
            )}
        </Drawer>
    )
}

export default ConfigForm
