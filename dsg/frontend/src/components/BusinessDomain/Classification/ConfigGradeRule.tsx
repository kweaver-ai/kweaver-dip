import { FC, useEffect, useState } from 'react'
import { Button, Form, Select, Tooltip } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { FormInstance } from 'antd/es/form'
import { useClassificationContext } from './ClassificationProvider'
import __ from '../locale'
import styles from './styles.module.less'
import { OperateBox } from './helper'
import { FontIcon } from '@/icons'
import SelectAttr from './SelectAttr'
import { formatError, getAttributesByParentId, getDataGradeLabel } from '@/core'

interface ConfigGradeRuleProps {
    form: FormInstance
}
const ConfigGradeRule: FC<ConfigGradeRuleProps> = ({ form }) => {
    const { selectedAttribute } = useClassificationContext()

    const [allAttributes, setAllAttributes] = useState<Array<any>>([])

    useEffect(() => {
        getAttrData()
    }, [])

    /**
     * 添加内层组合
     * @param pathName 表单路径
     */
    const onAddInnerGradeRule = (pathName: Array<string | number>) => {
        const gradeRules = form.getFieldValue(pathName)
        form.setFieldValue(pathName, [...gradeRules, { id: null }])
    }

    /**
     * 获取所有属性
     */
    const getAttrData = async () => {
        try {
            const res = await getAttributesByParentId({})
            setAllAttributes(
                res.attributes.filter(
                    (item) => item.id !== selectedAttribute.id,
                ),
            )
        } catch (error) {
            formatError(error)
        }
    }

    /**
     * 删除内层组合
     * @param pathName 表单路径
     * @param index 内层组合索引
     * @param outIndex 外层组合索引
     */
    const onDeleteInnerGradeRule = (
        pathName: Array<string | number>,
        index: number,
        outIndex: number,
    ) => {
        const gradeInnerRules = form.getFieldValue(pathName)
        if (gradeInnerRules.length > 2) {
            form.setFieldValue(
                pathName,
                gradeInnerRules.filter((_, i) => i !== index),
            )
        } else {
            const gradeRules = form.getFieldValue([
                'classifications',
                'grade_rules',
            ])
            form.setFieldValue(
                ['classifications', 'grade_rules'],
                gradeRules.filter((_, i) => i !== outIndex),
            )
        }
    }

    /**
     * 添加外层组合
     */
    const addGradeRule = () => {
        const gradeRules = form.getFieldValue([
            'classifications',
            'grade_rules',
        ])
        form.setFieldValue(
            ['classifications', 'grade_rules'],
            [
                ...gradeRules,
                {
                    operator: 'and',
                    classification_rule_subjects: [
                        {
                            id: selectedAttribute.id,
                        },
                        {
                            id: null,
                        },
                    ],
                },
            ],
        )
    }

    return (
        <div className={styles.configGradeRuleContainer}>
            <div>
                <Button
                    type="link"
                    icon={<PlusOutlined />}
                    onClick={addGradeRule}
                >
                    {__('新建组合')}
                </Button>
            </div>
            <div className={styles.configContentWrapper}>
                <Form.Item
                    shouldUpdate={(pre, cur) => {
                        return (
                            pre?.classifications?.grade_rules?.length !==
                            cur?.classifications?.grade_rules?.length
                        )
                    }}
                    noStyle
                    className={styles.configOutOperatorWrapper}
                >
                    {() => {
                        const gradeRules = form.getFieldValue([
                            'classifications',
                            'grade_rules',
                        ])
                        return gradeRules?.length > 1 ? (
                            <OperateBox operate="or" />
                        ) : null
                    }}
                </Form.Item>
                <div className={styles.configOutRuleWrapper}>
                    <Form.List name={['classifications', 'grade_rules']}>
                        {(groupFields, groupOperation, groupMeta) => {
                            const gradeRules = form.getFieldValue([
                                'classifications',
                                'grade_rules',
                            ])
                            return groupFields.map((groupField, outIndex) => {
                                return (
                                    <div className={styles.configInRuleItemBox}>
                                        <Form.Item
                                            name="operate"
                                            initialValue="and"
                                            noStyle
                                            className={
                                                styles.configInRuleItemOperator
                                            }
                                        >
                                            <OperateBox operate="and" />
                                        </Form.Item>

                                        <div
                                            className={
                                                styles.itemContentWrapper
                                            }
                                        >
                                            <Form.List
                                                name={[
                                                    outIndex,
                                                    'classification_rule_subjects',
                                                ]}
                                            >
                                                {(fields, operation, meta) => {
                                                    return fields.map(
                                                        (field, index) => {
                                                            const fieldId =
                                                                form.getFieldValue(
                                                                    [
                                                                        'classifications',
                                                                        'grade_rules',
                                                                        outIndex,
                                                                        'classification_rule_subjects',
                                                                        index,
                                                                        'id',
                                                                    ],
                                                                )
                                                            const outDataLength =
                                                                form.getFieldValue(
                                                                    [
                                                                        'classifications',
                                                                        'grade_rules',
                                                                    ],
                                                                )?.length
                                                            const innerDataLength =
                                                                form.getFieldValue(
                                                                    [
                                                                        'classifications',
                                                                        'grade_rules',
                                                                        outIndex,
                                                                        'classification_rule_subjects',
                                                                    ],
                                                                )?.length
                                                            return fieldId ===
                                                                selectedAttribute.id ? (
                                                                <div
                                                                    className={
                                                                        styles.titleContainer
                                                                    }
                                                                >
                                                                    <FontIcon
                                                                        name="icon-shuxing"
                                                                        style={{
                                                                            fontSize: 20,
                                                                            color: 'rgba(245, 137, 13, 1)',
                                                                        }}
                                                                    />
                                                                    <span
                                                                        className={
                                                                            styles.titleText
                                                                        }
                                                                    >
                                                                        {
                                                                            selectedAttribute.name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className={
                                                                        styles.itemSelectContainer
                                                                    }
                                                                >
                                                                    <Form.Item
                                                                        name={[
                                                                            index,
                                                                            'id',
                                                                        ]}
                                                                        rules={[
                                                                            {
                                                                                required:
                                                                                    true,
                                                                                message:
                                                                                    __(
                                                                                        '请选择字段的分类属性',
                                                                                    ),
                                                                            },
                                                                        ]}
                                                                        style={{
                                                                            width: '100%',
                                                                        }}
                                                                    >
                                                                        <SelectAttr
                                                                            placeholder={__(
                                                                                '请选择字段的分类属性',
                                                                            )}
                                                                            allAttributes={
                                                                                allAttributes
                                                                            }
                                                                        />
                                                                    </Form.Item>
                                                                    <Tooltip
                                                                        title={__(
                                                                            '添加',
                                                                        )}
                                                                        className={
                                                                            styles.operateBtnWrapper
                                                                        }
                                                                    >
                                                                        <div
                                                                            onClick={() =>
                                                                                onAddInnerGradeRule(
                                                                                    [
                                                                                        'classifications',
                                                                                        'grade_rules',
                                                                                        outIndex,
                                                                                        'classification_rule_subjects',
                                                                                    ],
                                                                                )
                                                                            }
                                                                        >
                                                                            <FontIcon
                                                                                name="icon-Add"
                                                                                style={{
                                                                                    fontSize: 16,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </Tooltip>
                                                                    {innerDataLength <=
                                                                        2 &&
                                                                    outDataLength <=
                                                                        1 ? (
                                                                        <div
                                                                            className={
                                                                                styles.notDeleteBtnWrapper
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <Tooltip
                                                                            title={__(
                                                                                '删除',
                                                                            )}
                                                                        >
                                                                            <div
                                                                                className={
                                                                                    styles.operateBtnWrapper
                                                                                }
                                                                                onClick={() =>
                                                                                    onDeleteInnerGradeRule(
                                                                                        [
                                                                                            'classifications',
                                                                                            'grade_rules',
                                                                                            outIndex,
                                                                                            'classification_rule_subjects',
                                                                                        ],
                                                                                        index,
                                                                                        outIndex,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <FontIcon
                                                                                    name="icon-lajitong"
                                                                                    style={{
                                                                                        fontSize: 16,
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                            )
                                                        },
                                                    )
                                                }}
                                            </Form.List>
                                        </div>
                                    </div>
                                )
                            })
                        }}
                    </Form.List>
                </div>
            </div>
        </div>
    )
}

export default ConfigGradeRule
