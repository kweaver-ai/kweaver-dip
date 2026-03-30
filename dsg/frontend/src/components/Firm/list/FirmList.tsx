import FirmTable from './FirmTable'
import { FirmMenuEnum, FirmTabMap } from '../helper'
import styles from '../styles.module.less'
import __ from '../locale'

/**
 * 厂商名录
 */
const FirmList = () => {
    return (
        <div className={styles.firmkMgt}>
            <div className={styles.firmTitle}>
                {FirmTabMap[FirmMenuEnum.List].title}
            </div>
            <FirmTable menu={FirmMenuEnum.List} />
        </div>
    )
}

export default FirmList
