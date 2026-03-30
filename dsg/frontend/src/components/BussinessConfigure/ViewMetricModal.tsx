import * as react from 'react'
import { useState, useEffect, useRef } from 'react'
import { Modal, Table, Carousel, Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import { formatError, getIndicatorDetails, viewIndicator } from '@/core'
import Empty from '@/ui/Empty'
import empty from '@/assets/dataEmpty.svg'
import { IndicatorThinColored } from '@/icons'

interface CreateModelType {
    onClose: () => void
    visible?: boolean
    indicatorId: string
    metricList: any
}

// 新建或者编辑模型
const ViewMetricModal = ({
    visible = true,
    metricList,
    onClose,
    indicatorId,
}: CreateModelType) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [first, setFirst] = useState<boolean>(true)
    const [viewColumns, setViewColumns] = useState([])
    const [viewData, setViewData] = useState([])
    const [id, setId] = useState<string>('')
    const container = useRef<any>(null)
    useEffect(() => {
        getMetricDetail()
    }, [indicatorId, id])

    const getMetricDetail = async () => {
        try {
            if (indicatorId) {
                if (first) {
                    metricList.forEach((item, index) => {
                        if (item.id === indicatorId) {
                            container.current.goTo(index)
                        }
                    })
                }
                const metricRes = await getIndicatorDetails(
                    first ? indicatorId : id,
                )
                const { desc, name, rule, indicator_model_id } = metricRes
                setFirst(false)
                setViewData([])
                setViewColumns([])
                const params = {
                    name,
                    desc,
                    rule,
                    indicator_model: indicator_model_id,
                }
                setLoading(true)
                const res = await viewIndicator(params)
                const { columns } = res
                const dataSource = res.data
                setViewColumns(
                    columns.map((item, index) => ({
                        key: index,
                        dataIndex: item.name,
                        title: item.name,
                        render: (text) => (
                            <div className={styles.ellipsis}>{text}</div>
                        ),
                    })),
                )
                const newViewData: any = []
                dataSource.forEach((outItem, i) => {
                    const obj: any = {}
                    outItem.forEach((innerItem, j) => {
                        const value = columns[j].name
                        obj.key = i
                        obj[value] = innerItem
                    })
                    newViewData.push(obj)
                })
                setViewData(newViewData)
                setLoading(false)
            }
        } catch (ex) {
            setLoading(false)
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }
    const onChange = (current) => {
        setId(metricList[current].id)
    }
    const prevBtn = () => {
        container.current.prev()
    }
    const nextBtn = () => {
        container.current.next()
    }
    const renderHeader = () => {
        return (
            <div className={styles.hearWrap}>
                <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={prevBtn}
                    disabled={metricList.length === 1}
                />
                <Carousel afterChange={onChange} ref={container}>
                    {metricList.map((item, index) => {
                        return (
                            <div className={styles.titInfo} key={item.id}>
                                <IndicatorThinColored />
                                <span>{item.name}</span>
                            </div>
                        )
                    })}
                </Carousel>
                <Button
                    type="text"
                    icon={<RightOutlined />}
                    onClick={nextBtn}
                    disabled={metricList.length === 1}
                />
            </div>
        )
    }
    return (
        <Modal
            width={640}
            title={renderHeader()}
            open={visible}
            bodyStyle={{ maxHeight: 600, overflow: 'auto' }}
            maskClosable={false}
            onCancel={() => {
                onClose()
            }}
            onOk={() => {
                onClose()
            }}
            destroyOnClose
            getContainer={false}
            className={styles.CreateIndicator}
            footer={null}
        >
            {viewData.length ? (
                <Table
                    columns={viewColumns}
                    dataSource={viewData}
                    loading={loading}
                />
            ) : (
                <Empty iconSrc={empty} desc={__('暂无数据')} />
            )}
        </Modal>
    )
}

export default ViewMetricModal
