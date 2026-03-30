import classnames from 'classnames'
import { Badge } from 'antd'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'

const IconInstructions = () => {
    return (
        <div className={styles['icon-instructions-wrapper']}>
            <div className={styles.item}>
                <FontIcon
                    name="icon-shuxing"
                    className={classnames(styles.icon, styles['attr-icon'])}
                />
                <span className={styles.desc}>{__('表示字段已分类')}</span>
            </div>
            <div className={styles.item}>
                <Badge dot color="#1890FF" offset={[-10, 16]}>
                    <FontIcon
                        name="icon-shuxing"
                        className={classnames(styles.icon, styles['attr-icon'])}
                    />
                </Badge>
                <span className={styles.desc}>
                    {__('表示字段当前分类是根据探查结果进行的自动分类')}
                </span>
            </div>
            <div className={styles.item}>
                <FontIcon
                    name="icon-biaoqianicon"
                    className={classnames(styles.icon, styles['tag-icon'])}
                />
                <span className={styles.desc}>
                    {__('表示字段已有分级标签（不同颜色代表不同级别）')}
                </span>
            </div>
        </div>
    )
}

export default IconInstructions
