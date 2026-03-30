import { useMemo, useState } from 'react'
import { register } from '@antv/x6-react-shape'
import { CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { ConfigProvider, Tooltip } from 'antd'
import styles from './styles.module.less'
import { NodeType, ViewMode } from '../const'
import {
    AddRecommendBtn,
    findNodeById,
    flatTreeData,
    graphAddNode,
    graphNodeCollapse,
    graphRecommendNode,
    graphStopRecommendNode,
} from '../helper'
import aiIcon from '@/icons/svg/outlined/aiIcon.svg'
import __ from '../locale'
import { getAntdLocal } from '@/core/graph/helper'
import { useUndsGraphContext } from '@/context/UndsGraphProvider'

let callbackColl: any = []
const SecondLeNodeComponent = (props: any) => {
    const { viewMode, catalogData, columnData } = useUndsGraphContext()
    const { node } = props
    const { id, data } = node

    const [nodeData, setNodeData] = useState<any>(data)
    const [addVisable, setAddVisable] = useState(false)
    const [borderBold, setBorderBold] = useState<boolean>(false)

    useMemo(() => setNodeData(data), [data])
    const mindMapData = useMemo(() => findNodeById(callbackColl[2](), id), [])
    // const viewMode = useMemo(() => callbackColl[1](), [])
    const show = useMemo(() => {
        return (
            addVisable &&
            !!nodeData?.dataInfo?.content_type &&
            viewMode !== ViewMode.VIEW &&
            nodeData?.children?.[0].nodeType !== NodeType.ThirdLeNode
        )
    }, [addVisable, nodeData, viewMode])
    const showAdd = useMemo(() => {
        return (
            addVisable &&
            !!nodeData?.dataInfo?.content_type &&
            nodeData?.dataInfo?.max_multi > 1 &&
            viewMode !== ViewMode.VIEW &&
            nodeData?.children?.[0].nodeType !== NodeType.ThirdLeNode
        )
    }, [addVisable, nodeData])

    return (
        <ConfigProvider
            locale={getAntdLocal()}
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={styles.secondLeNodeWrap}
                style={{
                    width: nodeData.width + 52,
                    height: nodeData.height + 20,
                }}
                onMouseLeave={() => setAddVisable(false)}
            >
                <div
                    className={styles.sln_titleWrap}
                    style={{
                        width: nodeData.width,
                        height: nodeData.height,
                        border: borderBold
                            ? '2px solid #547ee8'
                            : viewMode === ViewMode.EDIT &&
                              nodeData?.dataInfo?.error
                            ? '1px solid #F5222D'
                            : '1px solid #547ee8',
                    }}
                    onFocus={() => {}}
                    onMouseEnter={() => {
                        setAddVisable(true)
                        setBorderBold(true)
                    }}
                    onMouseLeave={() => setBorderBold(false)}
                    onClick={() =>
                        graphNodeCollapse(
                            callbackColl[0]().current,
                            callbackColl[2](),
                            node,
                        )
                    }
                >
                    <Tooltip
                        title={nodeData?.dataInfo?.note || '--'}
                        placement="top"
                    >
                        <QuestionCircleOutlined
                            hidden={!nodeData?.dataInfo?.note}
                            className={styles.sln_questionIcon}
                        />
                    </Tooltip>
                    {nodeData?.dataInfo?.required && '*'}
                    {nodeData?.dataInfo?.name}
                </div>
                <AddRecommendBtn
                    style={{
                        position: 'absolute',
                        right: -52,
                        top: showAdd && show ? -26 : 0,
                    }}
                    showAdd={showAdd}
                    showRecommend={show}
                    disabled={
                        nodeData?.recommendedAll === true
                            ? true
                            : !!nodeData?.recommended
                    }
                    onAdd={() => {
                        graphAddNode(
                            callbackColl[0]().current,
                            callbackColl[2](),
                            node.id,
                        )
                    }}
                    onRecommend={() => {
                        graphRecommendNode(
                            callbackColl[0]().current,
                            callbackColl[2](),
                            node.id,
                            mindMapData!.aiIntervalData!,
                            catalogData,
                            columnData,
                            callbackColl[4](),
                        )
                    }}
                />
                <div
                    className={styles.sln_num}
                    hidden={!nodeData?.collapsed || show || showAdd}
                    onClick={() => {
                        graphNodeCollapse(
                            callbackColl[0]().current,
                            callbackColl[2](),
                            node,
                        )
                    }}
                >
                    {nodeData.children?.[0]?.children
                        ? flatTreeData([nodeData]).length - 3
                        : nodeData?.children?.length || 0}
                </div>
            </div>
            <div
                className={styles.node_aiIng}
                hidden={
                    nodeData?.recommendedAll === true
                        ? true
                        : !nodeData.recommended
                }
            >
                <img src={aiIcon} alt="aiIcon" className={styles.node_aiIcon} />
                <span className={styles.node_aiIngTitle}>
                    {__('正在理解...')}
                </span>
                <CloseOutlined
                    className={styles.node_aiStopWrap}
                    onClick={() =>
                        graphStopRecommendNode(
                            callbackColl[0]().current,
                            callbackColl[2](),
                            mindMapData?.aiIntervalData,
                            node.id,
                            callbackColl[4](),
                        )
                    }
                />
            </div>
        </ConfigProvider>
    )
}

const SecondLeNode = (callback?: any): string => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: NodeType.SecondLeNode,
        effect: ['data'],
        component: SecondLeNodeComponent,
    })
    return NodeType.SecondLeNode
}

export default SecondLeNode
