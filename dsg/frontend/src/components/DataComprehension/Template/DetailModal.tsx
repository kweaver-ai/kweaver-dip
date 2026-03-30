import { Button, Drawer, Space, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { formatError, getComprehensionTemplateDetail } from '@/core'
import __ from './locale'
import styles from './styles.module.less'
import { Loader } from '@/ui'
import { CheckMap, CheckOptions, ConfigType } from './helper'

function DetailModal({ id, onClose, onEdit }: any) {
    const [detail, setDetail] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)

    const getDetail = async () => {
        try {
            setLoading(true)
            const res = await getComprehensionTemplateDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

    const [obj, metricTime, metricSpatial, metricElse, rule] = useMemo(() => {
        const keys = Object.keys(detail?.template_config || {}).filter(
            (o) => detail?.template_config[o],
        )
        const businessObject = CheckMap[ConfigType.BizObj].filter((o) =>
            keys.includes(o),
        )
        const businessMetricTime = [
            'time_range',
            'time_field_comprehension',
        ].filter((o) => keys.includes(o))
        const businessMetricSpatial = [
            'spatial_range',
            'spatial_field_comprehension',
        ].filter((o) => keys.includes(o))
        const businessMetricElse = CheckMap[ConfigType.BizIndicator].filter(
            (o) =>
                keys.includes(o) &&
                ![
                    'time_range',
                    'time_field_comprehension',
                    'spatial_range',
                    'spatial_field_comprehension',
                ].includes(o),
        )
        const businessRule = CheckMap[ConfigType.BizRule].filter((o) =>
            keys.includes(o),
        )
        return [
            businessObject,
            businessMetricTime,
            businessMetricSpatial,
            businessMetricElse,
            businessRule,
        ]
    }, [detail])

    return (
        <Drawer
            open
            title={
                <span style={{ fontWeight: 550, fontSize: 16 }}>
                    {__('模板详情')}
                </span>
            }
            placement="right"
            onClose={onClose}
            maskClosable
            width={420}
            footer={
                onEdit ? (
                    <div className={styles.drawerFootWrapper}>
                        <Space size={8}>
                            <Button className={styles.btn} onClick={onEdit}>
                                {__('编辑')}
                            </Button>
                        </Space>
                    </div>
                ) : null
            }
        >
            {loading ? (
                <div className={styles.loadingContainer}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.configFormWrapper}>
                    <div className={styles.moduleTitle}>
                        <h4>{__('基本信息')}</h4>
                    </div>
                    <div className={styles.showLine}>
                        <div style={{ width: '150px' }}>
                            {__('数据理解模板名称')}:
                        </div>
                        <div>{detail?.name}</div>
                    </div>
                    <div className={styles.showLine}>
                        <div style={{ width: '150px' }}>{__('描述')}:</div>
                        <div>{detail?.description}</div>
                    </div>
                    <div className={styles.moduleTitle}>
                        <h4>{__('配置信息')}</h4>
                    </div>
                    <div className={styles.showLine} hidden={obj?.length === 0}>
                        <div style={{ width: '100px', paddingTop: '4px' }}>
                            {__('业务对象')}:
                        </div>
                        <div>
                            <Space
                                size={[0, 8]}
                                style={{
                                    display: 'inline-flex',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {obj.map((k) => (
                                    <Tag key={k}>{CheckOptions[k]}</Tag>
                                ))}
                            </Space>
                        </div>
                    </div>
                    <div
                        className={styles.showLine}
                        hidden={
                            [...metricTime, ...metricSpatial, ...metricElse]
                                ?.length === 0
                        }
                    >
                        <div style={{ width: '100px', paddingTop: '4px' }}>
                            {__('业务指标')}:
                        </div>
                        <div>
                            <Space
                                size={[0, 8]}
                                style={{
                                    display: 'inline-flex',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {metricTime?.length > 0 && (
                                    <Tag key="time">
                                        {__('时间维度')}：
                                        {metricTime
                                            .map((k) => CheckOptions[k])
                                            .join('、')}
                                    </Tag>
                                )}
                                {metricSpatial?.length > 0 && (
                                    <Tag key="spatial">
                                        {__('空间维度')}：
                                        {metricSpatial
                                            .map((k) => CheckOptions[k])
                                            .join('、')}
                                    </Tag>
                                )}
                                {metricElse.map((k) => (
                                    <Tag key={k}>{CheckOptions[k]}</Tag>
                                ))}
                            </Space>
                        </div>
                    </div>
                    <div
                        className={styles.showLine}
                        hidden={rule?.length === 0}
                    >
                        <div style={{ width: '100px', paddingTop: '4px' }}>
                            {__('业务规则')}:
                        </div>
                        <div>
                            <Space
                                size={[0, 8]}
                                style={{
                                    display: 'inline-flex',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {rule.map((k) => (
                                    <Tag key={k}>{CheckOptions[k]}</Tag>
                                ))}
                            </Space>
                        </div>
                    </div>
                </div>
            )}
        </Drawer>
    )
}

export default DetailModal
