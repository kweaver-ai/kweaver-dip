import React, {
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Button, Checkbox, List, message, Modal } from 'antd'
import { useLocalStorageState, useSelections } from 'ahooks'
import classnames from 'classnames'
import styles from './styles.module.less'
import {
    formatError,
    formsQuery,
    flowCellBindFormModel,
    transformQuery,
} from '@/core'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { DrawioInfoContext } from '@/context/DrawioProvider'

import Loader from '@/ui/Loader'
import FlowchartInfoManager, {
    FormLabel,
    OperateType,
    SelectedStatus,
} from './helper'

import { FormTableKind } from '../Forms/const'
import { SearchInput } from '@/ui'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

interface ICiteForm {
    visible: boolean
    existing?: any[]
    flowchartId: string
    onClose: (operate?) => void
    onSure: () => void
}

/**
 * 关联业务表
 * @param visible 显示/隐藏
 * @param existing 已选中值
 * @param onClose 关闭
 * @param onSure 确定
 */
const CiteForm: React.FC<ICiteForm> = ({
    visible,
    existing = [],
    flowchartId,
    onClose,
    onSure,
}) => {
    // 流程图相关信息
    const { drawioInfo } = useContext(DrawioInfoContext)
    // 存储信息
    const [afFlowchartInfo, setAfFlowchartInfo] = useLocalStorageState<any>(
        `${flowchartId}`,
    )

    const [selectAllStatus, setSelectAllStatus] = useState<SelectedStatus>(
        SelectedStatus.UnChecked,
    )
    // 根业务模型id
    const mid = useMemo(() => drawioInfo?.rootMid, [visible])

    const scrollRef = useRef<any>()
    // load
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    const [isScroll, setIsScroll] = useState<boolean>(false)
    // 数据总集
    const [defaultItems, setDefaultItems] = useState<any[]>([])
    // 列表展示数据集
    const [items, setItems] = useState<any[]>([])

    // 搜索值
    const [searchKey, setSearchKey] = useState('')

    const { isDraft, selectedVersion } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    // 搜索框显示/隐藏
    const showSearch = useMemo(
        () => items.length > 0 || searchKey !== '',
        [searchKey, items],
    )

    const unBindItems = items?.filter((o) => !existing.includes(o.id))

    // 选择相关
    const { selected, setSelected, isSelected, toggle, unSelect, unSelectAll } =
        useSelections(unBindItems, [])

    // 确定按钮状态
    const okEnabled = useMemo(() => {
        const newSelected = selected.filter((s) => !existing.includes(s.id))
        return newSelected.length > 0
    }, [selected])

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

    useEffect(() => {
        // 重置
        setSearchKey('')
        setFetching(true)
        setDefaultItems([])
        setItems([])
        setSelected([])
        setSelectAllStatus(SelectedStatus.UnChecked)
        // 获取数据
        if (visible) {
            getList()
        }
    }, [visible])

    // 获取表单列表
    const getList = async () => {
        try {
            const res = await formsQuery(mid, {
                type: 2,
                offset: 1,
                limit: 2000,
                table_kind: FormTableKind.BUSINESS,
                ...versionParams,
            })
            // setSelected(res.entries.filter((f) => existing.includes(f.id)))
            setDefaultItems(res.entries)
            setItems(res.entries)
        } catch (e) {
            formatError(e)
            setDefaultItems([])
            setItems([])
        } finally {
            setFetching(false)
        }
    }

    // 保存数据
    const handleOk = async () => {
        try {
            setLoading(true)
            const fm = await getLatestData()
            await flowCellBindFormModel(
                drawioInfo?.cellInfos?.id,
                selected.map((f) => f.id),
                'form',
                fm?.current?.mid,
                fm?.current?.fid,
            )
            message.success(__('关联成功'))
            onSure()
        } catch (e) {
            formatError(e)
            getList()
        } finally {
            setLoading(false)
        }
    }

    // 选项反转
    const handleCheckSingle = (item) => {
        if (!existing.includes(item.id)) {
            toggle(item)
        }
    }

    useEffect(() => {
        setSelectAllStatus(
            unBindItems?.length === selected?.length && unBindItems?.length
                ? SelectedStatus.Checked
                : selected?.length === 0
                ? SelectedStatus.UnChecked
                : SelectedStatus.Indeterminate,
        )
    }, [selected])

    // 清空已选项
    const handleClear = () => {
        setSelected([])
        setSelectAllStatus(SelectedStatus.UnChecked)
    }

    useLayoutEffect(() => {
        if (scrollRef.current) {
            setIsScroll(
                scrollRef.current.clientHeight !==
                    scrollRef.current.scrollHeight,
            )
        }
    }, [items])

    /**
     * 全选
     * @param checked
     */
    const handleCheckedAllData = (checked) => {
        // 仅对非绑定项进行处理
        const canCheckItems = items.filter((o) => !existing.includes(o.id))
        if (checked) {
            const willAddData = canCheckItems.filter(
                (infoSystem) =>
                    !selected.find((item) => item.id === infoSystem.id),
            )
            setSelected([...selected, ...willAddData])
            setSelectAllStatus(SelectedStatus.Checked)
        } else {
            const currentData = selected.filter(
                (item) =>
                    !canCheckItems.find(
                        (infoSystem) => item.id === infoSystem.id,
                    ),
            )
            setSelected(currentData)
            setSelectAllStatus(SelectedStatus.UnChecked)
        }
    }

    // 搜索
    const handleSearch = (search: string) => {
        setSearchKey(search)
        // 搜索为空显示全部数据
        if (search === '') {
            setItems(defaultItems)
            return
        }
        // 关键字过滤
        const res = defaultItems.filter(
            (info) =>
                (info.name && info.name.includes(search)) ||
                (info.name && info.name?.match(new RegExp(search, 'ig'))),
        )
        setItems(res)
    }

    // 空白显示
    const showEmpty = () => {
        const desc =
            searchKey !== '' ? (
                <>{__('抱歉，没有找到相关内容')}</>
            ) : (
                <>
                    <div>{__('暂无业务节点表')}</div>
                    <div>
                        {__('点击')}
                        <Button
                            type="link"
                            onClick={() => onClose(OperateType.Form_CREATE)}
                        >
                            【{__('新建业务节点表')}】
                        </Button>
                        <span>{__('或')}</span>
                        <Button
                            type="link"
                            onClick={() => onClose(OperateType.Form_IMPORT)}
                        >
                            【{__('导入业务节点表')}】
                        </Button>

                        {__('按钮')}
                        <div>{__('可将业务节点表关联到节点')}</div>
                    </div>
                </>
            )
        const icon = searchKey !== '' ? searchEmpty : dataEmpty
        return <Empty desc={desc} iconSrc={icon} />
    }

    return (
        <Modal
            title={__('关联业务节点表')}
            width={480}
            maskClosable={false}
            open={visible}
            onCancel={onClose}
            destroyOnClose
            getContainer={false}
            className={classnames(
                styles.citeFormWrapper,
                !items?.length && !searchKey && styles.noFooter,
            )}
            bodyStyle={{ height: 444, padding: 0 }}
            footer={
                items?.length > 0 && (
                    <div className={styles.selectInfoSystem}>
                        <div>
                            {`${__('已选：')}`}
                            <span
                                style={{
                                    color:
                                        selected.length > 99
                                            ? '#f5222d'
                                            : '#126ee3',
                                }}
                            >
                                {(selected.length ?? 0) +
                                    (existing?.length ?? 0)}
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
                                    handleOk()
                                }}
                                loading={loading}
                                disabled={!okEnabled}
                            >
                                {__('确定')}
                            </Button>
                        </div>
                    </div>
                )
            }
        >
            <div
                style={{ margin: '16px auto 12px', width: '94%' }}
                hidden={!showSearch}
            >
                <SearchInput
                    placeholder={__('搜索业务节点表名称')}
                    onKeyChange={handleSearch}
                />
            </div>

            <div className={styles.infoBody}>
                {items?.length > 0 && (
                    <div className={styles.cf_chooseWrapper}>
                        <div>{__('全选')}</div>
                        <div>
                            <Checkbox
                                checked={
                                    selectAllStatus === SelectedStatus.Checked
                                }
                                indeterminate={
                                    selectAllStatus ===
                                    SelectedStatus.Indeterminate
                                }
                                onChange={(e) => {
                                    handleCheckedAllData(e.target.checked)
                                }}
                                disabled={items?.length === existing?.length}
                            />
                        </div>
                    </div>
                )}

                <div>
                    {fetching && (
                        <div style={{ marginTop: '32px' }}>
                            <Loader />
                        </div>
                    )}
                </div>
                {items && items.length > 0 ? (
                    <div
                        className={classnames(
                            styles.cf_list,
                            isScroll && styles.isScroll,
                        )}
                        ref={scrollRef}
                    >
                        <List
                            split={false}
                            dataSource={items}
                            renderItem={(item) => (
                                <List.Item>
                                    <div
                                        className={styles.cf_listItemWrapper}
                                        style={{
                                            backgroundColor: isSelected(item)
                                                ? 'rgba(18, 110, 227, 0.06)'
                                                : undefined,
                                        }}
                                        onClick={() => {
                                            if (
                                                existing.includes(item.id) ||
                                                item.flowcharts?.length > 0
                                            ) {
                                                return
                                            }
                                            handleCheckSingle(item)
                                        }}
                                    >
                                        <FormLabel
                                            text={item.name}
                                            item={item}
                                        />
                                        <Checkbox
                                            checked={
                                                isSelected(item) ||
                                                existing.includes(item.id)
                                            }
                                            style={{ marginLeft: 16 }}
                                            disabled={
                                                existing.includes(item.id) ||
                                                item.flowcharts?.length > 0
                                            }
                                        />
                                    </div>
                                </List.Item>
                            )}
                        />
                    </div>
                ) : (
                    <div className={styles.cf_empty}>{showEmpty()}</div>
                )}
            </div>
        </Modal>
    )
}

export default CiteForm
