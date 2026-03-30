import { useUpdateEffect } from 'ahooks'
import { Button, Modal, Space } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { CheckOutlined } from '@ant-design/icons'
import {
    formatError,
    getSubjectDomain,
    ISubjectDomainItem,
    LoginPlatform,
    PermissionScope,
} from '@/core'
import __ from './locale'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import emptyData from '@/assets/dataEmpty.svg'
import { ActivityL3Outlined, CloseOutlined, ObjL3Outlined } from '@/icons'
import { BusinessDomainType } from '../BusinessDomain/const'
import Loader from '@/ui/Loader'
import { SearchInput } from '@/ui'
import GlossaryDirTree from '../BusinessDomain/GlossaryDirTree'
import { GlossaryIcon } from '../BusinessDomain/GlossaryIcons'
import { getPlatformNumber } from '@/utils'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IChooseBusinessObj {
    open: boolean
    onClose: () => void
    getSelectedObj: (data: ISubjectDomainItem[]) => void
    selectedIds?: string[]
    subjectDomainId?: string
    addObj: () => void
}
const ChooseBusinessObjs: React.FC<IChooseBusinessObj> = ({
    open,
    onClose,
    getSelectedObj,
    selectedIds = [],
    subjectDomainId,
    addObj,
}) => {
    const [searchValue, setSearchValue] = useState('')
    const [data, setData] = useState<ISubjectDomainItem[]>([])
    const [selectedObjs, setSelectedObjs] = useState<ISubjectDomainItem[]>([])
    const [loading, setLoading] = useState(false)
    const platformNumber = getPlatformNumber()
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

    const ids = useMemo(() => {
        return selectedObjs.map((obj) => obj.id)
    }, [selectedObjs])

    const getL3Data = async (keyword = '') => {
        try {
            setLoading(true)
            const res = await getSubjectDomain({
                is_all: true,
                parent_id: '',
                type: `${BusinessDomainType.business_activity},${BusinessDomainType.business_object}`,
                keyword,
            })
            setData(res.entries)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            getL3Data()
        } else {
            setData([])
            setSelectedObjs([])
            setSearchValue('')
        }
    }, [subjectDomainId, open])

    useUpdateEffect(() => {
        getL3Data(searchValue)
    }, [searchValue])

    const renderEmpty = () => {
        if (searchValue) {
            return <Empty />
        }
        return <Empty iconSrc={emptyData} desc={__('暂无数据')} />
    }

    const handleOk = async () => {
        getSelectedObj(selectedObjs)
        onClose()
    }

    const getSelectedDomain = (so: ISubjectDomainItem) => {
        if (
            [
                BusinessDomainType.business_activity,
                BusinessDomainType.business_object,
            ].includes(so.type as BusinessDomainType)
        ) {
            // 若已为选中状态，再次点击则为取消选中
            if (selectedObjs?.find((o) => o.id === so.id)) {
                setSelectedObjs(selectedObjs.filter((obj) => obj.id !== so.id))
            } else {
                setSelectedObjs([...selectedObjs, so])
            }
        }
    }

    const getIcon = (type: BusinessDomainType, isColor = true) => {
        switch (type) {
            case BusinessDomainType.business_activity:
                return (
                    <ActivityL3Outlined
                        className={classnames(
                            styles.typeIcon,
                            !isColor && styles.disabledTypeIcon,
                        )}
                    />
                )
            case BusinessDomainType.business_object:
                return (
                    <ObjL3Outlined
                        className={classnames(
                            styles.typeIcon,
                            !isColor && styles.disabledTypeIcon,
                        )}
                    />
                )
            default:
                return (
                    <ActivityL3Outlined
                        className={classnames(
                            styles.typeIcon,
                            !isColor && styles.disabledTypeIcon,
                        )}
                    />
                )
        }
    }

    const getItems = (objs: ISubjectDomainItem[], isSearch = false) => {
        return objs.map((so) => {
            // 父组件传入的已选
            const isForbid = selectedIds.includes(so.id)
            // 在当前组件中选择的
            const isCurrentSelected = ids.includes(so.id)

            const fullPathArr = so.path_name.split('/')
            const path = fullPathArr
                .filter((_, index) => index !== fullPathArr.length - 1)
                .join('/')

            return (
                <div
                    className={classnames({
                        [styles.seletedItem]: true,
                        [styles.seletedSearchItem]:
                            isSearch && isCurrentSelected,
                    })}
                    key={so.id}
                    onClick={() => {
                        if (isSearch) {
                            if (isForbid) return
                            if (!isCurrentSelected) {
                                setSelectedObjs([...selectedObjs, so])
                            } else {
                                setSelectedObjs(
                                    selectedObjs.filter((o) => o.id !== so.id),
                                )
                            }
                        }
                    }}
                >
                    <div className={styles.leftInfo}>
                        <GlossaryIcon
                            type={so.type}
                            fontSize="36px"
                            width="36px"
                            styles={
                                isForbid
                                    ? {
                                          flexShrink: 0,
                                          marginRight: 4,
                                          color: 'rgb(0 0 0 / 45%)',
                                      }
                                    : {
                                          flexShrink: 0,
                                          marginRight: 4,
                                      }
                            }
                        />
                        <div className={styles.infos}>
                            <div className={styles.topInfo}>
                                <div
                                    title={so.name}
                                    className={classnames(
                                        styles.name,
                                        isForbid && styles.disabledName,
                                    )}
                                >
                                    {so.name}
                                </div>
                                {(isForbid || isCurrentSelected) &&
                                    (isForbid ? (
                                        <span className={styles.addedTag}>
                                            {__('已添加')}
                                        </span>
                                    ) : isSearch ? (
                                        <CheckOutlined
                                            className={styles['selected-tag']}
                                        />
                                    ) : null)}
                            </div>
                            <div title={so.path_name} className={styles.path}>
                                {__('主题域：')}
                                {path}
                            </div>
                        </div>
                    </div>
                    {!isSearch && (
                        <CloseOutlined
                            className={styles.closeIcon}
                            onClick={() =>
                                setSelectedObjs(
                                    selectedObjs.filter((s) => s.id !== so.id),
                                )
                            }
                        />
                    )}
                </div>
            )
        })
    }
    return (
        <Modal
            title={
                platformNumber === LoginPlatform.default
                    ? __('选择业务对象/活动')
                    : __('选择业务对象')
            }
            width={800}
            open={open}
            bodyStyle={{ height: 444 }}
            destroyOnClose
            onCancel={onClose}
            maskClosable={false}
            footer={
                <div className={styles['choose-obj-footer']}>
                    <Space size={8}>
                        {hasOprAccess && (
                            <>
                                <span className={styles['not-find']}>
                                    {__('找不到？')}
                                </span>
                                <Button
                                    type="link"
                                    onClick={() => {
                                        addObj()
                                        onClose()
                                    }}
                                >
                                    {__('立即新建')}
                                </Button>
                            </>
                        )}
                    </Space>
                    <Space>
                        <Button onClick={onClose} className={styles.btn}>
                            {__('取消')}
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => handleOk()}
                            className={styles.btn}
                            disabled={selectedObjs.length === 0}
                        >
                            {__('确定')}
                        </Button>
                    </Space>
                </div>
            }
        >
            <div className={styles.chooseBusinessObjWrapper}>
                <div className={styles.left}>
                    <div className={styles.searchInput}>
                        <SearchInput
                            placeholder={__('搜索业务对象/活动')}
                            value={searchValue}
                            onKeyChange={(value: string) =>
                                setSearchValue(value)
                            }
                            maxLength={128}
                        />
                    </div>
                    {loading && (
                        <div className={styles.loader}>
                            <Loader />
                        </div>
                    )}
                    {searchValue && !loading && (
                        <div className={styles.searchResWrapper}>
                            {data.length === 0 ? (
                                <Empty />
                            ) : (
                                <div className={styles.bottom}>
                                    {getItems(data, true)}
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        className={classnames(
                            styles.objTreeWrapper,
                            (searchValue || loading) &&
                                styles.objSearchTreeWrapper,
                        )}
                    >
                        <GlossaryDirTree
                            getSelectedKeys={getSelectedDomain}
                            isShowAll={false}
                            isShowSearch={false}
                            isShowSelected
                            disabledItemIds={selectedIds}
                            selectedIds={ids}
                        />
                    </div>
                </div>
                <div className={styles.right}>
                    <div className={styles.top}>
                        <span className={styles.count}>
                            {__('已选择：')} {selectedObjs.length}
                        </span>
                        <Button
                            type="link"
                            // className={styles.clear}
                            disabled={selectedObjs.length === 0}
                            onClick={() => setSelectedObjs([])}
                        >
                            {__('全部移除')}
                        </Button>
                    </div>
                    <div className={styles.bottom}>
                        {selectedObjs.length === 0 ? (
                            <Empty iconSrc={emptyData} desc={__('暂无数据')} />
                        ) : (
                            getItems(selectedObjs)
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    )
}
export default ChooseBusinessObjs
