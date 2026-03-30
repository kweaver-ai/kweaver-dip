import classnames from 'classnames'
import styles from './styles.module.less'
import {
    DepartmentOutlined,
    FontIcon,
    OrganizationOutlined,
    UserOutlined,
} from '@/icons'

const getIconByType = (type: any) => {
    switch (type) {
        case 'department':
            return <DepartmentOutlined />
        case 'organization':
            return <OrganizationOutlined />
        default:
            return <UserOutlined style={{ fontSize: '18px' }} />
    }
}

function VisitorLabel({ data, title }: any) {
    return (
        <div className={classnames(styles['visitor-label'], 'title-label')}>
            <div className={styles['visitor-label-icon']} title={data?.name}>
                {data.type === 'app' ? (
                    <FontIcon name="icon-jichengyingyong-xianxing" />
                ) : (
                    getIconByType(data?.type)
                )}
            </div>
            <div
                className={styles['visitor-label-title']}
                title={title || data?.name}
            >
                {data?.name}
            </div>
        </div>
    )
}

export default VisitorLabel
