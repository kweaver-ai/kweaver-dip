import { Drawer } from 'antd'
import BusinessDiagnosisDetails from '@/components/BusinessDiagnosis/Details'
import styles from './styles.module.less'

function Detail({
    id,
    visible,
    onClose,
}: {
    id: string
    visible: boolean
    onClose: () => void
}) {
    return (
        <Drawer
            open={visible}
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles['opt-wrapper']}>
                <BusinessDiagnosisDetails bdId={id} onClose={onClose} />
            </div>
        </Drawer>
    )
}

export default Detail
