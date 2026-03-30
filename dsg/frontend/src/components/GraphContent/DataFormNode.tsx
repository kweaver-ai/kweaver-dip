import { useEffect, useState } from 'react'
import { register } from '@antv/x6-react-shape'
import {
    CaretRightOutlined,
    LeftOutlined,
    LoadingOutlined,
    MinusOutlined,
    RightOutlined,
} from '@ant-design/icons'
import { useDebounce } from 'ahooks'
import classnames from 'classnames'
import { ConfigProvider, Spin } from 'antd'
import {
    calculateFormNodeHeight,
    DATA_TABLE_COLOR,
    DATA_TABLE_LINE_HEIGHT,
    ExpandStatus,
    getCurrentFieldsOffset,
    LOGIC_COLOR,
    LOGIC_LINE_HEIGHT,
    NODE_WIDTH,
    NodeShapeTypes,
    TABLE_LIMIT,
    TableNodeNames,
} from './const'
import { getCurrentShowData } from './helper'
import { FontIcon, LargeOutlined } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { NodeType } from '@/core/consanguinity'
import { useGraphContext } from './contextProvider'

const DataFormComponent = (props: any) => {
    // 节点
    const { node } = props
    // 数据表节点
    const { data } = node
    // 数据表名称
    const { label, expand } = data
    // 数据表图标
    const [targetData, setTargetData] = useState<Array<any>>([])
    // 是否显示翻页
    const [showPagTurning, setShowPageTurning] = useState<boolean>(false)
    // 选中的节点
    const [selectedIds, setSelectedIds] = useState<Array<string>>([])
    // 表单信息
    const [formInfo, setFormInfo] = useState<any>(null)
    // 搜索关键字
    const [searchKey, setSearchKey] = useState<string>('')
    // 搜索关键字防抖
    const debouncedValue = useDebounce(searchKey, { wait: 500 })
    // 表单数据
    const [formExpand, setFormExpand] = useState<ExpandStatus>(
        ExpandStatus.EXPAND,
    )

    const { expandNode, updateExpandNode, reloadNodeRelation, selectedField } =
        useGraphContext()

    const [expandLoading, setExpandLoading] = useState<boolean>(false)

    useEffect(() => {
        const { formData, fields } = data
        initTargetNode(fields)
        setTargetData(getCurrentShowData(data.offset, fields, TABLE_LIMIT))
        setFormInfo(data.formData)
        setSelectedIds(data.selectedFields)
    }, [data, node])

    useEffect(() => {
        if (expand === ExpandStatus.EXPAND) {
            setFormExpand(ExpandStatus.EXPAND)
            node.resize(
                NODE_WIDTH,
                calculateFormNodeHeight(
                    targetData.length,
                    data.offset,
                    data.type === NodeType.DATA_TABLE
                        ? DATA_TABLE_LINE_HEIGHT
                        : LOGIC_LINE_HEIGHT,
                ),
            )
        } else {
            setFormExpand(ExpandStatus.FOLD)
            node.resize(NODE_WIDTH, 56)
        }
    }, [expand, targetData.length])

    /**
     * 初始化节点
     * @param fields
     */
    const initTargetNode = (fields) => {
        node.resize(
            NODE_WIDTH,
            calculateFormNodeHeight(
                fields.length || 0,
                data.offset,
                data.type === NodeType.DATA_TABLE
                    ? DATA_TABLE_LINE_HEIGHT
                    : LOGIC_LINE_HEIGHT,
            ),
        )
    }

    /**
     * 下一页
     */
    const handlePageDown = () => {
        node.setData({
            ...data,
            offset: data.offset + 1,
        })
        reloadNodeRelation(node)
    }

    /**
     * 上一页
     */
    const handlePageUp = () => {
        node.setData({
            ...data,
            offset: data.offset - 1,
        })
        reloadNodeRelation(node)
    }

    /**
     * 根据选中节点进行翻页
     * @param selectedDataId  选中的
     * @param allFields
     * @param currentOffset
     */
    const pageTurnBySelecteds = (
        selectedDataId: string,
        allFields: Array<any>,
        currentOffset: number,
    ) => {
        let newOffset = getCurrentFieldsOffset(selectedDataId, allFields) - 1
        if (selectedDataId === data.formData?.id) {
            newOffset = 0
        }

        if (newOffset !== currentOffset) {
            node.setData({
                ...data,
                offset: newOffset,
            })
            // updateFormNodeAndEdge(newOffset, [selectedDataId])
        }
    }

    /**
     * 选择表
     * @returns
     */
    const getSelectFormClassName = () => {
        if (node.data.isSelected || node.data.hoverStatus) {
            return styles.selectFormOriginNode
        }
        return ''
    }

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={classnames(
                    styles.formNode,
                    styles.formOriginNode,
                    getSelectFormClassName(),
                )}
            >
                <div>
                    <div className={classnames(styles.formOriginHeader)}>
                        <div className={styles.formDataTip}>
                            {TableNodeNames[data.type]}
                        </div>
                        <div
                            className={styles.titleLine}
                            style={{
                                background:
                                    data.type === NodeType.DATA_TABLE
                                        ? DATA_TABLE_COLOR
                                        : LOGIC_COLOR,
                            }}
                        />
                        <div className={styles.headerContent}>
                            <div
                                className={classnames(
                                    styles.expandBtn,
                                    formExpand === ExpandStatus.EXPAND
                                        ? styles.expanded
                                        : styles.unExpand,
                                )}
                                onClick={() => {
                                    node.replaceData({
                                        ...data,
                                        expand:
                                            formExpand === ExpandStatus.EXPAND
                                                ? ExpandStatus.FOLD
                                                : ExpandStatus.EXPAND,
                                    })
                                    reloadNodeRelation(node)
                                }}
                            >
                                <CaretRightOutlined />
                            </div>
                            <div
                                className={styles.nameContainer}
                                style={{ margin: '6px 0' }}
                            >
                                {label}
                            </div>
                            {data?.parentNodeId?.length ? (
                                expandLoading ? (
                                    <div
                                        className={classnames(
                                            styles.addNodeIcon,
                                        )}
                                        // onClick={(e) => {
                                        //     e.preventDefault()
                                        //     e.stopPropagation()
                                        //     onExpand(true)
                                        // }}
                                    >
                                        <Spin
                                            indicator={<LoadingOutlined spin />}
                                            size="small"
                                        />
                                    </div>
                                ) : expandNode.includes(node.data.id) ? (
                                    <div
                                        className={classnames(
                                            styles.addNodeIcon,
                                        )}
                                    >
                                        <MinusOutlined
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                updateExpandNode(
                                                    node.data.id,
                                                    'remove',
                                                )
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className={classnames(
                                            styles.addNodeIcon,
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            updateExpandNode(
                                                node.data.id,
                                                'add',
                                            )
                                        }}
                                    >
                                        <LargeOutlined />
                                    </div>
                                )
                            ) : null}
                        </div>
                    </div>
                    {targetData.length && formExpand === ExpandStatus.EXPAND ? (
                        <div
                            className={styles.formContent}
                            onFocus={() => 0}
                            onBlur={() => 0}
                            onMouseOver={() => {
                                // if (
                                //     searchFieldData(data.items, data.keyWord)
                                //         .length > 10
                                // ) {
                                //     setShowPageTurning(true)
                                // }
                            }}
                            onMouseLeave={() => {
                                setShowPageTurning(false)
                            }}
                        >
                            <div>
                                {targetData.map((item, index) => {
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                height:
                                                    data.type ===
                                                    NodeType.DATA_TABLE
                                                        ? DATA_TABLE_LINE_HEIGHT
                                                        : LOGIC_LINE_HEIGHT,
                                            }}
                                            onClick={() => {
                                                selectedField(item, node)
                                            }}
                                            className={classnames(
                                                styles.fieldContainer,
                                                selectedIds.includes(item.id)
                                                    ? styles.selectedField
                                                    : '',
                                            )}
                                        >
                                            {item.label}

                                            {item?.tool?.left?.label && (
                                                <div
                                                    className={styles.leftTool}
                                                >
                                                    <div
                                                        className={classnames(
                                                            styles.toolWrapper,
                                                            selectedIds.includes(
                                                                item.id,
                                                            )
                                                                ? styles.toolWrapperSelected
                                                                : '',
                                                        )}
                                                    >
                                                        {
                                                            item?.tool?.left
                                                                ?.label
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                            {data?.tool?.right?.label && (
                                                <div>
                                                    <div>
                                                        {
                                                            item?.tool?.right
                                                                ?.label
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            {data?.fields?.length &&
                            data.fields.length > TABLE_LIMIT ? (
                                <div
                                    className={classnames(
                                        styles.formContentPageTurning,
                                        styles.originFormPageTurning,
                                    )}
                                >
                                    <LeftOutlined
                                        onClick={(e) => {
                                            if (data.offset === 0) {
                                                return
                                            }
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handlePageUp()
                                        }}
                                        style={
                                            data.offset === 0
                                                ? {
                                                      color: 'rgba(0,0,0,0.25)',
                                                      cursor: 'default',
                                                  }
                                                : {}
                                        }
                                    />
                                    <div>
                                        {`${data.offset + 1} /
                                    ${Math.ceil(
                                        data.fields.length / TABLE_LIMIT,
                                    )}`}
                                    </div>
                                    <RightOutlined
                                        onClick={(e) => {
                                            if (
                                                data.offset + 1 ===
                                                Math.ceil(
                                                    data.fields.length /
                                                        TABLE_LIMIT,
                                                )
                                            ) {
                                                return
                                            }
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handlePageDown()
                                        }}
                                        style={
                                            data.offset + 1 ===
                                            Math.ceil(
                                                data.fields.length /
                                                    TABLE_LIMIT,
                                            )
                                                ? {
                                                      color: 'rgba(0,0,0,0.25)',
                                                      cursor: 'default',
                                                  }
                                                : {}
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                {!targetData.length && (
                    <div className={styles.formEmpty}>
                        <div className={styles.formEmpty}>
                            {debouncedValue
                                ? __('抱歉，没有找到相关内容')
                                : __('暂无数据')}
                        </div>
                    </div>
                )}
            </div>
        </ConfigProvider>
    )
}

// 注册数据表节点
const dataFormNode = (callback?: any) => {
    register({
        shape: NodeShapeTypes.DATA_TABLE,
        effect: ['data'],
        component: DataFormComponent,
    })
    return NodeShapeTypes.DATA_TABLE
}

export default dataFormNode
