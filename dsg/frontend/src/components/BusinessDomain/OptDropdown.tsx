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
import { GlossaryType } from '../BusinessGlossary/const'
import __ from './locale'
import { BusinessDomainType } from './const'
import MoreHorizontalOutlined from '@/icons/MoreHorizontalOutlined'
import { useDirTreeContext } from '@/context/DirTreeProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { getPlatformNumber } from '@/utils'
import { PermissionScope } from '@/core'

interface IDropdownOperate {
    ref?: any
    type?: GlossaryType
    currentData?: any
    handleOperate: (op, data) => void
}
const DropdownOperate: React.FC<IDropdownOperate> = forwardRef(
    (props: any, ref) => {
        const { checkPermission } = useUserPermCtx()
        const { optNode, setOptNode } = useDirTreeContext()
        const { type, currentData, handleOperate } = props
        const [items, setItems] = useState<any[]>([])
        const [open, setOpen] = useState<boolean>(false)
        const platformNumber = getPlatformNumber()

        const hasOprAccess = useMemo(
            () =>
                checkPermission([
                    {
                        key: 'manageDataClassification',
                        scope: PermissionScope.All,
                    },
                ]),
            [checkPermission],
        )

        useEffect(() => {
            setOpen(optNode?.id === currentData?.id)
        }, [optNode])

        const treeOperateList = [
            hasOprAccess &&
            ![
                BusinessDomainType.business_activity,
                BusinessDomainType.business_object,
            ].includes(currentData.type)
                ? {
                      key: 'addTerms',
                      label: (
                          <a
                              onClick={(e) => {
                                  e.stopPropagation()
                                  setOptNode(undefined)
                                  handleOperate('addTerms', currentData)
                              }}
                          >
                              {currentData.type === ''
                                  ? __('新建业务领域')
                                  : currentData.type ===
                                    BusinessDomainType.subject_domain_group
                                  ? //   platformNumber === LoginPlatform.default
                                    //       ? __('新建主题域')
                                    //       :
                                    __('新建分组')
                                  : __('新建业务对象')}
                          </a>
                      ),
                  }
                : null,
            hasOprAccess &&
            [
                BusinessDomainType.business_activity,
                BusinessDomainType.business_object,
            ].includes(currentData.type)
                ? {
                      key: 'editDefine',
                      label: (
                          <a
                              onClick={(e) => {
                                  e.stopPropagation()
                                  setOpen(false)
                                  handleOperate('editDefine', currentData)
                              }}
                          >
                              {__('定义属性')}
                          </a>
                      ),
                  }
                : null,
            hasOprAccess
                ? {
                      key: 'edit',
                      label: (
                          <a
                              onClick={(e) => {
                                  e.stopPropagation()
                                  setOptNode(undefined)
                                  handleOperate('edit', currentData)
                              }}
                          >
                              {__('编辑基本信息')}
                          </a>
                      ),
                  }
                : null,
            hasOprAccess
                ? {
                      key: 'del',
                      label: (
                          <a
                              onClick={(e) => {
                                  setOptNode(undefined)
                                  e.stopPropagation()
                                  handleOperate('del', currentData)
                              }}
                          >
                              {__('删除')}
                          </a>
                      ),
                  }
                : null,
        ]

        useImperativeHandle(ref, () => ({
            type,
        }))

        useEffect(() => {
            let itemArry: any[] = []
            switch (currentData?.type) {
                case '':
                    itemArry = treeOperateList.filter(
                        (item) => item?.key === 'addTerms',
                    )
                    break
                case BusinessDomainType.business_object:
                    itemArry = treeOperateList.filter(
                        (item) => item?.key !== 'addTerms',
                    )
                    break
                default:
                    itemArry = treeOperateList
            }
            setItems(itemArry)
        }, [type, currentData])

        const clickRef = useRef<HTMLDivElement>(null)
        useClickAway(() => {
            if (open) {
                setOptNode(undefined)
            }
        }, clickRef)

        return (
            <div ref={clickRef} className={styles.dropdownWrapper}>
                {items.filter((i) => i !== null).length > 0 && (
                    <Dropdown
                        menu={{
                            items,
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
                                <AddOutlined style={{ fontSize: '12px' }} />
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
