import { getHandleObjection } from '@/core'
import { ObjectionMenuEnum, ObjectionTabMap } from '../helper'
import ObjectionTable from './ObjectionTable'
import styles from '../styles.module.less'
import __ from '../locale'

/**
 * 数据异议处理
 */
const ObjectionHandleList = () => {
    return (
        <div className={styles.objectionMgt}>
            <div className={styles.objectionTitle}>
                {ObjectionTabMap[ObjectionMenuEnum.Handle].title}
            </div>
            <ObjectionTable
                menu={ObjectionMenuEnum.Handle}
                func={getHandleObjection}
            />
        </div>
    )
}

export default ObjectionHandleList
