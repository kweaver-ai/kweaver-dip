import { Modal, message } from 'antd'
import { Architecture } from '@/components/BusinessArchitecture/const'
import __ from '../locale'
import VisitorList from './VisitorList'
import {
    VisitorModalProvider,
    useVisitorModalContext,
} from './VisitorModalProvider'
import VisitorTree from './VisitorTree'
import styles from './styles.module.less'

function VisitorModal({ visible, onSure, onClose, applierId }: any) {
    const { items, clearItems } = useVisitorModalContext()
    const handleSure = () => {
        if (!items?.length) {
            message.error('请先添加访问者')
            return
        }
        onSure?.(items)
        clearItems()
    }

    const handleCancel = () => {
        clearItems()
        onClose?.()
    }
    return (
        <Modal
            title={__('添加访问者')}
            open={visible}
            width={640}
            onOk={handleSure}
            onCancel={handleCancel}
            destroyOnClose
            maskClosable={false}
            className={styles['visitor-wrapper']}
        >
            <div className={styles['visitor-wrapper-content']}>
                <div className={styles['visitor-wrapper-content-left']}>
                    <VisitorTree
                        hiddenType={[
                            Architecture.BMATTERS,
                            Architecture.BSYSTEM,
                            Architecture.COREBUSINESS,
                        ]}
                        filterType={[
                            Architecture.ORGANIZATION,
                            Architecture.DEPARTMENT,
                        ].join(',')}
                        applierId={applierId}
                    />
                </div>
                <div className={styles['visitor-wrapper-content-right']}>
                    <VisitorList />
                </div>
            </div>
        </Modal>
    )
}

const AddVisitorModal = (props) => {
    return (
        <VisitorModalProvider>
            <VisitorModal {...props} />
        </VisitorModalProvider>
    )
}

export default AddVisitorModal
