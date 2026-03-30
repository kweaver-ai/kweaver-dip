import * as react from 'react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    Modal,
    Input,
    Form,
    Select,
    message,
    Radio,
    Spin,
    Slider,
    Row,
    Col,
    Checkbox,
} from 'antd'
import { trim } from 'lodash'
import __ from './locale'
import { validateName, keyboardInputValidator } from '@/utils/validate'
import {
    checkNameCorrect,
    checkNormalInput,
    OpenAttributeOption,
    SharedModeOption,
    SharedAttributeOption,
    SharedAttribute,
    SharedMode,
    OpenAttribute,
    SourceType,
} from '../FormGraph/helper'
import styles from './styles.module.less'
import {
    DataRange,
    Cycles,
    CyclesOptions,
    DataRangeOptions,
    NewFormType,
    FormTableKindOptions,
    dataKindOptions,
    changeToOptions,
    FormTableKind,
} from './const'
import {
    formsCreate,
    formsEdit,
    formatError,
    TaskType,
    reqInfoSystemList,
    getCoreBusinessDetails,
} from '@/core'
import { checkNameRepeat } from './helper'
import { TipsLabel } from '../ResourcesDir/BaseInfo'
import { getActualUrl, ErrorInfo } from '@/utils'
import Icons from '../BusinessArchitecture/Icons'
import { Architecture } from '../BusinessArchitecture/const'
import BusinessTagsSelect from './BusinessTagsSelect'
import SelFileByType from '@/components/CAFileManage/SelFileByType'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

const defaultQueryParams = {
    direction: 'desc',
    keyword: '',
    limit: 2000,
    offset: 1,
}

interface CreateFormType {
    visible?: boolean
    data?: any
    jumpUrl?: string
    okText?: string
    node_id?: string
    flowchart_id?: string
    onClose: () => void
    mid: string
    onUpdate: (vals?: any) => void
    taskId?: string
    taskType?: TaskType
    formType?: NewFormType
    formInfo?: any
    isJump?: boolean
    jumpWithWindow?: boolean
    configEnum?: any
    onlyShowTableKind?: FormTableKind
    title?: string
}
const CreateForm = ({
    visible = true,
    data,
    jumpUrl,
    onClose,
    node_id = '',
    flowchart_id = '',
    okText = __('确定'),
    onUpdate,
    mid,
    taskId = '',
    taskType,
    formType = NewFormType.BLANK,
    formInfo,
    isJump = true,
    jumpWithWindow = false,
    configEnum,
    onlyShowTableKind,
    title,
}: CreateFormType) => {
    const [form] = Form.useForm()
    const [formData, setFormData] = useState<any>(data)
    const [loading, setLoading] = useState<boolean>(false)
    const navigator = useNavigate()
    const redirect = useLocation()
    const businessTagsSelectRef: any = useRef()
    const [showSharedCondition, setShowSharedCondition] =
        useState<boolean>(true)
    const [showSharedConditionIpt, setShowSharedConditionIpt] =
        useState<boolean>(false)
    const [showOpenType, setShowOpenType] = useState<boolean>(false)

    const [queryParams, setQueryParams] = useState<any>(defaultQueryParams)

    const [systemOptions, setSystemOptions] = useState<Array<any>>([])

    const [systemLoading, setSystemLoading] = useState<boolean>(true)

    const [systemKeyword, setSystemKeyword] = useState<string>('')
    // 基础信息分类
    const [dataKindOptionsList, setDataKindOptionsList] =
        useState<any[]>(dataKindOptions)
    const [dataRangeOptionsList, setDataRangeOptionsList] =
        useState<any[]>(DataRangeOptions)
    const [tableKindOptionsList, setTableKindOptionsList] = useState<any[]>(
        FormTableKindOptions.filter(
            (item) =>
                item.value === FormTableKind.BUSINESS ||
                (!node_id && item.value === FormTableKind.STANDARD),
        ),
    )
    const [tagSum, setTagSum] = useState<number>(0)
    const {
        isDraft,
        selectedVersion,
        refreshDraft,
        refreshCoreBusinessDetails,
    } = useBusinessModelContext()

    useEffect(() => {
        if (data) {
            setShowOpenType(data.open_attribute === 'not_open')
            setShowSharedCondition(data.shared_attribute !== 'not_share')
        }
        setFormData(data)
    }, [data])
    useEffect(() => {
        getInfoSystems()
    }, [])

    useEffect(() => {
        if (configEnum) {
            setDataKindOptionsList(changeToOptions(configEnum.data_kind))
            setDataRangeOptionsList(changeToOptions(configEnum.data_range))
            // ToDd 待数据工程结束
            // setTableKindOptionsList(
            //     changeToOptions(configEnum.model_table_kind),
            // )
        }
    }, [configEnum])

    // 获取信息系统
    const getInfoSystems = async () => {
        try {
            setSystemLoading(true)
            const { entries, total_count } = await reqInfoSystemList(
                queryParams,
            )
            setSystemOptions(
                entries.map((systemInfo) => ({
                    label: (
                        <div
                            className={styles.systemItem}
                            title={systemInfo.name}
                        >
                            <Icons type={Architecture.BSYSTEM} />
                            <span className={styles.name}>
                                {systemInfo.name}
                            </span>
                        </div>
                    ),
                    value: systemInfo.id,
                    name: systemInfo.name,
                })),
            )
        } catch (err) {
            formatError(err)
        } finally {
            setSystemLoading(false)
        }
    }

    // 完善业务表时回显表名
    useEffect(() => {
        if (onlyShowTableKind) {
            form.setFieldsValue({
                name: formInfo?.name,
                table_kind: onlyShowTableKind,
            })
        } else {
            form.setFieldsValue({ name: formInfo?.name })
        }
    }, [formInfo, onlyShowTableKind])

    // 获取草稿状态
    const getDraft = async () => {
        try {
            const res = await getCoreBusinessDetails(mid)
            if (res.has_draft !== undefined && res.has_draft !== isDraft) {
                refreshDraft?.(res.has_draft)
            }
            refreshCoreBusinessDetails?.(res)
            return res.has_draft
        } catch (err) {
            formatError(err)
            return isDraft
        }
    }

    /**
     * 发请求
     * @param values
     */
    const onFinish = async (values) => {
        try {
            setLoading(true)

            if (formType === NewFormType.BLANK) {
                const currentForm = await formsCreate(mid, {
                    ...values,
                    node_id,
                    task_id: taskId,
                    flowchart_id,
                    update_cycle: values.update_cycle || '',
                })
                // 由于新建操作会导致草稿状态变更，因此此处更新草稿状态
                const newDraft = await getDraft()
                onUpdate()
                message.success(__('新建成功'))
                if (jumpUrl) {
                    const url = `/formGraph/view?mid=${mid}&fid=${
                        currentForm[0].id
                    }&redirect=${
                        redirect.pathname
                    }&defaultModel=edit&taskId=${taskId}&${jumpUrl}&jumpMode=${
                        jumpWithWindow ? 'win' : 'nav'
                    }&isDraft=${newDraft}&versionId=${selectedVersion}`
                    if (jumpWithWindow) {
                        window.open(getActualUrl(url), '_self')
                        return
                    }
                    navigator(url)
                } else {
                    const url = redirect.search
                        ? `/formGraph/view${redirect.search}&mid=${mid}&fid=${
                              currentForm[0].id
                          }&redirect=${
                              redirect.pathname
                          }&defaultModel=edit&taskId=${taskId}&targetTab=form&Task=${taskType}&jumpMode=${
                              jumpWithWindow ? 'win' : 'nav'
                          }&isDraft=${newDraft}&versionId=${selectedVersion}`
                        : `/formGraph/view?mid=${mid}&fid=${
                              currentForm[0].id
                          }&redirect=${
                              redirect.pathname
                          }&defaultModel=edit&taskId=${taskId}&targetTab=form&Task=${taskType}&jumpMode=${
                              jumpWithWindow ? 'win' : 'nav'
                          }&isDraft=${newDraft}&versionId=${selectedVersion}`
                    if (jumpWithWindow) {
                        window.open(getActualUrl(url), '_self')
                        return
                    }
                    navigator(url)
                }
            } else {
                // 编辑业务表 跳转进入画布
                const currentForm = await formsEdit(mid, formInfo.id, {
                    ...values,
                    task_id: taskId,
                })
                onUpdate(values)
                message.success(__('编辑成功'))
                if (isJump) {
                    if (jumpUrl) {
                        const url = `/formGraph/importFromDS?mid=${mid}&fid=${
                            currentForm[0].id
                        }&dfid=${formInfo.from_table_id}&redirect=${
                            redirect.pathname
                        }&defaultModel=edit&taskId=${taskId}&targetTab=form&Task=${taskType}&${jumpUrl}&jumpMode=${
                            jumpWithWindow ? 'win' : 'nav'
                        }&isDraft=${isDraft}&versionId=${selectedVersion}`
                        if (jumpWithWindow) {
                            window.open(getActualUrl(url), '_self')
                            return
                        }
                        navigator(url)
                    } else {
                        const url = redirect.search
                            ? `/formGraph/importFromDS${
                                  redirect.search
                              }&mid=${mid}&fid=${currentForm[0].id}&dfid=${
                                  formInfo.from_table_id
                              }&redirect=${
                                  redirect.pathname
                              }&defaultModel=edit&taskId=${taskId}&targetTab=form&Task=${taskType}&jumpMode=${
                                  jumpWithWindow ? 'win' : 'nav'
                              }&isDraft=${isDraft}&versionId=${selectedVersion}`
                            : `/formGraph/importFromDS?mid=${mid}&fid=${
                                  currentForm[0].id
                              }&dfid=${formInfo.from_table_id}&redirect=${
                                  redirect.pathname
                              }&defaultModel=edit&taskId=${taskId}&targetTab=form&Task=${taskType}&jumpMode=${
                                  jumpWithWindow ? 'win' : 'nav'
                              }&isDraft=${isDraft}&versionId=${selectedVersion}`
                        if (jumpWithWindow) {
                            window.open(getActualUrl(url), '_self')
                            return
                        }
                        navigator(url)
                    }
                }
            }

            onClose()
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }
    // 共享属性 切换
    const sharedTypeChange = (value) => {
        if (value) {
            setShowSharedCondition(value !== 'not_share')
            setShowSharedConditionIpt(value !== 'share_no_conditions')
            if (value === 'not_share') {
                form.setFieldValue('open_attribute', 'not_open')
                openTypeChange('not_open')
            }
        }
    }
    // 开放属性 切换
    const openTypeChange = (value) => {
        setShowOpenType(value === 'open')
    }

    return (
        <Modal
            width={640}
            title={
                title ||
                (formType === NewFormType.BLANK
                    ? __('新建业务表')
                    : __('完善业务表'))
            }
            open={visible}
            bodyStyle={{ maxHeight: 550, overflow: 'auto' }}
            maskClosable={false}
            onCancel={() => {
                onClose()
            }}
            onOk={() => form.submit()}
            destroyOnClose
            getContainer={false}
            okText={okText}
            okButtonProps={{ loading }}
            className={styles.createform}
        >
            <Form
                form={form}
                initialValues={data}
                onFinish={onFinish}
                layout="vertical"
                autoComplete="off"
            >
                <div className={styles.dataItem}>
                    <Form.Item
                        label={__('业务表名称')}
                        required
                        name="name"
                        validateFirst
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                message: ErrorInfo.NOTNULL,
                                transform: (value: string) => trim(value),
                                // validator: validateName(),
                            },
                            // {
                            //     validateTrigger: ['onBlur'],
                            //     validator: (e, value) =>
                            //         checkNameCorrect(e, value),
                            // },
                            {
                                validateTrigger: ['onBlur'],
                                validator: (e, value) =>
                                    checkNameRepeat(mid, value, formInfo?.id),
                            },
                        ]}
                    >
                        <Input
                            placeholder={__('请输入业务表名称')}
                            autoComplete="off"
                            maxLength={128}
                            onBlur={() => {
                                businessTagsSelectRef?.current?.getRecommendList()
                            }}
                        />
                    </Form.Item>
                </div>
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            label={__('类型')}
                            name="table_kind"
                            validateFirst
                            validateTrigger={['onChange', 'onBlur']}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择类型'),
                                },
                            ]}
                            initialValue={
                                node_id ? FormTableKind.BUSINESS : undefined
                            }
                        >
                            <Select
                                options={tableKindOptionsList}
                                placeholder={__('请选择类型')}
                                disabled={!!onlyShowTableKind}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('数据区域范围')}
                            name="data_range"
                            validateFirst
                            validateTrigger={['onChange', 'onBlur']}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择数据区域范围'),
                                },
                            ]}
                        >
                            <Select
                                options={dataRangeOptionsList}
                                placeholder={__('请选择数据区域范围')}
                            />
                        </Form.Item>
                    </Col>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, current) =>
                            prev.table_kind !== current.table_kind
                        }
                    >
                        {({ getFieldValue }) => {
                            const table_kind = getFieldValue('table_kind')
                            return (
                                table_kind === FormTableKind.STANDARD && (
                                    <Col span={24}>
                                        <Form.Item
                                            label={__('关联标准文件')}
                                            name="stand_file_ids"
                                        >
                                            <SelFileByType />
                                        </Form.Item>
                                    </Col>
                                )
                            )
                        }}
                    </Form.Item>
                </Row>
                <Form.Item label={__('基础信息分类')} name="data_kind">
                    <Checkbox.Group options={dataKindOptionsList} />
                </Form.Item>
                {/* <Form.Item
                    label={__('来源')}
                    name="source"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    initialValue={SourceType.Online}
                >
                    <Radio.Group>
                        <Radio value={SourceType.Online}>{__('线上')}</Radio>
                        <Radio value={SourceType.Offline}>{__('线下')}</Radio>
                    </Radio.Group>
                </Form.Item> */}
                {/* <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, curValues) =>
                        prevValues?.resource_tag !== curValues?.resource_tag ||
                        prevValues.source !== curValues.source
                    }
                >
                    {({ getFieldValue, setFieldValue }) => {
                        const source = getFieldValue('source')
                        return source === SourceType.Online ? (
                            <Form.Item
                                label={__('关联信息系统')}
                                name="source_system"
                            >
                                <Select
                                    options={systemOptions}
                                    placeholder={__('请选择关联信息系统')}
                                    mode="multiple"
                                    allowClear
                                    showArrow
                                    showSearch
                                    onSearch={(value) => {
                                        if (value.length <= 128) {
                                            setSystemKeyword(value)
                                        }
                                    }}
                                    optionLabelProp="name"
                                    maxTagTextLength={10}
                                    maxTagCount={3}
                                    searchValue={systemKeyword}
                                    // onPopupScroll={getModelByScroll}
                                    filterOption
                                    optionFilterProp="name"
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                    notFoundContent={
                                        systemLoading ? (
                                            <Spin />
                                        ) : systemKeyword ? (
                                            __('抱歉，未找到匹配的结果')
                                        ) : (
                                            __('暂无数据')
                                        )
                                    }
                                />
                            </Form.Item>
                        ) : null
                    }}
                </Form.Item> */}
                {/* <div className={styles.dataItem}>
                    <Form.Item
                        validateFirst
                        label={TipsLabel({
                            label: __('共享属性'),
                            // tips: '请输入该目录向其他政务部门共享的情况',
                        })}
                        name="shared_attribute"
                        initialValue={SharedAttribute.UnconditionalShare}
                    >
                        <Radio.Group
                            onChange={(value) => {
                                form.setFieldValue('shared_condition', '')
                                sharedTypeChange(value?.target?.value)
                            }}
                        >
                            {SharedAttributeOption.map((item) => (
                                <Radio value={item.value} key={item.value}>
                                    {item.label}
                                </Radio>
                            ))}
                        </Radio.Group>
                    </Form.Item>
                </div> */}
                {/* <div className={styles.dataItem}>
                    {showSharedConditionIpt && (
                        <Form.Item
                            label={TipsLabel({
                                label: showSharedCondition
                                    ? __('共享条件')
                                    : __('不予共享依据'),
                                // tips: '请输入该目录向其他政务部门共享的情况',
                            })}
                            name="shared_condition"
                            rules={[
                                {
                                    required: true,
                                    message: `请输入${
                                        showSharedCondition
                                            ? __('共享条件')
                                            : __('不予共享依据')
                                    }`,
                                },
                                {
                                    validator: keyboardInputValidator(),
                                },
                            ]}
                            validateFirst
                        >
                            <Input
                                maxLength={128}
                                placeholder={`${__('请输入')}${
                                    showSharedCondition
                                        ? __('共享条件')
                                        : __('不予共享依据')
                                }`}
                            />
                        </Form.Item>
                    )}
                </div> */}
                {/* {showSharedCondition && (
                    <Form.Item
                        label={TipsLabel({
                            label: __('共享方式'),
                            // tips: '请选择获取资源的方式，原则上通过共享平台方式获取，确因条件所限可采用邮件、介质交换方式',
                        })}
                        name="shared_mode"
                        validateFirst
                        initialValue={SharedMode.Platform}
                    >
                        <Radio.Group>
                            {SharedModeOption.map((item) => (
                                <Radio value={item.value} key={item.value}>
                                    {item.label}
                                </Radio>
                            ))}
                        </Radio.Group>
                    </Form.Item>
                )} */}
                {/* <div className={styles.dataItem}>
                    <Form.Item
                        label={TipsLabel({
                            label: __('开放属性'),
                            // tips: '该资源是否对社会公众开放',
                        })}
                        name="open_attribute"
                        validateFirst
                        initialValue={OpenAttribute.NotOpen}
                    >
                        <Radio.Group
                            disabled={!showSharedCondition}
                            onChange={(value) =>
                                openTypeChange(value?.target?.value)
                            }
                        >
                            {OpenAttributeOption.map((item) => (
                                <Radio value={item.value} key={item.value}>
                                    {item.label}
                                </Radio>
                            ))}
                        </Radio.Group>
                    </Form.Item>
                </div> */}
                {/* <div className={styles.dataItem}>
                    {showOpenType && (
                        <Form.Item
                            label={__('开放条件')}
                            name="open_condition"
                            rules={[
                                {
                                    validator: keyboardInputValidator(),
                                },
                            ]}
                        >
                            <Input
                                maxLength={128}
                                placeholder={`${__('请输入')}${__('开放条件')}`}
                            />
                        </Form.Item>
                    )}
                </div> */}
                {/* <div className={styles.dataItem}>
                    <Form.Item
                        label={__('更新周期')}
                        name="update_cycle"
                        validateTrigger={['onChange', 'onBlur']}
                    >
                        <Select
                            placeholder={__('请选择更新周期')}
                            options={CyclesOptions}
                            getPopupContainer={(node) => node.parentNode}
                            allowClear
                        />
                    </Form.Item>
                </div> */}
                <Form.Item
                    label={__('描述')}
                    name="description"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            transform: (value: string) => trim(value),
                            // validateTrigger: ['onBlur'],
                            // validator: (e, value) => checkNormalInput(e, value),
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder={__('请输入描述')}
                        style={{
                            height: `100px`,
                            resize: 'none',
                        }}
                        autoComplete="off"
                        maxLength={255}
                        autoSize={false}
                    />
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => {
                        const name = getFieldValue('name')
                        const desc = getFieldValue('description')
                        return (
                            <Form.Item
                                label={__('业务标签（${sum}/5）', {
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
                                            range_type: '1',
                                            desc,
                                        },
                                    ]}
                                />
                            </Form.Item>
                        )
                    }}
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default CreateForm
