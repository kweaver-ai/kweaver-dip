import { Tabs } from 'antd'
import OrganizationalStructure from './OrganizationalStructure'
import ProvincialOriganizationalStructure from '../ProvincialOriganizationalStructure'
import __ from './locale'
import styles from './styles.module.less'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

const Architecture = () => {
    const [{ governmentSwitch }] = useGeneralConfig()
    return governmentSwitch.on ? (
        <Tabs
            defaultActiveKey="1"
            className={styles['architecture-tabs']}
            items={[
                {
                    label: __('组织架构'),
                    key: '1',
                    children: <OrganizationalStructure />,
                },
                {
                    label: __('省级组织架构'),
                    key: '2',
                    children: <ProvincialOriganizationalStructure />,
                },
            ]}
        />
    ) : (
        <OrganizationalStructure />
    )
}

export default Architecture
