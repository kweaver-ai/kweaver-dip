import { FC, useState, useEffect, useMemo } from 'react'
import { Drawer, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import styles from './styles.module.less'
import __ from './locale'
import Details from './Details'
// import Apply from './Apply'
import { ResShareDrawerProvider } from './ResShareDrawerProvider'
import { useQuery } from '@/utils'
import Apply from './Apply'
import actionType from '@/redux/actionType'
import { formatError, getApplicationCatalog } from '@/core'
import { SharingOperate, SharingTab } from './const'

interface ICitySharingDrawer {
    open: boolean
    onClose?: () => void
    // 共享申请 id
    applyId?: string
    // 操作类型 view 查看 | create 创建
    operate?: SharingOperate | string
    // 是否全屏 默认全屏
    fullScreen?: boolean
    // 是否是弹窗 默认 false
    isModal?: boolean
    // 目录信息，创建时需要的数据
    applyResource?: any[]
    tab?: SharingTab
    basicInfo?: any
}
const CitySharingDrawer: FC<ICitySharingDrawer> = ({
    open,
    onClose,
    applyId,
    operate,
    fullScreen = true,
    isModal = false,
    applyResource,
    tab,
    basicInfo,
}) => {
    const dispatch = useDispatch()
    const citySharingData = useSelector(
        (state: any) => state?.citySharingReducer,
    )
    const navigate = useNavigate()
    // 路由跳转需要的信息
    const query = useQuery()
    // 共享申请 id
    const id = applyId || query.get('applyId') || ''
    // 操作类型
    const op = operate || query.get('operate') || ''
    // 返回路径
    const backurl = decodeURIComponent(query.get('backurl') || '')

    // 目录信息，创建时需要的数据
    const [resource, setResource] = useState<any[]>([])

    // 目录信息，创建时需要的数据
    useEffect(() => {
        if (applyResource) {
            setResource(
                applyResource,
                // applyResource.map((item) => ({
                //     res_id: item.catalog_id,
                //     res_name: item.catalog_name,
                //     res_description: item.catalog_description,
                //     res_code: item.catalog_code,
                //     res_type: item.res_type,
                //     department_path: item.department_path,
                //     is_online: item.is_online,
                //     ...item,
                // })),
            )
            return
        }
        if (query.get('resources')) {
            const ids = JSON.parse(
                decodeURIComponent(query.get('resources') || ''),
            )
            setResource(
                citySharingData.data.filter((item: any) =>
                    ids.includes(item.res_id),
                ),
            )
        }
    }, [applyResource, citySharingData])

    useEffect(() => {
        if (op === SharingOperate.Create) {
            getCitySharingData()
        }
    }, [op])

    // 获取市州待共享数据
    const getCitySharingData = async () => {
        try {
            const res = await getApplicationCatalog()
            dispatch({
                type: actionType.CITY_SHARING,
                payload: {
                    data: res || [],
                },
            })
        } catch (error) {
            formatError(error)
        }
    }

    // 关闭
    const handleClose = () => {
        if (onClose) {
            return onClose()
        }
        if (backurl) {
            return navigate(backurl)
        }
        return navigate(-1)
    }

    // 获取页面内容
    const getPageContent = () => {
        switch (op) {
            case SharingOperate.Detail:
                return (
                    <Details
                        applyId={id}
                        fullScreen={isModal ? false : fullScreen}
                        onClose={() => handleClose()}
                        tab={tab}
                    />
                )
            case SharingOperate.Create:
                return (
                    <Apply
                        catalogs={resource}
                        onClose={() => handleClose()}
                        basicInfo={basicInfo}
                    />
                )
            default:
                return ''
        }
    }

    return (
        <ResShareDrawerProvider>
            {isModal ? (
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
                        minWidth: fullScreen ? 1080 : 0,
                    }}
                    contentWrapperStyle={{ minWidth: 800 }}
                    destroyOnClose
                    maskClosable={false}
                    mask={false}
                    push={{ distance: 0 }}
                >
                    {getPageContent()}
                </Drawer>
            )}
        </ResShareDrawerProvider>
    )
}
export default CitySharingDrawer
