import {
    CaretDownOutlined,
    CloseOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons'
import { Node } from '@antv/x6'
import { useGetState } from 'ahooks'
import { debounce } from 'lodash'
import { Col, Drawer, Form, Input, Row, Select, Space, Tooltip } from 'antd'
import { FC, ReactNode, useEffect, useState } from 'react'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import DragItemList from './DragItemList'
import { DestRule, DestRuleOptions } from './const'
import { FormTableKind } from '../Forms/const'
import { TextView } from '../AutoFormView/baseViewComponents'

interface IConfigConvergenceRulesModel {
    open: boolean
    data: any
    onClose: () => void
    node: Node
    model: string
}

interface IExpandContainerModel {
    children: ReactNode
    title: string
    defaultExpand?: boolean
}

const ExpandContainer: FC<IExpandContainerModel> = ({
    children,
    title,
    defaultExpand = true,
}) => {
    const [expand, setExpand] = useState<boolean>(defaultExpand)

    return (
        <div className={styles.expandContainer}>
            <div className={styles.titleContainer}>
                <Space size={8}>
                    <span
                        onClick={() => {
                            setExpand(!expand)
                        }}
                    >
                        <CaretDownOutlined
                            className={classnames({
                                [styles.icon]: true,
                                [styles['icon-expand']]: expand,
                                [styles['icon-unExpand']]: !expand,
                            })}
                        />
                    </span>
                    <span>{title}</span>
                </Space>
            </div>
            {expand && (
                <div className={styles.expandContainerContent}>{children}</div>
            )}
        </div>
    )
}

interface IFieldsConfigModel {
    configInfo: any
    departmentName: string
    businessName: string
    onChange: (value: any) => void
    model: string
}

const FieldConfig: FC<IFieldsConfigModel> = ({
    configInfo,
    departmentName,
    businessName,
    onChange,
    model,
}) => {
    const [form] = Form.useForm()

    useEffect(() => {
        form.setFieldsValue({
            dest_rule: configInfo.dest_rule,
            value_rule: configInfo.value_rule,
            value_rule_desc: configInfo.value_rule_desc,
            description: configInfo.description,
        })
    }, [configInfo])

    return (
        <div className={styles.fieldConfigWrapper}>
            <div className={styles.baseInfoWrapper}>
                <Row>
                    <Col span={8}>
                        <span className={styles.label}>{__('取值部门：')}</span>
                    </Col>
                    <Col span={16}>
                        <span className={styles.value}>{departmentName}</span>
                    </Col>
                </Row>
                <Row>
                    <Col span={8}>
                        <span className={styles.label}>
                            {__('取值主干业务：')}
                        </span>
                    </Col>
                    <Col span={16}>
                        <span className={styles.value}>{businessName}</span>
                    </Col>
                </Row>
            </div>
            <div className={styles.ruleConfigWrapper}>
                <Form
                    form={form}
                    layout="vertical"
                    onValuesChange={(changedValues, allValues) => {
                        onChange(changedValues)
                    }}
                >
                    <Form.Item
                        name="value_rule"
                        label={
                            <span className={styles.ruleLabelWrapper}>
                                {__('优先规则')}
                                <Tooltip
                                    placement="right"
                                    title={
                                        <div>
                                            <div>
                                                {__(
                                                    '唯一性：只以一个字段的值为依据',
                                                )}
                                            </div>
                                            <div>
                                                {__(
                                                    '时间性：取相同字段最近更新的值',
                                                )}
                                            </div>
                                            <div>
                                                {__('从众性：取最多相同的值')}
                                            </div>
                                        </div>
                                    }
                                    color="#fff"
                                    overlayInnerStyle={{
                                        color: 'rgba(0,0,0,0.85)',
                                    }}
                                >
                                    <span>
                                        <QuestionCircleOutlined />
                                    </span>
                                </Tooltip>
                            </span>
                        }
                    >
                        <Select
                            options={DestRuleOptions}
                            placeholder={__('请选择优先规则')}
                            disabled={model === 'view'}
                        />
                    </Form.Item>
                    <Form.Item name="value_rule_desc" label={__('取值规则')}>
                        <Input
                            placeholder={__('请输入取值规则')}
                            disabled={model === 'view'}
                            maxLength={300}
                        />
                    </Form.Item>
                    <Form.Item name="description" label={__('备注')}>
                        <Input.TextArea
                            placeholder={__('请输入备注')}
                            maxLength={255}
                            style={{ height: 124, resize: 'none' }}
                            disabled={model === 'view'}
                        />
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}

const ConfigConvergenceRules: FC<IConfigConvergenceRulesModel> = ({
    open,
    data,
    onClose,
    node,
    model,
}) => {
    const [description, setDescription] = useState<string>('')
    const [destRule, setDestRule] = useState<DestRule>(DestRule.UNIQUE)
    const [sourceFields, setSourceFields, getSourceFields] = useGetState<
        Array<any>
    >([])
    const [allData, setAllData, getAllData] = useGetState<any>({})

    const [selectedField, setSelectedField] = useState<any>(null)

    useEffect(() => {
        if (data.field_map?.source_field?.length > 0) {
            setSelectedField(data.field_map.source_field[0])
            setSourceFields(
                data.field_map.source_field.sort((a, b) => a.sort - b.sort),
            )
        }
    }, [data])

    const updateDataToNode = debounce((updateInfo) => {
        node.replaceData({
            ...node.data,
            items: node.data.items.map((item) => {
                if (item.uniqueId === data.uniqueId) {
                    return {
                        ...item,
                        field_map: {
                            ...item.field_map,
                            ...updateInfo,
                            source_field: data.field_map.source_field.map(
                                (itemField) =>
                                    getSourceFields().find(
                                        (newItem) =>
                                            itemField.field_id ===
                                            newItem.field_id,
                                    ),
                            ),
                        },
                    }
                }
                return item
            }),
        })
    }, 500)

    useEffect(() => {
        updateDataToNode(allData)
    }, [allData])
    return (
        <Drawer
            width={800}
            title={
                <div className={styles.editFieldTitle}>
                    <div className={styles.editTitle}>
                        {node?.data?.formInfo?.table_kind ===
                        FormTableKind.DATA_FUSION
                            ? __('融合规则')
                            : __('取值规则')}
                    </div>
                    <div className={styles.closeButton}>
                        <CloseOutlined
                            onClick={() => {
                                onClose()
                            }}
                        />
                    </div>
                </div>
            }
            placement="right"
            onClose={() => {
                onClose()
            }}
            open
            getContainer={false}
            style={{ position: 'absolute' }}
            closable={false}
            className={styles.nodeConfigWrapper}
            destroyOnClose
        >
            {node?.data?.formInfo?.table_kind === FormTableKind.DATA_FUSION ? (
                <div className={styles.configRulesContainer}>
                    <ExpandContainer title={__('字段信息')}>
                        <div className={styles.fieldsInfoWrapper}>
                            <Row>
                                <Col span={4}>
                                    <span className={styles.itemLabel}>
                                        {__('字段业务名称：')}
                                    </span>
                                </Col>
                                <Col span={20}>
                                    <span
                                        className={styles.itemValue}
                                        title={data?.name}
                                    >
                                        {data?.name}
                                    </span>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={4}>
                                    <span className={styles.itemLabel}>
                                        {__('字段技术名称：')}
                                    </span>
                                </Col>
                                <Col span={20}>
                                    <span
                                        className={styles.itemValue}
                                        title={data?.name_en}
                                    >
                                        {data?.name_en}
                                    </span>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={4}>
                                    <span className={styles.itemLabel}>
                                        {__('取值范围：')}
                                    </span>
                                </Col>
                                <Col span={20}>
                                    <TextView initValue={data?.value_range} />
                                </Col>
                            </Row>
                        </div>
                    </ExpandContainer>
                    <ExpandContainer title={__('来源字段信息')}>
                        <div className={styles.regularContainer}>
                            <div>
                                {__(
                                    '字段名称（按优先级高低拖动排序，越往上优先级越高）',
                                )}
                            </div>

                            <div className={styles.contentContainer}>
                                <div className={styles.leftContainer}>
                                    <DragItemList
                                        data={sourceFields}
                                        formType={
                                            node?.data?.formInfo?.table_kind
                                        }
                                        model={model}
                                        onDragged={(newData) => {
                                            const newDataList = newData.map(
                                                (item, index) => ({
                                                    ...item,
                                                    sort: index,
                                                }),
                                            )

                                            setSourceFields(newDataList)

                                            setAllData({
                                                source_field: newDataList,
                                            })
                                        }}
                                        onSelect={(item) => {
                                            setSelectedField(item)
                                        }}
                                        selectedFieldId={
                                            selectedField?.field_id
                                        }
                                    />
                                </div>
                                <div className={styles.rightContainer}>
                                    <FieldConfig
                                        configInfo={selectedField}
                                        departmentName={
                                            node?.data?.formInfo
                                                ?.department_name || '--'
                                        }
                                        businessName={
                                            node?.data?.formInfo
                                                ?.main_business_name || '--'
                                        }
                                        onChange={(values) => {
                                            setSelectedField({
                                                ...selectedField,
                                                ...values,
                                            })
                                            setSourceFields(
                                                getSourceFields().map((item) =>
                                                    item.field_id ===
                                                    selectedField.field_id
                                                        ? {
                                                              ...item,
                                                              ...values,
                                                          }
                                                        : item,
                                                ),
                                            )
                                            setAllData({
                                                source_field:
                                                    getSourceFields().map(
                                                        (item) =>
                                                            item.field_id ===
                                                            selectedField.field_id
                                                                ? {
                                                                      ...item,
                                                                      ...values,
                                                                  }
                                                                : item,
                                                    ),
                                            })
                                        }}
                                        model={model}
                                    />
                                </div>
                            </div>
                        </div>
                    </ExpandContainer>
                </div>
            ) : (
                <div className={styles.configRulesContainer}>
                    <div className={styles.valueRulerContainer}>
                        <Row>
                            <Col span={6}>
                                <span className={styles.viewItemLabel}>
                                    {__('字段业务名称：')}
                                </span>
                            </Col>
                            <Col span={18}>
                                <span>{sourceFields?.[0]?.business_name}</span>
                            </Col>
                        </Row>
                        <Row>
                            <Col
                                span={model === 'view' ? 6 : 24}
                                className={
                                    model === 'view' ? styles.viewItemLabel : ''
                                }
                            >
                                <span>
                                    {model === 'view'
                                        ? __('取值规则：')
                                        : __('取值规则')}
                                </span>
                            </Col>
                            <Col span={model === 'view' ? 18 : 24}>
                                {model === 'view' ? (
                                    <div>
                                        {sourceFields?.[0]?.value_rule_desc ||
                                            '--'}
                                    </div>
                                ) : (
                                    <Input.TextArea
                                        value={
                                            sourceFields?.[0]?.value_rule_desc
                                        }
                                        onChange={(e) => {
                                            const newDataList = [
                                                {
                                                    ...(sourceFields?.[0] ||
                                                        {}),
                                                    value_rule_desc:
                                                        e.target.value,
                                                },
                                            ]
                                            setSourceFields(newDataList)

                                            setAllData({
                                                source_field: newDataList,
                                            })
                                        }}
                                        maxLength={255}
                                        placeholder={__('请输入取值规则')}
                                        className={styles.textArea}
                                    />
                                )}
                            </Col>
                        </Row>
                    </div>
                </div>
            )}
        </Drawer>
    )
}

export default ConfigConvergenceRules
