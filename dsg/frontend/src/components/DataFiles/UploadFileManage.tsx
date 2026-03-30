import { CloseOutlined } from '@ant-design/icons'
import { Drawer } from 'antd'
import __ from './locale'
import styles from './styles.module.less'
import UploadMultipleAttachment from './Upload'

interface UploadFileManageProps {
    open: boolean
    onClose: () => void
    id: string
}

const UploadFileManage = ({ open, onClose, id }: UploadFileManageProps) => {
    return (
        <Drawer
            width={1000}
            title={
                <div className={styles.editFieldTitle}>
                    <div className={styles.editTitle}>{__('附件')}</div>
                    <div className={styles.closeButton}>
                        <CloseOutlined
                            onClick={() => {
                                onClose()
                            }}
                        />
                    </div>
                </div>
            }
            placement="right"
            closable={false}
            mask={false}
            open
            getContainer={false}
            footer={null}
        >
            {id && <UploadMultipleAttachment dataId={id} />}
        </Drawer>
    )
}

export default UploadFileManage
