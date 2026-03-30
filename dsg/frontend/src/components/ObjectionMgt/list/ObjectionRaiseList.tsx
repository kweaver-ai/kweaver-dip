import { getRaiseObjection } from '@/core'
import { ObjectionMenuEnum, ObjectionTabMap } from '../helper'
import ObjectionTable from './ObjectionTable'
import styles from '../styles.module.less'
import __ from '../locale'

/**
 * 数据异议提出
 */
const ObjectionRaiseList = () => {
    return (
        <div className={styles.objectionMgt}>
            <div className={styles.objectionTitle}>
                {ObjectionTabMap[ObjectionMenuEnum.Raise].title}
            </div>
            <ObjectionTable
                menu={ObjectionMenuEnum.Raise}
                func={getRaiseObjection}
            />
        </div>
    )
}

export default ObjectionRaiseList
