import styles from '../styles.module.less'
import ListCollection from '@/components/DataPlanManage/ListCollection'
import __ from '../locale'

function CollectionList() {
    return (
        <div className={styles.dataPlanWrapper}>
            <div className={styles.pageTitle}>{__('数据归集清单')}</div>
            <ListCollection />
        </div>
    )
}

export default CollectionList
