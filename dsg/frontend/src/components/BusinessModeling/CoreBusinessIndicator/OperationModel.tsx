import { memo, useEffect, useMemo, useRef, useState } from 'react'
import CustomDrawer from '@/components/CustomDrawer'
import { BizModelType, IBusinessIndicator } from '@/core'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { OperateType } from '@/utils'
import __ from '../locale'
import CommonForm from './CommonForm'
import { useBusinessModelContext } from '../BusinessModelProvider'

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
            headerWidth="calc(100% - 40px)"
            style={{
                height: 'calc(100% - 100px)',
                top: '76px',
                left: '24px',
                width: 'calc(100% - 48px)',
            }}
            customBodyStyle={{ height: 'calc(100% - 125px)' }}
            title={title}
        >
            <CommonForm ref={formRef} mId={mId} item={item} operate={operate} />
        </CustomDrawer>
    )
}

export default memo(OperationModel)
