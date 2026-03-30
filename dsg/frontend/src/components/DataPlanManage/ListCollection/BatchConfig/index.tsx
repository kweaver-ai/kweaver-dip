import { Form, Modal, Select, Spin } from 'antd'
import { memo, useEffect, useState } from 'react'
import __ from './locale'
import styles from './styles.module.less'
import ViewList from './ViewList'
import { CollectionMethod, SyncFrequency } from './const'
import { formatError, getDataSourceList } from '@/core'
import { databaseTypesEleData } from '@/core/dataSource'

const BatchConfig = ({ open, data, onClose, onSure }: any) => {
    const [form] = Form.useForm()
    const [dataOriginOptions, setDataOriginOptions] = useState<Array<any>>([])
    const [dataSourceLoading, setDataSourceLoading] = useState(false)
    useEffect(() => {
        getDataOriginOptions()
    }, [])

    /**
     * 获取数据源下拉
     * @param systemId
     */
    const getDataOriginOptions = async () => {
        try {
            setDataSourceLoading(true)
            const { entries } = await getDataSourceList({
                limit: 999,
            })

            if (!entries || !Array.isArray(entries)) {
                setDataOriginOptions([])
                return
            }

            const options = entries
                .filter((item) => item.type !== 'excel')
                .map((dataSourceInfo) => {
                    const { Outlined } =
                        databaseTypesEleData?.dataBaseIcons?.[
                            dataSourceInfo.type
                        ] || {}
                    const ICons = Outlined ? (
                        <Outlined style={{ fontSize: 22 }} />
                    ) : null

                    return {
                        label: (
                            <div className={styles.selectMetaOptions}>
                                {ICons}
                                <span
                                    className={styles.name}
                                    title={dataSourceInfo.name}
                                >
                                    {dataSourceInfo.name}
                                </span>
                            </div>
                        ),
                        value: dataSourceInfo.id,
                        dataType: dataSourceInfo.type,
                        details: dataSourceInfo,
                    }
                })

            setDataOriginOptions(options)
        } catch (ex) {
            formatError(ex)
            setDataOriginOptions([])
        } finally {
            setDataSourceLoading(false)
        }
    }

    const handleFinish = (values: any) => {
        const filteredValues = Object.fromEntries(
            Object.entries(values).filter(
                ([_, v]) => v !== undefined && v !== null && v !== '',
            ),
        )

        if (filteredValues.target_datasource_id) {
            filteredValues.target_datasource_name =
                dataOriginOptions?.find(
                    (o) => o.value === filteredValues.target_datasource_id,
                )?.details?.name || ''
        }

        onSure?.(
            Object.keys(filteredValues).length === 0
                ? undefined
                : filteredValues,
        )
    }

    return (
        <Modal
            title={__('批量配置')}
            width={760}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            onOk={() => {
                form?.submit()
            }}
            destroyOnClose
            getContainer={false}
            bodyStyle={{ height: 484, padding: '0' }}
        >
            <div className={styles['batch-config']}>
                <div>
                    <ViewList data={data} />
                </div>
                <div className={styles['config-info']}>
                    <Form
                        form={form}
                        autoComplete="off"
                        layout="vertical"
                        onFinish={handleFinish}
                        style={{ width: '100%' }}
                    >
                        <Form.Item
                            name="collection_method"
                            label={__('归集方式')}
                        >
                            <Select
                                placeholder={__('请选择${type}', {
                                    type: __('归集方式'),
                                })}
                                options={CollectionMethod}
                                allowClear
                            />
                        </Form.Item>
                        <Form.Item name="sync_frequency" label={__('同步频率')}>
                            <Select
                                placeholder={__('请选择${type}', {
                                    type: __('同步频率'),
                                })}
                                options={SyncFrequency}
                                allowClear
                            />
                        </Form.Item>
                        <Form.Item
                            name="target_datasource_id"
                            label={__('目标数据源')}
                        >
                            <Select
                                placeholder={__('请选择${type}', {
                                    type: __('目标数据源'),
                                })}
                                options={dataOriginOptions}
                                allowClear
                                notFoundContent={
                                    dataSourceLoading ? (
                                        <div
                                            style={{
                                                padding: '8px 0',
                                                textAlign: 'center',
                                            }}
                                        >
                                            <Spin size="small" />
                                        </div>
                                    ) : dataOriginOptions?.length ? (
                                        __('未找到匹配的结果')
                                    ) : (
                                        __('暂无数据')
                                    )
                                }
                                showSearch
                                filterOption={(input, opt: any) => {
                                    const name = opt?.details?.name || ''
                                    return name
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }}
                            />
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </Modal>
    )
}

export default memo(BatchConfig)
