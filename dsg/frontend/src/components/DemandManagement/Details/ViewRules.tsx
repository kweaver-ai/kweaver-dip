import React, { useEffect, useState } from 'react'
import { Col, Collapse, Row, Tooltip } from 'antd'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import { flattenDeep } from 'lodash'
import __ from '../locale'
import styles from './styles.module.less'
import { IMemberData } from '@/core'
import Icons from '../Icons'
import { Relation, RelationTextMap } from '../const'
import { conditionArr } from '../ColumnRuleConfig/const'
import { FontIcon } from '@/icons'

const { Panel } = Collapse

enum TabsEnum {
    Rule = 'rule',
    Visitors = 'visitors',
}
interface IViewRules {
    fields: any
    detail?: string
}
const ROW_HEIGHT = 32
const ROW_MARGIN = 16
const ViewRules: React.FC<IViewRules> = ({ fields = [], detail }) => {
    const [rules, setRules] = useState<IMemberData[][]>([[]])
    const [whereRelation, setWhereRelation] = useState(Relation.And)
    const [groupRelations, setGroupRelations] = useState<Relation[]>([])
    const [showFields, setShowFields] = useState<any[]>([])

    useEffect(() => {
        if (detail && fields.length > 0) {
            const detailInfo = JSON.parse(detail)
            setShowFields(
                detailInfo.fields.map((f1) =>
                    fields.find((f2) => f2.id === f1.id),
                ),
            )
            const rulesArr: IMemberData[][] = []
            const gRelations: Relation[] = []
            detailInfo.row_filters?.where.forEach((item) => {
                rulesArr.push(item.member)
                gRelations.push(item.relation as Relation)
            })
            setRules(rulesArr)
            setGroupRelations(gRelations)
            setWhereRelation(detailInfo.row_filters?.where_relation as Relation)
        }
    }, [detail, fields])

    const getGroupRelateHeight = () => {
        // 全部行数
        const rulesLen = flattenDeep(rules).length
        // 组数
        const groupLen = rules.length
        // 第一组的行数
        const firstGroupLen = rules[0].length
        // 最后一组的行数
        const lastGroupLen = rules[groupLen - 1].length

        // 组连接线高度 = 总高度 - 第一组高度的一半 - 最后一组高度的一半
        const gHeight =
            rulesLen * ROW_HEIGHT +
            (rulesLen - 1) * ROW_MARGIN -
            (firstGroupLen * ROW_HEIGHT + (firstGroupLen - 1) * ROW_MARGIN) /
                2 -
            (lastGroupLen * ROW_HEIGHT + (lastGroupLen - 1) * ROW_MARGIN) / 2

        return gHeight
    }

    const getExpandIcon = (panelProps) => {
        return panelProps.isActive ? (
            <CaretDownOutlined className={styles['arrow-icon']} />
        ) : (
            <CaretRightOutlined className={styles['arrow-icon']} />
        )
    }

    return (
        <div className={styles['view-rule-wrapper']}>
            <Collapse
                bordered={false}
                defaultActiveKey={['1', '2']}
                ghost
                expandIcon={getExpandIcon}
            >
                <Panel header={__('限定列')} key="1">
                    <Row className={styles['field-container']} gutter={12}>
                        {showFields?.map((field, index) => (
                            <Col
                                className={styles['field-item']}
                                span={4}
                                key={index}
                            >
                                <Icons type={field?.data_type} />
                                <span
                                    className={styles['field-name']}
                                    title={field?.business_name}
                                >
                                    {field?.business_name}
                                </span>
                                {field.label_id && (
                                    <div
                                        className={
                                            styles['field-wrapper-title-label']
                                        }
                                    >
                                        <Tooltip
                                            title={
                                                <div
                                                    className={
                                                        styles[
                                                            'field-wrapper-title-label-tip'
                                                        ]
                                                    }
                                                >
                                                    <span>数据分级:</span>
                                                    {field.label_path || '--'}
                                                </div>
                                            }
                                            getPopupContainer={(node) =>
                                                node.parentElement || node
                                            }
                                            showArrow={false}
                                            overlayClassName={styles.label}
                                        >
                                            <FontIcon
                                                name="icon-biaoqianicon"
                                                style={{
                                                    color: field.label_icon,
                                                }}
                                                className={styles['tag-icon']}
                                            />
                                        </Tooltip>
                                    </div>
                                )}
                            </Col>
                        ))}
                    </Row>
                </Panel>
                <Panel header={__('限定行')} key="2">
                    <div className={styles['rule-container']}>
                        {rules.length > 1 && (
                            <div
                                className={styles['group-relate']}
                                style={{
                                    height: getGroupRelateHeight(),
                                    marginTop:
                                        (rules[0].length * ROW_HEIGHT +
                                            (rules[0].length - 1) *
                                                ROW_MARGIN) /
                                        2,
                                }}
                            >
                                <div className={styles['relate-text']}>
                                    {RelationTextMap[whereRelation]}
                                </div>
                            </div>
                        )}

                        <div className={styles['rule-groups']}>
                            {rules.map((group, index) => (
                                <div
                                    className={styles['rule-group']}
                                    key={index}
                                >
                                    {group.length > 1 && (
                                        <div
                                            className={styles['row-relate']}
                                            style={{
                                                height:
                                                    group.length * ROW_HEIGHT +
                                                    (group.length - 1) *
                                                        ROW_MARGIN -
                                                    ROW_HEIGHT,
                                            }}
                                        >
                                            <div
                                                className={
                                                    styles['relate-text']
                                                }
                                            >
                                                {groupRelations &&
                                                    RelationTextMap[
                                                        groupRelations[index]
                                                    ]}
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles['rule-rows']}>
                                        {group.map((item, gIndex) => (
                                            <div
                                                className={styles['rule-row']}
                                                key={gIndex}
                                            >
                                                <div
                                                    className={
                                                        styles['field-name']
                                                    }
                                                    title={item.name}
                                                >
                                                    {item.name}
                                                </div>
                                                <div
                                                    className={
                                                        styles[
                                                            'field-condition'
                                                        ]
                                                    }
                                                >
                                                    {
                                                        conditionArr.find(
                                                            (condition) =>
                                                                condition.value ===
                                                                item.operator,
                                                        )?.label
                                                    }
                                                </div>
                                                <div
                                                    className={
                                                        styles['field-value']
                                                    }
                                                    title={item.value}
                                                >
                                                    {item.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Panel>
            </Collapse>
        </div>
    )
}
export default ViewRules
