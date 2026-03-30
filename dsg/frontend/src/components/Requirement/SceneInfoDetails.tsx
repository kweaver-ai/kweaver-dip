import React from 'react'
import { Col, Row } from 'antd'
import moment from 'moment'
import { RequirementFieldType, sceneInfoFields } from './const'
import styles from './styles.module.less'

interface ISceneInfoDetails {
    details: any
}
const SceneInfoDetails: React.FC<ISceneInfoDetails> = ({ details }) => {
    const getValue = (field) => {
        const val: any = details?.[field.value]

        if (val) {
            if (field.type === RequirementFieldType.TIME) {
                return moment(details?.[field.value]).format('YYYY-MM-DD')
            }
            if (field.type === RequirementFieldType.TAG && Array.isArray(val)) {
                return val.length > 0 ? (
                    <div className={styles.tagWrapper}>
                        {val.map((v) => {
                            return (
                                <div className={styles.tag} title={v} key={v}>
                                    {v.length > 17 ? `${v.slice(0, 17)}...` : v}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    '--'
                )
            }

            return details?.[field.value]
        }
        return '--'
    }

    return (
        <div className={styles.baseInfoWrapper}>
            <Row>
                {sceneInfoFields.map((field) => {
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
export default SceneInfoDetails
