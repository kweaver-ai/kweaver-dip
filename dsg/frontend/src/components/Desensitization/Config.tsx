import {
    Drawer,
    Form,
    Input,
    Select,
    Radio,
    DrawerProps,
    Row,
    Col,
    Button,
    RadioChangeEvent,
    Divider,
    InputNumber,
    Space,
} from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'antd/lib/form/Form'
import styles from './styles.module.less'
import __ from './locale'
import {
    CatalogType,
    createDesenRule,
    excuteDesenRule,
    formatError,
    getBuiltInDesenAlgo,
    getCodeRuleDetails,
    updateDesenRule,
} from '@/core'
import SelDataByTypeModal from '../SelDataByTypeModal'
import CodeRuleDetails from '../CodeRulesComponent/CodeRuleDetails'
import AlgorithmTemplateModal from './AlgorithmTemplateModal'

const { Item } = Form
const { TextArea } = Input
const { Option } = Select
const { Group } = Radio

enum AlgorithmType {
    CUSTOM = 'custom',
    BUILTIN = 'built-in',
}

export enum DesenMethods {
    ALL = 'all',
    BAE = 'head-tail',
    CENTER = 'middle',
}

const opts = [
    { label: __('自定义算法'), value: AlgorithmType.CUSTOM },
    { label: __('使用内置算法'), value: AlgorithmType.BUILTIN },
]

export const methods = [
    {
        label: __('全部脱敏'),
        desc: __('数据全部替换为*，示例：**********'),
        value: DesenMethods.ALL,
    },
    {
        label: __('首尾脱敏'),
        desc: __('首尾内容替换为*，中间内容可正常展示，示例：***4567***'),
        value: DesenMethods.BAE,
    },
    {
        label: __('中间脱敏'),
        desc: __('中间内容替换为*，首尾内容可正常展示，示例：123****890'),
        value: DesenMethods.CENTER,
    },
]

// const builtInAlgos = [
//     { label: __('身份证'), value: 'idcard' },
//     { label: __('手机号'), value: 'phone' },
//     { label: __('邮箱'), value: 'email' },
//     { label: __('银行卡号'), value: 'bank' },
// ]

export interface DesensitizationStruct {
    name: string
    type: AlgorithmType
    inner_type: string
    algorithm: string
    method: DesenMethods
    description?: string
    middle_bit?: number
    tail_bit?: number
    head_bit?: number
}

export type DesensitizationRecord = DesensitizationStruct & { id: string }

export type ExcutionRule = Omit<
    DesensitizationStruct,
    'name' | 'type' | 'inner_type' | 'description'
> & { text: string }

interface CreationProps extends DrawerProps {
    data?: DesensitizationRecord
    onOk?: () => void
}
const Config = (props: CreationProps) => {
    const { onClose, onOk, data, ...restProps } = props
    const [algoType, setAlgoType] = useState<AlgorithmType>(
        AlgorithmType.CUSTOM,
    )
    const [builtInAlgos, setBuiltInAlgos] = useState<any>([])
    const [method, setMethod] = useState<DesenMethods>(DesenMethods.ALL)
    const [form] = useForm()
    const [originData, setOriginData] = useState<string>('')
    const onAlgoChange = (e: RadioChangeEvent) => {
        setAlgoType(e.target.value)
        setMethod(DesenMethods.ALL)
    }
    const [openCodeRuleModal, setOpenCodeRuleModal] = useState<boolean>(false)
    const [codeRuleId, setCodeRuleId] = useState<string>('')
    const [showCodeRuleDetails, setShowCodeRuleDetails] =
        useState<boolean>(false)
    const [algorithmTemplateOpen, setAlgorithmTemplateOpen] =
        useState<boolean>(false)

    const codeRuleRef = useRef<any>(null)

    const onMethodChange = (value: string) => {
        setMethod(value as DesenMethods)
    }

    const resetForm = () => {
        setAlgoType(AlgorithmType.CUSTOM)
        setMethod(DesenMethods.ALL)
        setOriginData('')
        form.resetFields()
    }

    const onCloseDrawer = () => {
        resetForm()
        if (onClose) {
            onClose({} as any)
        }
    }

    const excuteAlgo = async (params: ExcutionRule) => {
        try {
            const res = await excuteDesenRule(params)

            if (res.desensitization_text) {
                form.setFieldValue('result', res.desensitization_text)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const testAlgo = () => {
        if (!form.getFieldValue('text')) {
            form.setFields([{ name: 'text', errors: ['请输入原始数据'] }])
        }
        form.validateFields([
            'algorithm',
            'method',
            'text',
            'middle_bit',
            'head_bit',
            'tail_bit',
        ])
            .then((values) => {
                const {
                    text,
                    algorithm,
                    method: md,
                    middle_bit,
                    head_bit,
                    tail_bit,
                } = values
                if (!text) return
                excuteAlgo({
                    text,
                    algorithm,
                    method: md,
                    middle_bit,
                    head_bit,
                    tail_bit,
                })
            })
            .catch((err) => {})
    }

    const onSubmit = async (
        values: DesensitizationStruct & { text: string; result: string },
    ) => {
        const { text, result, ...rest } = values
        try {
            if (data && data.id) {
                await updateDesenRule({ id: data.id, ...rest })
            } else {
                await createDesenRule(rest)
            }

            if (onOk) {
                resetForm()
                onOk()
            }
        } catch (error) {
            formatError(error)
        }
    }

    const footerAction = (
        <div className={styles.footerAction}>
            <Button onClick={onCloseDrawer}>{__('取消')}</Button>
            <Button
                type="primary"
                onClick={() => {
                    form.submit()
                }}
            >
                {__('确定')}
            </Button>
        </div>
    )

    const getBuiltInAlgo = async () => {
        try {
            const res = await getBuiltInDesenAlgo()
            if (res.entities && res.entities.length) {
                const algos = res.entities.map((item) => ({
                    label: item.name,
                    value: item.inner_type,
                    ...item,
                }))
                setBuiltInAlgos(algos)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const validateDesenNumber = () => {
        const tailValue = form.getFieldValue('tail_bit')
        const headValue = form.getFieldValue('head_bit')

        if (tailValue === 0 && headValue === 0) {
            return Promise.reject(new Error('首部和尾部脱敏位数不能同时为0'))
        }
        return Promise.resolve()
    }

    useEffect(() => {
        if (restProps.open) {
            getBuiltInAlgo()
        }
    }, [restProps.open])

    const isEdit = Boolean(data && data.id)

    useEffect(() => {
        if (data && data.id) {
            setAlgoType(data.type)
            setMethod(data.method)
            form.setFieldsValue(data)
        } else {
            resetForm()
        }
    }, [data])

    /**
     * 从数据标准导入
     * @param newValue
     */
    const handleCodeRuleOk = async (newValue: any) => {
        try {
            const res = await getCodeRuleDetails(newValue[0].key)
            form.setFieldValue('algorithm', res.data.regex)
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <Drawer
            title={`${!data ? `${__('新建')}` : `${__('编辑')}`}${__(
                '脱敏算法',
            )}`}
            getContainer={false}
            width={640}
            footer={footerAction}
            bodyStyle={{ padding: '24px 24px 10px' }}
            onClose={onCloseDrawer}
            destroyOnClose
            push={false}
            {...restProps}
        >
            <Form layout="vertical" form={form} onFinish={onSubmit}>
                {/* {!isEdit && (
                    <Item name="type" initialValue={AlgorithmType.CUSTOM}>
                        <Group
                            buttonStyle="solid"
                            className={styles.groupWrapper}
                            optionType="button"
                            options={opts}
                            onChange={onAlgoChange}
                        />
                    </Item>
                )} */}
                {/* {algoType === AlgorithmType.BUILTIN && (
                    <Item
                        label={__('内置算法类型')}
                        name="inner_type"
                        rules={[
                            { required: true, message: '请选择内置算法类型' },
                        ]}
                    >
                        <Select
                            options={builtInAlgos}
                            disabled={isEdit}
                            onChange={(value) => {
                                const algo = builtInAlgos.find(
                                    (item) => item.inner_type === value,
                                )

                                if (algo) {
                                    form.setFieldValue(
                                        'algorithm',
                                        algo.algorithm,
                                    )
                                }
                            }}
                        />
                    </Item>
                )} */}
                <Item
                    label={__('算法名称')}
                    name="name"
                    rules={[{ required: true }]}
                >
                    <Input placeholder={`${__('请输入')}${__('算法名称')}`} />
                </Item>
                <Item label={__('算法描述')} name="description">
                    <Input
                        placeholder={`${__('请输入')}${__('算法描述')}`}
                        showCount
                        maxLength={300}
                    />
                </Item>
                {/* {algoType === AlgorithmType.CUSTOM && ( */}
                <div className={styles.algorithmImportWrapper}>
                    <Item
                        name="algorithm"
                        label={`${__('脱敏算法')}：${__('正则表达式')}`}
                        rules={[
                            {
                                required: true,
                                message: `${__('请输入')}${__('脱敏算法')}`,
                            },
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder={`${__('请输入')}${__('正则表达式')}`}
                        />
                    </Item>

                    <Space size={12} className={styles.importButton}>
                        <Button
                            type="link"
                            onClick={() => {
                                setAlgorithmTemplateOpen(true)
                            }}
                        >
                            {__('从算法模版导入')}
                        </Button>
                        <Button
                            type="link"
                            onClick={() => {
                                setOpenCodeRuleModal(true)
                            }}
                        >
                            {__('从数据标准导入')}
                        </Button>
                    </Space>
                </div>
                {/* )} */}
                {/* {algoType === AlgorithmType.BUILTIN && (
                    <Item
                        label={__('脱敏算法')}
                        name="algorithm"
                        extra="内置算法不可更改"
                    >
                        <Input
                            placeholder={`${__('请选择')}${__('内置算法类型')}`}
                            disabled
                        />
                    </Item>
                )} */}
                <Item
                    name="method"
                    label={__('脱敏方式')}
                    rules={[
                        {
                            required: true,
                            message: `${__('请选择')}${__('脱敏方式')}`,
                        },
                    ]}
                >
                    <Select
                        placeholder={`${__('请选择')}${__('脱敏方式')}`}
                        onChange={onMethodChange}
                    >
                        {methods.map((item) => (
                            <Option key={item.value} value={item.value}>
                                <div className={styles.methodsTip}>
                                    <span>{item.label}</span>
                                    <span>{item.desc}</span>
                                </div>
                            </Option>
                        ))}
                    </Select>
                </Item>
                {method === DesenMethods.BAE && (
                    <Row gutter={8} align="middle">
                        <Col>{__('首部脱敏')}</Col>
                        <Col span={8}>
                            <Item
                                name="head_bit"
                                dependencies={['tail_bit']}
                                rules={[
                                    { required: true, message: '请输入数字' },
                                    {
                                        validator: validateDesenNumber,
                                    },
                                ]}
                                className={styles.methodFormItem}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    controls={false}
                                    placeholder="数值范围0~999，必填"
                                    min={0}
                                    max={999}
                                />
                            </Item>
                        </Col>
                        <Col>{`${__('位')}，${__('尾部脱敏')}`}</Col>
                        <Col span={8}>
                            <Item
                                name="tail_bit"
                                dependencies={['head_bit']}
                                rules={[
                                    { required: true, message: '请输入数字' },
                                ]}
                                className={styles.methodFormItem}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    controls={false}
                                    placeholder="数值范围0~999，必填"
                                    min={0}
                                    max={999}
                                />
                            </Item>
                        </Col>
                        <Col>{__('位')}</Col>
                    </Row>
                )}
                {method === DesenMethods.CENTER && (
                    <Row gutter={8} align="middle">
                        <Col>{__('中间脱敏')}</Col>
                        <Col span={8}>
                            <Item
                                name="middle_bit"
                                rules={[
                                    { required: true, message: '请输入数字' },
                                ]}
                                className={styles.methodFormItem}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    controls={false}
                                    placeholder="数值范围0~999，必填"
                                    min={0}
                                    max={999}
                                />
                            </Item>
                        </Col>
                        <Col>{__('位')}</Col>
                    </Row>
                )}
                <Divider
                    style={{
                        margin: '24px 0 16px',
                        background: 'rgba(0, 0, 0, 0.1)',
                    }}
                />
                <div className={styles.title}>{__('测试数据')}</div>
                {/* <div className={`${styles.descText} ${styles.mb8}`}>
                    {__('输入原始数据后点击【测试】即可查看脱敏结果')}
                </div> */}
                <Row gutter={16}>
                    <Col span={12}>
                        <Item label={__('原始数据')} name="text">
                            <TextArea
                                value={originData}
                                onChange={(e) => {
                                    if (e.target.value !== '') {
                                        form.setFields([
                                            { name: 'text', errors: [] },
                                        ])
                                    }
                                    setOriginData(e.target.value)
                                }}
                                placeholder={__('多个数据使用Enter换行隔开')}
                                rows={4}
                            />
                        </Item>
                    </Col>
                    <Col span={12}>
                        <Item label={__('脱敏结果')} name="result">
                            <TextArea
                                rows={4}
                                readOnly
                                disabled={
                                    originData === '' ||
                                    originData === undefined
                                }
                                placeholder={`${__('请先输入')}${__(
                                    '原始数据',
                                )}`}
                            />
                        </Item>
                    </Col>
                </Row>
                <Item>
                    <Button onClick={testAlgo}>{__('测试')}</Button>
                </Item>
            </Form>
            {openCodeRuleModal && (
                <SelDataByTypeModal
                    visible={openCodeRuleModal}
                    ref={codeRuleRef}
                    onClose={() => {
                        setOpenCodeRuleModal(false)
                    }}
                    onOk={() => {
                        // form.validateFields(['std_files'])
                    }}
                    dataType={CatalogType.CODINGRULES}
                    rowSelectionType="radio"
                    oprItems={[]}
                    setOprItems={(newValue) => {
                        if (newValue[0]) {
                            // 数据元默认使用数据元code，若传dataKey为id，则使用key值
                            handleCodeRuleOk(newValue)
                        }
                    }}
                    handleShowDataDetail={(dataType, id) => {
                        if (dataType === CatalogType.CODINGRULES) {
                            setCodeRuleId(id as string)
                            setShowCodeRuleDetails(true)
                        }
                    }}
                    isEnableCodeRule
                    isEnableDict
                    getContainer={false}
                    checkItemDisabled={(item) => {
                        return item.rule_type === 'CUSTOM'
                    }}
                />
            )}
            {showCodeRuleDetails && !!codeRuleId && (
                <CodeRuleDetails
                    visible={showCodeRuleDetails}
                    onClose={() => {
                        setShowCodeRuleDetails(false)
                        setCodeRuleId('')
                    }}
                    id={codeRuleId}
                    getContainer={false}
                />
            )}
            {algorithmTemplateOpen && (
                <AlgorithmTemplateModal
                    open={algorithmTemplateOpen}
                    onClose={() => setAlgorithmTemplateOpen(false)}
                    onOk={(item) => {
                        form.setFieldValue('algorithm', item.algorithm)
                        setAlgorithmTemplateOpen(false)
                    }}
                />
            )}
        </Drawer>
    )
}

export default Config
