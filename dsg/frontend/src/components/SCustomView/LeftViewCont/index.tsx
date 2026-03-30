import { memo, useEffect, useState, useContext, useRef } from 'react'
import { List, Space, Tooltip, message, Modal } from 'antd'
import { Dnd } from '@antv/x6-plugin-dnd'
import { CodeOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import { useUpdateEffect, useGetState } from 'ahooks'
import classnames from 'classnames'
import { filter, map, uniqBy } from 'lodash'
import {
    formatError,
    getViewMultiDetailRequest,
    getMultiViewRequest,
} from '@/core'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import { SearchInput } from '@/ui'
import { useQuery } from '@/utils'
import Empty from '@/ui/Empty'
import { DatasheetViewColored, CopyOutlined, DeleteOutLined } from '@/icons'
import AddDirOutlined from '@/icons/AddDirOutlined'
import {
    CustomViewContext,
    CHANGE_TAB_ITEMS,
    CHANGE_TAB_ACTIVE_KEY,
    CHANGE_DATA_VIEWS_LISTS,
    CHANGE_SQL_INFO,
    CHANGE_DATA_VIEWS_LISTS_REMOVE_ID,
} from '../CustomViewRedux'
import SampleComp from './SampleComp'
import ChooseLogicalView from '../LogicalViewModal'
import { FormulaType } from '../const'
import { useSceneGraphContext } from '../helper'

const LogicalViewList = (props: any) => {
    const { onStartDrag, graphCase, optionType } = props
    const { setDeletable } = useSceneGraphContext()
    const query = useQuery()
    // 场景Id
    const sceneId = query.get('sceneId') || ''
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [total, setTotal] = useState(0)
    const [checkedId, setCheckedId] = useState<any>()

    const { data, dispatch } = useContext(CustomViewContext)
    const { tabItems, sqlResultFullScreen, dataViewLists, activeKey, sqlText } =
        data.toJS()
    const [listData, setListData] = useState<any[]>(dataViewLists)

    const [viewVisible, setViewVisible] = useState<boolean>(false)
    // 已选中的的库表
    const [selectView, setSelectView] = useState<any>()

    const [isDrag, setIsDrag, getIsDrag] = useGetState(false)

    const currentDndCase = useRef<Dnd>()

    useEffect(() => {
        if (sceneId) {
            const getLeftViewIds = async () => {
                const res = await getMultiViewRequest({ scene_id: sceneId })
                if (res.ids) {
                    const viewDetails = await getViewDetailArr(res.ids)
                    const newCheckItems = map(
                        viewDetails.logic_views,
                        (item, index) => {
                            return {
                                ...item,
                                id: res.ids[index],
                            }
                        },
                    )
                    dispatch({
                        type: CHANGE_DATA_VIEWS_LISTS,
                        data: newCheckItems,
                    })
                }
            }
            getLeftViewIds()
        }
    }, [sceneId])

    useUpdateEffect(() => {
        const res = filter(dataViewLists, (item: any) => {
            const {
                business_name,
                technical_name,
                uniform_catalog_code = '',
            } = item
            if (
                business_name
                    .toLocaleLowerCase()
                    .includes(keyword.toLocaleLowerCase()) ||
                technical_name
                    .toLocaleLowerCase()
                    .includes(keyword.toLocaleLowerCase()) ||
                uniform_catalog_code
                    .toLocaleLowerCase()
                    .includes(keyword.toLocaleLowerCase()) ||
                keyword === ''
            ) {
                return true
            }
            return false
        })
        setListData(res)
    }, [keyword])

    const getViewDetailArr = async (ids): Promise<any> => {
        try {
            const res = await getViewMultiDetailRequest({ ids })
            return Promise.resolve(res)
        } catch (err) {
            formatError(err)
            return Promise.resolve(undefined)
        }
    }

    useEffect(() => {
        setListData(dataViewLists)
        const leftContainerDom = document.getElementById(
            'leftContainer',
        ) as HTMLElement
        currentDndCase.current = new Dnd({
            target: graphCase,
            scaled: false,
            dndContainer: leftContainerDom || undefined,
            getDragNode: (node) => node.clone({ keepId: true }),
            getDropNode: (node) => node.clone({ keepId: true }),
        })
    }, [dataViewLists.length])

    // 空库表
    const renderEmpty = () => {
        if (listData.length === 0 && !keyword) {
            return <Empty iconSrc={dataEmpty} />
        }
        if (listData.length === 0 && keyword) {
            return <Empty iconHeight={104} />
        }
        return null
    }

    const handleCheck = (e, item: any) => {
        setCheckedId(item.id)
        const newActiveKey = item.id
        let newPanes = [...tabItems]
        newPanes.push({
            label: item.business_name,
            children: <SampleComp data={item} />,
            key: newActiveKey,
            closable: true,
        })
        newPanes = uniqBy(newPanes, 'key')
        dispatch({
            type: CHANGE_TAB_ITEMS,
            data: newPanes,
        })
        dispatch({
            type: CHANGE_TAB_ACTIVE_KEY,
            data: newActiveKey,
        })
    }

    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
    const [currentRemoveId, setCurrentRemoveId] = useState('')

    const showRemoveModal = () => {
        setIsRemoveModalOpen(true)
    }

    const handleRemoveModalOk = () => {
        setIsRemoveModalOpen(false)
        const tmp = [...dataViewLists]
        const newCheckItems = tmp.filter(
            (checkItem) => checkItem.id !== currentRemoveId,
        )
        dispatch({
            type: CHANGE_DATA_VIEWS_LISTS,
            data: newCheckItems,
        })
        dispatch({
            type: CHANGE_DATA_VIEWS_LISTS_REMOVE_ID,
            data: currentRemoveId,
        })
    }

    const handleRemoveModalCancel = () => {
        setIsRemoveModalOpen(false)
    }

    // 选择库表
    const handleChooseView = async (values) => {
        const tmp = [...dataViewLists, ...values]
        const uniqArr = uniqBy(tmp, 'id')
        const uniqIds = uniqArr.map((item) => item.id)
        const viewDetails = await getViewDetailArr(uniqIds)
        const newCheckItems = map(viewDetails?.logic_views, (item) => {
            return { ...item }
        })
        dispatch({
            type: CHANGE_DATA_VIEWS_LISTS,
            data: newCheckItems,
        })
        setViewVisible(false)
        setDeletable(true)
    }

    const addDataView = () => {
        setViewVisible(true)
        setDeletable(false)
    }
    const removeDataView = (e, id, text) => {
        e.stopPropagation()
        const tmp = [...dataViewLists]
        const newCheckItems = tmp.filter((checkItem) => checkItem.id !== id)
        dispatch({
            type: CHANGE_DATA_VIEWS_LISTS,
            data: newCheckItems,
        })
        message.success(__('已移除'))
    }
    const handleInsertSql = (e, currItem) => {
        setIsDrag(false)
        e.stopPropagation()
        if (sqlResultFullScreen || activeKey !== 'canvas') {
            return
        }
        const newSql = {
            flag: true,
            text: `${currItem.view_source_catalog_name}.${currItem.technical_name}`,
        }
        dispatch({
            type: CHANGE_SQL_INFO,
            data: newSql,
        })
    }

    return (
        <div className={styles.leftContainer} id="leftContainer">
            <h3 className={styles.leftTitle}>
                <span className={styles.titleText}>
                    {__('数据来源')}
                    {listData.length > 0 && (
                        <b className={styles.extraTitle}>
                            {__('（直接拖至画布引用库表）')}
                        </b>
                    )}
                </span>
                {dataViewLists.length > 0 && (
                    <div className={styles.leftAdd} onClick={addDataView}>
                        <Tooltip placement="bottom" title={__('添加库表')}>
                            <AddDirOutlined />
                        </Tooltip>
                    </div>
                )}
            </h3>
            {dataViewLists.length < 1 ? (
                <div
                    style={{
                        marginTop: 24,
                    }}
                >
                    <Empty
                        desc={
                            <>
                                <div style={{ textAlign: 'center' }}>
                                    {__('暂无数据')}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span>{__('配置模型请先')}</span>
                                    <span
                                        style={{
                                            color: 'rgba(18, 110, 227, 1)',
                                            cursor: 'pointer',
                                        }}
                                        onClick={addDataView}
                                    >
                                        {__('添加要引用的库表')}
                                    </span>
                                </div>
                            </>
                        }
                        iconSrc={dataEmpty}
                    />
                </div>
            ) : (
                <div className={styles['leftview-list']}>
                    <p className={styles['leftview-list-searchBox']}>
                        <SearchInput
                            style={{ width: '100%' }}
                            placeholder={__('搜索')}
                            onKeyChange={(kw: string) => {
                                setKeyword(kw)
                            }}
                            onPressEnter={(e: any) =>
                                setKeyword(e.target.value)
                            }
                        />
                    </p>

                    <div className={styles['leftview-list-bottom']}>
                        <div className={styles['leftview-list-bottom-content']}>
                            <List
                                split={false}
                                dataSource={listData}
                                renderItem={(item: any) => (
                                    <List.Item>
                                        <div
                                            className={classnames({
                                                [styles['leftview-item']]: true,
                                                [styles['is-checked']]:
                                                    item.id === checkedId,
                                            })}
                                            style={{
                                                height:
                                                    listData.length > 0 &&
                                                    keyword
                                                        ? 70
                                                        : 56,
                                            }}
                                            onClick={(e) => {
                                                if (
                                                    // @ts-ignore
                                                    e.target.nodeName !==
                                                        'svg' &&
                                                    // @ts-ignore
                                                    e.target.nodeName !== 'path'
                                                ) {
                                                    setIsDrag(false)
                                                    handleCheck(e, item)
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                setIsDrag(true)
                                                // 300ms 过后认为时长按
                                                setTimeout(() => {
                                                    if (!getIsDrag()) return
                                                    setIsDrag(true)
                                                    if (
                                                        // @ts-ignore
                                                        e.target.nodeName !==
                                                            'svg' &&
                                                        // @ts-ignore
                                                        e.target.nodeName !==
                                                            'path'
                                                    ) {
                                                        onStartDrag(
                                                            e,
                                                            item,
                                                            currentDndCase.current,
                                                        )
                                                    }
                                                }, 300)
                                            }}
                                        >
                                            <div
                                                className={
                                                    styles['leftview-item-icon']
                                                }
                                            >
                                                <DatasheetViewColored />
                                            </div>
                                            <div
                                                className={
                                                    styles[
                                                        'leftview-item-title'
                                                    ]
                                                }
                                            >
                                                <div
                                                    title={`${item?.business_name}`}
                                                    className={
                                                        styles[
                                                            'leftview-item-title-name'
                                                        ]
                                                    }
                                                >
                                                    {`${item?.business_name}`}
                                                </div>
                                                <div
                                                    title={`技术名称：${item?.technical_name}`}
                                                    className={
                                                        styles[
                                                            'leftview-item-title-code'
                                                        ]
                                                    }
                                                >
                                                    {item?.technical_name}
                                                </div>
                                                {listData.length > 0 &&
                                                    keyword && (
                                                        <div
                                                            title={`编码：${item?.uniform_catalog_code}`}
                                                            className={
                                                                styles[
                                                                    'leftview-item-title-code'
                                                                ]
                                                            }
                                                        >
                                                            {`编码：${item?.uniform_catalog_code}`}
                                                        </div>
                                                    )}
                                            </div>
                                            <div
                                                className={
                                                    styles[
                                                        'leftview-item-funcIcon'
                                                    ]
                                                }
                                            >
                                                <Space size={8}>
                                                    <Tooltip
                                                        placement="bottom"
                                                        title={
                                                            optionType ===
                                                                FormulaType.SQL &&
                                                            !sqlResultFullScreen &&
                                                            activeKey ===
                                                                'canvas'
                                                                ? __(
                                                                      '插入SQL编辑器',
                                                                  )
                                                                : __(
                                                                      '请先从模型画布中选择一个SQL算子',
                                                                  )
                                                        }
                                                    >
                                                        {optionType ===
                                                            FormulaType.SQL &&
                                                        !sqlResultFullScreen &&
                                                        activeKey ===
                                                            'canvas' ? (
                                                            <div
                                                                className={
                                                                    styles.expandIcon
                                                                }
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    handleInsertSql(
                                                                        e,
                                                                        item,
                                                                    )
                                                                }}
                                                            >
                                                                <CodeOutlined
                                                                    className={
                                                                        styles.icon
                                                                    }
                                                                    style={{
                                                                        color: 'rgba(99, 102, 107, 1)',
                                                                        cursor: 'pointer',
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <CodeOutlined
                                                                className={
                                                                    styles.icon
                                                                }
                                                                style={{
                                                                    color: 'rgba(189, 190, 192, 1)',
                                                                    cursor: 'not-allowed',
                                                                }}
                                                            />
                                                        )}
                                                    </Tooltip>

                                                    <Tooltip
                                                        placement="bottom"
                                                        title={
                                                            <div>
                                                                <p
                                                                    style={{
                                                                        marginBottom: 0,
                                                                    }}
                                                                >
                                                                    {__(
                                                                        '复制库表标识',
                                                                    )}
                                                                </p>
                                                                <p
                                                                    style={{
                                                                        marginBottom: 0,
                                                                        fontSize: 12,
                                                                        color: 'rgba(255,255,255,0.65)',
                                                                    }}
                                                                >
                                                                    {__(
                                                                        '复制后到SQL编辑器使用',
                                                                    )}
                                                                </p>
                                                            </div>
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.expandIcon
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                navigator.clipboard.writeText(
                                                                    `${item.view_source_catalog_name}.${item.technical_name}`,
                                                                )
                                                                message.success(
                                                                    __(
                                                                        '复制成功',
                                                                    ),
                                                                )
                                                            }}
                                                        >
                                                            <CopyOutlined />
                                                        </div>
                                                    </Tooltip>
                                                    <Tooltip
                                                        placement="bottom"
                                                        title={
                                                            <div>
                                                                <p
                                                                    style={{
                                                                        marginBottom: 0,
                                                                    }}
                                                                >
                                                                    {__(
                                                                        '移除库表',
                                                                    )}
                                                                </p>
                                                                <p
                                                                    style={{
                                                                        marginBottom: 0,
                                                                        fontSize: 12,
                                                                        color: 'rgba(255,255,255,0.65)',
                                                                    }}
                                                                >
                                                                    {__(
                                                                        '移除库表不影响已配置的节点信息',
                                                                    )}
                                                                </p>
                                                            </div>
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.expandIcon
                                                            }
                                                            onClick={(e) =>
                                                                removeDataView(
                                                                    e,
                                                                    item?.id,
                                                                    `${item.view_source_catalog_name}.${item.technical_name}`,
                                                                )
                                                            }
                                                        >
                                                            <DeleteOutLined />
                                                        </div>
                                                    </Tooltip>
                                                </Space>
                                            </div>
                                        </div>
                                    </List.Item>
                                )}
                                loading={loading}
                                locale={{
                                    emptyText: (
                                        <div style={{ marginTop: 8 }}>
                                            {renderEmpty()}
                                        </div>
                                    ),
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            <ChooseLogicalView
                open={viewVisible}
                checkedId={selectView?.value}
                onClose={() => {
                    setViewVisible(false)
                    setDeletable(true)
                }}
                onSure={handleChooseView}
            />
            <Modal
                title={
                    <Space size={15}>
                        <ExclamationCircleFilled
                            style={{ color: 'rgb(250 173 20)' }}
                        />
                        <span>{__('确定要移除库表吗？')}</span>
                    </Space>
                }
                open={isRemoveModalOpen}
                onOk={handleRemoveModalOk}
                onCancel={handleRemoveModalCancel}
                width={416}
            >
                <p>
                    {__(
                        '移除库表后，引用该库表来产生输出数据的节点及其配置信息也会被一起删除，且无法撤销，请谨慎操作！',
                    )}
                </p>
            </Modal>
        </div>
    )
}

export default memo(LogicalViewList)
