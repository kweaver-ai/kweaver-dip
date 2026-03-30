import React, { useState, useEffect, ClassAttributes, useMemo } from 'react'
import {
    Layout,
    Row,
    Col,
    Button,
    Dropdown,
    Divider,
    Tooltip,
    Badge,
    Space,
    message,
} from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { LeftOutlined, DownOutlined } from '@ant-design/icons'
import { noop } from 'lodash'
import classNames from 'classnames'
import ReactJoyride, { CallBackProps, STATUS } from 'react-joyride'
import { ISceneItem } from '@/core'
import __ from './locale'
import Icons from './Icons'
import { useQuery } from '@/utils'
import GlobalMenu from '../GlobalMenu'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { ModeType, OperateType, IndicatorType } from './const'
import styles from './styles.module.less'

const { Header: AntdHeader } = Layout
message.config({
    top: 100,
})

interface IGraphHeader extends ClassAttributes<HTMLDivElement> {
    onSaveGraph: () => void
    data?: ISceneItem
    canSave?: boolean
    canChange?: boolean
    mode?: ModeType
    setMode?: (mode: ModeType) => void
    loading?: boolean
    saveLoading?: boolean
}

const GraphHeader = ({
    onSaveGraph = noop,
    data,
    canChange = true,
    canSave = true,
    mode = ModeType.Definition,
    setMode,
    loading,
    saveLoading,
}: IGraphHeader) => {
    const query = useQuery()
    const id = query.get('id') || ''
    const operate = query.get('operate') || OperateType.CREATE
    const indicatorType = query.get('type') || IndicatorType.ATOM
    const backPrev = query.get('backPrev') || ''
    const taskId = query.get('taskId') || ''
    // 场景信息
    const navigator = useNavigate()
    const [sceneData, setSceneData] = useState<ISceneItem>()

    useEffect(() => {
        setSceneData(data)
    }, [data])

    // 返回
    const handleReturnBack = () => {
        ReturnConfirmModal({
            onCancel: () => {
                if (backPrev || taskId) {
                    navigator(-1)
                } else {
                    navigator('/business/indicatorManage')
                }
            },
        })
    }

    const title = useMemo(() => {
        let name: string = ''
        switch (operate) {
            case OperateType.CREATE:
                name =
                    indicatorType === IndicatorType.ATOM
                        ? __('新建原子指标')
                        : __('新建衍生指标')
                break
            case OperateType.EDIT:
                name = sceneData?.name || ''
                break
            default:
                break
        }
        return (
            <>
                <Icons type={indicatorType} colored fontSize={20} />
                <span className={styles.title} title={name}>
                    {name}
                </span>
            </>
        )
    }, [indicatorType, operate, sceneData?.name])

    return (
        <div className={styles.graphHeaderWrapper}>
            <AntdHeader className={styles.gh_header}>
                <Row
                    style={{
                        width: '100%',
                    }}
                >
                    <Col span={6} className={styles.gh_topLeftWrap}>
                        <GlobalMenu />
                        <div
                            aria-hidden
                            className={styles.returnWrapper}
                            onClick={() => {
                                handleReturnBack()
                            }}
                        >
                            <LeftOutlined />
                            <div className={styles.return}>{__('返回')}</div>
                        </div>

                        <div className={styles.nameWrapper}>
                            <div className={styles.nameborder} />
                            <div className={styles.domainName}>{title}</div>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.toolWrapper}>
                            {!loading && (
                                <div className={styles.modeContainer}>
                                    <Badge
                                        color={
                                            mode === ModeType.Definition &&
                                            styles.selectedText
                                                ? '#126EE3'
                                                : '#999999'
                                        }
                                        className={styles.dot}
                                    />
                                    <div
                                        className={classNames(
                                            styles.text,
                                            mode === ModeType.Definition &&
                                                styles.selectedText,
                                        )}
                                        onClick={() =>
                                            setMode?.(ModeType.Definition)
                                        }
                                    >
                                        {__('指标定义')}
                                        {mode === ModeType.Definition && (
                                            <div
                                                className={styles.bottomLine}
                                            />
                                        )}
                                    </div>
                                    <div className={styles.line} />
                                    <Badge
                                        color={
                                            mode === ModeType.More &&
                                            styles.selectedText
                                                ? '#126EE3'
                                                : '#999999'
                                        }
                                        className={styles.dot}
                                    />
                                    <div
                                        className={classNames(
                                            styles.text,
                                            !canChange && styles.disabledText,
                                            mode === ModeType.More &&
                                                styles.selectedText,
                                        )}
                                        onClick={() => {
                                            if (canChange) {
                                                setMode?.(ModeType.More)
                                            }
                                        }}
                                    >
                                        <Tooltip
                                            title={
                                                canChange
                                                    ? undefined
                                                    : __(
                                                          '请先完成“指标定义”中算子的配置',
                                                      )
                                            }
                                        >
                                            {__('更多属性')}
                                        </Tooltip>
                                        {mode === ModeType.More && (
                                            <div
                                                className={styles.bottomLine}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className={styles.toolSaveWrapper}>
                            <Space size={12}>
                                <Tooltip
                                    title={
                                        canSave
                                            ? undefined
                                            : __(
                                                  '请先完成“指标定义”“更多属性”两个板块的配置',
                                              )
                                    }
                                    placement="topRight"
                                >
                                    <Button
                                        style={{
                                            width:
                                                operate === OperateType.EDIT
                                                    ? 'auto'
                                                    : 80,
                                        }}
                                        type="primary"
                                        loading={saveLoading}
                                        disabled={!canSave}
                                        onClick={async (e) => {
                                            await onSaveGraph()
                                        }}
                                    >
                                        {operate === OperateType.CREATE
                                            ? __('发布')
                                            : __('更新指标')}
                                    </Button>
                                </Tooltip>
                            </Space>
                        </div>
                    </Col>
                </Row>
            </AntdHeader>
        </div>
    )
}

export default GraphHeader
