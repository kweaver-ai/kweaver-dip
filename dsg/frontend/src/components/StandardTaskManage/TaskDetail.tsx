import { LeftOutlined } from '@ant-design/icons'
import { Breadcrumb, Col, Divider, Drawer, Empty, Row, Table } from 'antd'
import { FC, useEffect, useState } from 'react'
import { trim } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import { IDetailConfig, taskBasicInfo } from './const'
import { formatError, getTaskDetails } from '@/core'
import { SearchInput } from '@/ui'
import Details, { DataEleMatchType } from '../DataEleManage/Details'

interface TaskDetailType {
    visible: boolean
    onClose: () => void
    id: string
}
const TaskDetail: FC<TaskDetailType> = ({ visible, onClose, id }) => {
    const [detailData, setDetailData] = useState<any>()
    const [keywords, setKeywords] = useState<string>('')
    // 保存分页组件变动的分页参数，用react本身的状态管理起来
    const [tableTotalAndNumAndSize, setTableTotalAndNumAndSize] = useState<
        [totalCount: number, pageNum: number, pageSize: number]
    >([0, 1, 20])

    // table显示的数据列表，即通过keywords和分页参数过滤后的数据,不请求接口只是在detailData上面的列表数据上做过滤
    const [tableList, setTableList] = useState<any[]>([])

    const [selDataEleCode, setSelDataEleCode] = useState<string>('')

    useEffect(() => {
        if (id) {
            getTaskDetailData(id)
        }
    }, [id])

    useEffect(() => {
        getTableListData(1, 20, '')
    }, [detailData])

    const getTaskDetailData = async (dataId) => {
        try {
            const { data } = await getTaskDetails(dataId)
            setDetailData(data)
        } catch (ex) {
            formatError(ex)
        }
    }

    // 加载所有配置信息
    const loadInfos = (configs: IDetailConfig[]) => {
        return (
            <Row>
                {configs.map((config: IDetailConfig) => {
                    return (
                        <Col span={config.col} key={config.name}>
                            {loadRowInfo(config)}
                        </Col>
                    )
                })}
            </Row>
        )
    }

    // 渲染数据元单元格库表
    const renderMetaDataCell = (text: any, record: any) => {
        // 数据元被删除，下划线
        if (record.std_del) {
            return (
                <div>
                    <div className={styles.deletedData}>
                        {record.std_ch_name}
                    </div>
                    <div className={styles.deletedDataCommend}>
                        ({__('已被删除')})
                    </div>
                </div>
            )
        }
        return (
            <div>
                <span>{record.std_ch_name ? record.std_ch_name : '--'}</span>
                {record.std_ch_name && record.std_ch_name !== '--' ? (
                    // <Link to="/customComponent">
                    <span
                        onClick={(event) => {
                            setSelDataEleCode(record.std_code)
                        }}
                        style={{
                            cursor: 'pointer',
                            marginLeft: 10,
                            color: '#126ee3',
                            userSelect: 'none',
                        }}
                    >
                        {__('查看')}
                    </span>
                ) : (
                    ''
                )}
            </div>
        )
    }

    const columns = [
        {
            title: __('字段名称'),
            dataIndex: 'table_field',
            key: 'table_field',
            width: 150,
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('字段描述'),
            dataIndex: 'table_field_description',
            key: 'table_field_description',
            width: 200,
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('参考文件'),
            dataIndex: 'std_ref_file',
            key: 'std_ref_file',
            width: 150,
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('数据元'),
            dataIndex: 'metadata',
            key: 'metadata',
            // 因为后面还有一个查看按钮，如果为true只展示一行，按钮就会看不到，故还是屏蔽可以换行
            // ellipsis: true,
            // text是指metadata字段对应的值，record就指整个一行需要的数据，
            // record即businessFieldList下面每一项{"fieldName": "手机号1","fieldDescription": "字段描述","refStandardDoc","metadata": "数据元名称1",...}
            // index表示Table表格数据的下标，也就是数组的下标从0开始
            render: (text: any, record: any, index: number) =>
                renderMetaDataCell(text, record),
        },
    ]

    // input内容改变，则pageNum从1从开始
    const handleSearchPressEnter = (e: any) => {
        const searchKeywords = typeof e === 'string' ? e : trim(e.target.value)
        setKeywords(searchKeywords)
        const pageSize = 20
        getTableListData(1, pageSize, searchKeywords)
    }

    // 详情业务字段信息列表
    const getTableListData = (
        pageNum: number,
        pageSize: number,
        inKeywords: string,
    ) => {
        // const filterKeywordsList = getFilterKeywordsList(inKeywords)
        let filterKeywordsList: any[] = detailData?.table_fields || []

        filterKeywordsList = filterKeywordsList.filter((fItem: any) => {
            return fItem.table_field.includes(inKeywords)
        })
        // const [totalCount, pageNum, pageSize] = tableTotalAndNumAndSize
        const startIndex = (pageNum - 1) * pageSize
        const endIndex = pageNum * pageSize
        // slice，下标是左闭右开，当左边和右边相等时返回[]
        const retList = filterKeywordsList.slice(startIndex, endIndex)
        // 设置table要显示的列表数据
        setTableList(retList)
        // 赋值分页数据
        setTableTotalAndNumAndSize([
            filterKeywordsList.length,
            pageNum,
            pageSize,
        ])
        // 设置关键字
        setKeywords(inKeywords)
    }

    // 加载单个配置信息
    const loadRowInfo = (rowConfig: IDetailConfig) => {
        return (
            <div className={styles.rowWrapper} key={rowConfig.name}>
                <div className={styles.label}>{rowConfig.label}</div>
                <div className={styles.value}>
                    {detailData?.[rowConfig.name] || '--'}
                </div>
            </div>
        )
    }

    // 页面改变，筛选，排序时触发
    const handleTableChange = (page /* , filters, sorter */) => {
        getTableListData(page.current || 1, page.pageSize, keywords)
    }
    return (
        <Drawer
            open={visible}
            onClose={() => {
                onClose()
            }}
            contentWrapperStyle={{
                width: '100%',
                height: 'calc(100vh - 52px )',
                boxShadow: 'none',
                transform: 'none',
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '4px 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            style={{ position: 'absolute' }}
            destroyOnClose
            maskClosable={false}
            mask={false}
            getContainer={false}
        >
            <div className={styles.bodyShadow} />
            <div className={styles.taskDetailWrapper}>
                <Breadcrumb style={{ marginLeft: 10, padding: '10px 0' }}>
                    <Breadcrumb.Item onClick={onClose}>
                        <a>
                            <LeftOutlined />
                            <span>{__('任务列表')}</span>
                        </a>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <div className={styles.lastItem}>{__('任务详情')}</div>
                    </Breadcrumb.Item>
                </Breadcrumb>
                <Divider
                    type="horizontal"
                    style={{
                        width: '100%',
                        margin: 0,
                    }}
                />
                <div className={styles.taskContent}>
                    <div>
                        <div className={styles.basicTitle}>
                            {__('基本信息')}
                        </div>
                        {loadInfos(taskBasicInfo)}
                    </div>
                    <Divider
                        type="horizontal"
                        style={{
                            width: '100%',
                            margin: '16px 0 24px 0',
                        }}
                    />

                    {/* 标题+搜索 */}
                    <div className={styles.tableTop}>
                        <div className={styles.basicTitle}>
                            {__('业务字段')}
                        </div>
                        <div className={styles.filterCondis}>
                            <SearchInput
                                style={{ height: 32, width: 272 }}
                                value={keywords}
                                placeholder={__('搜索字段名称')}
                                onKeyChange={(kw: string) => {
                                    setKeywords(kw)
                                    handleSearchPressEnter(kw)
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.tableContent}>
                        <Table
                            bordered={false}
                            rowKey={(record) => record.id}
                            dataSource={tableList}
                            columns={columns}
                            onChange={handleTableChange}
                            locale={{
                                emptyText: <Empty />,
                            }}
                            pagination={{
                                current: tableTotalAndNumAndSize[1],
                                pageSize: tableTotalAndNumAndSize[2],
                                pageSizeOptions: [10, 20, 50, 100],
                                showQuickJumper: true,
                                responsive: true,
                                showLessItems: true,
                                showSizeChanger: true,
                                total: tableTotalAndNumAndSize[0],
                                hideOnSinglePage:
                                    tableTotalAndNumAndSize[0] <= 10,
                                showTotal: (count) => {
                                    return `共 ${count} 条记录 第 ${
                                        tableTotalAndNumAndSize[1]
                                    }/${Math.ceil(
                                        count / tableTotalAndNumAndSize[2],
                                    )} 页`
                                },
                            }}
                        />
                    </div>
                </div>

                <Details
                    visible={!!selDataEleCode}
                    dataEleMatchType={DataEleMatchType.CODEMATCH}
                    dataEleId={selDataEleCode}
                    onClose={() => {
                        setSelDataEleCode('')
                    }}
                />
            </div>
        </Drawer>
    )
}

export default TaskDetail
