import { Dropdown, message } from 'antd'
import React, { useContext, useMemo, useState } from 'react'
import { OperateType } from '@/utils'
import { EllipsisOutlined } from '@/icons'
import styles from './styles.module.less'
import CreateCoreBusiness from './CreateCoreBusiness'
import { ViewMode } from './const'
import __ from './locale'
import Confirm from '../Confirm'
import {
    deleteCoreBusiness,
    formatError,
    getBusinessDomainTreeNodeDetails,
} from '@/core'
import { TaskInfoContext } from '@/context'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IModelOperate {
    modelId: string
    onCreateSuccess?: () => void
    onDelSuccess?: () => void
}
const ModelOperate: React.FC<IModelOperate> = ({
    modelId,
    onCreateSuccess,
    onDelSuccess,
}) => {
    const { checkPermission } = useUserPermCtx()
    const [createModelVisible, setCreateModelVisible] = useState(false)
    const [delOpen, setDelOpen] = useState(false)
    const { taskInfo, setTaskInfo } = useContext(TaskInfoContext)

    const hasOprAccess = useMemo(
        () => checkPermission('manageBusinessModelAndBusinessDiagnosis'),
        [checkPermission],
    )

    const modelItems = hasOprAccess
        ? [
              {
                  key: OperateType.EDIT,
                  label: __('编辑模型基本信息'),
              },
              {
                  key: OperateType.DELETE,
                  label: __('删除模型'),
              },
          ]
        : []

    // 删除业务模型
    const delCoreBusiness = async () => {
        try {
            await deleteCoreBusiness(modelId, {
                taskId: taskInfo.taskId,
                subject_domain_id: '',
            })
            message.success(__('删除成功'))
            onDelSuccess?.()
            setDelOpen(false)
            const processInfo = await getBusinessDomainTreeNodeDetails(
                taskInfo?.domain_id,
            )
            setTaskInfo({
                ...taskInfo,
                processInfo,
                modelId: undefined,
                business_model_id: undefined,
            })
        } catch (error) {
            formatError(error)
        }
    }

    const onClick = ({ key, domEvent }) => {
        domEvent.stopPropagation()
        domEvent.preventDefault()
        if (key === OperateType.DELETE) {
            setDelOpen(true)
        } else if (key === OperateType.EDIT) {
            setCreateModelVisible(true)
        }
    }

    return (
        <div>
            <Dropdown
                menu={{ items: modelItems, onClick }}
                placement="bottomLeft"
                trigger={['hover']}
                overlayStyle={{ width: 160 }}
            >
                <div className={styles['mode-operate']}>
                    <EllipsisOutlined className={styles.operateIcon} />
                </div>
            </Dropdown>
            <CreateCoreBusiness
                visible={createModelVisible}
                operateType={OperateType.EDIT}
                onClose={() => setCreateModelVisible(false)}
                onSuccess={onCreateSuccess}
                editId={modelId}
                viewMode={ViewMode.BArchitecture}
                selectedNode={taskInfo.processInfo}
            />
            <Confirm
                onOk={() => {
                    delCoreBusiness()
                }}
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

export default ModelOperate
