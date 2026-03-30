import DataQualityWorkOrder from '@/components/WorkOrder/WorkOrderManage/DataQualityWorkOrder'
import __ from '../../locale'
import styles from '../../styles.module.less'

function OrderList() {
    return (
        <div className={styles.orderManageWrapper}>
            <div className={styles.pageTitle}>{__('数据质量整改')}</div>
            <DataQualityWorkOrder />
        </div>
    )
}

export default OrderList
