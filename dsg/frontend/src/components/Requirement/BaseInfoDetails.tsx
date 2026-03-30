import React from 'react'
import { Col, Row } from 'antd'
import moment from 'moment'
import { baseInfoFields, RequirementFieldType } from './const'
import styles from './styles.module.less'

interface IBaseInfoDetails {
    details: any
}
const BaseInfoDetails: React.FC<IBaseInfoDetails> = ({ details }) => {
    const getValue = (field) => {
        if (field.type === RequirementFieldType.TIME) {
            return details?.[field.value]
                ? moment(details?.[field.value]).format('YYYY-MM-DD')
                : '--'
        }
        return details?.[field.value] || '--'
    }

    return (
        <div className={styles.baseInfoWrapper}>
            <div className={styles.requirementNo}>
                NO {details?.demand_code}
            </div>
            <Row gutter={24}>
                {baseInfoFields.map((field) => {
                    return (
                        <Col span={field.col || 12} key={field.value}>
                            <div className={styles.fieldItem}>
                                <div className={styles.fieldLabel}>
                                    {field.label}
                                </div>
                                <div
                                    className={styles.fieldValue}
                                    title={getValue(field)}
                                >
                                    {getValue(field)}
                                </div>
                            </div>
                        </Col>
                    )
                })}
            </Row>
        </div>
    )
}
export default BaseInfoDetails
