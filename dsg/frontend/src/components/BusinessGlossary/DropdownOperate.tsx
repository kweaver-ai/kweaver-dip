import React, { useEffect, useMemo, useState } from 'react'
import { Button, Dropdown } from 'antd'
import { MoreOutlined, DeleteOutlined } from '@ant-design/icons'
import { EditOutlined, AddOutlined, CatalogMoveOutlined } from '@/icons'
import styles from './styles.module.less'
import { GlossaryType } from './const'
import __ from '../BusinessDomain/locale'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { PermissionScope } from '@/core'

interface IDropdownOperate {
    ref?: any
    isButton?: boolean
    currentData?: any
    handleOperate: (op, data) => void
}
const DropdownOperate: React.FC<IDropdownOperate> = (props: any) => {
    const { currentData, isButton = true, handleOperate } = props
    const [items, setItems] = useState<any[]>([])
    const [open, setOpen] = useState<boolean>(false)

    const { checkPermission } = useUserPermCtx()

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

    const treeOperateList = hasOprAccess
        ? [
              {
                  key: 'addCategories',
                  label: (
                      <a
                          onClick={(e) => {
                              e.stopPropagation()
                              setOpen(false)
                              handleOperate('addCategories', currentData)
                          }}
                      >
                          <AddOutlined style={{ marginRight: '10px' }} />
                          新增类别
                      </a>
                  ),
              },
              {
                  key: 'addTerms',
                  label: (
                      <a
                          onClick={(e) => {
                              e.stopPropagation()
                              setOpen(false)
                              handleOperate('addTerms', currentData)
                          }}
                      >
                          <AddOutlined style={{ marginRight: '10px' }} />
                          新增术语
                      </a>
                  ),
              },
              {
                  key: 'edit',
                  label: (
                      <a
                          onClick={(e) => {
                              e.stopPropagation()
                              setOpen(false)
                              handleOperate('edit', currentData)
                          }}
                      >
                          <EditOutlined style={{ marginRight: '10px' }} />
                          编辑
                      </a>
                  ),
              },
              {
                  key: 'move',
                  label: (
                      <a
                          onClick={(e) => {
                              e.stopPropagation()
                              setOpen(false)
                              handleOperate('move', currentData)
                          }}
                      >
                          <CatalogMoveOutlined
                              style={{ marginRight: '10px' }}
                          />
                          移动至
                      </a>
                  ),
              },
              {
                  key: 'del',
                  label: (
                      <a
                          onClick={(e) => {
                              e.stopPropagation()
                              setOpen(false)
                              handleOperate('del', currentData)
                          }}
                      >
                          <DeleteOutlined style={{ marginRight: '10px' }} />
                          删除
                      </a>
                  ),
              },
          ]
        : []

    useEffect(() => {
        let itemArry: any[] = []
        switch (currentData?.type) {
            case GlossaryType.GLOSSARY:
                itemArry = treeOperateList.filter(
                    (item) => item?.key !== 'move',
                )
                // 业务域分组不能新增术语
                if (currentData?.content_id === '462308570965213996') {
                    itemArry = itemArry.filter(
                        (item) =>
                            item?.key !== 'addTerms' &&
                            item?.key !== 'del' &&
                            item?.key !== 'edit',
                    )
                }
                break
            case GlossaryType.CATEGORIES:
                itemArry = treeOperateList.filter(
                    (item) => item?.key !== 'addGlossary',
                )
                break
            case GlossaryType.TERMS:
                itemArry = treeOperateList.filter(
                    (item) =>
                        item?.key !== 'addTerms' &&
                        item?.key !== 'addCategories',
                )
                break
            default:
                itemArry = treeOperateList
        }
        // 业务域分组不能新增术语
        if (currentData?.glossary_id === '462308570965213996') {
            itemArry = itemArry.filter((item) => item?.key !== 'addTerms')
        }
        setItems(itemArry)
    }, [currentData])

    const handleOpenChange = (flag: boolean) => {
        setOpen(flag)
    }

    const dropdownWrapper = (): any => {
        return (
            <div className={styles.dropdownWrapper}>
                <Dropdown
                    menu={{ items }}
                    placement="bottomRight"
                    onOpenChange={handleOpenChange}
                    open={open}
                >
                    <span onClick={(e) => e.preventDefault()}>
                        <MoreOutlined />
                    </span>
                </Dropdown>
            </div>
        )
    }

    return (
        items.filter((i) => i !== null).length > 0 &&
        (isButton ? <Button icon={dropdownWrapper()} /> : dropdownWrapper())
    )
}

export default DropdownOperate
