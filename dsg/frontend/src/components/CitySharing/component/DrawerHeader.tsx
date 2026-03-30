import { Space } from 'antd'
import { CloseOutlined, LeftOutlined } from '@ant-design/icons'
import __ from '../locale'
import styles from './styles.module.less'
import GlobalMenu from '@/components/GlobalMenu'

interface IDrawerHeader {
    title?: string // 标题
    fullScreen?: boolean // 是否全屏，默认全屏
    onClose?: () => void // 关闭
}

/**
 * 抽屉头部
 */
const DrawerHeader = ({ title, fullScreen = true, onClose }: IDrawerHeader) => {
    return (
        <div className={styles.drawerHeader}>
            {fullScreen ? (
                <Space className={styles.returnWrappper} size={12}>
                    <div className={styles.returnInfo}>
                        <GlobalMenu />
                        <div onClick={() => onClose?.()}>
                            <LeftOutlined className={styles.returnArrow} />
                            <span className={styles.returnText}>
                                {__('返回')}
                            </span>
                        </div>
                    </div>
                    {title && <div className={styles.divider} />}
                    <div className={styles.titleText} title={title}>
                        {title}
                    </div>
                </Space>
            ) : (
                <>
                    <div className={styles.titleText} title={title}>
                        {title}
                    </div>
                    <CloseOutlined
                        className={styles.close}
                        onClick={() => onClose?.()}
                    />
                </>
            )}
        </div>
    )
}

export default DrawerHeader
