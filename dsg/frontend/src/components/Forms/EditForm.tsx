import * as react from 'react'
import { useState, useEffect } from 'react'
import { Modal, Input, Form, Select, message, Radio, Spin } from 'antd'
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
import { DataRange, Cycles, CyclesOptions, DataRangeOptions } from './const'
import {
    formsEdit,
    getFormInfo,
    formatError,
    reqInfoSystemList,
    updReqStdTableName,
} from '@/core'
import { checkNameRepeat } from './helper'
import { TipsLabel } from '../ResourcesDir/BaseInfo'
import Icons from '../BusinessArchitecture/Icons'
import { ErrorInfo } from '@/utils'
import { Architecture } from '../BusinessArchitecture/const'

const defaultQueryParams = {
    direction: 'desc',
    keyword: '',
    limit: 2000,
    offset: 1,
}

interface EditFormType {
    data?: any
    okText?: string
    formId: string
    onClose: () => void
    mid: string
    onUpdate: () => void
    taskId?: string
}
const EditForm = ({
    data,
    onClose,
    formId,
    okText = __('确定'),
    onUpdate,
    mid,
    taskId = '',
}: EditFormType) => {
    const [form] = Form.useForm()
    const [formData, setFormData] = useState<any>(data)
    const [loading, setLoading] = useState<boolean>(false)
    const [showSharedCondition, setShowSharedCondition] =
        useState<boolean>(true)
    const [showSharedConditionIpt, setShowSharedConditionIpt] =
        useState<boolean>(false)
    const [showOpenType, setShowOpenType] = useState<boolean>(false)

    const [queryParams, setQueryParams] = useState<any>(defaultQueryParams)

    const [systemOptions, setSystemOptions] = useState<Array<any>>([])

    const [systemLoading, setSystemLoading] = useState<boolean>(true)

    const [systemKeyword, setSystemKeyword] = useState<string>('')

    useEffect(() => {
        initForm()
    }, [data])

    useEffect(() => {
        form.setFieldsValue(formData)
    }, [formData])

    const initForm = async () => {
        const info = await getFormInfo(mid, formId)
        sharedTypeChange(info.shared_attribute)
        setShowOpenType(info.open_attribute === 'open')
        setShowSharedCondition(info.shared_attribute !== 'not_share')
        setFormData({
            name: info.name,
            description: info.description,
            guideline: info.guideline || '',
            data_range: info.data_range,
            update_cycle: info.update_cycle || undefined,
            resource_tag: info.resource_tag || [],
            source: info.source,
            source_system:
                info.source_system?.map((systemInfo) => systemInfo.id) || [],
            source_business_scene: info.source_business_scene || [],
            related_business_scene: info.related_business_scene || [],
            shared_attribute: info.shared_attribute || 'share_no_conditions',
            shared_condition: info.shared_condition,
            shared_mode: info.shared_mode || 'platform',
            open_attribute: info.open_attribute || 'not_open',
            open_condition: info.open_condition,
        })
    }

    useEffect(() => {
        getInfoSystems()
    }, [])

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
    /**
     * 发请求
     * @param values
     */
    const onFinish = async (values) => {
        try {
            setLoading(true)
            const source_system = values?.source_system
            await formsEdit(mid, formId, {
                ...formData,
                ...values,
                task_id: taskId,
                source_system,
                update_cycle: values.update_cycle || '',
            })
            // 修改名称，则修改新建标准表名称
            if (values?.name !== formData?.name) {
                await updReqStdTableName(formId, values.name)
            }
            onUpdate()
            message.success(__('编辑成功'))
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
            title={__('编辑业务表基本信息')}
            open
            bodyStyle={{ maxHeight: 444, overflow: 'auto' }}
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
                {/* <div className={styles.dataItem}>
                    <Form.Item
                        label={__('数据范围')}
                        required
                        name="data_range"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                message: __('请选择数据范围'),
                            },
                        ]}
                    >
                        <Select
                            placeholder={__('请选择数据范围')}
                            options={DataRangeOptions}
                            getPopupContainer={(node) => node.parentNode}
                        />
                    </Form.Item>
                </div> */}
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
                                    checkNameRepeat(mid, value, formId),
                            },
                        ]}
                    >
                        <Input
                            placeholder={__('请输入业务表名称')}
                            autoComplete="off"
                            maxLength={128}
                        />
                    </Form.Item>
                </div>
                <Form.Item
                    label={__('来源')}
                    name="source"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                >
                    <Radio.Group>
                        <Radio value={SourceType.Online}>{__('线上')}</Radio>
                        <Radio value={SourceType.Offline}>{__('线下')}</Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item
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
                                    mode="tags"
                                    allowClear
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
                                    showArrow
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
                </Form.Item>
                <div className={styles.dataItem}>
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
                </div>
                <div className={styles.dataItem}>
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
                </div>
                {showSharedCondition && (
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
                )}
                <div className={styles.dataItem}>
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
                </div>
                <div className={styles.dataItem}>
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
                </div>
                <div className={styles.dataItem}>
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
                </div>
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
            </Form>
        </Modal>
    )
}

export default EditForm
