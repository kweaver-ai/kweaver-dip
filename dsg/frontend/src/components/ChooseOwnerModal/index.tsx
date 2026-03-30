import { useEffect, useRef, useState } from 'react'
import { Modal } from 'antd'
import VisitorList from '../OperationAssessment/AddVisitorModal/components/VisitorList'
import VisitorTree from '../OperationAssessment/AddVisitorModal/components/VisitorTree'
import __ from './locale'
import styles from '../OperationAssessment/AddVisitorModal/styles.module.less'
import { Architecture } from '@/components/BusinessArchitecture/const'
import { OptionType } from '../OperationAssessment/AddVisitorModal/const'

interface IChooseOwnerModal {
    open: boolean
    value?: any // 单选时为对象或字符串ID，多选时为数组
    onOk: (data: any) => void // 单选时返回对象，多选时返回数组
    onCancel: () => void
    multiple?: boolean // 是否多选，默认为 false（单选）
    title?: string // Modal 标题，默认为"选择数据Owner"
}

function ChooseOwnerModal({
    open,
    value,
    onOk,
    onCancel,
    multiple = false,
    title,
}: IChooseOwnerModal) {
    const treeRef = useRef<any>()
    const [selectedMembers, setSelectedMembers] = useState<any[]>([])

    useEffect(() => {
        if (!open) {
            treeRef?.current?.onClear()
            setSelectedMembers([])
        }
    }, [open])

    useEffect(() => {
        if (!open) {
            return
        }

        if (!value) {
            setSelectedMembers([])
            return
        }

        if (multiple) {
            // 多选模式：value 应该是数组
            if (Array.isArray(value)) {
                setSelectedMembers(value)
            } else {
                setSelectedMembers([])
            }
            return
        }

        // 单选模式：value 可能是用户ID或用户对象
        if (typeof value === 'string') {
            // 如果是ID，需要转换为对象格式
            setSelectedMembers([{ id: value }])
        } else if (value.id) {
            setSelectedMembers([value])
        } else {
            setSelectedMembers([])
        }
    }, [value, open, multiple])

    const handleOptItem = (type, item) => {
        if (type === OptionType.Remove) {
            setSelectedMembers(
                selectedMembers.filter((it) => it.id !== item.id),
            )
        }
        if (type === OptionType.Add) {
            // 只允许选择用户
            if (item.type === 'user') {
                if (multiple) {
                    // 多选模式：添加到列表，避免重复
                    if (!selectedMembers.find((m) => m.id === item.id)) {
                        setSelectedMembers([
                            ...selectedMembers,
                            { id: item.id, name: item.name },
                        ])
                    }
                } else {
                    // 单选模式：替换当前选择
                    setSelectedMembers([{ id: item.id, name: item.name }])
                }
            }
        }
    }

    const handleOk = () => {
        if (multiple) {
            // 多选模式：返回数组
            onOk?.(selectedMembers)
        } else {
            // 单选模式：返回第一个选中的用户对象
            const selectedUser = selectedMembers[0]
            if (selectedUser) {
                onOk?.(selectedUser)
            }
        }
        onCancel()
    }

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title={title || __('选择数据Owner')}
            width={800}
            bodyStyle={{ height: 484 }}
            onOk={handleOk}
            okButtonProps={{
                disabled: selectedMembers.length === 0,
            }}
            destroyOnClose
        >
            <div className={styles['visitor-wrapper']}>
                <div className={styles['visitor-wrapper-title']}>
                    {__('组织架构')}
                </div>
                <div className={styles['visitor-wrapper-content']}>
                    <div className={styles['visitor-wrapper-content-left']}>
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
                            items={selectedMembers}
                            optItem={handleOptItem}
                            ref={treeRef}
                        />
                    </div>
                    <div className={styles['visitor-wrapper-content-right']}>
                        <VisitorList
                            items={selectedMembers}
                            clearItems={() => setSelectedMembers([])}
                            optItem={handleOptItem}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default ChooseOwnerModal
