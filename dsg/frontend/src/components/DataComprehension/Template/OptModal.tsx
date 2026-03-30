import {
    Button,
    Collapse,
    Drawer,
    Form,
    Input,
    Space,
    Switch,
    message,
} from 'antd'
import { trim } from 'lodash'
import moment from 'moment'
import { useContext, useEffect, useState } from 'react'
import { CaretRightOutlined, InfoCircleOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import { MicroWidgetPropsContext } from '@/context'
import {
    checkNameComprehensionTemplate,
    createComprehensionTemplate,
    formatError,
    getComprehensionTemplateDetail,
    updateComprehensionTemplate,
} from '@/core'
import { Loader } from '@/ui'
import { ErrorInfo, keyboardReg, nameReg, validateName } from '@/utils'
import {
    AllCheckKeys,
    CheckDataMap,
    CheckMap,
    ConfigType,
    TipConfigMap,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'
import ConfigPop from './ConfigPop'
import MixedCheckBoxGroup from './MixedCheckBoxGroup'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

const { Panel } = Collapse

const OptModal = ({ id, onClose }: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<boolean>(false)
    const [switchChecked, setSwitchChecked] = useState<{
        businessObject: boolean
        businessMetric: boolean
        businessRule: boolean
    }>({
        businessObject: false,
        businessMetric: false,
        businessRule: false,
    })

    const [detail, setDetail] = useState<any>()
    const getDetail = async () => {
        try {
            const res = await getComprehensionTemplateDetail(id)
            setDetail(res)
        } catch (err) {
            formatError(err)
        }
    }

    const handleReset = () => {
        form?.setFieldsValue({
            businessObject: CheckMap[ConfigType.BizObj],
            businessMetric: CheckMap[ConfigType.BizIndicator],
            businessRule: CheckMap[ConfigType.BizRule],
        })
        setSwitchChecked({
            businessObject: true,
            businessMetric: true,
            businessRule: true,
        })
    }

    useEffect(() => {
        if (!id && form) {
            handleReset()
        }
    }, [id, form])

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

    useEffect(() => {
        if (detail) {
            const { name, description, template_config } = detail
            const keys = Object.keys(template_config || {}).filter(
                (o) => template_config[o],
            )

            const infos = {
                businessObject: CheckMap[ConfigType.BizObj].filter((o) =>
                    keys.includes(o),
                ),
                businessMetric: CheckMap[ConfigType.BizIndicator].filter((o) =>
                    keys.includes(o),
                ),
                businessRule: CheckMap[ConfigType.BizRule].filter((o) =>
                    keys.includes(o),
                ),
            }
            form?.setFieldsValue({
                name,
                description,
                ...infos,
            })

            setSwitchChecked({
                businessObject: infos.businessObject.length > 0,
                businessMetric: infos.businessMetric.length > 0,
                businessRule: infos.businessRule.length > 0,
            })
        } else {
            form?.resetFields()
            handleReset()
        }
    }, [detail])

    const validateNameRepeat = (fid?: string) => {
        return (_: any, value: string) => {
            return new Promise((resolve, reject) => {
                const trimValue = trim(value)
                if (!trimValue) {
                    reject(new Error(__('输入不能为空')))
                    return
                }
                if (trimValue && !nameReg.test(trimValue)) {
                    reject(new Error(__('仅支持中英文、数字、下划线及中划线')))
                    return
                }
                const errorMsg = __('该名称已存在，请重新输入')
                checkNameComprehensionTemplate({
                    name: trimValue,
                    id: fid,
                })
                    .then((res) => {
                        resolve(1)
                    })
                    .catch(() => {
                        reject(new Error(errorMsg))
                    })
            })
        }
    }

    const onFinish = async (values) => {
        const { businessObject, businessMetric, businessRule, ...rest } = values
        if (
            !businessObject?.length &&
            !businessMetric?.length &&
            !businessRule?.length
        ) {
            message.error('请至少配置一个理解纬度')
            setError(true)
            return
        }
        const params = {
            ...rest,
            template_config: AllCheckKeys.reduce((prev, cur) => {
                return {
                    ...prev,
                    [cur]: [
                        ...(businessObject || []),
                        ...(businessMetric || []),
                        ...(businessRule || []),
                    ].includes(cur),
                }
            }, {}),
        }
        try {
            const tip = id ? __('更新成功') : __('新建成功')

            if (id) {
                await updateComprehensionTemplate(id, params)
            } else {
                await createComprehensionTemplate(params)
            }

            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast.success(tip)
            } else {
                message.success(tip)
            }
            onClose?.(true)
        } catch (err) {
            formatError(err, microWidgetProps?.components?.toast)
        }
    }

    // 处理父级 Switch 全选/取消全选
    const handleSwitchAll = (block, options) => (isOpen) => {
        form.setFieldsValue({ [block]: isOpen ? options : [] })
        setSwitchChecked((prev) => ({ ...prev, [block]: isOpen }))
    }

    useEffect(() => {
        if (Object.values(switchChecked).includes(true)) {
            setError(false)
        }
    }, [switchChecked])

    const handleCheckBoxChange = (block) => (checkedValue) => {
        form.setFieldsValue({ [block]: checkedValue })
        setSwitchChecked((prev) => ({
            ...prev,
            [block]: checkedValue?.length > 0,
        }))
    }

    return (
        <Drawer
            open
            title={
                <span style={{ fontWeight: 550, fontSize: 16 }}>
                    {id ? __('编辑模板') : __('新建模板')}
                </span>
            }
            placement="right"
            onClose={onClose}
            maskClosable={false}
            width={420}
            footer={
                <div className={styles.drawerFootWrapper}>
                    <Space size={8}>
                        <Button onClick={onClose} className={styles.btn}>
                            {__('取消')}
                        </Button>
                        <Button
                            onClick={() => {
                                // setExpandStatus(true)
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
                <div
                    className={classNames(
                        styles.configFormWrapper,
                        error && styles.noCheck,
                    )}
                >
                    <Form
                        form={form}
                        onFinish={onFinish}
                        layout="vertical"
                        autoComplete="off"
                    >
                        <div className={styles.moduleTitle}>
                            <h4>{__('基本信息')}</h4>
                        </div>
                        <Form.Item
                            label={__('数据理解模板名称')}
                            name="name"
                            validateTrigger={['onChange', 'onBlur']}
                            validateFirst
                            rules={[
                                {
                                    required: true,
                                    validateTrigger: 'onChange',
                                    validator: validateName(),
                                },
                                {
                                    validateTrigger: 'onBlur',
                                    validator: validateNameRepeat(id),
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={128} />
                        </Form.Item>
                        <Form.Item
                            label={__('描述')}
                            name="description"
                            rules={[
                                {
                                    pattern: keyboardReg,
                                    message: ErrorInfo.EXCEPTEMOJI,
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={255} />
                        </Form.Item>
                        <div className={styles.moduleTitle}>
                            <h4>{__('配置信息')}</h4>
                        </div>

                        <Collapse
                            // eslint-disable-next-line react/no-unstable-nested-components
                            expandIcon={({ isActive }) => (
                                <CaretRightOutlined
                                    rotate={isActive ? 90 : 0}
                                />
                            )}
                        >
                            {/* 业务对象 */}
                            <Panel
                                forceRender
                                header={
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FontIcon
                                            className={styles.titleIcon}
                                            type={IconType.COLOREDICON}
                                            name="icon-L3-new2"
                                        />
                                        <span>{__('业务对象')}</span>
                                        <ConfigPop
                                            {...TipConfigMap[ConfigType.BizObj]}
                                        >
                                            <InfoCircleOutlined
                                                style={{ marginLeft: 8 }}
                                            />
                                        </ConfigPop>
                                        <Switch
                                            style={{ marginLeft: 'auto' }}
                                            checked={
                                                switchChecked.businessObject
                                            }
                                            onClick={handleSwitchAll(
                                                'businessObject',
                                                CheckMap[ConfigType.BizObj],
                                            )}
                                        />
                                    </div>
                                }
                                key="businessObject"
                            >
                                <Form.Item name="businessObject">
                                    <MixedCheckBoxGroup
                                        options={
                                            CheckDataMap[ConfigType.BizObj]
                                        }
                                        onChange={handleCheckBoxChange(
                                            'businessObject',
                                        )}
                                    />
                                </Form.Item>
                            </Panel>
                        </Collapse>
                        <Collapse
                            // eslint-disable-next-line react/no-unstable-nested-components
                            expandIcon={({ isActive }) => (
                                <CaretRightOutlined
                                    rotate={isActive ? 90 : 0}
                                />
                            )}
                        >
                            {/* 业务指标 */}
                            <Panel
                                forceRender
                                header={
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FontIcon
                                            className={styles.titleIcon}
                                            type={IconType.COLOREDICON}
                                            name="icon-zhibiaoxi"
                                        />
                                        <span>{__('业务指标')}</span>
                                        <ConfigPop
                                            {...TipConfigMap[
                                                ConfigType.BizIndicator
                                            ]}
                                        >
                                            <InfoCircleOutlined
                                                style={{ marginLeft: 8 }}
                                            />
                                        </ConfigPop>
                                        <Switch
                                            style={{ marginLeft: 'auto' }}
                                            checked={
                                                switchChecked.businessMetric
                                            }
                                            onClick={handleSwitchAll(
                                                'businessMetric',
                                                CheckMap[
                                                    ConfigType.BizIndicator
                                                ],
                                            )}
                                        />
                                    </div>
                                }
                                key="businessMetric"
                            >
                                <Form.Item name="businessMetric">
                                    <MixedCheckBoxGroup
                                        options={
                                            CheckDataMap[
                                                ConfigType.BizIndicator
                                            ]
                                        }
                                        onChange={handleCheckBoxChange(
                                            'businessMetric',
                                        )}
                                    />
                                </Form.Item>
                            </Panel>
                        </Collapse>
                        <Collapse
                            // eslint-disable-next-line react/no-unstable-nested-components
                            expandIcon={({ isActive }) => (
                                <CaretRightOutlined
                                    rotate={isActive ? 90 : 0}
                                />
                            )}
                        >
                            {/* 业务规则 */}
                            <Panel
                                forceRender
                                header={
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FontIcon
                                            className={styles.titleIcon}
                                            type={IconType.COLOREDICON}
                                            name="icon-shenqingdan"
                                        />
                                        <span>{__('业务规则')}</span>
                                        <ConfigPop
                                            {...TipConfigMap[
                                                ConfigType.BizRule
                                            ]}
                                        >
                                            <InfoCircleOutlined
                                                style={{ marginLeft: 8 }}
                                            />
                                        </ConfigPop>
                                        <Switch
                                            style={{ marginLeft: 'auto' }}
                                            checked={switchChecked.businessRule}
                                            onClick={handleSwitchAll(
                                                'businessRule',
                                                CheckMap[ConfigType.BizRule],
                                            )}
                                        />
                                    </div>
                                }
                                key="businessRule"
                            >
                                <Form.Item name="businessRule">
                                    <MixedCheckBoxGroup
                                        options={
                                            CheckDataMap[ConfigType.BizRule]
                                        }
                                        onChange={handleCheckBoxChange(
                                            'businessRule',
                                        )}
                                    />
                                </Form.Item>
                            </Panel>
                        </Collapse>
                    </Form>
                </div>
            )}
        </Drawer>
    )
}

export default OptModal
