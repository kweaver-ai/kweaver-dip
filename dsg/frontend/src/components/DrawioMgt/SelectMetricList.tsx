import * as React from 'react'
import {
    useState,
    useEffect,
    useContext,
    useRef,
    useLayoutEffect,
    useMemo,
} from 'react'
import { useLocalStorageState } from 'ahooks'
import { Button, Checkbox, Modal, message } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import {
    formatError,
    flowCellBindFormModel,
    getCoreBusinessIndicators,
    transformQuery,
} from '@/core'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import FlowchartInfoManager, { SelectedStatus } from './helper'
import __ from './locale'
import { IndicatorThinColored } from '@/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import Empty from '@/ui/Empty'
import { SearchInput } from '@/ui'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

interface SelectedInfoSystemType {
    values: Array<any>
    mid: string
    flowchartId: string
    onClose: () => void
    onConfirm: (datas: any) => void
}

const SelectMetricList = ({
    values,
    mid,
    flowchartId,
    onClose,
    onConfirm,
}: SelectedInfoSystemType) => {
    const [bindItems, setBindItems] = useState<any>([])
    const [selectData, setSelectData] = useState<any>([])
    const [fieldInfo, setFieldInfo] = useState<any>([])
    const [datas, setDatas] = useState<any>([])
    const [keyword, setKeyword] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [selectAllStatus, setSelectAllStatus] = useState<SelectedStatus>(
        SelectedStatus.UnChecked,
    )
    const scrollRef = useRef<any>()
    const [isScroll, setIsScroll] = useState<boolean>(false)

    // 流程图相关信息
    const { drawioInfo } = useContext(DrawioInfoContext)
    // 存储信息
    const [afFlowchartInfo, setAfFlowchartInfo] = useLocalStorageState<any>(
        `${flowchartId}`,
    )
    const { isDraft, selectedVersion } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    useEffect(() => {
        if (mid) {
            getBusinessIndicator()
        }
    }, [mid])

    useEffect(() => {
        const items = values.map((item) => {
            return { ...item, id: item.id }
        })
        // setSelectData(items)
        setBindItems(items)
    }, [values])

    // 获取业务指标
    const getBusinessIndicator = async () => {
        const res = await getCoreBusinessIndicators({
            mid,
            limit: 2000,
            ...versionParams,
        })
        const list = res.entries || []
        setDatas(list)
        setFieldInfo(list)
        checkedSelectStatus(list)
    }

    /**
     * 检索
     * @param value
     */
    const onSearch = (value: string) => {
        setKeyword(value)
        if (value) {
            const list = fieldInfo?.filter((o) => o?.name?.includes(value))
            setFieldInfo(list)
            checkedSelectStatus(list)
        } else {
            setFieldInfo(datas)
            checkedSelectStatus(datas)
        }
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
        // 仅对非绑定项进行处理
        const canCheckItems = fieldInfo.filter(
            (o) => !bindItems.some((i) => o.id === i.id),
        )
        if (checked) {
            const currentSelectData = [...selectData, item]
            setSelectData(currentSelectData)
            const surplusData = canCheckItems.filter(
                (indicator_item) =>
                    !currentSelectData.find(
                        (selected) => selected.id === indicator_item.id,
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
                canCheckItems.find(
                    (infoSystem) => selected.id === infoSystem.id,
                ),
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
        // 仅对非绑定项进行处理
        const canCheckItems = fieldInfo.filter(
            (o) => !bindItems.some((i) => o.id === i.id),
        )
        if (checked) {
            const willAddData = canCheckItems.filter(
                (infoSystem) =>
                    !selectData.find(
                        (selected) => selected.id === infoSystem.id,
                    ),
            )
            setSelectData([...selectData, ...willAddData])
            setSelectAllStatus(SelectedStatus.Checked)
        } else {
            const currentData = selectData.filter(
                (selected) =>
                    !canCheckItems.find(
                        (infoSystem) => selected.id === infoSystem.id,
                    ),
            )
            setSelectData(currentData)
            setSelectAllStatus(SelectedStatus.UnChecked)
        }
    }
    // 获取最新数据
    const getLatestData = () => {
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            setAfFlowchartInfo(temp)
            return new FlowchartInfoManager(
                temp?.flowchartData?.infos || [],
                temp?.flowchartData?.current,
            )
        }
        return undefined
    }
    // 保存绑定绑定指标
    const onSure = async () => {
        const allItems = [...(selectData || []), ...(bindItems || [])]
        try {
            setLoading(true)
            const fm = await getLatestData()
            await flowCellBindFormModel(
                drawioInfo?.cellInfos?.id,
                allItems?.map((f) => f.id),
                'indicator',
                fm?.current?.mid,
                fm?.current?.fid,
            )
            message.success(__('关联成功'))
            onConfirm(allItems)
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }
    /**
     * 清空
     */
    const handleClear = () => {
        setSelectData([])
        setSelectAllStatus(SelectedStatus.UnChecked)
    }

    useLayoutEffect(() => {
        if (scrollRef.current) {
            setIsScroll(
                scrollRef.current.clientHeight !==
                    scrollRef.current.scrollHeight,
            )
        }
    }, [fieldInfo])

    return (
        <div>
            <Modal
                open
                title={__('关联业务指标')}
                width={480}
                bodyStyle={{
                    padding: 0,
                    minHeight: '400px',
                }}
                maskClosable={false}
                onCancel={onClose}
                footer={
                    fieldInfo?.length > 0 && (
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
                                    {(selectData.length ?? 0) +
                                        (bindItems?.length ?? 0)}
                                </span>
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
                                        onSure()
                                    }}
                                    loading={loading}
                                    disabled={selectData.length === 0}
                                >
                                    {__('确定')}
                                </Button>
                            </div>
                        </div>
                    )
                }
            >
                <div className={styles.metricWrap}>
                    <div
                        style={{
                            margin: '16px auto 12px',
                            width: '94%',
                        }}
                    >
                        <SearchInput
                            placeholder={__('搜索业务指标名称')}
                            onKeyChange={(kw: string) => {
                                onSearch(kw)
                            }}
                        />
                    </div>
                    <div className={styles.selectInfoBody}>
                        <div className={styles.rightContainer}>
                            {fieldInfo.length > 0 && (
                                <div className={styles.selectAll}>
                                    <div>{__('全选')}</div>
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
                                            disabled={
                                                fieldInfo?.length ===
                                                bindItems?.length
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {fieldInfo.length ? (
                                <div
                                    className={classnames({
                                        [styles.selectedItems]: true,
                                        [styles.isScroll]: isScroll,
                                    })}
                                    ref={scrollRef}
                                >
                                    {fieldInfo.map((item) => {
                                        return (
                                            <div
                                                className={styles.bigWrap}
                                                key={item.id}
                                            >
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
                                                        }}
                                                    >
                                                        <IndicatorThinColored />
                                                        <span
                                                            style={{
                                                                marginLeft:
                                                                    '6px',
                                                            }}
                                                            className={classnames(
                                                                styles.systemInfoName,
                                                            )}
                                                            title={
                                                                item.name ||
                                                                item.indicator_name
                                                            }
                                                        >
                                                            {item.name ||
                                                                item.indicator_name}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <Checkbox
                                                            checked={
                                                                selectData.find(
                                                                    (
                                                                        selected,
                                                                    ) =>
                                                                        selected.id ===
                                                                        item.id,
                                                                ) ||
                                                                bindItems.some(
                                                                    (o) =>
                                                                        o.id ===
                                                                        item.id,
                                                                )
                                                            }
                                                            onChange={(e) => {
                                                                handleCheckItem(
                                                                    e.target
                                                                        .checked,
                                                                    item,
                                                                )
                                                            }}
                                                            disabled={
                                                                (selectData.find(
                                                                    (
                                                                        selected,
                                                                    ) =>
                                                                        selected.id ===
                                                                        item.id,
                                                                ) &&
                                                                    selectData.length >=
                                                                        99) ||
                                                                bindItems.some(
                                                                    (o) =>
                                                                        o.id ===
                                                                        item.id,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div>
                                    <Empty
                                        desc={
                                            <div>
                                                {keyword !== ''
                                                    ? __('抱歉，未找到匹配内容')
                                                    : __('暂无数据')}
                                            </div>
                                        }
                                        iconSrc={
                                            keyword !== ''
                                                ? searchEmpty
                                                : dataEmpty
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default SelectMetricList
