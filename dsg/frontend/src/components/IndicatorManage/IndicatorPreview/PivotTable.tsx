import { FC, useEffect, useMemo, useRef } from 'react'
import { useDebounce, useSize } from 'ahooks'
import { message, Switch, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import {
    S2DataConfig,
    PivotSheet,
    S2Options,
    asyncGetAllPlainData,
    SpreadSheet,
    copyToClipboard,
} from '@antv/s2'
import { Watermark } from '@/ui'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import __ from '../locale'

/**
 * 定义了一个透视表的配置接口
 * 该接口用于统一定义透视表的数据配置和选项配置
 */
interface IPivotTable {
    // 数据配置对象，用于指定透视表的数据源及相关数据处理设置
    s2DataConfig: S2DataConfig
    // 选项配置对象，用于指定透视表的渲染及交互等选项
    s2Options: S2Options
    total?: number
    switchTotals: boolean
    updateSwitchTotals: (status: boolean) => void
    // 指标信息
    indicatorInfo?: any
}
const PivotTable: FC<IPivotTable> = ({
    s2DataConfig,
    s2Options,
    total = 0,
    switchTotals,
    updateSwitchTotals,
    indicatorInfo,
}) => {
    // 透视表示例
    const s2Instance = useRef<PivotSheet>()

    const [userInfo] = useCurrentUser()

    // 透视表绑定的元素
    const s2Table = useRef<any>(null)

    // 外城容器大小
    const containerSize = useSize(s2Table)
    // 防抖监听容器变化调整表格大小
    const debounceSize = useDebounce(containerSize, { wait: 500 })

    useEffect(() => {
        initS2Sheet()
    }, [])

    useEffect(() => {
        s2Instance?.current?.setDataCfg(s2DataConfig)
        s2Instance.current?.setOptions({
            ...s2Options,
            width: debounceSize?.width,
            height: debounceSize?.height,
        })
        s2Instance.current?.render()
    }, [s2DataConfig, s2Options])

    useEffect(() => {
        s2Instance.current?.changeSheetSize(
            debounceSize?.width,
            debounceSize?.height,
        )
        s2Instance.current?.render()
    }, [debounceSize])

    /**
     * 初始化S2表格实例。
     *
     * 该函数用于创建并配置一个PivotSheet实例，它是S2表格的核心对象。通过传入当前的表格DOM元素、数据配置和选项，
     * 来初始化并管理S2表格的生命周期。此函数通常在组件挂载后调用，以确保所有必要的DOM元素和配置都已准备就绪。
     *
     * @returns 无返回值
     */
    const initS2Sheet = () => {
        s2Instance.current = new PivotSheet(
            s2Table.current,
            s2DataConfig,
            s2Options,
        )
        s2Instance.current.setThemeCfg({
            name: 'gray',
            theme: {
                cornerCell: {
                    text: {
                        fontWeight: 400,
                    },
                },
                rowCell: {
                    text: {
                        fontWeight: 400,
                    },
                },
                colCell: {
                    text: {
                        fontWeight: 400,
                    },
                    cell: {
                        padding: {
                            right: 12,
                            left: 12,
                        },
                    },
                },
            },
        })
    }

    // 是否配置同环比
    const metrics = useMemo(
        () =>
            s2DataConfig?.fields?.values?.some((item) =>
                [
                    `growth_value_${indicatorInfo?.id}`,
                    `growth_rate_${indicatorInfo?.id}`,
                    `proportion_${indicatorInfo?.id}`,
                ].includes(item),
            ),
        [s2DataConfig, indicatorInfo],
    )

    return (
        <div className={styles.pivotTableContainer}>
            <div className={styles.toolBar}>
                <div>
                    <Tooltip
                        title={
                            metrics
                                ? __('配置同环比时无法显示“总计”值')
                                : total > 1000
                                ? __('超过1000条数据时无法显示“总计”值')
                                : ''
                        }
                        placement="topLeft"
                        arrowPointAtCenter
                    >
                        <Switch
                            size="small"
                            checked={switchTotals}
                            onChange={updateSwitchTotals}
                            disabled={metrics || total > 1000}
                            className={styles.switch}
                        />
                    </Tooltip>
                    <span>{__('“总计”值显示')}</span>
                </div>
                {total > 1000 ? (
                    <div className={styles.tipMessage}>
                        <InfoCircleOutlined className={styles.messageIcon} />
                        <span>{__('最多展示1000条数据')}</span>
                    </div>
                ) : null}
            </div>
            <Watermark
                content={`${userInfo?.VisionName || ''} ${
                    userInfo?.Account || ''
                }`}
                style={{
                    width: '100%',
                    height: 'calc(100% - 34px)',
                }}
            >
                <div className={styles.tableWrapper} ref={s2Table} />
            </Watermark>
            <Tooltip title={__('复制数据')}>
                <div
                    onClick={async () => {
                        try {
                            const conyData = await asyncGetAllPlainData({
                                sheetInstance:
                                    s2Instance.current as SpreadSheet,
                                split: '\t',
                                formatOptions: {
                                    formatHeader: true,
                                    formatData: false,
                                },
                            })

                            await copyToClipboard(
                                conyData.replace(/(?<![0-9])0(?![0-9])/g, ''),
                            )
                            message.success('复制成功')
                        } catch (err) {
                            message.error('复制失败')
                        }
                    }}
                    className={styles.copyBtn}
                >
                    <FontIcon name="icon-fuzhi" />
                </div>
            </Tooltip>
        </div>
    )
}

export default PivotTable
