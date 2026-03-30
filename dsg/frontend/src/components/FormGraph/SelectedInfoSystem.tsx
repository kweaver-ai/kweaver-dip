import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button, Checkbox, Input, Modal } from 'antd'
import classnames from 'classnames'
import { SearchOutlined } from '@ant-design/icons'
import VirtualList from 'rc-virtual-list'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useDebounce } from 'ahooks'
import CustomTree from '../BusinessArchitecture/ArchitectureTree'
import { Architecture } from '../BusinessArchitecture/const'
import Icons from '../BusinessArchitecture/Icons'
import empty from '@/assets/dataEmpty.svg'
import __ from './locale'
import styles from './styles.module.less'
import { getObjects, reqInfoSystemList } from '@/core'
import Empty from '@/ui/Empty'
import { SelectedStatus } from './helper'
import { SearchInput } from '@/ui'
import Loader from '@/ui/Loader'
import SelectedDataCatalog from '../ConfigDataSerivce/SelectedDataCatalog'

const defaultQueryParams = {
    direction: 'desc',
    keyword: '',
    limit: 99,
    offset: 1,
}

interface SelectedInfoSystemType {
    values: Array<any>

    onClose: () => void

    onConfirm: (datas: any) => void
}

const SelectedInfoSystem = ({
    values,
    onClose,
    onConfirm,
}: SelectedInfoSystemType) => {
    const [selectData, setSelectData] = useState<any>([])
    const [selectTreeNode, setSelectTreeNode] = useState<any>(null)
    const [selectedTreeNodeData, setSelectedTreeNodeData] = useState<any>([])
    const [infoSystems, setInfoSystems] = useState<any>([])
    const [keyword, setKeyword] = useState<string>('')
    const debounceValue = useDebounce(keyword, {
        wait: 500,
    })
    const [selectAllStatus, setSelectAllStatus] = useState<SelectedStatus>(
        SelectedStatus.UnChecked,
    )
    const [loading, setLoading] = useState<boolean>(false)

    const [queryParams, setQueryParams] = useState<any>(defaultQueryParams)
    const [totalCount, setTotalCount] = useState<number>(0)

    useEffect(() => {
        setSelectData(values)
    }, [values])

    useEffect(() => {
        if (queryParams.offset === 1) {
            getInfoSystems([])
        } else {
            getInfoSystems(infoSystems)
        }
    }, [queryParams])

    useEffect(() => {
        setQueryParams({
            ...queryParams,
            offset: 1,
            keyword: debounceValue,
        })
    }, [debounceValue])

    // 获取信息系统
    const getInfoSystems = async (initData) => {
        const { entries, total_count } = await reqInfoSystemList(queryParams)
        setSelectedTreeNodeData(entries)
        setTotalCount(total_count)
        const currentAllInfoSystems = [...initData, ...entries]
        setInfoSystems(currentAllInfoSystems)
        if (currentAllInfoSystems.length) {
            const currentDataHasSelected = currentAllInfoSystems.filter(
                (currentData) => {
                    return !!selectData.find(
                        (currentSelected) =>
                            currentSelected.id === currentData.id,
                    )
                },
            )
            if (currentDataHasSelected.length) {
                if (
                    currentDataHasSelected.length ===
                    currentAllInfoSystems.length
                ) {
                    setSelectAllStatus(SelectedStatus.Checked)
                } else {
                    setSelectAllStatus(SelectedStatus.Indeterminate)
                }
            } else {
                setSelectAllStatus(SelectedStatus.UnChecked)
            }
        } else {
            setSelectAllStatus(SelectedStatus.UnChecked)
        }
    }

    /**
     * 检索
     * @param value
     */
    const onSearch = (value: string) => {
        setKeyword(value)
    }

    /**
     * 检查当前选中数据的状态
     * @param displayData 列表显示数据
     */
    const checkedSelectStatus = (displayData) => {
        const checkedDisplayData = displayData.filter((currentData) =>
            selectData.find((selected) => selected.id === currentData.id),
        )
        if (!checkedDisplayData.length) {
            setSelectAllStatus(SelectedStatus.UnChecked)
        } else if (checkedDisplayData.length === displayData.length) {
            setSelectAllStatus(SelectedStatus.Checked)
        } else {
            setSelectAllStatus(SelectedStatus.Indeterminate)
        }
    }

    /**
     * 单选
     * @param checked 选中状态
     * @param item 单条数据
     */
    const handleCheckItem = (checked, item) => {
        if (checked) {
            const currentSelectData = [...selectData, item]
            setSelectData(currentSelectData)
            const surplusData = infoSystems.filter(
                (infoSystem) =>
                    !currentSelectData.find(
                        (selected) => selected.id === infoSystem.id,
                    ),
            )
            if (surplusData.length) {
                setSelectAllStatus(SelectedStatus.Indeterminate)
            } else {
                setSelectAllStatus(SelectedStatus.Checked)
            }
        } else {
            const currentSelectData = selectData.filter(
                (selected) => selected.id !== item.id,
            )
            setSelectData(currentSelectData)
            const checkedCurrentData = currentSelectData.filter((selected) =>
                infoSystems.find((infoSystem) => selected.id === infoSystem.id),
            )
            if (checkedCurrentData.length) {
                setSelectAllStatus(SelectedStatus.Indeterminate)
            } else {
                setSelectAllStatus(SelectedStatus.UnChecked)
            }
        }
    }

    /**
     * 全选
     * @param checked
     */
    const handleCheckedAllData = (checked) => {
        if (checked) {
            if (selectData.length === 99) {
                const currentData = selectData.filter(
                    (selected) =>
                        !infoSystems.find(
                            (infoSystem) => selected.id === infoSystem.id,
                        ),
                )
                setSelectData(currentData)
                setSelectAllStatus(SelectedStatus.UnChecked)
            } else {
                const willAddData = infoSystems.filter(
                    (infoSystem) =>
                        !selectData.find(
                            (selected) => selected.id === infoSystem.id,
                        ),
                )
                const needDataLength = 99 - selectData.length
                if (needDataLength > 0) {
                    if (needDataLength >= willAddData.length) {
                        setSelectData([...selectData, ...willAddData])
                        setSelectAllStatus(SelectedStatus.Checked)
                    } else {
                        setSelectData([
                            ...selectData,
                            ...willAddData.slice(0, needDataLength),
                        ])
                        setSelectAllStatus(SelectedStatus.Indeterminate)
                    }
                }
            }
        } else {
            const currentData = selectData.filter(
                (selected) =>
                    !infoSystems.find(
                        (infoSystem) => selected.id === infoSystem.id,
                    ),
            )
            setSelectData(currentData)
            setSelectAllStatus(SelectedStatus.UnChecked)
        }
    }

    /**
     * 清空
     */
    const handleClear = () => {
        setSelectData([])
        setSelectAllStatus(SelectedStatus.UnChecked)
    }

    return (
        <div>
            <Modal
                open
                title={__('选择信息系统')}
                width={644}
                bodyStyle={{
                    padding: 0,
                }}
                maskClosable={false}
                onCancel={onClose}
                footer={
                    <div className={styles.selectInfoSystem}>
                        <div>
                            {`${__('已选：')}`}
                            <span
                                style={{
                                    color:
                                        selectData.length > 99
                                            ? '#f5222d'
                                            : '#126ee3',
                                }}
                            >
                                {selectData.length}
                            </span>
                            /99
                        </div>
                        <div>
                            <Button type="text" onClick={handleClear}>
                                {__('清空')}
                            </Button>
                            <Button
                                onClick={() => {
                                    onClose()
                                }}
                            >
                                {__('取消')}
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => {
                                    onConfirm(selectData)
                                }}
                                disabled={selectData.length > 99}
                            >
                                {__('确定')}
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className={styles.selectInfoBody}>
                    {/* <div className={styles.leftContainer}>
                        <CustomTree
                            isShowAll={false}
                            getSelectedNode={(sn) => {
                                handleSelectTreeNode(sn)
                            }}
                            isShowOperate={false}
                        />
                    </div> */}
                    {!infoSystems?.length && !queryParams?.keyword ? (
                        <div
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                            }}
                        >
                            <Empty iconSrc={empty} desc={__('暂无数据')} />
                        </div>
                    ) : (
                        <div className={styles.rightContainer}>
                            <div>
                                <SearchInput
                                    placeholder={__('请输入信息系统')}
                                    onKeyChange={(kw: string) => {
                                        onSearch(kw)
                                    }}
                                />
                            </div>
                            {infoSystems.length ? (
                                <div className={styles.selectAll}>
                                    <div
                                        style={{
                                            width: '540px',
                                        }}
                                    >
                                        {__('全选')}
                                    </div>
                                    <div>
                                        <Checkbox
                                            checked={
                                                selectAllStatus ===
                                                SelectedStatus.Checked
                                            }
                                            indeterminate={
                                                selectAllStatus ===
                                                SelectedStatus.Indeterminate
                                            }
                                            onChange={(e) => {
                                                handleCheckedAllData(
                                                    e.target.checked,
                                                )
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : null}
                            <div id="scrollableDiv">
                                <InfiniteScroll
                                    hasMore={infoSystems.length < totalCount}
                                    endMessage={
                                        infoSystems.length === 0 ? (
                                            <Empty
                                                desc={__(
                                                    '抱歉，没有找到相关内容',
                                                )}
                                            />
                                        ) : (
                                            ''
                                        )
                                    }
                                    loader={
                                        <div className={styles.listLoading}>
                                            <Loader />
                                        </div>
                                    }
                                    next={() => {
                                        setQueryParams({
                                            ...queryParams,
                                            offset: queryParams.offset + 1,
                                        })
                                    }}
                                    dataLength={infoSystems.length}
                                    scrollableTarget="scrollableDiv"
                                >
                                    <div className={styles.selectedItems}>
                                        {infoSystems.map((item) => {
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={classnames(
                                                        styles.selectAll,
                                                        selectData.find(
                                                            (selected) =>
                                                                selected.id ===
                                                                item.id,
                                                        ) &&
                                                            styles.selectedItemData,
                                                    )}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            width: '540px',
                                                        }}
                                                    >
                                                        <Icons
                                                            type={
                                                                Architecture.BSYSTEM
                                                            }
                                                        />
                                                        <span
                                                            style={{
                                                                marginLeft:
                                                                    '10px',
                                                            }}
                                                            className={
                                                                styles.systemInfoName
                                                            }
                                                            title={item.name}
                                                        >
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <Checkbox
                                                            checked={selectData.find(
                                                                (selected) =>
                                                                    selected.id ===
                                                                    item.id,
                                                            )}
                                                            onChange={(e) => {
                                                                handleCheckItem(
                                                                    e.target
                                                                        .checked,
                                                                    item,
                                                                )
                                                            }}
                                                            disabled={
                                                                !selectData.find(
                                                                    (
                                                                        selected,
                                                                    ) =>
                                                                        selected.id ===
                                                                        item.id,
                                                                ) &&
                                                                selectData.length >=
                                                                    99
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </InfiniteScroll>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default SelectedInfoSystem
