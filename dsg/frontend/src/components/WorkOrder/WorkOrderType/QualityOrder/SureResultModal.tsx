import { Button, Modal, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { CheckCircleFilled } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'

const SureResultModal = ({ visible, onClose }: any) => {
    const navigate = useNavigate()
    const handleNavigate = () => {
        navigate(`/dataQualityManage/dataQualityWorkOrder`)
    }

    return (
        <Modal
            title={__('提示')}
            open={visible}
            maskClosable={false}
            destroyOnClose
            getContainer={false}
            width={560}
            bodyStyle={{ maxHeight: 400, overflow: 'auto', paddingBottom: 0 }}
            footer={
                <div className={styles.sureFootWrapper}>
                    <Space size={8}>
                        <Button onClick={onClose} className={styles.btn}>
                            {__('否')}
                        </Button>

                        <Button
                            onClick={handleNavigate}
                            type="primary"
                            className={styles.btn}
                        >
                            {__('是')}
                        </Button>
                    </Space>
                </div>
            }
        >
            <div style={{ textAlign: 'center' }}>
                <div>
                    <CheckCircleFilled
                        style={{ color: '#52c41a', fontSize: '64px' }}
                    />
                </div>
                <div style={{ marginTop: '20px' }}>{__('工单创建完成')}</div>
                <div style={{ marginBottom: '20px' }}>
                    {__('是否跳转至工单列表查看')}
                </div>
            </div>
        </Modal>
    )
}

export default SureResultModal
