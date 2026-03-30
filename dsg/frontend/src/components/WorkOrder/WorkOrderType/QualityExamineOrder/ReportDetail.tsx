import { Breadcrumb, Drawer } from 'antd'
import ReportDetailContent from '@/components/WorkOrder/QualityReport/ReportDetail/ReportDetailContent'
import Return from '../../Return'
import styles from './styles.module.less'

function ReportDetail({
    item,
    title,
    visible,
    onClose,
    showCorrection = true,
}: any) {
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
            <div className={styles.reportDetail}>
                <div className={styles.header}>
                    <Return
                        onReturn={() => onClose(false)}
                        title={
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Breadcrumb>
                                    <Breadcrumb.Item>
                                        <a onClick={() => onClose?.()}>
                                            {title || '质量检测工单详情'}
                                        </a>
                                    </Breadcrumb.Item>
                                    <Breadcrumb.Item>查看报告</Breadcrumb.Item>
                                </Breadcrumb>
                            </div>
                        }
                    />
                </div>
                <ReportDetailContent
                    item={item}
                    showCorrection={showCorrection}
                />
            </div>
        </Drawer>
    )
}

export default ReportDetail
