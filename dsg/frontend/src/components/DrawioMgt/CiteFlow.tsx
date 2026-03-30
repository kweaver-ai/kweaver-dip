import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Button, List, message, Modal, Tabs, Tooltip } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { toNumber } from 'lodash'
import { useGetState, useLocalStorageState } from 'ahooks'
import classnames from 'classnames'
import styles from './styles.module.less'
import {
    formatError,
    getMainAllFlowChart,
    getSubAllFlowChart,
    IBusinFlowChartItem,
    IBusinFlowChartRecmdItem,
    messageError,
    bindFlowChart,
    flowRecommendQuery,
    getFlowChartByKeyword,
    IMainAllFlowChart,
    transformQuery,
} from '@/core'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '../../assets/dataEmpty.svg'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import Loader from '@/ui/Loader'
import FlowchartInfoManager, {
    FlowChooseItem,
    FlowPathType,
    FlowPathTypeList,
    getFlowTabItems,
    OperateType,
    treeTolist,
} from './helper'
import ArchitectureTree from '../BusinessArchitecture/ArchitectureTree'
import { Architecture, DataNode } from '../BusinessArchitecture/const'
import FlowchartIconOutlined from '@/icons/FlowchartIconOutlined'
import { SubFlowchartOutlined } from '@/icons'
import { oprTreeData } from '../ResourcesDir/const'
import { SearchInput } from '@/ui'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

interface ICiteFlow {
    visible: boolean
    waiting: boolean
    flowchartId: string
    onClose: (operate?) => void
    onSure: () => void
}

/**
 * 关联子流程组件
 * @param visible 显示/隐藏
 * @param waiting 等待状态
 * @param onClose 关闭
 * @param onSure 确定
 */
const CiteFlow: React.FC<ICiteFlow> = ({
    visible,
    waiting,
    flowchartId,
    onClose,
    onSure,
}) => {
    // 流程图相关信息
    const { drawioInfo } = useContext(DrawioInfoContext)
    const [df, setDf, getDf] = useGetState<any>()
    useMemo(() => {
        setDf(drawioInfo)
    }, [drawioInfo])
    // 存储信息
    const [afFlowchartInfo, setAfFlowchartInfo] = useLocalStorageState<any>(
        `${flowchartId}`,
    )
    const flowInfosMg = useMemo(() => {
        return new FlowchartInfoManager(
            afFlowchartInfo?.flowchartData?.infos || [],
            afFlowchartInfo?.flowchartData?.current,
        )
    }, [afFlowchartInfo])

    // load
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [searching, setSearching] = useState(false)

    // 推荐数据集
    const [recItems, setRecItems] = useState<IBusinFlowChartRecmdItem[]>([])
    // 列表树结构
    const [listTreeData, setListTreeData] = useState<IBusinFlowChartItem[]>([])
    // 列表展示数据集
    const [items, setItems] = useState<IBusinFlowChartItem[]>([])
    // 搜索数据集
    const [searchItems, setSearchItems] = useState<IBusinFlowChartItem[]>([])

    // 选中值id-业务模型列表
    const [selected, setSelected] = useState<any>()
    // 选中的目录节点-左侧树结构流程节点
    const [node, setNode] = useState<any>('')

    // 开关状态
    const [switchOpen, setSwitchOpen] = useState(false)

    // 推荐显示/隐藏
    const [recVisible, setRecVisible] = useState<boolean | undefined>(true)

    // tabKey
    const [activeKey, setActiveKey] = useState<FlowPathType>(FlowPathType.ALL)

    // 搜索值
    const [searchKey, setSearchKey] = useState('')
    // 列表参数
    const defaultParams = {
        type: FlowPathTypeList[activeKey],
        object_id: '',
        fid: drawioInfo.currentFid,
    }

    const [params, setParams] = useState<IMainAllFlowChart>(defaultParams)
    const { isDraft, selectedVersion } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return {
            ...transformQuery({ isDraft, selectedVersion }),
            is_draft: false,
        }
    }, [isDraft, selectedVersion])

    // 搜索框显示/隐藏
    const showSearch = useMemo(() => {
        return (
            !fetching &&
            (recItems.length > 0 ||
                items.length > 0 ||
                searchItems.length > 0 ||
                searchKey !== '' ||
                params.object_id !== '')
        )
    }, [fetching, searchKey, items, recItems])

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

    // 重置变量
    const initAllParams = () => {
        setSearchKey('')
        setLoading(false)
        setSearching(false)
        setRecItems([])
        setListTreeData([])
        setSelected(undefined)
        setRecVisible(true)
        setSwitchOpen(false)
        setParams(defaultParams)
    }

    useEffect(() => {
        if (!visible) {
            // 重置
            initAllParams()
        }
        // 获取数据
        if (visible && !waiting) {
            setFetching(true)

            switch (activeKey) {
                case FlowPathType.ALL:
                    getSelectedNode({ id: '' })

                    setSearchKey(searchKey)
                    break
                case FlowPathType.CUR_DEPARTMENT:
                    // 获取所有流程-主流程+所有子孙流程，子孙流程在主流程下平铺
                    getSelectedNode({ id: drawioInfo?.departmentId })
                    setSearchKey(searchKey)
                    break
                case FlowPathType.CUR_MAINBUSINS:
                    // 获取所有子流程-平铺
                    getSelectedNode({ id: drawioInfo?.departmentId })
                    setSearchKey(searchKey)
                    break
                default:
                    break
            }
            getRecommendList()
        }
    }, [visible, waiting, activeKey])

    useEffect(() => {
        const res = treeTolist('business_model_id', listTreeData, '')
        setItems(res)
    }, [listTreeData])

    // 获取推荐数据
    const getRecommendList = async () => {
        try {
            const fm = await getLatestData()
            const res = await flowRecommendQuery(
                fm?.current?.mid,
                fm?.current?.fid,
                {
                    node_id: drawioInfo?.cellInfos?.id,
                    type: FlowPathTypeList[activeKey],
                    ...versionParams,
                },
            )

            // 测试推荐数据
            // const res = testFlowList

            if (res?.length > 0) {
                setRecItems(res)
                setRecVisible(true)
            } else {
                // 无推荐数据隐藏推荐模块
                setRecItems([])
                setRecVisible(undefined)
            }

            // 获取业务模型
            await getCoreBusinessList(params)
        } catch (e) {
            setRecItems([])
            setRecVisible(undefined)
        } finally {
            setFetching(false)
        }
    }

    // 保存数据
    const handleOk = async () => {
        // 没有选中项不处理
        if (!selected) {
            messageError(__('请选择关联的子流程'))
            return
        }
        try {
            setLoading(true)
            const fm = await getLatestData()
            await bindFlowChart(
                fm?.current?.fid || '',
                drawioInfo?.cellInfos?.id,
                selected,
            )
            message.success(__('关联成功'))
            onSure()
        } catch (e) {
            formatError(e)
            getCoreBusinessList(params)
        } finally {
            setLoading(false)
        }
    }

    // 获取业务模型列表
    const getCoreBusinessList = async (p) => {
        const { object_id, type, fid, keyword } = p
        if (!fid) return
        setSearching(true)
        try {
            setParams(p)
            if (keyword) {
                const res = await getFlowChartByKeyword(type, fid, keyword)
                setSearchItems(res.entries || [])
            } else {
                let paramsTemp: IMainAllFlowChart = { type }
                if (type === FlowPathTypeList[FlowPathType.ALL]) {
                    paramsTemp = {
                        type,
                        fid,
                        object_id,
                    }
                } else {
                    paramsTemp = {
                        type,
                        fid,
                        object_id: '',
                    }
                }
                const res: any = await getMainAllFlowChart({
                    ...paramsTemp,
                    ...versionParams,
                })
                Object.assign(res, {
                    entries:
                        res?.entries?.map((tfItem) => {
                            // 一级目录
                            if (tfItem.flowchart_level === 1) {
                                Object.assign(tfItem, {
                                    isExpand: false,
                                    isShow: true,
                                })
                            } else {
                                Object.assign(tfItem, { isShow: true })
                            }
                            return tfItem
                        }) || [],
                })
                switch (activeKey) {
                    case FlowPathType.ALL:
                        setListTreeData(res.entries)
                        break
                    case FlowPathType.CUR_DEPARTMENT:
                        setListTreeData(res.entries)
                        break
                    case FlowPathType.CUR_MAINBUSINS:
                        setListTreeData(res.entries)
                        break
                    default:
                        break
                }
            }
        } catch (error) {
            formatError(error)
        } finally {
            setSearching(false)
        }
    }

    // 搜索
    const handleSearch = async (search: string) => {
        setSearchKey(search)
        // 搜索为空显示全部数据
        if (search === '') {
            // setItems([])
            getCoreBusinessList({
                ...params,
                object_id: node,
                keyword: '',
            })
            setSearchItems([])
            return
        }
        // setItems([])
        // setSelected(undefined)
        // initAllParams()
        // // 获取数据
        // if (visible && !waiting) {
        //     setFetching(true)
        //     getRecommendList()
        // }
        getCoreBusinessList({
            ...params,
            id: node,
            keyword: search,
        })
    }

    // 获取选中的节点的业务模型
    const getSelectedNode = async (sn: DataNode | { id: string }) => {
        setNode(sn?.id || '')
        getCoreBusinessList({ ...params, object_id: sn?.id || '' })
    }

    const handleTabChange = (key) => {
        // 重置搜索框
        setSearchKey('')
        setListTreeData([])
        setActiveKey(key as FlowPathType)
        setParams({
            ...params,
            object_id: '',
            type: FlowPathTypeList[key],
        })
    }

    const handleChecked = (id) => {
        if (flowInfosMg?.root?.mbsid === id) {
            return
        }
        setSelected(id)
    }

    // 处理展开/收起
    const handleExpand = async (expItem: IBusinFlowChartItem) => {
        const { main_business_id, business_model_id } = expItem
        const newIsExp = !expItem.isExpand

        try {
            setSearching(true)

            let res: any
            let listTreeDataTemp =
                listTreeData.map((item) => {
                    if (main_business_id === item.main_business_id) {
                        Object.assign(item, {
                            isExpand: newIsExp,
                            isShow: true,
                        })
                        Object.assign(expItem, {
                            isExpand: newIsExp,
                            isShow: true,
                        })
                    }

                    return item
                }) || []
            if (expItem.isExpand && expItem.children === undefined) {
                res = await getSubAllFlowChart(
                    expItem.main_business_id,
                    drawioInfo.currentFid,
                    versionParams,
                )

                // 展示所有子节点
                Object.assign(res, {
                    entries: res?.entries?.map((subItem) => {
                        return {
                            ...subItem,
                            isShow: true,
                            parent_id: expItem.business_model_id,
                        }
                    }),
                })

                listTreeDataTemp = oprTreeData(
                    business_model_id,
                    listTreeDataTemp,
                    {
                        children: res.entries || [],
                    },
                    {},
                    {},
                    'business_model_id',
                )
            } else if (toNumber(expItem.children?.length) > 0) {
                listTreeDataTemp = oprTreeData(
                    business_model_id,
                    listTreeDataTemp,
                    {
                        isShow: newIsExp,
                    },
                    {},
                    {},
                    'parent_id',
                )
            }
            setListTreeData(listTreeDataTemp)
        } catch (error) {
            // console.log('error:', error)
        } finally {
            setSearching(false)
        }
    }

    const getFlowChartIcon = (mainFlowChart = true) => {
        if (mainFlowChart) {
            return (
                <Tooltip title={__('主流程')}>
                    <FlowchartIconOutlined className={styles.fci_icon} />
                </Tooltip>
            )
        }
        return (
            <Tooltip title={__('子流程')}>
                <SubFlowchartOutlined className={styles.fci_flowIcon} />
            </Tooltip>
        )
    }

    // 空白添加显示
    const showEmpty = () => {
        const desc = (
            <>
                {__('点击')}
                <Button
                    type="link"
                    onClick={() => onClose(OperateType.Pro_CREATE)}
                >
                    【{__('新建流程')}】
                </Button>
                {__('按钮')}
                <p>{__('可将新建的流程关联到节点')}</p>
            </>
        )
        return (
            <div className={styles.cf_empty}>
                <Empty desc={desc} iconSrc={dataEmpty} />
            </div>
        )
    }

    return (
        <Modal
            title={__('从已有流程中引用')}
            width={640}
            maskClosable={false}
            open={visible}
            onCancel={onClose}
            onOk={handleOk}
            destroyOnClose
            getContainer={false}
            className={styles.citeFlowWrapper}
            bodyStyle={{
                height: 444,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
            }}
            okButtonProps={{ loading, disabled: !selected }}
        >
            <Tabs
                activeKey={activeKey}
                onChange={handleTabChange}
                getPopupContainer={(n) => n}
                tabBarGutter={32}
                items={getFlowTabItems()}
                destroyInactiveTabPane
                className={styles.flowPathTabs}
                // style={{padding: '16px 24px';}}
            />
            {fetching && <Loader />}
            {!fetching && !showSearch ? (
                showEmpty()
            ) : (
                <>
                    <div style={{ padding: '0 24px 16px' }}>
                        <SearchInput
                            value={searchKey}
                            placeholder={__('搜索流程名称')}
                            onKeyChange={handleSearch}
                            hidden={!showSearch}
                        />
                    </div>
                    <div className={styles.flowDataContent}>
                        <div
                            hidden={
                                !showSearch ||
                                recVisible === undefined ||
                                searchKey !== ''
                            }
                            style={{ width: '100%' }}
                        >
                            <div className={styles.cf_recHeaderWrapper}>
                                {recVisible ? (
                                    <DownOutlined
                                        className={styles.cf_recIcon}
                                        onClick={() => setRecVisible(false)}
                                    />
                                ) : (
                                    <RightOutlined
                                        className={styles.cf_recIcon}
                                        onClick={() => setRecVisible(true)}
                                    />
                                )}
                                {__('智能推荐')}
                            </div>
                            {/* 推荐列表 */}
                            {recVisible && (
                                <List
                                    className={styles.recList}
                                    style={{
                                        marginTop: 16,
                                    }}
                                    grid={{ gutter: 12, column: 3 }}
                                    dataSource={recItems}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <FlowChooseItem
                                                data={item}
                                                small={false}
                                                selDisabled={
                                                    flowInfosMg?.root?.mbsid ===
                                                        item.main_business_id &&
                                                    item.flowchart_level === 1
                                                }
                                                disabledId={
                                                    flowInfosMg?.root?.mbsid
                                                }
                                                checked={
                                                    selected ===
                                                    item.flowchart_id
                                                }
                                                onChecked={() =>
                                                    handleChecked(
                                                        item.flowchart_id,
                                                    )
                                                }
                                                icon={getFlowChartIcon(
                                                    item.flowchart_level === 1,
                                                )}
                                                style={{
                                                    color: 'red',
                                                    border:
                                                        selected ===
                                                        item.flowchart_id
                                                            ? '1px solid #126EE3'
                                                            : '1px solid rgb(0 0 0 / 15%)',
                                                    cursor:
                                                        flowInfosMg?.root
                                                            ?.mbsid ===
                                                        item.flowchart_id
                                                            ? 'not-allowed'
                                                            : 'pointer',
                                                    padding: '8px',
                                                }}
                                            />
                                        </List.Item>
                                    )}
                                />
                            )}
                        </div>
                        <div
                            className={styles.cf_recHeaderWrapper}
                            hidden={!showSearch}
                        >
                            {searchKey === '' ? __('全部流程') : __('搜索结果')}
                        </div>
                        <div
                            hidden={!showSearch || searchKey !== ''}
                            style={{
                                display: 'flex',
                                height:
                                    recVisible === undefined
                                        ? 'calc(100% - 36px)'
                                        : recVisible
                                        ? 'calc(100% - 144px)'
                                        : 'calc(100% - 72px)',
                            }}
                        >
                            {activeKey === FlowPathType.ALL && (
                                <div className={styles.cf_tree}>
                                    <ArchitectureTree
                                        getSelectedNode={getSelectedNode}
                                        isShowAll
                                        isShowOperate={false}
                                        hiddenNodeTypeList={[
                                            Architecture.BMATTERS,
                                            Architecture.BSYSTEM,
                                            Architecture.COREBUSINESS,
                                        ]}
                                        // initNodeId={
                                        //     switchOpen
                                        //         ? getDf()?.departmentType
                                        //         : undefined
                                        // }
                                        initNodeType={[
                                            Architecture.ORGANIZATION,
                                            Architecture.DEPARTMENT,
                                        ].join()}
                                        isShowXScroll
                                    />
                                </div>
                            )}
                            {/* 左边对应节点的流程图列表 */}
                            <List
                                className={classnames(
                                    styles.cf_list,
                                    activeKey === FlowPathType.ALL &&
                                        styles.cf_AllList,
                                    activeKey === FlowPathType.CUR_DEPARTMENT &&
                                        styles.cf_deprtList,
                                    activeKey === FlowPathType.CUR_MAINBUSINS &&
                                        styles.cf_businList,
                                )}
                                split={false}
                                dataSource={items}
                                renderItem={(item: IBusinFlowChartItem) => {
                                    let mainFwLeft = 0
                                    let subFwLeft = 0
                                    let padLeft = 0

                                    if (activeKey === FlowPathType.ALL) {
                                        mainFwLeft = 20
                                        subFwLeft = 26
                                    } else if (
                                        activeKey ===
                                        FlowPathType.CUR_DEPARTMENT
                                    ) {
                                        mainFwLeft = 0
                                        subFwLeft = 26
                                    }
                                    padLeft =
                                        item.flowchart_level === 1
                                            ? mainFwLeft
                                            : mainFwLeft + subFwLeft
                                    return (
                                        item.isShow && (
                                            <List.Item>
                                                <FlowChooseItem
                                                    data={item}
                                                    small
                                                    checked={
                                                        selected ===
                                                        item.flowchart_id
                                                    }
                                                    selDisabled={
                                                        flowInfosMg?.root
                                                            ?.mbsid ===
                                                            item.main_business_id &&
                                                        item.flowchart_level ===
                                                            1
                                                    }
                                                    disabledId={
                                                        flowInfosMg?.root?.mbsid
                                                    }
                                                    onChecked={() =>
                                                        handleChecked(
                                                            item.flowchart_id,
                                                        )
                                                    }
                                                    showExpIcon={
                                                        activeKey !==
                                                            FlowPathType.CUR_MAINBUSINS &&
                                                        item.flowchart_level ===
                                                            1
                                                    }
                                                    onExpand={() =>
                                                        handleExpand(item)
                                                    }
                                                    icon={getFlowChartIcon(
                                                        item.flowchart_level ===
                                                            1,
                                                    )}
                                                    style={{
                                                        backgroundColor:
                                                            flowInfosMg?.root
                                                                ?.mbsid ===
                                                            item.flowchart_id
                                                                ? '#FAFAFA'
                                                                : selected ===
                                                                  item.flowchart_id
                                                                ? 'rgba(18, 110, 227, 0.06)'
                                                                : undefined,
                                                        cursor:
                                                            flowInfosMg?.root
                                                                ?.mbsid ===
                                                            item.flowchart_id
                                                                ? 'not-allowed'
                                                                : 'pointer',
                                                        paddingLeft: `${padLeft}px`,
                                                    }}
                                                />
                                            </List.Item>
                                        )
                                    )
                                }}
                                loading={searching}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            desc={
                                                node === ''
                                                    ? __('暂无数据')
                                                    : __('暂无流程')
                                            }
                                            iconSrc={dataEmpty}
                                        />
                                    ),
                                }}
                            />
                        </div>
                    </div>
                    <div
                        hidden={!showSearch || searchKey === ''}
                        style={{ height: 'calc(100% - 110px)' }}
                    >
                        {/* 流程图列表搜索结果 */}
                        <List
                            className={classnames(
                                styles.cf_list,
                                styles.cf_searchList,
                            )}
                            split={false}
                            dataSource={searchItems}
                            renderItem={(item) => (
                                <List.Item>
                                    <FlowChooseItem
                                        data={item}
                                        small={false}
                                        recommeded={
                                            !!recItems.find(
                                                (r) =>
                                                    r.flowchart_id ===
                                                    item.flowchart_id,
                                            )
                                        }
                                        selDisabled={
                                            flowInfosMg?.root?.mbsid ===
                                                item.main_business_id &&
                                            item.flowchart_level === 1
                                        }
                                        disabledId={flowInfosMg?.root?.mbsid}
                                        checked={selected === item.flowchart_id}
                                        onChecked={() =>
                                            handleChecked(item.flowchart_id)
                                        }
                                        icon={getFlowChartIcon(
                                            item.flowchart_level === 1,
                                        )}
                                        style={{
                                            padding: '8px 24px',
                                            height: 48,
                                            backgroundColor:
                                                flowInfosMg?.root?.mbsid ===
                                                item.flowchart_id
                                                    ? '#FAFAFA'
                                                    : selected ===
                                                      item.flowchart_id
                                                    ? 'rgba(18, 110, 227, 0.06)'
                                                    : undefined,
                                            cursor:
                                                flowInfosMg?.root?.mbsid ===
                                                item.flowchart_id
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                        }}
                                    />
                                </List.Item>
                            )}
                            loading={searching}
                            locale={{ emptyText: <Empty /> }}
                        />
                    </div>
                </>
            )}
        </Modal>
    )
}

export default CiteFlow
