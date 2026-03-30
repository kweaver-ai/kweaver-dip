import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Anchor } from 'antd'
import CustomDrawer from '@/components/CustomDrawer'
import { BizModelType, IBusinessIndicator } from '@/core'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { OperateType } from '@/utils'
import __ from '../../locale'
import { useBusinessModelContext } from '../../BusinessModelProvider'
import styles from './styles.module.less'
import DataIndicatorForm from './DataIndicatorForm'
import DetailDataIndicator from './DetailDataIndicator'

interface IOperaionModelType {
    visible?: boolean
    item?: IBusinessIndicator
    mId: string
    operate: OperateType
    onClose: () => void
    onSure: () => void
}

const OperationModel = ({
    visible,
    operate,
    item,
    mId,
    onClose,
    onSure,
}: IOperaionModelType) => {
    const [loading, setLoading] = useState<boolean>(false)
    const formRef = useRef<any>()
    const { businessModelType } = useBusinessModelContext()
    const { Link } = Anchor

    useEffect(() => {
        if (visible) {
            formRef.current?.setValues()
        } else {
            formRef.current?.resetFields()
        }
    }, [visible, item])

    const handleClose = () => {
        onClose()
        formRef.current?.resetFields()
    }

    const handleCancel = () => {
        const isEqual = formRef.current?.checkIsChange()
        if (isEqual) {
            handleClose()
        } else {
            ReturnConfirmModal({
                onCancel: () => {
                    handleClose()
                },
            })
        }
    }

    const handleOk = async () => {
        setLoading(true)
        const isSuccess = await formRef.current?.handleSubmit()
        setLoading(false)

        if (isSuccess) {
            handleClose()
            onSure()
        }
    }

    const title = useMemo(
        () =>
            operate === OperateType.CREATE
                ? businessModelType === BizModelType.BUSINESS
                    ? __('新建业务指标')
                    : __('新建数据指标')
                : businessModelType === BizModelType.BUSINESS
                ? __('编辑业务指标')
                : __('编辑数据指标'),
        [operate],
    )

    return (
        <CustomDrawer
            open={visible}
            destroyOnClose
            loading={loading}
            onCancel={handleClose}
            onClose={handleCancel}
            handleOk={handleOk}
            title={title}
            customHeaderStyle={{
                height: '52px',
                padding: '0 16px',
            }}
            footerStyle={{
                height: operate !== OperateType.DETAIL ? '50px' : '0',
            }}
            isShowFooter={operate !== OperateType.DETAIL}
            customBodyStyle={{
                height:
                    operate !== OperateType.DETAIL
                        ? 'calc(100% - 116px)'
                        : 'calc(100% - 52px)',
            }}
        >
            <div className={styles.operationModelContainer}>
                {operate === OperateType.DETAIL ? (
                    <DetailDataIndicator indicatorId={item?.id || ''} />
                ) : (
                    <DataIndicatorForm
                        ref={formRef}
                        mId={mId}
                        item={item}
                        operate={operate}
                    />
                )}
                <div className={styles.menuContainer}>
                    <Anchor
                        targetOffset={160}
                        getContainer={() => window}
                        onClick={(e: any) => e.preventDefault()}
                        className={styles.anchorWrapper}
                    >
                        <Link
                            href="#component-indictor-base"
                            title={__('基本属性')}
                        />
                        <Link
                            href="#component-indicator-statistics"
                            title={__('统计信息')}
                        />
                    </Anchor>
                </div>
            </div>
        </CustomDrawer>
    )
}

export default memo(OperationModel)
