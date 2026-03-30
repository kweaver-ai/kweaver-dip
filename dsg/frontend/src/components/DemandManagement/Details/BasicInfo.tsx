import React from 'react'
import DemandInfo from './DemandInfo'
import OperateRecord from './OperateRecord'
import styles from './styles.module.less'

interface IBasicInfo {
    id: string
    isBack?: boolean
}
const BasicInfo: React.FC<IBasicInfo> = ({ id, isBack = false }) => {
    return (
        <div className={styles['basicinfo-wrapper']}>
            <div className={styles['basicinfo-left-content']}>
                <DemandInfo />
            </div>
            {/* <div className={styles['basicinfo-right-content']}>
                <OperateRecord id={id} />
            </div> */}
        </div>
    )
}

export default BasicInfo
