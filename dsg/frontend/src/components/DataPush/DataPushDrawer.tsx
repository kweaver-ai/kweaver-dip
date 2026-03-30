import { FC } from 'react'
import { Drawer, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.less'
import __ from './locale'
import Details from './Details'
import { useQuery } from '@/utils'
import { DataPushAction } from './const'
import CreateDataPush from './CreateDataPush'

interface IDataPushDrawer {
    open: boolean
    onClose?: (refresh?: boolean) => void
    // 数据推送 id
    dataPushId?: string
    // 操作类型 DataPushAction
    operate?: string
    // 是否全屏 默认全屏
    fullScreen?: boolean
    // 是否是弹窗 默认 false
    isModal?: boolean
}
const DataPushDrawer: FC<IDataPushDrawer> = ({
    open,
    onClose,
    dataPushId,
    operate,
    fullScreen = true,
    isModal = false,
}) => {
    const navigate = useNavigate()
    // 路由跳转需要的信息
    const query = useQuery()
    const id = dataPushId || query.get('dataPushId') || ''
    const op = operate || query.get('operate') || ''
    // 返回路径
    const backurl = decodeURIComponent(query.get('backurl') || '')

    const handleClose = (refresh?: boolean) => {
        if (onClose) {
            return onClose(refresh)
        }
        if (backurl) {
            return navigate(backurl)
        }
        return navigate(-1)
    }

    const getPageContent = () => {
        switch (op) {
            case DataPushAction.Detail:
            case DataPushAction.Monitor:
                return (
                    <Details
                        dataPushId={id}
                        operate={op}
                        fullScreen={isModal ? false : fullScreen}
                        onClose={() => handleClose()}
                    />
                )
            case DataPushAction.Create:
            case DataPushAction.Edit:
                return (
                    <CreateDataPush
                        dataPushId={id}
                        operate={op}
                        onClose={(refresh) => {
                            handleClose(refresh)
                        }}
                    />
                )
            default:
                return ''
        }
    }

    return isModal ? (
        <Modal
            width="80%"
            open={open}
            closable={false}
            centered
            destroyOnClose
            footer={null}
            style={{ maxWidth: 1200 }}
            bodyStyle={{
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                height: document.body.clientHeight * 0.9,
            }}
        >
            {getPageContent()}
        </Modal>
    ) : (
        <Drawer
            open={open}
            width={fullScreen ? '100%' : '80%'}
            placement="right"
            closable={false}
            bodyStyle={{
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            {getPageContent()}
        </Drawer>
    )
}
export default DataPushDrawer
