import { Col, Row, Tooltip, Form, Input, Select, Button } from 'antd'
import { FormInstance } from 'antd/es/form'
import { FC, useRef, useState } from 'react'
import { InfoCircleOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { trim } from 'lodash'
import __ from './locale'
import NumberInput from '@/ui/NumberInput'
import { RuleCustomType, RuleTypeOptions } from './const'
import { AddOutlined, DeleteOutLined } from '@/icons'
import styles from './styles.module.less'
import { ErrorInfo } from '@/utils'
import { CatalogType, IDataItem } from '@/core'
import SelDataByTypeModal from '../SelDataByTypeModal'
import CodeTableDetails from '../CodeTableManage/Details'
import { NumberType } from '@/ui/NumberInput/const'

interface CustomRuleComponetType {
    form: FormInstance<any>
}

const CustomRuleComponet: FC<CustomRuleComponetType> = ({ form }) => {
    const [selDataByTypeVisible, setSelDataByTypeVisible] = useState(false)
    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])
    // 文件详情
    const [codeTbDetailVisible, setCodeDetailVisible] = useState<boolean>(false)
    // 文件id
    const [detailId, setDetailId] = useState<string>('')

    const [valueConfigIndex, setValueConfigIndex] = useState<number | null>(
        null,
    )

    // 选择数据对话框ref
    const selDataRef = useRef({
        reloadData: () => {},
    })
    /**
     * 删除一条数据
     * @param i 组index

     */
    const handleRemoveOneData = (i) => {
        const values = form.getFieldValue('custom')
        if (values?.length === 1) {
            form.setFieldValue('custom', [
                {
                    name: undefined,
                    segment_length: undefined,
                    type: undefined,
                    value: undefined,
                },
            ])
        } else {
            form.setFieldValue(
                'custom',
                values.filter((info, currentIndex) => currentIndex !== i),
            )
        }
    }

    /**
     * 展示详情页面（如编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id
     */
    const handleShowDataDetail = (dataType: CatalogType, dataId?: string) => {
        if (dataId) {
            setCodeDetailVisible(true)
            setDetailId(dataId)
        }
    }

    const checkValueRange = (value, maxLength) => {
        if (value.length !== Number(maxLength)) {
            return Promise.reject(new Error(__('规则值的长度必须等于分段长度')))
        }
        return Promise.resolve()
    }

    const checkNameRepeat = (name, index) => {
        if (!name) {
            return Promise.resolve()
        }
        const customList = form.getFieldValue('custom')
        const findCustomName = customList.find(
            (currentCustom, currentIndex) =>
                trim(currentCustom.name).toLocaleLowerCase() ===
                    name.toLocaleLowerCase() && index !== currentIndex,
        )
        if (findCustomName) {
            return Promise.reject(new Error(__('规则名称已存在')))
        }
        return Promise.resolve()
    }
    const getValueComponents = (itemName, customType) => {
        switch (customType) {
            case RuleCustomType.CodeTable:
                return (
                    <Form.Item
                        name={[itemName, 'value']}
                        rules={[
                            {
                                required: true,

                                message: __('请选择码表'),
                            },
                        ]}
                        validateFirst
                    >
                        <Select
                            labelInValue
                            placeholder={__('请选择码表')}
                            open={false}
                            onClick={(e) => {
                                e.stopPropagation()
                                const lastData = form.getFieldValue([
                                    'custom',
                                    itemName,
                                    'value',
                                ])
                                setSelDataByTypeVisible(true)
                                setValueConfigIndex(itemName)
                                setSelDataItems(lastData || [])
                            }}
                        />
                    </Form.Item>
                )
            case RuleCustomType.Date:
                return (
                    <Form.Item
                        name={[itemName, 'value']}
                        validateTrigger={['onChange', 'onBlur']}
                        validateFirst
                        rules={[
                            {
                                required: true,

                                message: __('请选择日期格式'),
                            },
                            {
                                validator: (e, value) => {
                                    const maxLength = form.getFieldValue([
                                        'custom',
                                        itemName,
                                        'segment_length',
                                    ])
                                    return checkValueRange(value, maxLength)
                                },
                            },
                        ]}
                    >
                        <Select
                            placeholder={__('请选择日期格式')}
                            options={[
                                { value: 'yyyyMMdd', label: 'yyyyMMdd' },
                                { value: 'yyyy/MM/dd', label: 'yyyy/MM/dd' },
                                { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd' },
                                {
                                    value: 'yyyyMMddHHmmss',
                                    label: 'yyyyMMddHHmmss',
                                },
                                {
                                    value: 'yyyy-MM-dd HH:mm:ss',
                                    label: 'yyyy-MM-dd HH:mm:ss',
                                },
                                {
                                    value: 'yyyy/MM/dd HH:mm:ss',
                                    label: 'yyyy/MM/dd HH:mm:ss',
                                },
                            ]}
                            onChange={(value) => {
                                form.setFieldValue(
                                    ['custom', itemName, 'segment_length'],
                                    value.length,
                                )
                            }}
                        />
                    </Form.Item>
                )
            case RuleCustomType.Separators:
                return (
                    <Form.Item
                        name={[itemName, 'value']}
                        validateTrigger={['onChange', 'onBlur']}
                        validateFirst
                        rules={[
                            {
                                required: true,
                                message: __('请输入分割字符串'),
                            },
                            {
                                validateTrigger: ['onBlur'],
                                validator: (e, value) => {
                                    const maxLength = form.getFieldValue([
                                        'custom',
                                        itemName,
                                        'segment_length',
                                    ])
                                    return checkValueRange(value, maxLength)
                                },
                            },
                        ]}
                    >
                        <Input placeholder={__('请输入分割字符串')} />
                    </Form.Item>
                )
            default:
                return (
                    <Form.Item name={[itemName, 'value']}>
                        <Input disabled placeholder={__('无需填写')} />
                    </Form.Item>
                )
        }
    }

    return (
        <div className={styles.customRuleContent}>
            <Row gutter={48}>
                <Col span={4}>
                    <div className={styles.ruleLabel}>
                        <span style={{ color: '#ff4d4f', paddingTop: '2px' }}>
                            *
                        </span>
                        <span className={styles.text}>
                            {__('编码分段长度')}
                        </span>
                        <span>
                            <Tooltip
                                title={__(
                                    '分段长度填写整数，代表该编码分段的占位长度。如分段长度第一段为1，第二段为4，则编码总长度为5。',
                                )}
                                color="#fff"
                                overlayInnerStyle={{
                                    color: 'rgba(0,0,0,0.65)',
                                }}
                            >
                                <InfoCircleOutlined
                                    style={{ color: 'rgba(0,0,0,0.65)' }}
                                />
                            </Tooltip>
                        </span>
                    </div>
                </Col>
                <Col span={10}>
                    <div className={styles.ruleLabel}>
                        <span>{__('规则名称')}</span>
                    </div>
                </Col>
                <Col span={4}>
                    <div className={styles.ruleLabel}>
                        <span style={{ color: '#ff4d4f', paddingTop: '2px' }}>
                            *
                        </span>
                        <span className={styles.text}>{__('规则类型')}</span>
                    </div>
                </Col>
                <Col span={4}>
                    <div className={styles.ruleLabel}>
                        <div style={{ color: '#ff4d4f', paddingTop: '2px' }}>
                            *
                        </div>
                        <span className={styles.text}>{__('规则格式/值')}</span>
                    </div>
                </Col>
            </Row>
            <Form.List
                name="custom"
                initialValue={[
                    {
                        name: undefined,
                        segment_length: undefined,
                        type: undefined,
                        value: undefined,
                    },
                ]}
            >
                {(rules, { add }) => {
                    return (
                        <div>
                            <div>
                                {rules.map((item, index) => {
                                    const { key, name: itemName } = item
                                    const itemValues =
                                        form.getFieldValue('custom')?.[index]
                                    const {
                                        name,
                                        segment_length,
                                        type,
                                        value: curentValue,
                                    } = itemValues
                                    const delDisabled =
                                        rules.length === 1 &&
                                        !(
                                            name ||
                                            segment_length ||
                                            type ||
                                            curentValue
                                        )
                                    return (
                                        <div>
                                            <Row gutter={48}>
                                                <Col span={4}>
                                                    <Form.Item
                                                        name={[
                                                            itemName,
                                                            'segment_length',
                                                        ]}
                                                        rules={[
                                                            {
                                                                required: true,
                                                                transform: (
                                                                    value: string,
                                                                ) =>
                                                                    trim(value),
                                                                message:
                                                                    ErrorInfo.NOTNULL,
                                                            },
                                                        ]}
                                                    >
                                                        <NumberInput
                                                            placeholder={__(
                                                                '请输入编码分段长度',
                                                            )}
                                                            type={
                                                                NumberType.Natural
                                                            }
                                                            max={128}
                                                            min={1}
                                                            onChange={() => {
                                                                form.validateFields(
                                                                    [
                                                                        [
                                                                            'custom',
                                                                            itemName,
                                                                            'value',
                                                                        ],
                                                                    ],
                                                                )
                                                            }}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={10}>
                                                    <Form.Item
                                                        name={[
                                                            itemName,
                                                            'name',
                                                        ]}
                                                        validateFirst
                                                        validateTrigger={[
                                                            'onBlur',
                                                        ]}
                                                        rules={[
                                                            {
                                                                validateTrigger:
                                                                    ['onBlur'],
                                                                validator: (
                                                                    e,
                                                                    currentValue,
                                                                ) =>
                                                                    checkNameRepeat(
                                                                        trim(
                                                                            currentValue,
                                                                        ),
                                                                        index,
                                                                    ),
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            placeholder={__(
                                                                '请输入规则名称',
                                                            )}
                                                            maxLength={128}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={4}>
                                                    <Form.Item
                                                        name={[
                                                            itemName,
                                                            'type',
                                                        ]}
                                                        rules={[
                                                            {
                                                                required: true,

                                                                message:
                                                                    __(
                                                                        '请选择规则类型',
                                                                    ),
                                                            },
                                                        ]}
                                                    >
                                                        <Select
                                                            placeholder={__(
                                                                '请选择规则类型',
                                                            )}
                                                            options={
                                                                RuleTypeOptions
                                                            }
                                                            onChange={() => {
                                                                form.resetFields(
                                                                    [
                                                                        [
                                                                            'custom',
                                                                            itemName,
                                                                            'value',
                                                                        ],
                                                                    ],
                                                                )
                                                            }}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={4}>
                                                    <Form.Item
                                                        shouldUpdate={(
                                                            prevValues,
                                                            curValues,
                                                        ) => {
                                                            if (
                                                                curValues
                                                                    ?.custom[
                                                                    index
                                                                ]?.type !==
                                                                prevValues
                                                                    ?.custom[
                                                                    index
                                                                ]?.type
                                                            ) {
                                                                return true
                                                            }
                                                            return false
                                                        }}
                                                        noStyle
                                                        style={{
                                                            width: '100%',
                                                            padding: '0 8px',
                                                        }}
                                                    >
                                                        {({
                                                            getFieldValue,
                                                        }) => {
                                                            const customType =
                                                                getFieldValue([
                                                                    'custom',
                                                                    index,
                                                                    'type',
                                                                ])
                                                            return getValueComponents(
                                                                itemName,
                                                                customType,
                                                            )
                                                        }}
                                                    </Form.Item>
                                                </Col>
                                                <Col span={2}>
                                                    <div
                                                        className={
                                                            styles.innerItemDelWrap
                                                        }
                                                        style={{
                                                            marginLeft: -12,
                                                        }}
                                                    >
                                                        <DeleteOutLined
                                                            className={classnames(
                                                                styles.innerItemDel,
                                                                delDisabled &&
                                                                    styles.innerItemDelDisabled,
                                                            )}
                                                            onClick={() => {
                                                                if (delDisabled)
                                                                    return
                                                                handleRemoveOneData(
                                                                    index,
                                                                )
                                                            }}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    )
                                })}
                            </div>

                            <div>
                                <Button
                                    block
                                    disabled={rules.length >= 30}
                                    icon={<AddOutlined />}
                                    onClick={() => {
                                        add({
                                            name: undefined,
                                            segment_length: undefined,
                                            type: undefined,
                                            value: undefined,
                                        })
                                    }}
                                >
                                    {__('新增')}
                                </Button>
                            </div>
                            {/* 选择码表/编码规则 */}
                            <SelDataByTypeModal
                                visible={selDataByTypeVisible}
                                ref={selDataRef}
                                onClose={() => {
                                    setSelDataByTypeVisible(false)
                                }}
                                onOk={() => {
                                    // form.validateFields(['std_files'])
                                }}
                                dataType={CatalogType.CODETABLE}
                                rowSelectionType="radio"
                                oprItems={selDataItems}
                                setOprItems={(value) => {
                                    if (valueConfigIndex !== null) {
                                        form.setFieldValue(
                                            [
                                                'custom',
                                                valueConfigIndex,
                                                'value',
                                            ],
                                            value,
                                        )
                                        setSelDataItems([])
                                    }
                                }}
                                handleShowDataDetail={handleShowDataDetail}
                            />

                            {/* 查看码表详情 */}
                            {codeTbDetailVisible && !!detailId && (
                                <CodeTableDetails
                                    visible={codeTbDetailVisible && !!detailId}
                                    dictId={detailId}
                                    onClose={() => {
                                        setCodeDetailVisible(false)
                                        setDetailId('')
                                    }}
                                    getContainer={document.getElementById(
                                        'root',
                                    )}
                                />
                            )}
                        </div>
                    )
                }}
            </Form.List>
        </div>
    )
}

export default CustomRuleComponet
