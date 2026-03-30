import { Button, Modal, Tabs, Tooltip, message } from 'antd'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Architecture } from '@/components/BusinessArchitecture/const'
import __ from '../../locale'
import VisitorList from './VisitorList'
import {
    VisitorModalProvider,
    useVisitorModalContext,
} from './VisitorModalProvider'
import VisitorTree from './VisitorTree'
import styles from './styles.module.less'
import { MicroWidgetPropsContext } from '@/context'
import { TabsItems, VisitorType } from '../../const'
import VisitorApplicationList from './VisitorApplicationList'

function VisitorModal({
    visible,
    onSure,
    onClose,
    visitorTypes = [],
    applyMode = false,
    title = __('添加访问者'),
    // 确定按钮样式，解决转办选择用户时候按钮颜色显示不正确
    modalButtonStyle,
}: any) {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const { items, clearItems } = useVisitorModalContext()
    const [activeKey, setActiveKey] = useState<VisitorType>(
        VisitorType.APPLICATION,
    )
    const [selectTabs, setSelectTabs] = useState<Array<any>>([])

    useEffect(() => {
        setActiveKey(visitorTypes[0])
        setSelectTabs(TabsItems)
    }, [visitorTypes[0]])

    const handleSure = () => {
        if (!items?.length) {
            ;(microWidgetProps?.components?.toast || message).error(
                __('请先添加访问者'),
            )
            return
        }
        onSure?.(items)
        clearItems()
    }

    const handleCancel = () => {
        clearItems()
        onClose?.()
    }

    const getSelectListTemplate = () => {
        switch (activeKey) {
            case VisitorType.USER:
                return (
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
                    />
                )
            case VisitorType.APPLICATION:
                return <VisitorApplicationList applyMode={applyMode} />
            default:
                return null
        }
    }
    return (
        <div className={styles['visitor-modal-wrapper']}>
            <Modal
                title={title}
                open={visible}
                width={800}
                footer={
                    <div className={styles.modalFooter}>
                        <Button onClick={handleCancel}>{__('取消')}</Button>
                        <Tooltip
                            title={
                                items?.length ? '' : __('请先选择要添加的对象')
                            }
                            overlayStyle={{ maxWidth: 500 }}
                            placement="topRight"
                        >
                            <Button
                                disabled={!items?.length}
                                onClick={handleSure}
                                type="primary"
                                style={modalButtonStyle}
                            >
                                {__('确定')}
                            </Button>
                        </Tooltip>
                    </div>
                }
                destroyOnClose
                maskClosable={false}
                getContainer={false}
                onCancel={handleCancel}
                className={styles['visitor-wrapper']}
            >
                <div>
                    <Tabs
                        activeKey={activeKey}
                        items={selectTabs}
                        onChange={(e) => {
                            setActiveKey(e as VisitorType)
                        }}
                        getPopupContainer={(node) => node}
                        tabBarGutter={32}
                        className={styles.viewContentTab}
                    />
                    <div className={styles['visitor-wrapper-content']}>
                        <div className={styles['visitor-wrapper-content-left']}>
                            {getSelectListTemplate()}
                        </div>
                        <div
                            className={styles['visitor-wrapper-content-right']}
                        >
                            <VisitorList />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
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
