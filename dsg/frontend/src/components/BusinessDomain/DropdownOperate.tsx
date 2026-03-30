import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react'
import { Dropdown } from 'antd'
import { EllipsisOutlined, AddOutlined } from '@/icons'
import styles from './styles.module.less'
import { GlossaryType } from '../BusinessGlossary/const'
import __ from './locale'
import { BusinessDomainType } from './const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
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

        const { type, currentData, handleOperate } = props
        const [items, setItems] = useState<any[]>([])
        const [open, setOpen] = useState<boolean>(false)

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

        const treeOperateList = [
            hasOprAccess
                ? {
                      key: 'addTerms',
                      label: (
                          <a
                              onClick={(e) => {
                                  e.stopPropagation()
                                  setOpen(false)
                                  handleOperate('addTerms', currentData)
                              }}
                          >
                              {/* <AddOutlined style={{ marginRight: '10px' }} /> */}
                              {!currentData.type
                                  ? __('新建业务领域')
                                  : currentData.type ===
                                    BusinessDomainType.subject_domain_group
                                  ? __('新建主题域')
                                  : __('新建')}
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
                              {__('编辑定义')}
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
                                  setOpen(false)
                                  handleOperate('edit', currentData)
                              }}
                          >
                              {/* <EditOutlined style={{ marginRight: '10px' }} /> */}
                              {__('编辑')}
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
                                  setOpen(false)
                                  e.stopPropagation()
                                  handleOperate('del', currentData)
                              }}
                          >
                              {/* <DeleteOutlined style={{ marginRight: '10px' }} /> */}
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

        const handleOpenChange = (flag: boolean) => {
            setOpen(flag)
        }

        return (
            <div className={styles.dropdownWrapper}>
                {items.filter((i) => i !== null).length > 0 && (
                    <Dropdown
                        menu={{
                            items,
                        }}
                        placement="bottomRight"
                        onOpenChange={handleOpenChange}
                        open={open}
                    >
                        <div
                            onClick={(e) => e.preventDefault()}
                            className={styles.operateIcon}
                        >
                            {!currentData.type ? (
                                <AddOutlined style={{ fontSize: '12px' }} />
                            ) : (
                                <EllipsisOutlined />
                            )}
                        </div>
                    </Dropdown>
                )}
            </div>
        )
    },
)
export default DropdownOperate
