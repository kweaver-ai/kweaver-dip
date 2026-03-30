import { MarkAGreenColored, MarkBGreenColored, MarkGreenColored } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'

const TypeShow = () => {
    return (
        <div className={styles['type-show-container']}>
            <div className={styles['business-form']}>
                <MarkGreenColored className={styles['business-icon']} />
                <span className={styles.desc}>{__('业务表')}</span>
            </div>
            <div className={styles['map-info']}>
                <MarkAGreenColored className={styles['business-icon']} />
                <div className={styles.arrow} />
                <MarkBGreenColored className={styles['business-icon']} />
                <span className={styles.desc}>
                    {__('B表数据由拖拽至画布的A表“引用/复制”后得到')}
                </span>
            </div>
        </div>
    )
}

export default TypeShow
