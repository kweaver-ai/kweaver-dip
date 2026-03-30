import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import { Tooltip, message } from 'antd'
import {
    ISubjectDomainItem,
    LoginPlatform,
    formatError,
    updateFormRelatedAttribute,
} from '@/core'
import styles from './styles.module.less'
import { RecycleBinOutlined } from '@/icons'
import __ from './locale'
import Confirm from '../Confirm'
import { GlossaryIcon } from '../BusinessDomain/GlossaryIcons'
import { getPlatformNumber } from '@/utils'

interface IObjList {
    objList: ISubjectDomainItem[]
    selectedId?: string
    getSelectedId: (id: string) => void
    deleteItemCb: (id: string) => void
    isDetails?: boolean
    formId: string
}
const ObjList: React.FC<IObjList> = ({
    objList,
    selectedId,
    getSelectedId,
    deleteItemCb,
    isDetails = false,
    formId,
}) => {
    const [selectedObjId, setSelectedObjId] = useState<string>()
    const [open, setOpen] = useState<boolean>()
    const [deleteId, setDeleteId] = useState<string>()
    const platformNumber = getPlatformNumber()

    useEffect(() => {
        setSelectedObjId(objList[0]?.id)
        getSelectedId(objList[0]?.id)
    }, [objList])

    const handleClick = (id: string) => {
        setSelectedObjId(id)
        getSelectedId(id)
    }

    const handleDeleteConfirm = (id: string) => {
        setOpen(true)
        setDeleteId(id)
    }

    const handleCancelDelete = () => {
        setOpen(false)
        setDeleteId('')
    }

    const deleteObj = () => {
        deleteItemCb(deleteId!)
        setOpen(false)
        if (deleteId === selectedObjId) {
            setSelectedObjId(objList[0]?.id)
        }
        setDeleteId('')
        message.success(__('移除成功'))
    }

    const handleDelete = async () => {
        if (deleteId) {
            if (objList.length === 1) {
                try {
                    await updateFormRelatedAttribute({
                        form_id: formId,
                        form_relevance_objects: [],
                    })
                    deleteObj()
                } catch (error) {
                    formatError(error)
                }
            } else {
                deleteObj()
            }
        }
    }

    return (
        <>
            <div className={styles['obj-list']}>
                {objList.map((obj) => (
                    <div
                        key={obj.id}
                        className={classNames(
                            styles['obj-item'],
                            selectedObjId === obj.id &&
                                styles['selected-obj-item'],
                        )}
                        onClick={() => handleClick(obj.id)}
                    >
                        <GlossaryIcon
                            type={obj.type}
                            fontSize="18px"
                            width="18px"
                            styles={{ flexShrink: 0, marginRight: 8 }}
                        />
                        <div className={styles['obj-name']} title={obj.name}>
                            {obj.name}
                        </div>
                        {!isDetails && (
                            <Tooltip title={__('移除')}>
                                <div
                                    className={styles['delete-icon-container']}
                                >
                                    <RecycleBinOutlined
                                        className={styles['delete-icon']}
                                        onClick={() =>
                                            handleDeleteConfirm(obj.id)
                                        }
                                    />
                                </div>
                            </Tooltip>
                        )}
                    </div>
                ))}
            </div>
            <Confirm
                title={__('确认要移除吗？')}
                content={
                    objList.length === 1
                        ? platformNumber === LoginPlatform.default
                            ? __(
                                  '移除最后一个业务对象/活动后，将清空全部配置的逻辑实体和关联字段信息。',
                              )
                            : __(
                                  '移除最后一个业务对象后，将清空全部配置的逻辑实体和关联字段信息。',
                              )
                        : platformNumber === LoginPlatform.default
                        ? __(
                              '移除后将不会保存此业务对象/活动中配置的逻辑实体和关联字段信息。',
                          )
                        : __(
                              '移除后将不会保存此业务对象中配置的逻辑实体和关联字段信息。',
                          )
                }
                open={open}
                onOk={handleDelete}
                onCancel={handleCancelDelete}
            />
        </>
    )
}
export default ObjList
