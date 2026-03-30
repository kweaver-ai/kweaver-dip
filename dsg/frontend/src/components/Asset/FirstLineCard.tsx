import { Statistic } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import Icons from './Icons'

function FirstLineCard({ item }: any) {
    return (
        <div className={styles.firstLineCardWrapper}>
            <div className={styles.iconBox}>
                <Icons type={item.key} />
            </div>
            <div className={styles.titleBox}>
                <div className={styles.title}>{item.title}</div>
                <div className={styles.countWrapper}>
                    <span className={styles.count}>
                        <Statistic value={item.count || 0} />
                    </span>
                </div>
            </div>
        </div>
    )
}

export default FirstLineCard
