import MyTask from '@/components/MyTask'
import styles from './styles.module.less'

function MyTaskMgt() {
    return (
        <div className={styles.myTaskMgtWrapper}>
            {/* <div className={styles.domianTitle}>我的任务</div> */}
            <MyTask />
        </div>
    )
}

export default MyTaskMgt
