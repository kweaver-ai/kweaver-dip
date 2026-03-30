import styles from './styles.module.less'
import { DepartmentOutlined, OrganizationOutlined, UserOutlined } from '@/icons'

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

function VisitorLabel({ data }: any) {
    return (
        <div className={styles['visitor-label']}>
            <div className={styles['visitor-label-icon']}>
                {getIconByType(data?.type)}
            </div>
            <div className={styles['visitor-label-title']} title={data?.name}>
                {data?.name}
            </div>
        </div>
    )
}

export default VisitorLabel
