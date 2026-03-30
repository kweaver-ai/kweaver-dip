import Icon, { SearchOutlined } from '@ant-design/icons'
import { useDebounce, useUpdateEffect } from 'ahooks'
import { Input, message, Modal, Radio } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { trim } from 'lodash'
import {
    checkBusinessObjReference,
    formatError,
    getSubjectDomain,
    ISubjectDomainItem,
    LoginPlatform,
} from '@/core'
import __ from './locale'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import emptyData from '@/assets/dataEmpty.svg'
import { CloseOutlined } from '@/icons'
import { BusinessDomainType } from '../BusinessDomain/const'
import Loader from '@/ui/Loader'
import GlossaryDirTree from './GlossaryDirTree'
import { SearchInput } from '@/ui'
import { GlossaryIcon } from './GlossaryIcons'
import { getPlatformNumber } from '@/utils'

interface IChooseBusinessObj {
    id: string
    open: boolean
    onClose: () => void
    getSelectedObj: (data) => void
    selectedData?: any
    subjectDomainId?: string
}
const ChooseBusinessObj: React.FC<IChooseBusinessObj> = ({
    id,
    open,
    onClose,
    getSelectedObj,
    selectedData,
    subjectDomainId,
}) => {
    const [searchValue, setSearchValue] = useState('')
    const [data, setData] = useState<ISubjectDomainItem[]>([])
    const [selectedObjs, setSelectedObjs] = useState<ISubjectDomainItem[]>([])
    const [loading, setLoading] = useState(false)
    const platformNumber = getPlatformNumber()

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
        let isExistSelectedData = false
        selectedObjs?.forEach((so) => {
            if (selectedData?.find((sd) => sd.id === so.id)) {
                isExistSelectedData = true
            }
        })
        if (isExistSelectedData) {
            message.error(
                __('该业务对象中已引用本业务对象，无法再被本业务对象引用。'),
            )
            return
        }
        try {
            const res = await checkBusinessObjReference({
                id,
                ref_id: selectedObjs?.map((obj) => obj.id)?.join(','),
            })
            if (res.circular_reference) {
                message.error(__('选中的对象存在循环引用，请重新选择'))
                return
            }
            message.success(__('引用成功'))
        } catch (error) {
            formatError(error)
        }

        getSelectedObj(selectedObjs)
        onClose()
    }

    const getSelectedDomain = (so: ISubjectDomainItem) => {
        if (
            [
                BusinessDomainType.business_activity,
                BusinessDomainType.business_object,
            ].includes(so.type as BusinessDomainType) &&
            !selectedObjs?.find((o) => o.id === so.id)
        ) {
            setSelectedObjs([...selectedObjs, so])
        }
    }

    const getItems = (objs: ISubjectDomainItem[], isSearch = false) => {
        return objs.map((so) => (
            <div
                className={classnames({
                    [styles.seletedItem]: true,
                    [styles.seletedSearchItem]:
                        isSearch && selectedObjs.find((s) => s.id === so.id),
                })}
                key={so.id}
                onClick={() => {
                    if (
                        isSearch &&
                        !selectedObjs?.find((o) => o.id === so.id)
                    ) {
                        setSelectedObjs([...selectedObjs, so])
                    }
                }}
            >
                <div className={styles.leftInfo}>
                    <GlossaryIcon
                        type={so.type}
                        fontSize="36px"
                        width="36px"
                        styles={{ flexShrink: 0, marginRight: 4 }}
                    />
                    <div className={styles.infos}>
                        <div title={so.name} className={styles.name}>
                            {so.name}
                        </div>
                        <div title={so.path_name} className={styles.path}>
                            {__('路径：')} {so.path_name}
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
        ))
    }
    return (
        <Modal
            title={
                // platformNumber === LoginPlatform.default
                //     ? __('选择业务对象/活动')
                //     :
                __('选择业务对象')
            }
            width={800}
            open={open}
            bodyStyle={{ height: 444 }}
            okButtonProps={{ disabled: selectedObjs.length === 0 }}
            destroyOnClose
            onCancel={onClose}
            maskClosable={false}
            onOk={handleOk}
        >
            <div className={styles.chooseBusinessObjWrapper}>
                <div className={styles.left}>
                    <div className={styles.searchInput}>
                        <SearchInput
                            placeholder={
                                // platformNumber === LoginPlatform.default
                                //     ? __('搜索业务对象/活动')
                                //     :
                                __('搜索业务对象')
                            }
                            value={searchValue}
                            onKeyChange={(value: string) =>
                                setSearchValue(value)
                            }
                        />
                    </div>
                    {loading ? (
                        <div className={styles.loader}>
                            <Loader />
                        </div>
                    ) : (
                        <div className={styles.objTreeWrapper}>
                            {searchValue ? (
                                data.length === 0 ? (
                                    <Empty />
                                ) : (
                                    <div className={styles.bottom}>
                                        {getItems(data, true)}
                                    </div>
                                )
                            ) : (
                                <GlossaryDirTree
                                    getSelectedKeys={getSelectedDomain}
                                    isShowAll={false}
                                    isShowSearch={false}
                                />
                            )}
                        </div>
                    )}
                </div>
                <div className={styles.right}>
                    <div className={styles.top}>
                        <span className={styles.count}>
                            {__('已选择：')} {selectedObjs.length}
                        </span>
                        <span
                            className={styles.clear}
                            onClick={() => setSelectedObjs([])}
                        >
                            {__('全部移除')}
                        </span>
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
export default ChooseBusinessObj
