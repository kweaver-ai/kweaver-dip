import { Button, Modal, ModalProps, Select, Tooltip } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import Icon from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import { ReactComponent as basicInfo } from '@/assets/DataAssetsCatlg/basicInfo.svg'
import { ViewType, viewOptionList } from './helper'
import ArchitectureDirTree from '@/components/BusinessArchitecture/ArchitectureDirTree'
import GlossaryDirTree from '@/components/BusinessDomain/GlossaryDirTree'
import { Architecture } from '@/components/BusinessArchitecture/const'
import AtomLIst from './AtomLIst'
import { BusinessDomainType } from '@/components/BusinessDomain/const'
import { getIndicatorDetail } from '@/core/apis/indicatorManagement'
import { formatError, messageError } from '@/core'

interface IChooseAtom extends ModalProps {
    open: boolean
    checkedId?: string
    onClose: () => void
    onSure: (info) => void
}
/**
 * 原子指标选择窗
 */
const ChooseAtom: React.FC<IChooseAtom> = ({
    open,
    checkedId,
    onClose,
    onSure,
    ...props
}) => {
    const [checkedItem, setCheckedItem] = useState<any>()
    const [viewKey, setViewKey] = useState<ViewType>(ViewType.SubjectDomain)
    const [selectedNode, setSelectedNode] = useState<any>()

    useEffect(() => {
        if (checkedId && open) {
            setCheckedItem({ id: checkedId })
        } else {
            setCheckedItem(undefined)
        }
    }, [open])

    const condition = useMemo(() => {
        if (!selectedNode) return undefined
        switch (viewKey) {
            case ViewType.Organization:
                if (selectedNode?.id === 'ungrouped') {
                    return undefined
                }
                return { management_department_id: selectedNode?.id }
            case ViewType.SubjectDomain:
                if (selectedNode?.parent_id === '') {
                    return undefined
                }
                return {
                    subject_id: selectedNode?.id,
                    include_sub_subject: true,
                }
            default:
                return undefined
        }
    }, [selectedNode])

    const handleOk = async () => {
        try {
            const res = await getIndicatorDetail(checkedItem.id)
            onSure(res)
        } catch (err) {
            if (err.data.code) {
                messageError(err.data.description)
            } else {
                formatError(err)
            }
        }
    }

    const footer = (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
                style={{ width: 80, height: 32, marginRight: 12 }}
                onClick={onClose}
            >
                {__('取消')}
            </Button>
            <Tooltip
                placement="topRight"
                title={checkedItem ? '' : __('请选择所需原子指标')}
            >
                <Button
                    style={{ width: 80, height: 32 }}
                    type="primary"
                    disabled={!checkedItem}
                    onClick={handleOk}
                >
                    {__('确定')}
                </Button>
            </Tooltip>
        </div>
    )

    return (
        <Modal
            title={__('选择原子指标')}
            width={800}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            destroyOnClose
            getContainer={false}
            okButtonProps={{
                disabled: !checkedItem,
            }}
            footer={footer}
            bodyStyle={{ height: 484, padding: 0 }}
            {...props}
        >
            <div className={styles['choose-at']}>
                <div className={styles['choose-at-left']}>
                    <div className={styles['choose-at-left-top']}>
                        <Icon component={basicInfo} />
                        <Select
                            value={viewKey}
                            bordered={false}
                            options={viewOptionList}
                            onChange={(option: ViewType) => {
                                setViewKey(option)
                            }}
                            dropdownStyle={{ minWidth: 96 }}
                            getPopupContainer={(n) => n}
                        />
                    </div>
                    {viewKey === ViewType.Organization ? (
                        <div className={styles['choose-at-left-orgTree']}>
                            <ArchitectureDirTree
                                getSelectedNode={(node) => {
                                    if (node) {
                                        setSelectedNode(node)
                                    } else {
                                        setSelectedNode({ id: '' })
                                    }
                                }}
                                hiddenType={[
                                    Architecture.BMATTERS,
                                    Architecture.BSYSTEM,
                                    Architecture.COREBUSINESS,
                                ]}
                                filterType={[
                                    Architecture.ORGANIZATION,
                                    Architecture.DEPARTMENT,
                                ].join()}
                            />
                        </div>
                    ) : viewKey === ViewType.SubjectDomain ? (
                        <div className={styles['choose-at-left-sbjTree']}>
                            <GlossaryDirTree
                                placeholder={__(
                                    '搜索主题域分组、主题域、业务对象/活动',
                                )}
                                getSelectedKeys={setSelectedNode}
                                // limitTypes={[BusinessDomainType.logic_entity]}
                                filterType={[
                                    BusinessDomainType.subject_domain_group,
                                    BusinessDomainType.subject_domain,
                                    BusinessDomainType.business_object,
                                    BusinessDomainType.business_activity,
                                ]}
                                limitTypes={[
                                    BusinessDomainType.business_object,
                                    BusinessDomainType.business_activity,
                                ]}
                            />
                        </div>
                    ) : null}
                </div>
                <div className={styles['choose-at-right']}>
                    <AtomLIst
                        condition={condition}
                        checkedId={checkedItem?.id}
                        onChecked={(val) => setCheckedItem(val)}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default ChooseAtom
