import { useEffect, useRef, useState } from 'react'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import classNames from 'classnames'
import { Button, Drawer, Form, Input, message, Select } from 'antd'
import { noop } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import {
    AlgorithmStatus,
    AlgorithmType,
    BuiltInAlgorithmType,
    BuiltInAlgorithmTypeMap,
} from './const'
import {
    CatalogType,
    checkRepeatRecognitionAlgorithmName,
    createRecognitionAlgorithm,
    formatError,
    getCodeRuleDetails,
    getInnerRecognitionAlgorithm,
    getRecognitionAlgorithmDetails,
    updateRecognitionAlgorithm,
} from '@/core'
import SelDataByTypeModal from '../SelDataByTypeModal'
import CodeRuleDetails from '../CodeRulesComponent/CodeRuleDetails'

interface CreateAlgorithmProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    dataId?: string
}

// 测试状态
enum TestStatus {
    // 正常
    NORMAL = 'normal',
    // 没有数据
    NOT_DATA = 'not_data',
    // 正则表达式错误
    NOT_REGEX = 'not_regex',
}

/**
 * 测试结果类型
 */
enum TestResultType {
    // 未测试
    NOT_TEST = 'not_test',
    // 匹配成功
    MATCH_SUCCESS = 'match_success',
    // 匹配失败
    MATCH_FAILED = 'match_failed',
}

/**
 * 选择算法类型
 */
interface SelectAlgorithmTypeProps {
    value?: string
    onChange?: (value: string) => void
}
const SelectAlgorithmType = ({
    value = AlgorithmType.CUSTOM,
    onChange = noop,
}: SelectAlgorithmTypeProps) => {
    return (
        <div className={styles.selectAlgorithmContainer}>
            <div
                className={classNames(styles.item, {
                    [styles.selected]: value === AlgorithmType.CUSTOM,
                })}
                onClick={() =>
                    value === AlgorithmType.BUILT_IN
                        ? onChange(AlgorithmType.CUSTOM)
                        : noop()
                }
            >
                {__('自定义算法')}
            </div>
            <div
                onClick={() =>
                    value === AlgorithmType.CUSTOM
                        ? onChange(AlgorithmType.BUILT_IN)
                        : noop()
                }
                className={classNames(styles.item, {
                    [styles.selected]: value === AlgorithmType.BUILT_IN,
                })}
            >
                {__('使用内置算法')}
            </div>
        </div>
    )
}

const CreateAlgorithm = ({
    open,
    onClose,
    onConfirm,
    dataId,
}: CreateAlgorithmProps) => {
    const [form] = Form.useForm()
    const [testData, setTestData] = useState<string>('')
    const [algorithmDetails, setAlgorithmDetails] = useState<any>({})
    const [testResult, setTestResult] = useState<TestResultType>(
        TestResultType.NOT_TEST,
    )
    const [testError, setTestError] = useState<TestStatus>(TestStatus.NORMAL)
    const [builtInAlgorithms, setBuiltInAlgorithms] = useState<
        Array<{
            key: string
            value: string
            label: string
        }>
    >([])
    const [openCodeRuleModal, setOpenCodeRuleModal] = useState<boolean>(false)

    const [codeRuleId, setCodeRuleId] = useState<string>('')
    const [showCodeRuleDetails, setShowCodeRuleDetails] =
        useState<boolean>(false)

    const codeRuleRef = useRef<any>(null)

    useEffect(() => {
        getBuiltInAlgorithm()
    }, [])

    useEffect(() => {
        if (dataId) {
            getDataDetail()
        }
    }, [dataId])

    /**
     * 获取数据详情
     */
    const getDataDetail = async () => {
        try {
            const res = await getRecognitionAlgorithmDetails(dataId as string)
            form.setFieldsValue({
                name: res.name,
                description: res.description,
                algorithm: res.algorithm,
                inner_type: res?.inner_type || undefined,
                type: res.type,
            })
            setAlgorithmDetails(res)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 测试
     */
    const handleTest = () => {
        if (!form.getFieldValue('algorithm')) {
            form.validateFields(['algorithm'])
            setTestError(TestStatus.NOT_REGEX)
            return
        }
        if (!testData) {
            setTestError(TestStatus.NOT_DATA)
            return
        }
        setTestError(TestStatus.NORMAL)

        const algorithm = form.getFieldValue('algorithm')
        const regex = new RegExp(algorithm)

        const result = regex.test(testData)
        setTestResult(
            result ? TestResultType.MATCH_SUCCESS : TestResultType.MATCH_FAILED,
        )
    }

    /**
     * 获取内置算法
     */
    const getBuiltInAlgorithm = async () => {
        try {
            const res = await getInnerRecognitionAlgorithm()

            setBuiltInAlgorithms(
                res?.inner_map?.map((item) => ({
                    key: item.inner_algorithm,
                    value: item.inner_type,
                    label: item.inner_type,
                })) || [],
            )
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 显示测试错误
     * @param error 错误类型
     * @returns 错误信息
     */
    const showTestError = (error: TestStatus) => {
        switch (error) {
            case TestStatus.NOT_REGEX:
                return __('请先完成识别算法配置')
            case TestStatus.NOT_DATA:
                return __('请输入原始数据')
            default:
                return ''
        }
    }

    /**
     * 表单字段变化
     * @param changedFields 变化的字段
     * @param allFields 所有字段
     */
    const handleFieldsChange = (changedFields: any, allFields: any) => {
        const currentKey = Object.keys(changedFields)[0]
        if (currentKey === 'inner_type') {
            const algorithm = builtInAlgorithms.find(
                (item) => item.label === changedFields.inner_type,
            )
            if (algorithm) {
                form.setFieldValue('algorithm', algorithm.key)
            }
        }
    }

    /**
     *
     * @param values
     */
    const handleConfirm = async (values) => {
        try {
            if (dataId) {
                await updateRecognitionAlgorithm(dataId, {
                    ...values,
                    status: AlgorithmStatus.ENABLE,
                    type: algorithmDetails?.type,
                })
                message.success(__('编辑成功'))
            } else {
                await createRecognitionAlgorithm({
                    ...values,
                    status: AlgorithmStatus.ENABLE,
                })
                message.success(__('创建成功'))
            }

            onConfirm()
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 名称重复检查
     * @param value
     * @returns
     */
    const nameRepeatCheck = async (value: string): Promise<void> => {
        try {
            if (value.trim() === '') {
                return Promise.resolve()
            }
            const res = await checkRepeatRecognitionAlgorithmName({
                name: value.trim(),
                id: dataId || undefined,
            })
            if (res.is_duplicate === 'true') {
                return Promise.reject(new Error(__('名称已存在，请重新输入')))
            }
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        }
    }

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
        <div>
            <Drawer
                title={
                    dataId
                        ? __('编辑数据识别算法模版')
                        : __('新建数据识别算法模版')
                }
                open={open}
                onClose={() => onClose()}
                width={640}
                footer={
                    <div className={styles.drawerFooterWrapper}>
                        <Button className={styles.button} onClick={onClose}>
                            {__('取消')}
                        </Button>
                        <Button
                            type="primary"
                            className={styles.button}
                            onClick={() => form.submit()}
                        >
                            {__('确定')}
                        </Button>
                    </div>
                }
                maskClosable={false}
                destroyOnClose
                push={false}
            >
                <div className={styles.createAlgorithmContainer}>
                    <Form
                        form={form}
                        onFinish={handleConfirm}
                        layout="vertical"
                        onValuesChange={handleFieldsChange}
                        autoComplete="off"
                    >
                        {!dataId && (
                            <Form.Item
                                name="type"
                                initialValue={AlgorithmType.CUSTOM}
                            >
                                <SelectAlgorithmType />
                            </Form.Item>
                        )}
                        <Form.Item
                            shouldUpdate={(pre, cur) => pre.type !== cur.type}
                            noStyle
                        >
                            {({ getFieldValue }) => {
                                const type = getFieldValue('type')
                                if (type === AlgorithmType.BUILT_IN) {
                                    return (
                                        <Form.Item
                                            label={__('内置算法类型')}
                                            name="inner_type"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __(
                                                            '请选择内置算法类型',
                                                        ),
                                                },
                                            ]}
                                        >
                                            <Select
                                                options={builtInAlgorithms}
                                                placeholder={__(
                                                    '请选择内置算法类型',
                                                )}
                                                disabled={!!dataId}
                                            />
                                        </Form.Item>
                                    )
                                }
                                return null
                            }}
                        </Form.Item>
                        <Form.Item
                            label={__('模版名称')}
                            name="name"
                            required
                            validateTrigger={['onBlur', 'onChange']}
                            validateFirst
                            rules={[
                                {
                                    required: true,
                                    message: __('请输入模版名称'),
                                    validateTrigger: ['onBlur', 'onChange'],
                                },
                                {
                                    validator: (e, value) =>
                                        nameRepeatCheck(value),
                                    validateTrigger: ['onBlur'],
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入模版名称')} />
                        </Form.Item>
                        <Form.Item label={__('模版描述')} name="description">
                            <Input.TextArea
                                placeholder={__('请输入模版描述')}
                                maxLength={300}
                                showCount
                                style={{ resize: 'none', height: 32 }}
                            />
                        </Form.Item>
                        <Form.Item
                            shouldUpdate={(pre, cur) =>
                                pre.type !== cur.type ||
                                pre.inner_type !== cur.inner_type
                            }
                            noStyle
                        >
                            {({ getFieldValue }) => {
                                const type = getFieldValue('type')
                                const builtInAlgorithm =
                                    getFieldValue('inner_type')
                                return type === AlgorithmType.BUILT_IN ? (
                                    <Form.Item
                                        label={__('数据识别算法：正则表达式')}
                                        name="algorithm"
                                        required
                                    >
                                        <Input
                                            placeholder={__(
                                                '请先选择内置算法类型',
                                            )}
                                            disabled
                                        />
                                    </Form.Item>
                                ) : (
                                    <div
                                        className={
                                            styles.algorithmImportWrapper
                                        }
                                    >
                                        <Form.Item
                                            label={__(
                                                '数据识别算法：正则表达式',
                                            )}
                                            name="algorithm"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('请输入识别算法'),
                                                },
                                            ]}
                                        >
                                            <Input.TextArea
                                                placeholder={__(
                                                    '请输入正则表达式',
                                                )}
                                                style={{
                                                    resize: 'none',
                                                    height: 120,
                                                }}
                                            />
                                        </Form.Item>
                                        <div className={styles.importButton}>
                                            <Button
                                                type="link"
                                                onClick={() => {
                                                    setOpenCodeRuleModal(true)
                                                }}
                                            >
                                                {__('从数据标准导入')}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            }}
                        </Form.Item>
                    </Form>
                    <div className={styles.splitLine} />
                    <div className={styles.testContainer}>
                        <div className={styles.titleText}>{__('测试数据')}</div>
                        <div className={styles.testContent}>
                            <div className={styles.item}>
                                <div>{__('原始数据')}</div>
                                <div>
                                    <Input
                                        placeholder={__('请输入原始数据')}
                                        value={testData}
                                        onChange={(e) =>
                                            setTestData(e.target.value)
                                        }
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                            <div className={styles.item}>
                                <div>{__('匹配结果')}</div>
                                <div className={styles.resultWrapper}>
                                    {testResult ===
                                    TestResultType.MATCH_SUCCESS ? (
                                        <div className={styles.resultText}>
                                            <CheckCircleFilled
                                                className={styles.successIcon}
                                            />
                                            <span>{__('可以识别')}</span>
                                        </div>
                                    ) : testResult ===
                                      TestResultType.MATCH_FAILED ? (
                                        <div className={styles.resultText}>
                                            <CloseCircleFilled
                                                className={styles.errorIcon}
                                            />
                                            <span>
                                                {__(
                                                    '无法识别，算法和数据格式不匹配',
                                                )}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className={styles.normal}>
                                            {__('请先输入原始数据')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={styles.testButton}>
                            <Button
                                onClick={handleTest}
                                className={styles.button}
                            >
                                {__('测试')}
                            </Button>
                            <span className={styles.errorText}>
                                {showTestError(testError)}
                            </span>
                        </div>
                    </div>
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
                </div>
            </Drawer>
        </div>
    )
}

export default CreateAlgorithm
