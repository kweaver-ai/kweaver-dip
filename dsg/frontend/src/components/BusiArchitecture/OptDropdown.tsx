import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Dropdown } from 'antd'
import classnames from 'classnames'
import { useClickAway } from 'ahooks'
import { AddOutlined } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import MoreHorizontalOutlined from '@/icons/MoreHorizontalOutlined'
import { useDirTreeContext } from '@/context/DirTreeProvider'
import { BusinessDomainLevelTypes, IBusinessDomainItem } from '@/core'
import { OperateType } from '@/utils'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IDropdownOperate {
    ref?: any
    type?: BusinessDomainLevelTypes
    currentData?: IBusinessDomainItem
    handleOperate: (op, data) => void
    domainLevels?: BusinessDomainLevelTypes[]
}
const DropdownOperate: React.FC<IDropdownOperate> = forwardRef(
    (props: any, ref) => {
        const { checkPermission } = useUserPermCtx()
        const { optNode, setOptNode } = useDirTreeContext()
        const { type, currentData, handleOperate, domainLevels = [] } = props
        const [open, setOpen] = useState<boolean>(false)

        useEffect(() => {
            setOpen(optNode?.id === currentData?.id)
        }, [optNode])

        const hasOprAccess = useMemo(
            () => checkPermission('manageBusinessArchitecture'),
            [checkPermission],
        )

        const treeOperateList = useMemo(
            () => [
                hasOprAccess
                    ? {
                          key: OperateType.DETAIL,
                          label: (
                              <a
                                  onClick={(e) => {
                                      e.stopPropagation()
                                      setOptNode(undefined)
                                      handleOperate(
                                          OperateType.DETAIL,
                                          currentData,
                                      )
                                  }}
                              >
                                  {__('详情')}
                              </a>
                          ),
                      }
                    : null,
                // 当前节点的下一级如果是业务域类型才可以新建
                hasOprAccess &&
                domainLevels[currentData.path.split('/').length] ===
                    BusinessDomainLevelTypes.Domain
                    ? {
                          key: OperateType.CREATE,
                          label: (
                              <a
                                  onClick={(e) => {
                                      e.stopPropagation()
                                      setOptNode(undefined)
                                      handleOperate(
                                          OperateType.CREATE,
                                          currentData,
                                      )
                                  }}
                              >
                                  {currentData.type ===
                                  BusinessDomainLevelTypes.DomainGrouping
                                      ? __('新建业务领域')
                                      : currentData.type ===
                                        BusinessDomainLevelTypes.Domain
                                      ? __('新建子业务领域')
                                      : null}
                              </a>
                          ),
                      }
                    : null,
                hasOprAccess &&
                currentData.type === BusinessDomainLevelTypes.Domain
                    ? {
                          key: OperateType.MOVE,
                          label: (
                              <a
                                  onClick={(e) => {
                                      e.stopPropagation()
                                      setOptNode(undefined)
                                      handleOperate(
                                          OperateType.MOVE,
                                          currentData,
                                      )
                                  }}
                              >
                                  {__('移动')}
                              </a>
                          ),
                      }
                    : null,
                hasOprAccess &&
                currentData.type === BusinessDomainLevelTypes.Domain
                    ? {
                          key: OperateType.EDIT,
                          label: (
                              <a
                                  onClick={(e) => {
                                      e.stopPropagation()
                                      setOptNode(undefined)
                                      handleOperate(
                                          OperateType.EDIT,
                                          currentData,
                                      )
                                  }}
                              >
                                  {__('编辑')}
                              </a>
                          ),
                      }
                    : null,
                hasOprAccess
                    ? {
                          key: OperateType.DELETE,
                          label: (
                              <a
                                  onClick={(e) => {
                                      setOptNode(undefined)
                                      e.stopPropagation()
                                      handleOperate(
                                          OperateType.DELETE,
                                          currentData,
                                      )
                                  }}
                              >
                                  {__('删除')}
                              </a>
                          ),
                      }
                    : null,
            ],
            [domainLevels, currentData],
        )

        useImperativeHandle(ref, () => ({
            type,
        }))

        const clickRef = useRef<HTMLDivElement>(null)
        useClickAway(() => {
            if (open) {
                setOptNode(undefined)
            }
        }, clickRef)

        return (
            <div ref={clickRef} className={styles.dropdownWrapper}>
                {treeOperateList.filter((i) => i !== null).length > 0 && (
                    <Dropdown
                        menu={{
                            items: treeOperateList,
                        }}
                        placement="bottomRight"
                        open={open}
                        overlayStyle={{
                            minWidth: 120,
                        }}
                    >
                        <span
                            className={classnames(
                                styles.menuBtn,
                                open ? styles.active : '',
                            )}
                            onClick={(e) => {
                                setOptNode(open ? undefined : currentData)
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                            title={__('操作')}
                        >
                            {currentData.type === '' ? (
                                <AddOutlined style={{ fontSize: 12 }} />
                            ) : (
                                <MoreHorizontalOutlined />
                            )}
                        </span>
                    </Dropdown>
                )}
            </div>
        )
    },
)
export default DropdownOperate
