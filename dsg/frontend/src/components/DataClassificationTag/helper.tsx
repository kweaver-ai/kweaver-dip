import styles from './styles.module.less'
import __ from './locale'

export const getTabByUsing = (using?: number) => {
    const tooltip = using
        ? __('仅对应用“智能找数”生效，若未安装此应用，可忽略配置。')
        : __('仅对应用“智能找数”生效，若未安装此应用或无编目场景，可忽略配置。')

    return (
        <span className={styles['tag-label']} title={tooltip}>
            {__('应用：智能找数')}
        </span>
    )
}
