import Empty from '@/ui/Empty'
import CustomDrawer from '@/components/CustomDrawer'
import styles from './styles.module.less'
import { CloseOutlined } from '@/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from '../../locale'

interface IEmptyDrawerType {
    open?: boolean
    onClose: (flag?: boolean) => void
}
function EmptyDrawer({ open, onClose }: IEmptyDrawerType) {
    return (
        <div className={styles['empty-drawer']}>
            <CustomDrawer
                open={open}
                destroyOnClose
                onCancel={onClose}
                onClose={() => onClose()}
                isShowHeader={false}
                isShowFooter={false}
                customBodyStyle={{
                    flexDirection: 'column',
                    height: '100%',
                }}
                contentWrapperStyle={{
                    width: '100%',
                    boxShadow: '0 0 10px 0px rgb(15 32 68 / 10%)',
                }}
                bodyStyle={{
                    width: 417,
                    padding: 0,
                }}
                style={{
                    position: 'relative',
                    width: 417,
                    right: '0',
                    height: '100%',
                }}
            >
                <div className={styles.headerBtnWrapper}>
                    <CloseOutlined
                        className={styles.closeIcon}
                        onClick={onClose}
                    />
                </div>
                <Empty
                    iconSrc={dataEmpty}
                    desc={__('此逻辑实体暂未关联库表')}
                    style={{ marginTop: '-20vh' }}
                />
            </CustomDrawer>
        </div>
    )
}

export default EmptyDrawer
