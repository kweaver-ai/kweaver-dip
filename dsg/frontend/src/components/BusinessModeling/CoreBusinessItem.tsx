import React, { useContext, useMemo, useState } from 'react'
import { Dropdown, message, Modal } from 'antd'
import classnames from 'classnames'
import { EllipsisOutlined, ModelFilledOutlined } from '@/icons'
import { OperateType } from '@/utils'
import { TaskInfoContext } from '@/context'
import styles from './styles.module.less'
import __ from './locale'
import {
    deleteCoreBusiness,
    formatError,
    ICoreBusinessItem,
    TaskStatus,
    TaskType,
} from '@/core'
import Confirm from '../Confirm'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface ICoreBusinessCard {
    item: ICoreBusinessItem
    isSelected: boolean
    getSelectedCoreBusiness: (coreBusiness: ICoreBusinessItem) => void
    handleOperate: (ot: OperateType, id?: string) => void
    onDeleteSuccess: () => void
}
const CoreBusinessItem: React.FC<ICoreBusinessCard> = ({
    item,
    isSelected,
    getSelectedCoreBusiness,
    handleOperate,
    onDeleteSuccess,
}) => {
    const [showOperate, setShowOperate] = useState(false)
    const [delOpen, setDelOpen] = useState(false)
    const { taskInfo } = useContext(TaskInfoContext)
    const { checkPermission } = useUserPermCtx()
    const hasOprAccess = useMemo(
        () => checkPermission('manageBusinessModelAndBusinessDiagnosis'),
        [checkPermission],
    )

    const items = hasOprAccess
        ? [
              {
                  key: OperateType.EDIT,
                  label: __('编辑'),
              },
              {
                  key: OperateType.DELETE,
                  label: __('删除'),
              },
          ]
        : []

    const onClick = ({ key, domEvent }) => {
        domEvent.stopPropagation()
        if (key === OperateType.EDIT) {
            handleOperate(OperateType.EDIT, item.main_business_id)
        }
        if (key === OperateType.DELETE) {
            setDelOpen(true)
        }
        domEvent.preventDefault()
    }

    const handleClick = () => {
        getSelectedCoreBusiness(item)
    }

    // 删除业务模型
    const delCoreBusiness = async () => {
        try {
            await deleteCoreBusiness(item.main_business_id, {
                taskId: taskInfo?.taskId || '',
                subject_domain_id: taskInfo.subDomainId,
            })
            message.success(__('删除成功'))
            onDeleteSuccess()
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div
            className={classnames({
                [styles.coreBusinessItem]: true,
                [styles.selectedCoreBusinessItem]: isSelected,
            })}
            onMouseEnter={() => setShowOperate(true)}
            onMouseLeave={() => setShowOperate(false)}
            onClick={handleClick}
        >
            <div className={styles.modelIconWrapper}>
                <ModelFilledOutlined className={styles.modelIcon} />
            </div>
            <div className={styles.businessInfo}>
                <div className={styles.textInfo}>
                    <div className={styles.name} title={item.name}>
                        {item.name}
                    </div>
                    {[
                        TaskType.DATACOLLECTING,
                        TaskType.DATAPROCESSING,
                    ].includes(taskInfo.taskType) && (
                        <div
                            className={styles.domain}
                            title={item.business_domain_name}
                        >
                            {__('业务领域：')}
                            {item.business_domain_name}
                        </div>
                    )}
                </div>
                {[TaskType.DATACOLLECTING, TaskType.DATAPROCESSING].includes(
                    taskInfo.taskType,
                ) ||
                taskInfo.taskStatus === TaskStatus.COMPLETED ||
                items.filter((i) => i !== null).length === 0 ? null : (
                    <div className={styles.dropdown} hidden={!showOperate}>
                        <Dropdown
                            menu={{ items, onClick }}
                            placement="bottomLeft"
                            trigger={['click']}
                            className={styles.itemMore}
                            overlayStyle={{ width: 90 }}
                        >
                            <EllipsisOutlined className={styles.operateIcon} />
                        </Dropdown>
                    </div>
                )}
            </div>
            <Confirm
                onOk={() => delCoreBusiness()}
                onCancel={() => setDelOpen(false)}
                open={delOpen}
                title={__('确认要删除业务模型吗？')}
                content={__('删除后，本业务模型下的所有内容将一并删除。')}
                okText={__('确定')}
                cancelText={__('取消')}
            />
        </div>
    )
}

export default CoreBusinessItem
