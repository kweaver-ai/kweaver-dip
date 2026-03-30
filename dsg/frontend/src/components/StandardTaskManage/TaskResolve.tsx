import { FC, useEffect, useRef, useState } from 'react'
import {
    Breadcrumb,
    Button,
    Col,
    Divider,
    Drawer,
    Empty,
    Input,
    Progress,
    Radio,
    Row,
    Select,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { trim } from 'lodash'
import { useGetState } from 'ahooks'
import __ from './locale'
import styles from './styles.module.less'
import {
    BusinessFieldStatus,
    IDetailConfig,
    handleTaskBasicInfo,
    isBlankList,
} from './const'
import {
    CatalogType,
    CatalogTypeName,
    IDataItem,
    formatError,
    getTaskDetails,
    stagingTask,
    submitTask,
} from '@/core'
import { SearchInput, ReturnConfirmModal } from '@/ui'
import DetailDialog from '../ResourcesAudit/DetailDialog'
import SelDataByTypeModal from '../SelDataByTypeModal'
import Details, { DataEleMatchType } from '../DataEleManage/Details'

interface TaskResolveType {
    visible: boolean
    onClose: () => void
    id: string
    afterOprReload: () => void
}
const TaskResolve: FC<TaskResolveType> = ({
    visible,
    onClose,
    id,
    afterOprReload,
}) => {
    const [detailData, setDetailData] = useState<any>()
    const [keywords, setKeywords] = useState<string>('')
    const [businessFieldStatus, setBusinessFieldStatus] =
        useState<BusinessFieldStatus>(BusinessFieldStatus.ALL)

    // 选中的字段id,即TableFieldId，当触发选择数据元模态框时去赋值操作，点击查看时赋值
    const [selModalTableFieldId, setSelModalTableFieldId] = useState<string>('')

    const [selDataEleItems, setSelDataEleItems] = useState<IDataItem[]>([])
    const [tempSaveLoading, setTempSaveLoading] = useState<boolean>(false)
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)

    // 编辑选择数据元模态对话框
    const [modalVisible, setModalVisible] = useState(false)

    // 保存初始字段详情
    const [originDataSource, setOriginDataSource] = useState<Array<any>>([])

    // 业务字段table
    const [dataSource, setDataSource] = useState<Array<any>>(
        detailData?.table_fields || [],
    )
    const [selDataEleCode, setSelDataEleCode, getSelDataEleCode] =
        useGetState<string>('')

    const selDataRef = useRef({
        reloadData: () => {},
    })
    const { Option } = Select
    const RadioGroup = Radio.Group

    useEffect(() => {
        if (id) {
            getTaskDetailData(id)
        }
    }, [id])

    useEffect(() => {
        setDataSource(detailData?.table_fields || [])
    }, [detailData?.table_fields])

    const columns = [
        {
            title: __('字段名称'),
            dataIndex: 'table_field',
            key: 'table_field',
            width: '10%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('字段描述'),
            dataIndex: 'table_field_description',
            key: 'table_field_description',
            width: '20%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('参考文件'),
            dataIndex: 'std_ref_file',
            key: 'std_ref_file',
            width: '15%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('数据元'),
            // css的伪类first-letter会把后面的字符也赋值为红色,故上面加红星的需求不做
            // className: styles.metadataColor,
            dataIndex: 'metadata',
            key: 'metadata',
            // ellipsis: true,
            // text是指metadata字段对应的值，record就指整个一行需要的数据，
            // record即businessFieldList下面每一项{"fieldName": "手机号1","fieldDescription": "字段描述","refStandardDoc","metadata": "数据元名称1",...}
            // index表示Table表格数据的下标，也就是数组的下标从0开始 注意因为有筛选操作，此index不一定就是state中字段对象数组的下标
            render: (text: any, record: any, index: number) =>
                renderMetaDataCell(text, record),
        },
    ]

    const getTaskDetailData = async (dataId) => {
        try {
            const { data } = await getTaskDetails(dataId)
            setDetailData(data)
        } catch (ex) {
            formatError(ex)
        }
    }

    // 渲染数据元单元格库表
    const renderMetaDataCell = (text: any, record: any) => {
        const normalInputStyle = {
            // ,
            width: 250,
            marginRight: 10,
            // cursor: 'pointer', 只在挨着框外显示手型，里面还是i型手型
            color: 'rgba(0, 0, 0, 0.65)', // 没有效果
        }
        return (
            <div>
                <span style={{ marginRight: '4px', color: '#ff4d4f' }}>*</span>
                <Input
                    // status=""
                    style={
                        record.err_msg
                            ? {
                                  ...normalInputStyle,
                                  border: '1px solid #E60012',
                              }
                            : normalInputStyle
                    }
                    placeholder="请选择"
                    allowClear
                    value={record.std_ch_name}
                    onClick={(event) =>
                        // handleMetadataInputChange(event, record)
                        clickSeeDataElementModal(event, record)
                    }
                    onChange={(event) => clickDataEleClear(event, record)}
                />

                {record.err_msg && (
                    // 提交或暂存报错提示
                    <div
                        style={{
                            fontSize: '14px',
                            fontWeight: 400,
                            color: '#E60012',
                        }}
                    >
                        {record.err_msg}
                    </div>
                )}

                {record.std_ch_name ? (
                    // <Link to="/customComponent">
                    <span
                        onClick={
                            () => {
                                setSelDataEleCode(record.std_code)
                            }
                            // clickSeeDataEleDetail({
                            //     stdCode: record.std_code,
                            //     recordId: record.id,
                            //     clickType: DataEleDetailClickType.LOOK_OVER,
                            //     fromHandleTaskDetailPage: true,
                            // })

                            // handleShowDataDetail(
                            //     CatalogTypeName.DATAELE,
                            //     record.std_code,
                            // )
                        }
                        style={{
                            cursor: 'pointer',
                            color: '#126ee3',
                            userSelect: 'none',
                        }}
                    >
                        {__('查看')}
                    </span>
                ) : (
                    // </Link>
                    ''
                )}
                {record.rec_stds &&
                    record.rec_stds.length > 0 &&
                    renderSmartRecommend(record)}
            </div>
        )
    }

    // 点击数据元输入框右边的清除按钮
    const clickDataEleClear = (event: any, record: any) => {
        setDetailData({
            ...detailData,
            table_fields: detailData?.table_fields?.map((currnetData) =>
                currnetData.id === record.id
                    ? {
                          ...currnetData,
                          std_code: '',
                          std_ch_name: '',
                          std_en_name: '',
                      }
                    : currnetData,
            ),
        })
    }
    const renderSmartRecommend = (rowRecord: any) => {
        const { rec_stds: smartRecommendList } = rowRecord

        // Radio选中与否，是用RadioGroup的value去与Radio中的value去判断，相等就显示选中，
        // 用Radio的checked={rowRecord.metadata == item}判断失效，就算为true，Radio不会显示选中
        return (
            <div style={{ marginTop: 5 }}>
                <span style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                    {__('智能推荐')}
                </span>
                <RadioGroup
                    value={rowRecord.std_code}
                    onChange={(event) =>
                        handleRadioGroupChange(event, rowRecord)
                    }
                >
                    <Row>
                        {smartRecommendList.map((item: any, index: any) => {
                            const { std_code, std_ch_name } = item
                            return (
                                <Col key={index} style={{ marginLeft: 14 }}>
                                    <Radio
                                        // checked={rowRecord.metadata == item}
                                        style={{
                                            marginRight: 5,
                                        }}
                                        key={index}
                                        value={std_code}
                                    >
                                        <span
                                            className={styles.dataTipSpan}
                                            onClick={() =>
                                                // clickSeeDataEleDetail({
                                                //     stdCode: std_code,
                                                //     recordId: rowRecord.id,
                                                //     clickType:
                                                //         DataEleDetailClickType.REC_STD,
                                                //     fromHandleTaskDetailPage: true,
                                                // })
                                                handleShowDataDetail(
                                                    CatalogType.DATAELE,
                                                    '',
                                                    std_code,
                                                )
                                            }
                                        >
                                            {showStdChNameView(
                                                std_ch_name || '',
                                            )}
                                        </span>
                                    </Radio>
                                </Col>
                            )
                        })}
                    </Row>
                </RadioGroup>
            </div>
        )
    }

    // 智能推荐单选框变化时触发
    const handleRadioGroupChange = (event: any, record: any) => {
        // event.target.value为Radio的value属性，为std_code
        const stdCode = event.target.value

        let stdChName: any = ''
        let stdEnName: any = ''
        // 选中推荐列表的某个标准元，以std_code去匹配
        record.rec_stds.forEach((element: any) => {
            if (element.std_code === stdCode) {
                stdChName = element.std_ch_name
                stdEnName = element.std_en_name
            }
        })
        setDetailData({
            ...detailData,
            table_fields: detailData?.table_fields?.map((currnetData) =>
                currnetData.id === record.id
                    ? {
                          ...currnetData,
                          std_code: stdCode,
                          std_ch_name: stdChName,
                          std_en_name: stdEnName,
                      }
                    : currnetData,
            ),
        })
    }

    // 展示智能推荐的名称
    const showStdChNameView = (stdChName: string) => {
        return (
            <Tooltip title={stdChName}>
                <span>{trimStdChName(stdChName)}</span>
            </Tooltip>
        )
    }

    const trimStdChName = (stdChName: string) => {
        if (stdChName.length > 40) {
            return `${stdChName.substring(0, 40)}...`
        }
        return stdChName
    }

    // 点击跳转选择数据元模态框
    const clickSeeDataElementModal = (event: any, record: any) => {
        // 赋值点击的这行tableFieldId
        setSelModalTableFieldId(record.id)

        // 如有数据元则赋值，模态框才能高亮check显示此数据元
        // { key: item.key, label: item.label }
        let stdCode = ''
        let stdChName = ''
        let stdEnName = ''
        detailData.table_fields.forEach((element: any) => {
            if (element.id === record.id) {
                stdCode = element.std_code
                stdChName = element.std_ch_name
                stdEnName = element.std_en_name
            }
        })
        if (stdCode) {
            setSelDataEleItems([
                {
                    key: stdCode,
                    code: stdCode,
                    label: stdChName,
                    otherInfo: stdEnName,
                },
            ])
        } else {
            setSelDataEleItems([])
        }

        setModalVisible(true)
    }

    // 关闭模态框，但此函数有时在点击提交或暂存时后会调用，故不处理状态数据
    const onHandleModelClose = () => {
        setModalVisible(false)
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

    // 加载单个配置信息
    const loadRowInfo = (rowConfig: IDetailConfig) => {
        if (rowConfig.name === 'progress') {
            return (
                <div className={styles.rowWrapper} key={rowConfig.name}>
                    <div className={styles.label}>{rowConfig.label}</div>
                    <div className={styles.value}>{renderProgressBar()}</div>
                </div>
            )
        }
        return (
            <div className={styles.rowWrapper} key={rowConfig.name}>
                <div className={styles.label}>{rowConfig.label}</div>
                <div className={styles.value}>
                    {detailData?.[rowConfig.name] || '--'}
                </div>
            </div>
        )
    }

    const renderProgressBar = () => {
        // 实时动态地与字段未完成，已完成的数量关联
        const { totalFieldCount, finishFieldCount, unFinishFieldCount } =
            getEachFieldStateCount()
        // 分子*100后，再除以分母
        const percent: number = (finishFieldCount * 100) / totalFieldCount

        return (
            <div className="progress">
                <Progress
                    style={{
                        width: 100,
                        marginBottom: 0,
                        marginRight: 8,
                    }}
                    percent={percent}
                    showInfo={false}
                />
                <span>{`${finishFieldCount}/${totalFieldCount}`}</span>
            </div>
        )
    }

    // 计算业务字段总数，已完成，未完成的数量
    const getEachFieldStateCount = () => {
        let finishCount = 0
        let unFinishCount = 0
        if (
            detailData?.table_fields &&
            !isBlankList(detailData?.table_fields)
        ) {
            detailData.table_fields.forEach((element: any) => {
                if (element.std_code) {
                    finishCount += 1
                } else {
                    unFinishCount += 1
                }
            })
        }
        return {
            totalFieldCount: finishCount + unFinishCount,
            finishFieldCount: finishCount,
            unFinishFieldCount: unFinishCount,
        }
    }

    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        setKeywords(keyword)
        filterTableField({
            type: businessFieldStatus,
            keyword,
        })
    }

    // 筛选字段
    const filterTableField = (filterCondis: any): void => {
        let fileds: any[] = detailData.table_fields || []

        const fKeyword = filterCondis.keyword
        const status = filterCondis.type
        fileds = fileds.filter((fItem: any) => {
            if (status === BusinessFieldStatus.ALL) {
                return fItem.table_field.includes(fKeyword)
            }
            if (status === BusinessFieldStatus.FINISH) {
                return fItem.std_code && fItem.table_field.includes(fKeyword)
            }
            if (status === BusinessFieldStatus.UNFINISH) {
                return !fItem.std_code && fItem.table_field.includes(fKeyword)
            }
            return false
        })

        setDataSource(fileds)
    }

    const getStateOptionStr = () => {
        const { totalFieldCount, finishFieldCount, unFinishFieldCount } =
            getEachFieldStateCount()
        if (businessFieldStatus === BusinessFieldStatus.ALL) {
            // 全部
            return `${__('全部')} (${totalFieldCount})`
        }
        if (businessFieldStatus === BusinessFieldStatus.FINISH) {
            // 已完成
            return `${__('已完成')} (${finishFieldCount})`
        }
        if (businessFieldStatus === BusinessFieldStatus.UNFINISH) {
            // 未完成
            return `${__('未完成')} (${unFinishFieldCount})`
        }
        return __('未知')
    }

    // 状态修改Option的渲染
    const renderStateOptions = () => {
        const { totalFieldCount, finishFieldCount, unFinishFieldCount } =
            getEachFieldStateCount()
        const list = [
            [`${__('全部')}(${totalFieldCount})`, BusinessFieldStatus.ALL],
            [
                `${__('已完成')}(${finishFieldCount})`,
                BusinessFieldStatus.FINISH,
            ],
            [
                `${__('未完成')}(${unFinishFieldCount})`,
                BusinessFieldStatus.UNFINISH,
            ],
        ]
        return list.map((ele, index) => {
            const showValue = ele[0]
            const optionKey = ele[1]
            return (
                <Option key={optionKey} value={showValue}>
                    <span>{showValue}</span>
                </Option>
            )
        })
    }

    const selectStateChanged = (
        value: any,
        option: any /* , recordKey:any */,
    ) => {
        // option.key 0全部 1已完成 2未完成
        setBusinessFieldStatus(Number(option.key))
        filterTableField({
            type: Number(option.key),
            keyword: keywords,
        })
    }

    const clickCancelBtn = (event: any) => {
        // 比较新字段与初始字段
        const equalDataSource = originDataSource?.filter(
            (orgItem: { std_code: any }, orgIndex: string | number) => {
                return (
                    // 两者绑定数据元的code都 为空或''的值 || 两者数据元的code值存在且值相等
                    (!orgItem.std_code &&
                        !detailData?.table_fields[orgIndex]?.std_code) ||
                    orgItem.std_code ===
                        detailData?.table_fields[orgIndex]?.std_code
                )
            },
        )
        if (
            equalDataSource &&
            equalDataSource?.length === originDataSource?.length
        ) {
            // 值相同则直接返回上一层
            onClose()
        } else {
            // 与初始值不同，则提示
            ReturnConfirmModal({
                onCancel: () => {
                    onClose()
                },
            })
        }
    }

    // 点击保存按钮
    const clickTempSaveBtn = async (event: any) => {
        try {
            setTempSaveLoading(true)
            await stagingTask(detailData)
            afterOprReload()
        } catch (saveError) {
            formatError({ error: saveError })
        } finally {
            setTempSaveLoading(false)
        }
    }

    // 点击提交按钮
    const clickSubmitBtn = async (event: any) => {
        try {
            setSubmitLoading(true)
            await submitTask(detailData)
            afterOprReload()
        } catch (saveError) {
            formatError(saveError)
        } finally {
            setSubmitLoading(false)
        }
    }
    const getFinishFieldCount = () => {
        const { totalFieldCount, finishFieldCount, unFinishFieldCount } =
            getEachFieldStateCount()
        return unFinishFieldCount > 0
    }

    // 状态数据在点击确定按钮后处理，okItems的数据与selDataEleItems一样
    const onHandleModelOk = (okItems: any) => {
        setDetailData({
            ...detailData,
            table_fields: detailData?.table_fields?.map((currnetData) =>
                currnetData.id === selModalTableFieldId
                    ? {
                          ...currnetData,
                          std_code: okItems[0]?.code,
                          std_ch_name: okItems[0]?.label,
                          std_en_name: okItems[0]?.label,
                      }
                    : currnetData,
            ),
        })
        setModalVisible(false)
    }

    /**
     * 展示详情页面（如编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id（编码规则/码表传入值为id，数据元为code）
     */
    const handleShowDataDetail = (
        dataType: CatalogType,
        dataId?: string,
        code?: string,
    ) => {
        if (code) {
            setSelDataEleCode(code)
        }
        // setDataEleDetailVisible(true)
        // 查看数据元详情
        // const showedDetailId = dataId || ''
        // clickSeeDataEleDetail({
        //     stdCode: showedDetailId,
        //     recordId: showedDetailId,
        //     clickType: DataEleDetailClickType.LOOK_OVER,
        //     fromHandleTaskDetailPage: true,
        // })
        // dispatch(metadataSlice.actions.changeStdCode(showedDetailId))
    }

    const getContentKeyword = () => {
        let stdChName = ''
        if (detailData?.table_fields && !isBlankList(detailData.table_fields)) {
            detailData.table_fields.forEach((element: any) => {
                if (element.id === selModalTableFieldId) {
                    stdChName = element.std_ch_name
                }
            })
        }
        return stdChName
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
                        <div className={styles.lastItem}>{__('任务处理')}</div>
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
                        {loadInfos(handleTaskBasicInfo)}
                    </div>
                    <Divider
                        type="horizontal"
                        style={{
                            width: '100%',
                            margin: '16px 0 24px 0',
                        }}
                    />
                    <div className={styles.tableTop}>
                        <div className={styles.basicTitle}>
                            {__('业务字段')}
                        </div>
                        <div className={styles.filterCondis}>
                            <Select
                                onChange={(value, option) =>
                                    selectStateChanged(value, option)
                                }
                                // 此处不能写defaultValue，不然不能及时刷新select的值
                                value={getStateOptionStr()}
                                style={{
                                    width: 120,
                                    height: 32,
                                    marginRight: 8,
                                }}
                            >
                                {renderStateOptions()}
                            </Select>
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
                    <div className="tableContent">
                        <Table
                            bordered={false}
                            rowKey={(record) => record.id}
                            dataSource={dataSource}
                            columns={columns}
                            // 不分页，显示所有的列表数据
                            pagination={false}
                        />
                    </div>
                </div>
                <div className={styles.footer}>
                    <Space>
                        <Button
                            style={{ marginRight: 20 }}
                            onClick={clickCancelBtn}
                            className={styles.btn}
                        >
                            {__('取消')}
                        </Button>
                        <Button
                            disabled={tempSaveLoading}
                            type="default"
                            style={{ marginRight: 20 }}
                            onClick={clickTempSaveBtn}
                            className={styles.btn}
                        >
                            {__('暂存')}
                        </Button>
                        <Tooltip
                            title={
                                getFinishFieldCount() ? __('请完善数据元') : ''
                            }
                        >
                            <Button
                                disabled={
                                    submitLoading || getFinishFieldCount()
                                }
                                style={{ width: '80px', height: '36px' }}
                                type="primary"
                                onClick={clickSubmitBtn}
                                className={styles.btn}
                            >
                                {__('提交')}
                            </Button>
                        </Tooltip>
                    </Space>
                </div>
                <SelDataByTypeModal
                    ref={selDataRef}
                    visible={modalVisible}
                    onClose={onHandleModelClose}
                    onOk={onHandleModelOk}
                    dataType={CatalogType.DATAELE}
                    dataKey="code"
                    // contentKeyword={getContentKeyword()}
                    oprItems={selDataEleItems}
                    setOprItems={setSelDataEleItems}
                    handleShowDataDetail={handleShowDataDetail}
                />
                <Details
                    visible={!!selDataEleCode}
                    dataEleId={selDataEleCode}
                    onClose={() => {
                        setSelDataEleCode('')
                    }}
                    dataEleMatchType={DataEleMatchType.CODEMATCH}
                    handleError={(errorKey: string) => {
                        if (errorKey === 'Standardization.Empty') {
                            // 清空为空数据元

                            setDetailData({
                                ...detailData,
                                table_fields: detailData?.table_fields?.map(
                                    (currnetData) =>
                                        currnetData.std_code === selDataEleCode
                                            ? {
                                                  std_code: '',
                                                  std_ch_name: '',
                                                  std_en_name: '',
                                              }
                                            : currnetData,
                                ),
                            })
                            // 查看详情失败，刷新SelData列表
                            selDataRef?.current?.reloadData()
                        }

                        setSelDataEleCode('')
                    }}
                />
            </div>
        </Drawer>
    )
}

export default TaskResolve
