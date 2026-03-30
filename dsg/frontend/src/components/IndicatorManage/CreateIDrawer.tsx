import { FC, useState, useEffect } from 'react'
import { Button, Drawer, Form, Space } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import {
    OperateType,
    TabsKey,
    atomsExpressionRegx,
    changeUrlData,
    compositeExpressionRegx,
} from './const'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import ConfigIndcatorForm from './ConfigIndcatorForm'
import { formatError, getIndicatorDetail } from '@/core'
import IndicatorEdit from './IndicatorEdit'
import { Loader } from '@/ui'
import IndicatorDetail from './IndicatorDetail'
import { rewriteUrl, useQuery } from '@/utils'

interface CreateDrawerType {
    visible: boolean
    onClose: (needReload: boolean) => void
    indicatorType: TabsKey
    domainId?: string
    modelId?: string
    indicatorId?: string
    getContainer?: any
    configType?: OperateType
}
const CreateDrawer: FC<CreateDrawerType> = ({
    visible,
    onClose,
    indicatorType,
    domainId = '',
    modelId = '',
    indicatorId = '',
    getContainer = false,
    configType,
}) => {
    const query = useQuery()

    const detailStatus = query.get('detailStatus')
    const [detailEditStatus, setDetailEditStatus] = useState<boolean>(false)
    const [detailHasEdited, setDetailHasEdited] = useState<boolean>(false)

    useEffect(() => {
        if (detailStatus === 'edit') {
            setDetailEditStatus(true)
        }
    }, [detailStatus])
    // const [hasChange, setHasChange] = useState<boolean>(false)

    // useEffect(() => {
    //     setHasChange(false)
    // }, [visible])

    // /**
    //  *  获取抽屉的title
    //  * @returns
    //  */
    // const getReturnTitle = (curentKey) => {
    //     switch (curentKey) {
    //         case TabsKey.ATOMS:
    //             return indicatorId ? __('编辑原子指标') : __('新建原子指标')
    //         case TabsKey.DERIVE:
    //             return indicatorId ? __('编辑衍生指标') : __('新建衍生指标')
    //         case TabsKey.RECOMBINATION:
    //             return indicatorId ? __('编辑复合指标') : __('新建复合指标')
    //         default:
    //             return ''
    //     }
    // }
    const getPageContent = () => {
        switch (configType) {
            case OperateType.CREATE:
                return (
                    <IndicatorEdit
                        modelDataId={modelId}
                        domainDataId={domainId}
                        indicatorDataType={indicatorType}
                        onClose={onClose}
                    />
                )
            case OperateType.EDIT:
                return (
                    <IndicatorEdit
                        dataId={indicatorId}
                        indicatorDataType={indicatorType}
                        onClose={onClose}
                    />
                )
            case OperateType.DETAIL:
                return detailEditStatus ? (
                    <IndicatorEdit
                        dataId={indicatorId}
                        indicatorDataType={indicatorType}
                        onClose={(isEdited) => {
                            rewriteUrl(changeUrlData({}, ['detailStatus']))
                            setDetailHasEdited(isEdited)
                            setDetailEditStatus(false)
                        }}
                    />
                ) : (
                    <IndicatorDetail
                        indicatorDataId={indicatorId}
                        indicatorDataType={indicatorType}
                        onClose={() => {
                            onClose(detailHasEdited)
                        }}
                        onEdit={() => {
                            setDetailEditStatus(true)
                            rewriteUrl(changeUrlData({ detailStatus: 'edit' }))
                        }}
                    />
                )
            default:
                return (
                    <div className={styles.drawerLoading}>
                        <Loader />
                    </div>
                )
        }
    }

    return (
        <Drawer
            open={visible}
            // onClose={onClose}
            contentWrapperStyle={{
                width: '100%',
                height: getContainer ? '100%' : 'calc(100vh - 56px )',
                boxShadow: 'none',
                transform: 'none',
                marginTop: getContainer ? 0 : '4px',
            }}
            style={
                getContainer
                    ? {
                          position: 'absolute',
                      }
                    : {}
            }
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
            getContainer={getContainer}
        >
            {/* <div className={styles.CreateIndicatorWrap}>
                {getContainer ? null : <div className={styles.bodyShadow} />}
                <div className={styles.titleWrap}>
                    <div className={styles.titleWrapContainer}>
                        <div
                            className={styles.return}
                            onClick={() => {
                                if (hasChange) {
                                    ReturnConfirmModal({
                                        onCancel: () => {
                                            form.resetFields()
                                            setHasChange(false)
                                            onClose()
                                        },
                                    })
                                } else {
                                    form.resetFields()
                                    onClose()
                                }
                            }}
                        >
                            <LeftOutlined style={{ fontSize: 16 }} />
                            <span className={styles.returnText}>
                                {__('返回')}
                            </span>
                        </div>
                        <div className={styles.drawerTitle}>
                            {getReturnTitle(indicatorType)}
                        </div>
                    </div>
                </div>
                <div className={styles.content}>
                    <ConfigIndcatorForm
                        form={form}
                        indicatorType={indicatorType}
                        onChange={() => {
                            setHasChange(true)
                        }}
                        domainId={domainId}
                        modelId={modelId}
                        onFinish={() => {
                            form.resetFields()
                            onClose()
                        }}
                        indicatorId={indicatorId}
                    />
                </div>
                <div className={styles.footer}>
                    <Space>
                        <Button
                            className={styles.btn}
                            onClick={() => {
                                onClose()
                                form.resetFields()
                            }}
                        >
                            {__('取消')}
                        </Button>

                        <Button
                            type="primary"
                            className={styles.btn}
                            onClick={() => {
                                form.submit()
                            }}
                        >
                            {__('确定')}
                        </Button>
                    </Space>
                </div>
            </div> */}
            {getPageContent()}
        </Drawer>
    )
}
export default CreateDrawer
