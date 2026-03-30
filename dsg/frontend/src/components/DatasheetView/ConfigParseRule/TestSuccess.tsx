import { Space, Table, Tooltip } from 'antd'
import classNames from 'classnames'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import __ from '../locale'
import styles from './styles.module.less'
import Icons from '@/components/DemandManagement/Icons'
import { IConvertRuleVerifyRes } from '@/core'
import { getDefaultDataType } from '../const'
import { Empty } from '@/ui'

interface TestSuccessProps {
    testData: IConvertRuleVerifyRes
}

const TestSuccess = ({ testData }: TestSuccessProps) => {
    const { convert_data, original_data } = testData

    const getColumns = (isOrigin: boolean = true) => [
        {
            title: (
                <div className={styles['table-header']}>
                    <div className={styles['field-info']}>
                        <div className={styles['field-name']}>
                            <Icons
                                type={
                                    isOrigin
                                        ? original_data.data_type
                                        : convert_data.data_type
                                }
                                fontSize={16}
                            />
                            <span className={styles['name-cn']}>
                                {isOrigin
                                    ? original_data.business_name
                                    : convert_data.business_name}
                            </span>
                        </div>
                        <div className={styles['name-en']}>
                            {isOrigin
                                ? original_data.technical_name
                                : convert_data.technical_name}
                        </div>
                    </div>
                    <div
                        className={classNames(
                            styles['common-flag'],
                            isOrigin
                                ? styles['origin-flag']
                                : styles['parse-flag'],
                        )}
                    >
                        {isOrigin ? __('原数据') : __('数据转换后')}
                    </div>
                </div>
            ),
            dataIndex: 'data',
            key: 'data',
            render: (value) => (
                <>
                    {value ||
                    value === 0 ||
                    (isOrigin && original_data.data_type === 'boolean') ||
                    (!isOrigin && convert_data.data_type === 'boolean')
                        ? `${value}`
                        : 'null'}
                    {value === null && !isOrigin && (
                        <Tooltip title={__('无法解析')}>
                            <ExclamationCircleOutlined
                                className={styles['tip-icon']}
                            />
                        </Tooltip>
                    )}
                </>
            ),
        },
    ]

    return (
        <div className={styles['test-success-container']}>
            {['date', 'timestamp', 'decimal', 'time'].includes(
                convert_data.data_type,
            ) && (
                <div className={styles['test-success-title']}>
                    {__('测试结果')}
                    <span className={styles['test-success-title-desc']}>
                        {__('（最多展示10条数据作为参考）')}
                    </span>
                </div>
            )}

            <div
                className={classNames(
                    styles['table-container'],
                    !['date', 'timestamp', 'decimal', 'time'].includes(
                        convert_data.data_type,
                    ) && styles['parse-table-container'],
                )}
            >
                <Space size={8}>
                    <Table
                        columns={getColumns(true)}
                        dataSource={(original_data.data || []).map(
                            (item, index) => {
                                return { data: item, id: index }
                            },
                        )}
                        pagination={false}
                        bordered
                        className={classNames(
                            styles['common-table'],
                            !['date', 'timestamp', 'decimal', 'time'].includes(
                                convert_data.data_type,
                            ) && styles['parse-table'],
                        )}
                        locale={{
                            emptyText: <Empty desc={__('暂无数据')} />,
                        }}
                    />
                    <Table
                        columns={getColumns(false)}
                        dataSource={(convert_data.data || []).map(
                            (item, index) => {
                                return { data: item, id: index }
                            },
                        )}
                        pagination={false}
                        bordered
                        className={classNames(
                            styles['common-table'],
                            !['date', 'timestamp', 'decimal', 'time'].includes(
                                convert_data.data_type,
                            ) && styles['parse-table'],
                        )}
                        locale={{
                            emptyText: <Empty desc={__('暂无数据')} />,
                        }}
                    />
                </Space>
            </div>
        </div>
    )
}

export default TestSuccess
