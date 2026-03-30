import {
    useEffect,
    useState,
    useImperativeHandle,
    forwardRef,
    useRef,
    useMemo,
} from 'react'
import {
    Form,
    Input,
    Row,
    Col,
    Select,
    Tooltip,
    Radio,
    TreeSelect,
    Anchor,
    Button,
    Tag,
    Alert,
} from 'antd'
import { isEqual, noop, trim, uniqBy, isString } from 'lodash'
import { DownOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import type { CustomTagProps } from 'rc-select/lib/BaseSelect'
import BusinessTagsSelect from '@/components/Forms/BusinessTagsSelect'
import styles from './styles.module.less'
import __ from './locale'
import {
    getInfoCatlgConflicts,
    formatError,
    getCategory,
    getApplyScopeConfig,
    getCurUserDepartment,
    getInfoRescCatlgAutoRelated,
    ICategoryItem,
    SystemCategory,
    getObjectDetails,
} from '@/core'
import {
    ErrorInfo,
    keyboardInputValidator,
    OperateType,
    useQuery,
    keyboardRegEnter,
} from '@/utils'
import {
    ShareTypeEnum,
    ShareModeEnum,
    OpenTypeEnum,
    updateCycleOptions,
    shareTypeList,
    shareModeList,
    openTypeList,
} from '../const'
import { LabelTitle } from '../Details/BasicInfo'
import { businFormRangeToDataRange, dataRangeOptions } from '../helper'
import { Architecture } from '@/components/BusinessArchitecture/const'
import { findNodeById } from '@/components/FormGraph/helper'

import { FontIcon } from '@/icons'
import SelectBusinFlow from './SelectBusinFlow'
import SelectBusinScene from './SelectBusinScene'
import {
    checkChangeIcon,
    invalidSelOptionVal,
    selectNullOption,
    validSelOptionIsDel,
} from './helper'
import SelectRescCatlg from './SelectRescCatlg'
import { sceneTypeList } from './SelectBusinScene/helper'
import SelectRelateInfo from './SelectRelateInfo'
import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'
import { IconType } from '@/icons/const'
import { useUserLocalStorage } from '@/hooks/useLocalStorage'
import ScrollLoadInfoSystemSelect from '@/components/ScrollLoadInfoSystemSelect'
import DepartmentAndOrgSelect from '@/components/DepartmentAndOrgSelect'

const { TextArea } = Input

export const tagRender = ({
    label,
    value,
    closable,
    onClose,
}: CustomTagProps) => (
    <Tooltip
        color="white"
        placement="top"
        overlayClassName="delTagWrapper"
        title={`${label}${
            value === invalidSelOptionVal ? __('（已删除）') : ''
        }`}
    >
        <Tag
            closable={closable}
            onClose={(e: any) => {
                // e?.preventDefault()
                // e?.stopPropagation()
                onClose()
            }}
            className={classnames({
                'any-fabric-ant-select-selection-item': true,
                [styles.tagWrapper]: true,
                [styles.delTag]: value === invalidSelOptionVal,
            })}
        >
            <span className={styles.tagSpan} title={label as string}>
                {label}
            </span>
            <span className={styles.delStatus}>
                {value === invalidSelOptionVal ? __('（已删除）') : ''}
            </span>
        </Tag>
    </Tooltip>
)

type ValidateStatus = Parameters<typeof Form.Item>[0]['validateStatus']
interface IBasicInfo {
    ref?: any
    oprType: OperateType
    // 选中业务表
    defaultForm: any
    optionsType?: string
    onDataChanged?: () => void
    // 应用范围ID（如："00000000-0000-0000-0000-000000000003"）
    applyScopeId?: string
}

const BasicInfo = forwardRef((props: any, ref) => {
    const {
        defaultForm,
        optionsType,
        onDataChanged = noop,
        applyScopeId,
    }: {
        defaultForm: any
        optionsType: OperateType
        onDataChanged: () => void
        applyScopeId?: string
    } = props

    const [hiddenChangeTip, setHiddenChangeTip] = useUserLocalStorage(
        'af_info_resc_change_tip',
        false,
    )
    const query = useQuery()
    // 有值时为编辑，无值时为新建
    const catlgId = query.get('id') || ''
    // 有值则表明已有草稿，无则表示还未有草稿
    const alterId = query.get('nextId') || ''

    const container = useRef<any>(null)
    const businessTagsSelectRef: any = useRef()
    const { Link } = Anchor
    const [form] = Form.useForm()

    const sourceSceneShowCont = Form.useWatch(
        ['relation_info', 'source_business_scenes'],
        form,
    )
    const relatedSceneShowCont = Form.useWatch(
        ['relation_info', 'related_business_scenes'],
        form,
    )

    // 来源业务场景显示label
    const showSourceScene = useMemo(() => {
        const type = sceneTypeList?.find(
            (item) => item.key === sourceSceneShowCont?.type,
        )?.label
        const value = sourceSceneShowCont?.value?.join(',')
        const showContent =
            type && value?.length ? `${type}/${value}` : undefined
        return showContent
    }, [sourceSceneShowCont])

    // 关联业务场景显示label
    const showRelatedScene = useMemo(() => {
        const type = sceneTypeList?.find(
            (item) => item.key === sourceSceneShowCont?.type,
        )?.label
        const value = sourceSceneShowCont?.value?.join(',')
        const showContent =
            type && value?.length ? `${type}/${value}` : undefined
        return showContent
    }, [relatedSceneShowCont])

    // 需要初始值的formItem
    const formInitialValue: any = {
        shared_open_info: {
            shared_type: ShareTypeEnum.UNCONDITION,
            shared_mode: ShareModeEnum.Platform,
            open_type: OpenTypeEnum.OPEN,
            // data_range: dataRange.CITY,
        },
    }

    const [initialValues, setInitialValues] = useState<any>(formInitialValue)

    const [curDepart, setCurDepartment] = useState()
    // 所属部门-组织架构树
    const [orgStrucTreeData, setOrgStrucTreeData] = useState<any>([])
    // 选择主干业务弹窗
    const [selectBusinFlowOpen, setSelectBusinFlowOpen] = useState(false)
    // 选择关联信息弹窗
    const [selectBusinSceneOpen, setSelectBusinSceneOpen] = useState(false)
    // 选择关联目录抽屉
    const [selectRescCatlgOpen, setSelectRescCatlgOpen] = useState(false)
    // 选择关联信息类抽屉
    const [selectRelateInfoOpen, setSelectRelateInfoOpen] = useState(false)

    // 点击业务场景对话框对应的表单字段
    const [curOprFormItemKey, setCurOprFormItemKey] = useState<any>([])
    const [categorys, setCategorys] = useState<ICategoryItem[]>([])

    const [relevancyInfoSearchVal, setRelevancyInfoSearchVal] =
        useState<string>('')
    const [showBusinessSystem, setShowBusinessSystem] = useState<boolean>(false)

    // 表单自定义异步状态
    const [formCustomValue, setFormCustomValue] = useState<any>({})
    const [tagSum, setTagSum] = useState<number>(0)

    // 上一步选中的业务表
    const selFormId = useMemo(() => {
        return defaultForm?.source_info?.business_form?.id
    }, [defaultForm])
    // 自动关联的信息类
    const [infoCatlgRelateList, setInfoCatlgRelateList] = useState<any>({})
    // 表单项中所选数据被删除，提示用户重选
    const [formItemHasDelDataList, setFormItemHasDelDataList] = useState<any>(
        {},
    )

    // 业务场景相关formItemKeyList
    const sceneFormItemsList = useMemo(
        () => [
            {
                label: __('来源业务场景'),
                key: ['relation_info', 'source_business_scenes'],
                showContent: showSourceScene,
            },
            {
                label: __('关联业务场景'),
                key: ['relation_info', 'related_business_scenes'],
                showContent: showRelatedScene,
            },
        ],
        [showSourceScene, showRelatedScene],
    )

    // 信息系统是否启用
    const hasBusinessSystem = useMemo(() => {
        return !!categorys?.find(
            (item) => item.id === SystemCategory.InformationSystem,
        )?.id
    }, [categorys])

    const [departRequired, infoSysRequired] = useMemo(() => {
        const cateList: any = [0, 0]
        categorys?.forEach((item) => {
            if (SystemCategory.Organization === item.id) {
                cateList[0] = item
            }
            if (SystemCategory.InformationSystem === item.id) {
                cateList[1] = item
            }
        })
        return [cateList?.[0]?.required, cateList?.[1]?.required]
    }, [categorys])

    // 信息系统为空值
    const [isInfoSysNull, setIsInfoSysNull] = useState(false)

    // useMemo(() => {
    //     return (
    //         form.getFieldValue(['relation_info', 'info_systems'])?.[0]
    //             ?.value === selectNullOption.value
    //     )
    // }, [form.getFieldValue(['relation_info', 'info_systems'])])

    useImperativeHandle(ref, () => ({
        getForm,
        getFormAndValidate,
        nameValidata,
        categorys,
    }))

    const formateToOption = (arr: Array<any>) => {
        // 有label就展示，若value为''则表示已删除
        const value = arr
            ?.map((item) => ({
                value: item?.id || item?.value,
                label: item?.name || item?.label,
                metadata: item,
            }))
            ?.filter((item) => item.label)
        return value?.length ? value : undefined
    }

    const defaultFormValues = useMemo(() => {
        const {
            update_cycle,
            data_range,
            source_info = {},
            relation_info = {},
            belong_info = {},
        } = defaultForm || {}
        const {
            info_systems,
            data_resource_catalogs,
            info_resource_catalogs,
            info_items,
            // 场景字段为form，所以格式需要为 {type: string, value: Array<string>}，在获取详情中转换格式
            related_business_scenes = {},
            source_business_scenes = {},
        } = relation_info

        const { type: relateSType, value: relateSValue } =
            related_business_scenes
        const { type: sourceSType, value: sourceSValue } =
            source_business_scenes

        const { department, office, business_process } = belong_info

        const defaultCateInfo = (defaultForm?.cate_info || []).reduce(
            (acc, cur) => {
                acc[`category_node_ids_${cur.cate_id}`] =
                    defaultForm[`category_node_ids_${cur.cate_id}`] ||
                    cur.node_id
                return acc
            },
            {},
        )
        return {
            ...formInitialValue,
            ...defaultForm,
            ...defaultCateInfo,
            name: defaultForm?.name,
            data_range: data_range
                ? businFormRangeToDataRange[data_range || ''] || data_range
                : undefined,
            update_cycle: update_cycle || undefined,
            belong_info: {
                ...belong_info,
                department: formateToOption([department])?.[0],
                office: defaultForm?.belong_info?.office
                    ? formateToOption([office])?.[0]
                    : selectNullOption,
                business_process: formateToOption(business_process),
            },
            source_info: {
                ...source_info,
                department: formateToOption([source_info?.department])?.[0],
            },
            // 设置tag类型的select数据，需要转换为[{label, value}]数组
            relation_info: relation_info
                ? {
                      info_systems: formateToOption(info_systems),
                      data_resource_catalogs: formateToOption(
                          data_resource_catalogs,
                      ),

                      info_resource_catalogs: formateToOption(
                          info_resource_catalogs,
                      ),
                      info_items: formateToOption(info_items),
                      // 场景字段为form，所以格式需要为 {type: string, value: Array<string>}
                      related_business_scenes:
                          relateSType && relateSValue
                              ? {
                                    type: relateSType,
                                    value: relateSValue,
                                }
                              : undefined,
                      source_business_scenes:
                          sourceSType && sourceSValue
                              ? {
                                    type: sourceSType,
                                    value: sourceSValue,
                                }
                              : undefined,
                  }
                : {},
        }
    }, [defaultForm])

    useEffect(() => {
        queryCategoryList()

        setInitialValues({ ...formInitialValue, ...defaultFormValues })

        form.setFieldsValue(defaultFormValues)
        validateHasDelValFields(defaultFormValues)

        // 查询当前部门
        if (!defaultFormValues?.source_info?.department?.id) {
            getCurDepartment()
        }
        setTagSum(defaultForm?.label_ids?.length || 0)
    }, [defaultFormValues])

    const validateHasDelValFields = (values) => {
        const { relation_info = {}, belong_info = {} } = values || {}
        const {
            info_systems,
            data_resource_catalogs,
            info_resource_catalogs,
            info_items,
            related_business_scenes,
            source_business_scenes,
        } = relation_info

        const checkFields = {
            info_systems,
            data_resource_catalogs,
            info_resource_catalogs,
            info_items,
        }

        const { department, office, business_process } = belong_info

        const namePaths: Array<any> = []

        if (department?.value === selectNullOption) {
            namePaths.push(['belong_info', 'department'])
        }

        if (office?.value === selectNullOption) {
            namePaths.push(['belong_info', 'department'])
        }

        Object.keys(checkFields)?.forEach((key) => {
            const hasNullVal = relation_info[key]?.find(
                (item) => item.value === selectNullOption,
            )
            if (hasNullVal) {
                namePaths.push(['relation_info', key])
            }
        })

        if (namePaths?.length) {
            form.validateFields(namePaths)
        }
    }

    // 获取关联信息类
    const getInfoCatlgRelateList = async () => {
        try {
            const res = await getInfoRescCatlgAutoRelated(selFormId)
            setInfoCatlgRelateList(res || [])
            const newFormItemVal =
                res?.columns?.map((item) => ({
                    ...item,
                    label: item.name,
                    value: item.id,
                    // 自动关联信息类
                    is_auto_related: true,
                })) || []
            form.setFieldValue(
                ['relation_info', 'info_resource_catalogs'],
                uniqBy(
                    [
                        ...newFormItemVal,
                        ...form.getFieldValue([
                            'relation_info',
                            'info_resource_catalogs',
                        ]),
                    ],
                    'value',
                ),
            )
        } catch (error) {
            formatError(error)
        }
    }

    // 获取form参数，并校验
    const getFormAndValidate = async () => {
        const value = form.validateFields()
        value.then().catch((e) => {
            // 在catch中进行错误定位
            setTimeout(() => {
                const errorList = document.querySelectorAll(
                    '.any-fabric-ant-form-item-has-error',
                )
                errorList[0]?.scrollIntoView({
                    block: 'center',
                    behavior: 'smooth',
                })
            }, 300)
        })
        return value
    }

    const getForm = () => {
        return form.getFieldsValue()
    }

    const nameValidata = () => {
        return form.validateFields(['name'])
    }

    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const res = await getCurUserDepartment()
            // 当前树能根据id匹配到部门，根据id显示部门，不能匹配到，显示部门名称
            if (res?.length === 1) {
                const [dept] = res
                setCurDepartment(dept)
                // dept格式-{id,name}
                form.setFieldValue(
                    ['source_info', 'department'],
                    dept?.id
                        ? {
                              label: dept?.name,
                              value: dept?.id,
                          }
                        : undefined,
                )
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 查询关联信息系统
    // const getBusinessSystem = async () => {
    //     try {
    //         const res =
    //             (await reqInfoSystemList({
    //                 offset: 1,
    //                 limit: 2000,
    //             })) || {}
    //         setBusinessSystemList(res.entries || [])
    //     } catch (error: any) {
    //         formatError(error)
    //     }
    // }

    // 查询处室业务职责
    const handleFillResponsibilities = async (officeId: string) => {
        try {
            const res = await getObjectDetails(officeId)
            if (res?.attributes?.department_responsibilities) {
                form.setFieldValue(
                    ['belong_info', 'business_responsibility'],
                    res?.attributes?.department_responsibilities,
                )
            }
        } catch (error) {
            // formatError(error)
        }
    }

    // 获取类目列表
    const queryCategoryList = async () => {
        try {
            const { entries } = await getCategory({})
            let list = entries?.filter((item) => item.using) || []

            // 如果指定了 applyScopeId，使用新的配置逻辑
            if (applyScopeId) {
                try {
                    const config = await getApplyScopeConfig()

                    // 创建类目配置映射表
                    const categoryConfigMap = new Map<
                        string,
                        { selected: boolean; required: boolean }
                    >()

                    config.categories?.forEach((category) => {
                        // 查找指定的 apply_scope_id
                        const module = category.modules?.find(
                            (m) => m.apply_scope_id === applyScopeId,
                        )
                        if (module) {
                            categoryConfigMap.set(category.id, {
                                selected: module.selected,
                                required: module.required,
                            })
                        }
                    })

                    // 过滤并设置必填状态
                    list = list
                        .filter((item) => {
                            const itemConfig = categoryConfigMap.get(item.id)
                            return itemConfig?.selected === true
                        })
                        .map((item) => {
                            const itemConfig = categoryConfigMap.get(item.id)
                            return {
                                ...item,
                                required: itemConfig?.required || false,
                            }
                        })
                } catch (error) {
                    formatError(error)
                }
            }

            setCategorys(list || [])
            const isBusinsSysOn: boolean = !!list?.find(
                (item) => item.id === SystemCategory.InformationSystem,
            )?.id
            // if (isBusinsSysOn) {
            //     getBusinessSystem()
            // }
            setShowBusinessSystem(hasBusinessSystem)
        } catch (err) {
            formatError(err)
        }
    }

    const handleSetNullVal = (
        fItemKey: string | Array<string>,
        isArray: boolean = true,
    ) => {
        form.setFieldValue(
            fItemKey,
            isArray ? [selectNullOption] : selectNullOption,
        )
        form.validateFields([fItemKey])
        onDataChanged()
    }

    const validateOfficeSelect = (msg = `${__('请选择')}${__('所属处室')}`) => {
        return (x: any, value: string) => {
            const department_id = form.getFieldValue('department_id')

            const department = findNodeById(orgStrucTreeData, department_id)
            return new Promise((resolve, reject) => {
                if (department?.expand && !value) {
                    reject(msg)
                } else {
                    resolve(1)
                }
            })
        }
    }

    const renderSceneFormIten = (item: any) => {
        // const { key, label, showContent } = item
        const { key, label } = item
        return (
            <>
                <Col span={9}>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, curValues) => {
                            return (
                                prevValues?.[key?.[0]]?.[key?.[1]] !==
                                curValues?.[key?.[0]]?.[key?.[1]]
                            )
                        }}
                    >
                        {({ getFieldValue, validateFields }) => {
                            const sourceSceneTemp = getFieldValue(key)
                            const type = sceneTypeList?.find(
                                (_type) => _type.key === sourceSceneTemp?.type,
                            )?.label
                            const value = sourceSceneTemp?.value?.join(',')
                            const showContent =
                                type && value?.length
                                    ? `${type}/${value}`
                                    : undefined
                            return (
                                <Form.Item
                                    rules={[
                                        {
                                            required: true,
                                            message: `${__('请选择')}${label}`,
                                        },
                                    ]}
                                    validateTrigger={['onChange', 'onBlur']}
                                    validateFirst
                                    label={label}
                                    name={key}
                                    className={styles.relateInfoFormItem}
                                >
                                    <Select
                                        placeholder={`${__('请选择')}${label}`}
                                        value={showContent}
                                        // optionFilterProp="name"
                                        open={false}
                                        notFoundContent={undefined}
                                        allowClear
                                        // showArrow
                                        onDropdownVisibleChange={(visible) => {
                                            if (visible) {
                                                setCurOprFormItemKey(key)
                                                setSelectBusinSceneOpen(true)
                                            }
                                        }}
                                        onChange={(val) => {
                                            if (!val) {
                                                form.setFieldValue(
                                                    key,
                                                    undefined,
                                                )
                                                setFormCustomValue({
                                                    ...formCustomValue,
                                                    relation_info_source_business_scenes:
                                                        {
                                                            validateStatus:
                                                                'error',
                                                            errorMsg: `${__(
                                                                '请选择',
                                                            )}${label}`,
                                                        },
                                                })
                                            }
                                        }}
                                    />
                                    <div />
                                </Form.Item>
                            )
                        }}
                    </Form.Item>
                </Col>
                <Col span={3} />
            </>
        )
    }

    const handleSelDataOpenChange = (
        type: string,
        open,
        callBack: () => void,
    ) => {
        setCurOprFormItemKey(undefined)
        callBack?.()
    }

    const onValuesChange = (changedValues, allValues) => {
        onDataChanged()
    }

    // 监听组织架构树数据变化，确保初始化时的回显
    useEffect(() => {
        if (orgStrucTreeData.length > 0 && initialValues?.belong_info?.office) {
            // 当组织架构树数据加载完成且有初始处室数据时，确保表单字段正确设置
            const officeValue = form.getFieldValue(['belong_info', 'office'])
            if (!officeValue && initialValues.belong_info.office) {
                form.setFieldValue(
                    ['belong_info', 'office'],
                    initialValues.belong_info.office,
                )
            }
        }
    }, [orgStrucTreeData, initialValues])

    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            const res = await getInfoCatlgConflicts({
                id: `${catlgId}${alterId ? ',' : ''}${alterId}` || '',
                name: trimValue,
            })
            if (res?.[0] === 'name') {
                return Promise.reject(
                    new Error(__('信息资源目录名称已存在，请重新输入')),
                )
            }
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        }
    }

    return (
        <div className={styles.basicInfoBox} ref={container}>
            <div
                className={styles.infoCatlgTip}
                hidden={
                    !(optionsType === OperateType.CHANGE && !hiddenChangeTip)
                }
            >
                <Alert
                    message={
                        <span className={styles.changeTips}>
                            <span>
                                {__('带有')}
                                <FontIcon
                                    name="icon-biangeng"
                                    type={IconType.COLOREDICON}
                                    style={{ margin: '0 4px' }}
                                />
                                {__('标识的字段变更后，需要走审批流程')}
                            </span>
                            <a
                                onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    setHiddenChangeTip(true)
                                }}
                            >
                                {__('不再提示')}
                            </a>
                        </span>
                    }
                    type="info"
                    showIcon
                />
            </div>
            <div className={styles.basicInfoWrapper}>
                <Form
                    className={styles.basicInfoForm}
                    autoComplete="off"
                    form={form}
                    layout="vertical"
                    initialValues={initialValues}
                    onValuesChange={onValuesChange}
                >
                    <Row
                        className={styles.basicInfoRow}
                        align="middle"
                        gutter={16}
                    >
                        <LabelTitle label="基本属性" id="basic-info" />
                        <Col span={24}>
                            <Form.Item
                                label={checkChangeIcon(
                                    __('信息资源目录名称'),
                                    optionsType,
                                )}
                                validateFirst
                                validateTrigger={['onBlur']}
                                rules={[
                                    {
                                        required: true,
                                        message: `${__('请输入')}${__(
                                            '信息资源目录名称',
                                        )}`,
                                    },
                                    {
                                        validator: (e, value) =>
                                            validateNameRepeat(value),
                                    },
                                ]}
                                name="name"
                            >
                                <Input
                                    placeholder={`${__('请输入')}${__(
                                        '信息资源目录名称',
                                    )}`}
                                    maxLength={128}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={9}>
                            <Form.Item
                                label={__('信息资源来源部门')}
                                name={['source_info', 'department']}
                            >
                                <Select options={[]} disabled />
                            </Form.Item>
                        </Col>
                        <Col span={3} />
                        {/* <Form.Item label="Address"> */}
                        <Col span={9}>
                            <Form.Item
                                label={checkChangeIcon(
                                    __('所属部门'),
                                    optionsType,
                                )}
                                name={['belong_info', 'department']}
                                validateFirst
                                validateTrigger={['onBlur', 'onChange']}
                                rules={[
                                    {
                                        required: departRequired,
                                        message: `${__('请选择')}${__(
                                            '所属部门',
                                        )}`,
                                    },
                                    {
                                        validator:
                                            validSelOptionIsDel(
                                                '所属部门已被删除，请重新选择',
                                            ),
                                        validateTrigger: ['onChange', 'onBlur'],
                                    },
                                    // {
                                    //     validator: (rule, value) => {
                                    //         const optionVal =
                                    //             typeof value ===
                                    //             'string'
                                    //                 ? trim(value)
                                    //                 : value?.id ||
                                    //                   value?.value
                                    //         if (
                                    //             optionVal ===
                                    //             invalidSelOptionVal
                                    //         ) {
                                    //             // reject(new Error(errMsg))
                                    //             return Promise.reject(
                                    //                 new Error(
                                    //                     `该节点已被删除，请重新选择2`,
                                    //                 ),
                                    //             )
                                    //         }

                                    //         return Promise.resolve(1)

                                    //         //   if (!value || value.includes('blue')) {
                                    //         //     return Promise.reject(
                                    //         //       new Error('The two passwords that you entered do not match!')
                                    //         //     );
                                    //         //   }
                                    //         //   return Promise.resolve();
                                    //     },
                                    // },
                                ]}
                                className={styles.hadDelValFormItem}
                                // help={formItemHasDelDataList?.belong_info?.department?.help(
                                //     __('信息资源来源部门'),
                                // )}
                                // validateStatus={
                                //     formItemHasDelDataList?.belong_info
                                //         ?.department?.validateStatus
                                // }
                            >
                                {/* <DepartmentOrAgencySelect
                                    placeholder={`${__('请选择')}${__(
                                        '所属部门',
                                    )}`}
                                    // defaultValue={
                                    //     initialValues.belong_info?.department
                                    // }
                                    isAll={false}
                                    // loadArchitType={[Architecture.DEPARTMENT]}
                                    // disableNonLeftDeptNode
                                    disableArchitType={[
                                        Architecture.ORGANIZATION,
                                    ]}
                                    onTreeDataChange={(data) => {
                                        setOrgStrucTreeData(data)
                                    }}
                                    allowClear
                                    labelInValue
                                    onChange={(val, label: any) => {
                                        const option = val || {}
                                        form.setFieldValue(
                                            ['belong_info', 'department'],
                                            val
                                                ? {
                                                      value: option?.value,
                                                      label:
                                                          option?.label?.props
                                                              ?.children ||
                                                          option?.value,
                                                  }
                                                : undefined,
                                        )

                                        form.setFieldValue(
                                            ['belong_info', 'office'],
                                            undefined,
                                        )
                                        form.setFieldValue(
                                            [
                                                'belong_info',
                                                'business_responsibility',
                                            ],
                                            undefined,
                                        )
                                        // form.validateFields([
                                        //     ['belong_info', 'office'],
                                        // ])
                                    }}
                                /> */}
                                <DepartmentAndOrgSelect
                                    placeholder={`${__('请选择')}${__(
                                        '所属部门',
                                    )}`}
                                    disableArchitType={[
                                        Architecture.ORGANIZATION,
                                    ]}
                                    onTreeDataChange={(data) => {
                                        setOrgStrucTreeData(data)
                                    }}
                                    defaultValue={
                                        initialValues?.belong_info?.department
                                            ?.value
                                    }
                                    allowClear
                                    labelInValue
                                    onChange={(val, label: any) => {
                                        const option = isString(val)
                                            ? {
                                                  value: val,
                                                  label: {
                                                      props: {
                                                          children: label,
                                                      },
                                                  },
                                              }
                                            : val || {}
                                        form.setFieldValue(
                                            ['belong_info', 'department'],
                                            val
                                                ? {
                                                      value: option?.value,
                                                      label:
                                                          option?.label?.props
                                                              ?.children ||
                                                          option?.value,
                                                  }
                                                : undefined,
                                        )

                                        form.setFieldValue(
                                            ['belong_info', 'office'],
                                            undefined,
                                        )
                                        form.setFieldValue(
                                            [
                                                'belong_info',
                                                'business_responsibility',
                                            ],
                                            undefined,
                                        )
                                        // form.validateFields([
                                        //     ['belong_info', 'office'],
                                        // ])
                                        onDataChanged()
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={9}>
                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, curValues) => {
                                    return (
                                        prevValues.belong_info?.department !==
                                            curValues.belong_info?.department ||
                                        prevValues.belong_info?.office !==
                                            curValues.belong_info?.office
                                    )
                                }}
                            >
                                {({ getFieldValue, validateFields }) => {
                                    const department_id = getFieldValue([
                                        'belong_info',
                                        'department',
                                    ])?.value
                                    const department = findNodeById(
                                        orgStrucTreeData,
                                        department_id,
                                    )

                                    // 未选中部门或选中叶子节点

                                    const curDisabled =
                                        !department_id ||
                                        (orgStrucTreeData.length > 0 &&
                                            (!department ||
                                                !department?.expand))

                                    return (
                                        <Form.Item
                                            label={checkChangeIcon(
                                                __('所属处室'),
                                                optionsType,
                                            )}
                                            name={['belong_info', 'office']}
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            rules={[
                                                {
                                                    required: !curDisabled,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__('所属处室')}`,
                                                },
                                                // {
                                                //     validator:
                                                //         validateOfficeSelect(),
                                                // },
                                                {
                                                    validator:
                                                        validSelOptionIsDel(
                                                            '所属处室已被删除，请重新选择',
                                                        ),
                                                    validateTrigger: [
                                                        'onChange',
                                                        'onBlur',
                                                    ],
                                                },
                                            ]}
                                        >
                                            {/* <DepartmentOrAgencySelect
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('所属处室')}`}
                                                // defaultValue={val}
                                                // value={val}
                                                isAll={false}
                                                disableNonLeftDeptNode
                                                rootId={department_id}
                                                rootArchitType={
                                                    Architecture.DEPARTMENT
                                                }
                                                loadArchitType={[
                                                    Architecture.DEPARTMENT,
                                                ]}
                                                disableArchitType={[
                                                    Architecture.ORGANIZATION,
                                                ]}
                                                allowClear
                                                labelInValue
                                                // 没有选择部门或者部门无子孙部门节点
                                                disabled={curDisabled}
                                                onChange={(val, label: any) => {
                                                    const option = val || {}

                                                    form.setFieldValue(
                                                        [
                                                            'belong_info',
                                                            'office',
                                                        ],
                                                        val
                                                            ? {
                                                                  value: option?.value,
                                                                  label:
                                                                      option
                                                                          ?.label
                                                                          ?.props
                                                                          ?.children ||
                                                                      option?.value,
                                                              }
                                                            : undefined,
                                                    )

                                                    if (option?.value) {
                                                        handleFillResponsibilities(
                                                            option?.value,
                                                        )
                                                    } else {
                                                        form.setFieldValue(
                                                            [
                                                                'belong_info',
                                                                'business_responsibility',
                                                            ],
                                                            undefined,
                                                        )
                                                    }
                                                }}
                                            /> */}
                                            <DepartmentAndOrgSelect
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('所属处室')}`}
                                                // defaultValue={val}
                                                // value={val}
                                                // isAll={false}
                                                disableNonLeftDeptNode
                                                rootId={department_id}
                                                rootArchitType={
                                                    Architecture.DEPARTMENT
                                                }
                                                loadArchitType={[
                                                    Architecture.DEPARTMENT,
                                                ]}
                                                disableArchitType={[
                                                    Architecture.ORGANIZATION,
                                                ]}
                                                allowClear
                                                labelInValue
                                                // 没有选择部门或者部门无子孙部门节点
                                                disabled={curDisabled}
                                                defaultValue={
                                                    initialValues.belong_info
                                                        ?.office?.value
                                                }
                                                nullKey={selectNullOption.value}
                                                onChange={(val, label: any) => {
                                                    const option = val || {}

                                                    form.setFieldValue(
                                                        [
                                                            'belong_info',
                                                            'office',
                                                        ],
                                                        val
                                                            ? {
                                                                  value: option?.value,
                                                                  label:
                                                                      option
                                                                          ?.label
                                                                          ?.props
                                                                          ?.children ||
                                                                      option?.value,
                                                              }
                                                            : undefined,
                                                    )

                                                    if (option?.value) {
                                                        handleFillResponsibilities(
                                                            option?.value,
                                                        )
                                                    } else {
                                                        form.setFieldValue(
                                                            [
                                                                'belong_info',
                                                                'business_responsibility',
                                                            ],
                                                            undefined,
                                                        )
                                                    }
                                                    onDataChanged()
                                                }}
                                            />
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Button
                                className={styles.setNullBtn}
                                onClick={() => {
                                    handleSetNullVal(
                                        ['belong_info', 'office'],
                                        false,
                                    )
                                    form.setFieldValue(
                                        [
                                            'belong_info',
                                            'business_responsibility',
                                        ],
                                        undefined,
                                    )
                                }}
                            >
                                {__('暂无处室')}
                            </Button>
                        </Col>
                        <Col span={9}>
                            <Form.Item
                                label={__('所属主干业务')}
                                name={['belong_info', 'business_process']}
                                // validateFirst
                                // validateTrigger={['onChange', 'onBlur']}
                                rules={[
                                    {
                                        required: true,
                                        message: `${__('请选择')}${__(
                                            '所属主干业务',
                                        )}`,
                                    },
                                    // {
                                    //     required: categorys.find(
                                    //         (item) =>
                                    //             item.id ===
                                    //             SystemCategory.InformationSystem,
                                    //     )?.required,
                                    //     message: `${__('请选择')}${__(
                                    //         '所属主干业务',
                                    //     )}`,
                                    // },
                                    {
                                        validator:
                                            validSelOptionIsDel(
                                                '所属主干业务已被删除，请重新选择',
                                            ),
                                    },
                                ]}
                            >
                                <Select
                                    mode="multiple"
                                    optionFilterProp="name"
                                    placeholder={`${__('请选择')}${__(
                                        '所属主干业务',
                                    )}`}
                                    open={false}
                                    notFoundContent={undefined}
                                    allowClear
                                    showArrow
                                    labelInValue
                                    tagRender={tagRender}
                                    onClick={() => {
                                        // 点击 Select 输入框时打开对应的选择器
                                        setCurOprFormItemKey([
                                            'belong_info',
                                            'business_process',
                                        ])
                                        setSelectBusinFlowOpen(true)
                                    }}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                />
                            </Form.Item>
                        </Col>
                        {/* </Form.Item> */}
                        <Col span={9}>
                            <Form.Item
                                label={checkChangeIcon(
                                    __('数据范围'),
                                    optionsType,
                                )}
                                name="data_range"
                                rules={[
                                    {
                                        required: true,
                                        message: `${__('请选择')}${__(
                                            '数据范围',
                                        )}`,
                                    },
                                ]}
                            >
                                <Select
                                    allowClear
                                    options={dataRangeOptions}
                                    placeholder={`${__('请选择')}${__(
                                        '数据范围',
                                    )}`}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={3} />
                        <Col span={9}>
                            <Form.Item
                                label={checkChangeIcon(
                                    __('更新周期'),
                                    optionsType,
                                )}
                                rules={[
                                    {
                                        required: true,
                                        message: `${__('请选择')}${__(
                                            '更新周期',
                                        )}`,
                                    },
                                ]}
                                name="update_cycle"
                            >
                                <Select
                                    allowClear
                                    options={updateCycleOptions}
                                    placeholder={`${__('请选择')}${__(
                                        '更新周期',
                                    )}`}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item noStyle shouldUpdate>
                                {({ getFieldValue }) => {
                                    const name = getFieldValue('name')
                                    const desc = getFieldValue('description')
                                    return (
                                        <Form.Item
                                            label={__('资源标签（${sum}/5）', {
                                                sum: tagSum || '0',
                                            })}
                                            name="label_ids"
                                        >
                                            <BusinessTagsSelect
                                                ref={businessTagsSelectRef}
                                                onChange={(list) => {
                                                    setTagSum(list?.length)
                                                }}
                                                recommendParams={[
                                                    {
                                                        name,
                                                        range_type: '2',
                                                        desc,
                                                    },
                                                ]}
                                            />
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                        </Col>

                        <Col span={20}>
                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, curValues) => {
                                    return (
                                        prevValues.belong_info?.office !==
                                        curValues.belong_info?.office
                                    )
                                }}
                            >
                                {({ getFieldValue, validateFields }) => {
                                    return (
                                        <Form.Item
                                            label={__('处室业务职责')}
                                            name={[
                                                'belong_info',
                                                'business_responsibility',
                                            ]}
                                            rules={[
                                                {
                                                    validator:
                                                        keyboardInputValidator(
                                                            ErrorInfo.EXCEPTEMOJI,
                                                        ),
                                                },
                                            ]}
                                        >
                                            <TextArea
                                                rows={3}
                                                maxLength={255}
                                                placeholder={`${__(
                                                    '请输入',
                                                )}${__('处室业务职责描述')}`}
                                                className={styles.textArea}
                                                disabled
                                                showCount
                                            />
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                        </Col>

                        <Col span={20}>
                            <Form.Item
                                label={__('信息资源目录描述')}
                                name="description"
                                rules={[
                                    {
                                        required: true,
                                        message: `${__('请输入')}${__(
                                            '信息资源目录描述',
                                        )}`,
                                    },
                                    {
                                        pattern: keyboardRegEnter,
                                        message: ErrorInfo.EXCEPTEMOJI,
                                    },
                                ]}
                            >
                                <TextArea
                                    rows={3}
                                    maxLength={255}
                                    placeholder={`${__('请输入')}${__(
                                        '信息资源目录描述',
                                    )}`}
                                    className={styles.textArea}
                                    showCount
                                />
                            </Form.Item>
                        </Col>

                        {categorys.filter((item) => item.type !== 'system')
                            ?.length ? (
                            <LabelTitle
                                label="资源属性分类"
                                id="resc-attr-classify"
                            />
                        ) : undefined}
                        {categorys
                            .filter((item) => item.type !== 'system')
                            ?.map((item, index) => {
                                return (
                                    <>
                                        <Col span={9} key={item.id}>
                                            <Form.Item
                                                label={checkChangeIcon(
                                                    item.name,
                                                    optionsType,
                                                )}
                                                rules={[
                                                    {
                                                        required: item.required,
                                                        message: `${__(
                                                            '请选择',
                                                        )}${item.name}`,
                                                    },
                                                ]}
                                                name={`category_node_ids_${item.id}`}
                                            >
                                                <TreeSelect
                                                    treeDataSimpleMode
                                                    getPopupContainer={(node) =>
                                                        node.parentNode
                                                    }
                                                    style={{ width: '100%' }}
                                                    dropdownStyle={{
                                                        width: '100%',
                                                        maxHeight: 400,
                                                        overflow: 'auto',
                                                    }}
                                                    dropdownMatchSelectWidth={
                                                        false
                                                    }
                                                    allowClear
                                                    placeholder={`${__(
                                                        '请选择',
                                                    )}${item.name}`}
                                                    treeData={item.tree_node}
                                                    switcherIcon={
                                                        <DownOutlined />
                                                    }
                                                    fieldNames={{
                                                        label: 'name',
                                                        value: 'id',
                                                    }}
                                                    popupClassName={
                                                        styles.orgTreeSelect
                                                    }
                                                    treeIcon
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={3} />
                                    </>
                                )
                            })}

                        <LabelTitle label="关联信息" id="related-info" />
                        {/* <Form.Item label="relation_info"> */}

                        <Col span={9}>
                            <Form.Item
                                rules={[
                                    // {
                                    //     required: true,
                                    //     message: `${__('请选择')}${__(
                                    //         '关联数据资源目录',
                                    //     )}`,
                                    // },
                                    {
                                        validator:
                                            validSelOptionIsDel(
                                                '关联数据资源目录已被删除，请重新选择',
                                            ),
                                        validateTrigger: ['onChange', 'onBlur'],
                                    },
                                ]}
                                validateFirst
                                validateTrigger={['onChange', 'onBlur']}
                                label={__('关联数据资源目录')}
                                name={[
                                    'relation_info',
                                    'data_resource_catalogs',
                                ]}
                                className={styles.relateInfoFormItem}
                            >
                                <Select
                                    placeholder={`${__('请选择')}${__(
                                        '关联数据资源目录',
                                    )}`}
                                    // fieldNames={{
                                    //     label: 'name',
                                    //     value: 'id',
                                    // }}
                                    optionFilterProp="name"
                                    mode="multiple"
                                    open={false}
                                    notFoundContent={undefined}
                                    allowClear
                                    showArrow
                                    labelInValue
                                    tagRender={tagRender}
                                    onClick={() => {
                                        // 点击 Select 输入框时打开对应的选择器
                                        setCurOprFormItemKey([
                                            'relation_info',
                                            'data_resource_catalogs',
                                        ])
                                        setSelectRescCatlgOpen(true)
                                    }}
                                    // suffixIcon={
                                    //     <Button
                                    //         type="link"
                                    //         className={styles.selBtn}
                                    //         onClick={() => {
                                    //             setCurOprFormItemKey([
                                    //                 'relation_info',
                                    //                 'data_resource_catalogs',
                                    //             ])
                                    //             setSelectRescCatlgOpen(true)
                                    //         }}
                                    //     >
                                    //         {__('选择')}
                                    //     </Button>
                                    // }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={3} />
                        {hasBusinessSystem && (
                            <>
                                <Col span={9}>
                                    <Form.Item
                                        rules={[
                                            {
                                                required: infoSysRequired,
                                                message: `${__('请选择')}${__(
                                                    '关联信息系统',
                                                )}`,
                                            },
                                            {
                                                validator:
                                                    validSelOptionIsDel(
                                                        '关联信息系统已被删除，请重新选择',
                                                    ),
                                            },
                                        ]}
                                        validateFirst
                                        label={__('关联信息系统')}
                                        name={['relation_info', 'info_systems']}
                                        className={styles.relateInfoFormItem}
                                    >
                                        <ScrollLoadInfoSystemSelect
                                            placeholder={`${__('请选择')}${__(
                                                '关联信息系统',
                                            )}`}
                                            mode="multiple"
                                            labelInValue
                                            disableDetailFetch
                                            // icon={<InfoSystemCardOutlined />}
                                            onChange={(val, options) => {
                                                const opts = options?.map(
                                                    (o) => ({
                                                        key: o?.key,
                                                        name: o?.name,
                                                        value: o?.value,
                                                        label: o?.name,
                                                    }),
                                                )
                                                // 处理清空的情况
                                                if (
                                                    !opts ||
                                                    opts.length === 0
                                                ) {
                                                    form.setFieldValue(
                                                        [
                                                            'relation_info',
                                                            'info_systems',
                                                        ],
                                                        undefined,
                                                    )
                                                    setIsInfoSysNull(false)
                                                    return
                                                }

                                                // 如果之前设置了"暂无关联系统"，并且现在选择了实际的系统
                                                if (
                                                    isInfoSysNull &&
                                                    opts?.length > 0
                                                ) {
                                                    setIsInfoSysNull(false)
                                                    // 过滤掉 selectNullOption
                                                    const validVal =
                                                        opts?.filter(
                                                            (item) =>
                                                                item.value !==
                                                                    selectNullOption.value &&
                                                                item.value,
                                                        )
                                                    form.setFieldValue(
                                                        [
                                                            'relation_info',
                                                            'info_systems',
                                                        ],
                                                        validVal,
                                                    )
                                                } else {
                                                    // 正常选择情况
                                                    form.setFieldValue(
                                                        [
                                                            'relation_info',
                                                            'info_systems',
                                                        ],
                                                        opts,
                                                    )
                                                }

                                                // 触发表单验证
                                                form.validateFields([
                                                    [
                                                        'relation_info',
                                                        'info_systems',
                                                    ],
                                                ])
                                                onDataChanged()
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={3}>
                                    <Button
                                        className={styles.setNullBtn}
                                        onClick={() => {
                                            setIsInfoSysNull(true)
                                            handleSetNullVal([
                                                'relation_info',
                                                'info_systems',
                                            ])
                                        }}
                                    >
                                        {__('暂无关联系统')}
                                    </Button>
                                </Col>
                            </>
                        )}
                        {sceneFormItemsList?.map((item) =>
                            renderSceneFormIten(item),
                        )}
                        <Col span={9}>
                            <Form.Item
                                rules={[
                                    {
                                        required: true,
                                        message: `${__('请选择')}${__(
                                            '关联信息类',
                                        )}`,
                                    },
                                    {
                                        validator:
                                            validSelOptionIsDel(
                                                '关联信息类已被删除，请重新选择',
                                            ),
                                    },
                                ]}
                                validateFirst
                                label={__('关联信息类')}
                                name={[
                                    'relation_info',
                                    'info_resource_catalogs',
                                ]}
                                className={styles.relateInfoFormItem}
                            >
                                <Select
                                    placeholder={`${__('请选择')}${__(
                                        '关联信息类',
                                    )}`}
                                    mode="multiple"
                                    labelInValue
                                    // options={[]}
                                    // fieldNames={{
                                    //     label: 'name',
                                    //     value: 'id',
                                    // }}
                                    open={false}
                                    notFoundContent={undefined}
                                    allowClear
                                    showArrow
                                    tagRender={tagRender}
                                    onClick={() => {
                                        // 点击 Select 输入框时打开对应的选择器
                                        setCurOprFormItemKey([
                                            'relation_info',
                                            'info_resource_catalogs',
                                        ])
                                        setSelectRescCatlgOpen(true)
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Button
                                className={styles.setNullBtn}
                                onClick={() =>
                                    handleSetNullVal([
                                        'relation_info',
                                        'info_resource_catalogs',
                                    ])
                                }
                            >
                                {__('暂无关联信息类')}
                            </Button>
                        </Col>
                        <Col span={9}>
                            <Form.Item
                                rules={[
                                    {
                                        required: true,
                                        message: `${__('请选择')}${__(
                                            '关联信息项',
                                        )}`,
                                    },
                                    {
                                        validator:
                                            validSelOptionIsDel(
                                                '关联信息项已被删除，请重新选择',
                                            ),
                                    },
                                ]}
                                validateFirst
                                label={__('关联信息项')}
                                name={['relation_info', 'info_items']}
                                className={styles.relateInfoFormItem}
                            >
                                <Select
                                    placeholder={`${__('请选择')}${__(
                                        '关联信息项',
                                    )}`}
                                    mode="multiple"
                                    labelInValue
                                    open={false}
                                    notFoundContent={undefined}
                                    allowClear
                                    showArrow
                                    tagRender={tagRender}
                                    onClick={() => {
                                        // 点击 Select 输入框时打开对应的选择器
                                        setCurOprFormItemKey([
                                            'relation_info',
                                            'info_items',
                                        ])
                                        setSelectRelateInfoOpen(true)
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Button
                                className={styles.setNullBtn}
                                onClick={() =>
                                    handleSetNullVal([
                                        'relation_info',
                                        'info_items',
                                    ])
                                }
                            >
                                {__('暂无关联信息项')}
                            </Button>
                        </Col>
                        {/* </Form.Item> */}

                        <LabelTitle label="共享开放信息" id="share-info" />
                        {/* <Form.Item label="shared_open_info"> */}
                        <Col span={12}>
                            <Form.Item
                                rules={[
                                    {
                                        required: true,
                                        message: `${__('请选择')}${__(
                                            '共享属性',
                                        )}`,
                                    },
                                ]}
                                validateFirst
                                label={checkChangeIcon(
                                    __('共享属性'),
                                    optionsType,
                                )}
                                name={['shared_open_info', 'shared_type']}
                            >
                                <Radio.Group
                                    onChange={(value) => {
                                        form.setFieldValue(
                                            [
                                                'shared_open_info',
                                                'shared_message',
                                            ],
                                            '',
                                        )
                                        const newVal = value?.target?.value
                                        form.setFieldValue(
                                            ['shared_open_info', 'shared_type'],
                                            newVal,
                                        )
                                        if (newVal === ShareTypeEnum.NOSHARE) {
                                            form.setFieldValue(
                                                [
                                                    'shared_open_info',
                                                    'open_type',
                                                ],
                                                OpenTypeEnum.NOOPEN,
                                            )
                                        }
                                    }}
                                >
                                    {shareTypeList.map((item) => {
                                        return (
                                            <Radio
                                                key={item.key}
                                                value={item.key}
                                            >
                                                {item.label}
                                            </Radio>
                                        )
                                    })}
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, curValues) => {
                                    return (
                                        prevValues.shared_open_info
                                            ?.shared_type !==
                                        curValues.shared_open_info?.shared_type
                                    )
                                }}
                            >
                                {({ getFieldValue, validateFields }) => {
                                    const sharedType = getFieldValue([
                                        'shared_open_info',
                                        'shared_type',
                                    ])
                                    if (
                                        [
                                            ShareTypeEnum.CONDITION,
                                            ShareTypeEnum.NOSHARE,
                                        ].includes(sharedType)
                                    ) {
                                        const isCondition =
                                            sharedType ===
                                            ShareTypeEnum.CONDITION
                                        return (
                                            <Form.Item
                                                label={checkChangeIcon(
                                                    isCondition
                                                        ? __('共享条件')
                                                        : __('不予共享依据'),
                                                    optionsType,
                                                )}
                                                name={[
                                                    'shared_open_info',
                                                    'shared_message',
                                                ]}
                                                validateTrigger={[
                                                    'onChange',
                                                    'onBlur',
                                                ]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: `请输入${
                                                            isCondition
                                                                ? __('共享条件')
                                                                : __(
                                                                      '不予共享依据',
                                                                  )
                                                        }`,
                                                    },
                                                    {
                                                        validator:
                                                            keyboardInputValidator(
                                                                ErrorInfo.EXCEPTEMOJI,
                                                            ),
                                                    },
                                                ]}
                                                validateFirst
                                            >
                                                <Input
                                                    maxLength={128}
                                                    placeholder={`${__(
                                                        '请输入',
                                                    )}${
                                                        isCondition
                                                            ? __('共享条件')
                                                            : __('不予共享依据')
                                                    }`}
                                                />
                                            </Form.Item>
                                        )
                                    }
                                    return ''
                                }}
                            </Form.Item>
                        </Col>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) => {
                                return (
                                    prevValues.shared_open_info?.shared_type !==
                                    curValues.shared_open_info?.shared_type
                                )
                            }}
                        >
                            {({ getFieldValue }) => {
                                const sharedType = getFieldValue([
                                    'shared_open_info',
                                    'shared_type',
                                ])

                                //    无共享属性或不予共享，不显示共享方式
                                if (
                                    !sharedType ||
                                    sharedType === ShareTypeEnum.NOSHARE
                                ) {
                                    return ''
                                }
                                return (
                                    <Col span={24}>
                                        <Form.Item
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__('共享方式')}`,
                                                },
                                            ]}
                                            label={checkChangeIcon(
                                                __('共享方式'),
                                                optionsType,
                                            )}
                                            name={[
                                                'shared_open_info',
                                                'shared_mode',
                                            ]}
                                            validateFirst
                                            // initialValue={1}
                                        >
                                            <Radio.Group>
                                                {shareModeList.map((item) => {
                                                    return (
                                                        <Radio
                                                            key={item.key}
                                                            value={item.key}
                                                        >
                                                            {item.label}
                                                        </Radio>
                                                    )
                                                })}
                                            </Radio.Group>
                                        </Form.Item>
                                    </Col>
                                )
                            }}
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) => {
                                return (
                                    prevValues.shared_open_info?.shared_type !==
                                    curValues.shared_open_info?.shared_type
                                )
                            }}
                        >
                            {({ getFieldValue }) => {
                                const sharedType = getFieldValue([
                                    'shared_open_info',
                                    'shared_type',
                                ])

                                return (
                                    <Col span={12}>
                                        <Form.Item
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__('开放属性')}`,
                                                },
                                            ]}
                                            label={checkChangeIcon(
                                                __('开放属性'),
                                                optionsType,
                                            )}
                                            name={[
                                                'shared_open_info',
                                                'open_type',
                                            ]}
                                            validateFirst
                                            // initialValue={1}
                                        >
                                            <Radio.Group
                                                disabled={
                                                    sharedType ===
                                                    ShareTypeEnum.NOSHARE
                                                }
                                            >
                                                {openTypeList.map((item) => {
                                                    return (
                                                        <Radio
                                                            key={item.key}
                                                            value={item.key}
                                                        >
                                                            {item.label}
                                                        </Radio>
                                                    )
                                                })}
                                            </Radio.Group>
                                        </Form.Item>
                                    </Col>
                                )
                            }}
                        </Form.Item>
                        <Col span={12}>
                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, curValues) => {
                                    return (
                                        prevValues.shared_open_info
                                            ?.open_type !==
                                        curValues.shared_open_info?.open_type
                                    )
                                }}
                            >
                                {({ getFieldValue }) => {
                                    const openType = getFieldValue([
                                        'shared_open_info',
                                        'open_type',
                                    ])
                                    if (
                                        OpenTypeEnum.HASCONDITION === openType
                                    ) {
                                        return (
                                            <Form.Item
                                                label={checkChangeIcon(
                                                    __('开放条件'),
                                                    optionsType,
                                                )}
                                                name={[
                                                    'shared_open_info',
                                                    'open_condition',
                                                ]}
                                                // rules={[
                                                //     {
                                                //         validator:
                                                //             keyboardInputValidator(
                                                //                 ErrorInfo.EXCEPTEMOJI,
                                                //             ),
                                                //     },
                                                // ]}
                                                // required
                                            >
                                                <Input
                                                    maxLength={128}
                                                    placeholder={`${__(
                                                        '请输入',
                                                    )}${__('开放条件')}`}
                                                />
                                            </Form.Item>
                                        )
                                    }
                                    return ''
                                }}
                            </Form.Item>
                        </Col>
                        {/* </Form.Item> */}
                    </Row>
                </Form>

                <div className={styles.menuContainer}>
                    <Anchor
                        getContainer={() =>
                            (container.current as HTMLElement) || window
                        }
                        className={styles.anchorWrapper}
                        onClick={(e: any) => {
                            e.preventDefault()
                        }}
                    >
                        <Link href="#basic-info" title={__('基本属性')} />
                        {!!categorys.filter((item) => item.type !== 'system')
                            ?.length && (
                            <Link
                                href="#resc-attr-classify"
                                title={__('资源属性分类')}
                            />
                        )}
                        <Link href="#related-info" title={__('关联信息')} />
                        <Link href="#share-info" title={__('共享开放信息')} />
                    </Anchor>
                </div>

                {/* 选择主干业务 */}
                {selectBusinFlowOpen && curOprFormItemKey && (
                    <SelectBusinFlow
                        open={selectBusinFlowOpen}
                        selValue={form
                            ?.getFieldValue(curOprFormItemKey)
                            ?.filter((item) => item.value)
                            ?.map?.((item) => ({
                                id: item.value,
                                name: item.label,
                            }))}
                        onClose={() => setSelectBusinFlowOpen(false)}
                        onOK={(val) => {
                            form.setFieldValue(
                                curOprFormItemKey,
                                val?.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                            )
                            setSelectBusinFlowOpen(false)
                            form.validateFields([curOprFormItemKey])
                            onDataChanged()
                        }}
                    />
                )}

                {/* 选择来源/关联业务场景 */}
                {selectBusinSceneOpen && curOprFormItemKey && (
                    <SelectBusinScene
                        title={
                            isEqual(curOprFormItemKey, [
                                'relation_info',
                                'source_business_scenes',
                            ])
                                ? __('来源业务场景')
                                : __('关联业务场景')
                        }
                        open={selectBusinSceneOpen}
                        originValue={form?.getFieldValue(curOprFormItemKey)}
                        onOK={(val) => {
                            form.setFieldValue(curOprFormItemKey, val)
                            setSelectBusinSceneOpen(false)
                            setFormCustomValue({
                                ...formCustomValue,
                                [curOprFormItemKey?.join('_')]: undefined,
                            })
                            form.validateFields([curOprFormItemKey])
                            onDataChanged()
                        }}
                        onClose={() => {
                            setSelectBusinSceneOpen(false)
                            setCurOprFormItemKey(undefined)
                        }}
                    />
                )}
                {/* 选择数据资源/信息资源目录 */}
                {selectRescCatlgOpen && curOprFormItemKey && (
                    <SelectRescCatlg
                        formId={selFormId}
                        type={
                            isEqual(curOprFormItemKey, [
                                'relation_info',
                                'data_resource_catalogs',
                            ])
                                ? DataRescType.DATA_RESC_CATLG
                                : DataRescType.INFO_RESC_CATLG
                        }
                        open={selectRescCatlgOpen}
                        selRescList={form
                            ?.getFieldValue(curOprFormItemKey)
                            ?.filter(
                                (item) =>
                                    ![
                                        selectNullOption.value,
                                        invalidSelOptionVal,
                                    ].includes(item.value),
                            )}
                        onClose={() => {
                            setSelectRescCatlgOpen(false)
                        }}
                        onOK={(res) => {
                            setSelectRescCatlgOpen(false)
                            form?.setFieldValue(
                                curOprFormItemKey,
                                res?.map((item) => ({
                                    value: item.id,
                                    label: item.name,
                                    title: item.code,
                                })),
                            )
                            form.validateFields([curOprFormItemKey])
                            onDataChanged()
                        }}
                    />
                )}

                {/* 选择信息项 */}
                {selectRelateInfoOpen && curOprFormItemKey && (
                    <SelectRelateInfo
                        formId={selFormId}
                        open={selectRelateInfoOpen}
                        onClose={() => {
                            setSelectRelateInfoOpen(false)
                        }}
                        selInfoCatlgList={(
                            form?.getFieldValue([
                                'relation_info',
                                'info_resource_catalogs',
                            ]) || []
                        )?.filter(
                            (item) =>
                                item &&
                                item.value &&
                                ![
                                    selectNullOption.value,
                                    invalidSelOptionVal,
                                ].includes(item.value),
                        )}
                        selInfoItems={(
                            form?.getFieldValue(curOprFormItemKey) || []
                        )?.filter(
                            (item) =>
                                item &&
                                item.value &&
                                ![
                                    selectNullOption.value,
                                    invalidSelOptionVal,
                                ].includes(item.value),
                        )}
                        onOK={(res) => {
                            setSelectRelateInfoOpen(false)
                            form?.setFieldValue(
                                curOprFormItemKey,
                                res?.map((item) => ({
                                    value: item.id,
                                    label: item.name || item.business_name,
                                    title: item?.metadata?.data_type,
                                    metadata: item?.metadata,
                                })),
                            )
                            form.validateFields([curOprFormItemKey])
                            onDataChanged()
                        }}
                    />
                )}
            </div>
        </div>
    )
})

export default BasicInfo
