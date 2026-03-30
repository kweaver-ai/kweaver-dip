import { FC, useEffect, useState } from 'react'
import { Modal, Form, Select, Radio, Tooltip } from 'antd'
import __ from '../locale'
import IntegralTypeSelect from './IntegralTypeSelect'
import styles from './styles.module.less'
import {
    DefaultIntegralRule,
    FeedBackModule,
    FeedBackModuleOptions,
    getCurrentKeyDefaultData,
    getCurrentTypeDefaultData,
    getDefaultData,
    getUnAddIntegralConfigCount,
    IntegralCondition,
    IntegralConditionOptions,
    IntegralIdMap,
    IntegralObject,
    IntegralObjectOptions,
    IntegralType,
    IntegralTypeMap,
    RequirementsModule,
    RequirementsModuleOptions,
} from '../const'
import { LabelText } from '../helper'
import IntegralNumberInput from './IntegralNumberInput'
import ExpirationSelect from './ExpirationSelect'

interface AddIntegralRuleProps {
    open: boolean
    onCancel: () => void
    onConfirm: (value) => void
    allData?: Array<any>
}
const AddIntegralRule: FC<AddIntegralRuleProps> = ({
    open,
    onCancel,
    onConfirm,
    allData = [],
}) => {
    const [form] = Form.useForm()

    const [disabledTypes, setDisabledTypes] = useState<Array<string>>([])

    useEffect(() => {
        if (open) {
            form.setFieldsValue(getDefaultData(allData))
            setDisabledTypes(
                Object.keys(IntegralTypeMap).filter(
                    (type) =>
                        !getUnAddIntegralConfigCount(type, 'type', allData),
                ),
            )
        }
    }, [open, allData])

    /**
     * 获取业务模块组件
     * @param type 积分类型
     * @returns 业务模块组件
     */
    const getBusinessModuleComponent = (type: IntegralType) => {
        if (type === IntegralType.TASK_TYPE) {
            return __('数据归集任务')
        }
        const options =
            type === IntegralType.FEEDBACK_TYPE
                ? FeedBackModuleOptions
                : RequirementsModuleOptions
        return (
            <Radio.Group>
                {options.map((option, index) => (
                    <Tooltip
                        title={
                            getUnAddIntegralConfigCount(
                                option.value,
                                'business_module',
                                allData,
                            )
                                ? ''
                                : __(
                                      '此业务模块下的规则已全部添加，不能重复添加',
                                  )
                        }
                        key={index}
                    >
                        <Radio.Button
                            value={option.value}
                            disabled={
                                !getUnAddIntegralConfigCount(
                                    option.value,
                                    'business_module',
                                    allData,
                                )
                            }
                        >
                            {option.label}
                        </Radio.Button>
                    </Tooltip>
                ))}
            </Radio.Group>
        )
    }

    /**
     * 获取积分对象组件
     * @param type 积分类型
     * @param businessModule 业务模块
     * @returns 积分对象组件
     */
    const getIntegralObjectComponent = (
        type: IntegralType,
        businessModule: string,
    ) => {
        if (type === IntegralType.TASK_TYPE) {
            return (
                <Select
                    options={IntegralObjectOptions.filter((option) =>
                        [
                            IntegralObject.TASK_EXECUTOR,
                            IntegralObject.TASK_PUBLISHER,
                        ].includes(option.value as IntegralObject),
                    ).map((item) => ({
                        ...item,
                        disabled: !getUnAddIntegralConfigCount(
                            item.value,
                            'integral_object',
                            allData,
                        ),
                        label: getUnAddIntegralConfigCount(
                            item.value,
                            'integral_object',
                            allData,
                        ) ? (
                            item.label
                        ) : (
                            <Tooltip title={__('已存在规则，不能重复添加')}>
                                {item.label}
                            </Tooltip>
                        ),
                    }))}
                />
            )
        }
        if (type === IntegralType.FEEDBACK_TYPE) {
            if (businessModule === FeedBackModule.DIR_FEEDBACK) {
                return (
                    <Select
                        options={IntegralObjectOptions.filter((option) =>
                            [
                                IntegralObject.FEEDBACK_USER,
                                IntegralObject.DIR_OF_DEPARTMENT,
                            ].includes(option.value as IntegralObject),
                        ).map((item) => ({
                            ...item,
                            disabled: !getUnAddIntegralConfigCount(
                                item.value,
                                'integral_object',
                                allData,
                            ),
                            label: getUnAddIntegralConfigCount(
                                item.value,
                                'integral_object',
                                allData,
                            ) ? (
                                item.label
                            ) : (
                                <Tooltip title={__('已存在规则，不能重复添加')}>
                                    {item.label}
                                </Tooltip>
                            ),
                        }))}
                    />
                )
            }
            return __('反馈人')
        }
        if (businessModule === RequirementsModule.REQUIREMENTS_REQUEST) {
            return __('目录所属部门')
        }
        return __('资源所属部门')
    }

    /**
     * 改变积分类型
     * @param type 积分类型
     */
    const changeType = (type: IntegralType) => {
        form.setFieldsValue({
            ...getCurrentTypeDefaultData(allData, type),
        })
    }

    const changeBusinessModule = (businessModule: string) => {
        const businessModuleData = getCurrentKeyDefaultData(
            allData,
            businessModule,
            'business_module',
        ).map((item) => IntegralIdMap[item])
        const currentType = form.getFieldValue('type')
        const canUseData = businessModuleData.filter(
            (item) => item.type === currentType,
        )
        if (canUseData.length) {
            form.setFieldsValue({
                ...canUseData[0],
            })
        }
    }
    /**
     * 改变积分对象
     * @param integralObject 积分对象
     */
    const changeIntegralObject = (integralObject: string) => {
        const businessModuleData = getCurrentKeyDefaultData(
            allData,
            integralObject,
            'integral_object',
        ).map((item) => IntegralIdMap[item])
        const currentType = form.getFieldValue('type')
        const canUseData = businessModuleData.filter(
            (item) => item.type === currentType,
        )
        if (canUseData.length) {
            form.setFieldsValue({
                ...canUseData[0],
            })
        }
    }

    const handleValuesChange = (changedFields: any, allFields: any) => {
        if (Object.keys(changedFields).includes('type')) {
            changeType(changedFields.type)
        }
        if (Object.keys(changedFields).includes('business_module')) {
            changeBusinessModule(changedFields.business_module)
        }
        if (Object.keys(changedFields).includes('integral_object')) {
            changeIntegralObject(changedFields.integral_object)
        }
    }
    return (
        <Modal
            title={__('添加积分规则')}
            open={open}
            onCancel={onCancel}
            onOk={() => {
                form.submit()
            }}
            width={640}
            maskClosable
        >
            <div className={styles.integralRuleWrapper}>
                <Form
                    form={form}
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    layout="horizontal"
                    labelAlign="left"
                    onValuesChange={handleValuesChange}
                    onFinish={(values) => {
                        onConfirm(values)
                    }}
                >
                    <Form.Item
                        name="type"
                        initialValue={IntegralType.FEEDBACK_TYPE}
                    >
                        <IntegralTypeSelect disabledTypes={disabledTypes} />
                    </Form.Item>
                    <Form.Item
                        shouldUpdate={(preValues, curValues) =>
                            preValues.type !== curValues.type
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const type = getFieldValue('type')
                            return (
                                <Form.Item
                                    label={__('业务模块')}
                                    name="business_module"
                                >
                                    {getBusinessModuleComponent(type)}
                                </Form.Item>
                            )
                        }}
                    </Form.Item>
                    <Form.Item
                        shouldUpdate={(preValues, curValues) =>
                            preValues.type !== curValues.type ||
                            preValues.business_module !==
                                curValues.business_module
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const type = getFieldValue('type')
                            const businessModule =
                                getFieldValue('business_module')
                            return (
                                <Form.Item
                                    label={__('获得积分对象')}
                                    name="integral_object"
                                >
                                    {getIntegralObjectComponent(
                                        type,
                                        businessModule,
                                    )}
                                </Form.Item>
                            )
                        }}
                    </Form.Item>

                    <Form.Item
                        label={__('获得积分条件')}
                        name="integral_condition"
                    >
                        <LabelText options={IntegralConditionOptions} />
                    </Form.Item>

                    <Form.Item
                        shouldUpdate={(preValues, curValues) =>
                            preValues.integral_condition !==
                            curValues.integral_condition
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const integralCondition =
                                getFieldValue('integral_condition')

                            return (
                                <Form.Item
                                    label={__('积分变化')}
                                    name="strategy_config"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请输入积分值'),
                                        },
                                    ]}
                                >
                                    <IntegralNumberInput
                                        isScoring={
                                            integralCondition ===
                                            IntegralCondition.CATALOG_SCORING
                                        }
                                    />
                                </Form.Item>
                            )
                        }}
                    </Form.Item>
                    <Form.Item label={__('规则有效期')} name="strategy_period">
                        <ExpirationSelect />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    )
}

export default AddIntegralRule
