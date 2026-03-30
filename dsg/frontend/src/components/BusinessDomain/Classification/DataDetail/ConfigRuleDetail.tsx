import { FC, useEffect } from 'react'
import { OperateBox } from '../helper'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'

interface ConfigGradeRuleProps {
    data: any
}
const ConfigRuleDetail: FC<ConfigGradeRuleProps> = ({ data }) => {
    return (
        <div className={styles.configGradeRuleContainer}>
            <div className={styles.configContentWrapper}>
                {data?.grade_rules?.length > 1 ? (
                    <OperateBox operate="or" />
                ) : null}
                <div className={styles.configOutRuleWrapper}>
                    {data?.grade_rules?.map((groupField, outIndex) => {
                        return (
                            <div className={styles.configInRuleItemBox}>
                                <OperateBox operate="and" />
                                <div className={styles.ruleritemContentWrapper}>
                                    {groupField.classification_rule_subjects.map(
                                        (field, index) => {
                                            return (
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
                                                        title={field.name}
                                                    >
                                                        {field.name}
                                                    </span>
                                                </div>
                                            )
                                        },
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default ConfigRuleDetail
