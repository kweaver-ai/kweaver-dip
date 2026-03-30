import React, { useEffect, useState, useMemo, ReactNode } from 'react'
import styles from './styles.module.less'
import ExplorationFields from '../ExplorationFields'
import ExplorationAttribute from '../ExplorationAttribute'

const FieldRules = () => {
    return (
        <div className={styles.fieldRulesWrapper}>
            <div className={styles.left}>
                <ExplorationFields />
            </div>
            <div className={styles.right}>
                <ExplorationAttribute />
            </div>
        </div>
    )
}

export default FieldRules
