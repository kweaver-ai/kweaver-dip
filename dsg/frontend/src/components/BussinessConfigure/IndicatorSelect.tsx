import React from 'react'
import styles from './styles.module.less'
import { Operation, PolymerValue } from './const'

const IndicatorList: React.FC<{
    indicatorList: any
}> = ({ indicatorList }) => {
    const { name, rule } = indicatorList
    const { measure } = rule
    const { member, operator } = measure
    return (
        <div className={styles.indicatorListItem}>
            <div className={styles.indicatorItemName} title={name}>
                {name}
            </div>
            <div className={styles.indicatorLabels}>
                <div className={styles.leftLabel}>
                    <span title={member[0].name}>{member[0].name}</span>
                    <span>
                        {member[0].aggregate &&
                            PolymerValue[member[0].aggregate]}
                    </span>
                </div>
                {member.length > 1 && (
                    <>
                        <div className={styles.middleLabel}>
                            {operator && Operation[operator]}
                        </div>
                        <div className={styles.rightLabel}>
                            <span title={member[1].name}>{member[1].name}</span>
                            <span>
                                {[member[1].aggregate] &&
                                    PolymerValue[member[1].aggregate]}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
export default IndicatorList
