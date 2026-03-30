import {
    CaretDownOutlined,
    CaretRightOutlined,
    LeftOutlined,
} from '@ant-design/icons'
import { Col, Divider, Drawer, Row, Table, Tooltip } from 'antd'
import classnames from 'classnames'
import { useNavigate } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import moment from 'moment'
import { downloadFile, getActualUrl, streamToFile, useQuery } from '@/utils'
import styles from './styles.module.less'
import {
    requirementDetailsInfo,
    RequirementFieldType,
    ResourceSource,
    resourceSourceInfo,
    resourceTypeInfo,
} from './const'
import {
    downloadDemandFile,
    formatError,
    getDemandDetails,
    getDemandItems,
    IDemandItem,
    IDemandItemConfig,
} from '@/core'
import ConfigDetails from './ConfigDetails'
import FileIcon from '../FileIcon'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import GlobalMenu from '../GlobalMenu'
import __ from './locale'

const RuquirementDetails = () => {
    const query = useQuery()
    const navigate = useNavigate()
    const [details, setDetails] = useState<any>()
    const [items, setItems] = useState<IDemandItemConfig[]>([])
    const [configDetailsOpen, setConfigDetailsOpen] = useState(false)
    const [itemInfo, setItemInfo] = useState<IDemandItemConfig>()
    const [hiddenInfo, setHiddenInfo] = useState({
        0: false,
        1: false,
        2: false,
        3: false,
    })
    const id = query.get('demandId')
    const project = localStorage.getItem('project')

    const handleClick = () => {
        navigate(`/dataService/requirement/list`)
    }

    const getDetails = async () => {
        try {
            if (id) {
                const res = await getDemandDetails(id)
                setDetails(res)
            }
        } catch (err) {
            formatError(err)
        }
    }

    const getItems = async () => {
        try {
            if (id) {
                const res = await getDemandItems(id)
                setItems(res.entries)
            }
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        getDetails()
        getItems()
    }, [])

    const resourceColumns = [
        {
            title: __('资源名称'),
            dataIndex: 'res_name',
            key: 'res_name',
            render: (_, record) => (
                <div
                    className={styles.resNameWrapper}
                    onClick={() => {
                        if (record.res_status === 2) return
                        setItemInfo(record)
                        setConfigDetailsOpen(true)
                    }}
                    title={record.res_name}
                >
                    <div
                        className={classnames({
                            [styles.resourceName]: true,
                            [styles.loseEffectResourceName]:
                                record.res_status === 2,
                            [styles.loseEffect]: record.res_status === 2,
                        })}
                    >
                        {record.res_name}
                    </div>
                    {record.res_status === 2 && (
                        <div className={styles.loseEffectiveFlag}>
                            {__('已失效')}
                        </div>
                    )}
                </div>
            ),
            ellipsis: true,
        },
        {
            title: __('资源类型'),
            dataIndex: 'res_type',
            key: 'res_type',
            render: (val, record) => (
                <div
                    className={classnames({
                        [styles.loseEffect]: record.res_status === 2,
                    })}
                >
                    {resourceTypeInfo[val]}
                </div>
            ),
        },
        {
            title: __('资源描述'),
            dataIndex: 'res_desc',
            key: 'res_desc',
            ellipsis: true,
            render: (val, record) => (
                <div
                    className={classnames({
                        [styles.loseEffect]: record.res_status === 2,
                        [styles.resDesc]: true,
                    })}
                >
                    {val || '--'}
                </div>
            ),
        },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
            render: (_: string, record) =>
                record.res_status !== 2 ? (
                    <a
                        onClick={() => {
                            setItemInfo(record)
                            setConfigDetailsOpen(true)
                        }}
                    >
                        {__('查看配置')}
                    </a>
                ) : null,
        },
    ]

    const download = async (
        files: {
            file_uuid: string
            file_name: string
            type: number
            id: string
        }[],
    ) => {
        const { id: fileId, file_name } =
            files.find((item) => item.type === 1) || {}
        try {
            if (!fileId) return
            const res = await downloadDemandFile(fileId)
            // 将文件流转换成文件
            streamToFile(res, file_name)
        } catch (error) {
            formatError(error)
        }
    }

    const getValue = (field) => {
        const val: any = details?.[field.value]

        if (val) {
            if (field.type === RequirementFieldType.TIME) {
                return moment(details?.[field.value]).format('YYYY-MM-DD')
            }
            if (field.type === RequirementFieldType.TAG && Array.isArray(val)) {
                return val.length > 0 ? (
                    <div className={styles.tagWrapper}>
                        {val.map((v) => {
                            return (
                                <div className={styles.tag} title={v} key={v}>
                                    {v.length > 17 ? `${v.slice(0, 17)}...` : v}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    '--'
                )
            }
            if (
                field.type === RequirementFieldType.FILE &&
                Array.isArray(val)
            ) {
                // 获取文件信息
                const file = val.find((item) => item.type === field.typeValue)
                if (file && file.file_name) {
                    const suffix = file.file_name.substring(
                        file.file_name.lastIndexOf('.') + 1,
                    )
                    return (
                        <div className={styles.fileWrapper}>
                            <FileIcon suffix={suffix} />
                            <div
                                className={styles.fileName}
                                onClick={() => download(val)}
                                title={file.file_name}
                            >
                                {file.file_name}
                            </div>
                        </div>
                    )
                }
                return '--'
            }
            return details?.[field.value]
        }
        return '--'
    }
    return (
        <div className={styles.requirementDetailsWrapper}>
            <div className={styles.header}>
                <GlobalMenu />
                <div onClick={handleClick} className={styles.returnInfo}>
                    <LeftOutlined className={styles.returnArrow} />
                    <span className={styles.returnText}>{__('返回')}</span>
                </div>
                <Divider className={styles.divider} type="vertical" />
                <div className={styles.detailsTitle}>{__('详情')}</div>
            </div>
            <div className={styles.bodyWrapper}>
                <div className={styles.body}>
                    <div className={styles.bodyContent}>
                        {requirementDetailsInfo.map((item, index) => {
                            if (project === 'tc' && item.key === 3) return null
                            return (
                                <div key={item.key}>
                                    {index === 1 && (
                                        <>
                                            <div
                                                className={styles.titleWrapper}
                                            >
                                                {hiddenInfo[3] ? (
                                                    <CaretRightOutlined
                                                        className={
                                                            styles.arrowIcon
                                                        }
                                                        onClick={() =>
                                                            setHiddenInfo({
                                                                ...hiddenInfo,
                                                                3: !hiddenInfo[3],
                                                            })
                                                        }
                                                    />
                                                ) : (
                                                    <CaretDownOutlined
                                                        className={
                                                            styles.arrowIcon
                                                        }
                                                        onClick={() =>
                                                            setHiddenInfo({
                                                                ...hiddenInfo,
                                                                3: !hiddenInfo[3],
                                                            })
                                                        }
                                                    />
                                                )}
                                                <div className={styles.title}>
                                                    {__('资源配置')}
                                                </div>
                                            </div>
                                            <div
                                                hidden={hiddenInfo[3]}
                                                className={styles.detailContent}
                                            >
                                                <div
                                                    className={
                                                        styles.resourceTitle
                                                    }
                                                >
                                                    {__('数据资源目录')}
                                                </div>
                                                <div
                                                    className={
                                                        styles.resourceList
                                                    }
                                                >
                                                    <Table
                                                        columns={
                                                            resourceColumns
                                                        }
                                                        dataSource={items.filter(
                                                            (info) =>
                                                                info.res_source ===
                                                                ResourceSource.SERVICESHOP,
                                                        )}
                                                        pagination={false}
                                                        rowKey="id"
                                                        locale={{
                                                            emptyText: (
                                                                <Empty
                                                                    iconSrc={
                                                                        dataEmpty
                                                                    }
                                                                    desc={__(
                                                                        '暂无数据',
                                                                    )}
                                                                />
                                                            ),
                                                        }}
                                                    />
                                                </div>
                                                <div
                                                    className={
                                                        styles.resourceTitle
                                                    }
                                                >
                                                    {__('空白资源')}
                                                </div>
                                                <div
                                                    className={
                                                        styles.resourceList
                                                    }
                                                >
                                                    <Table
                                                        columns={
                                                            resourceColumns
                                                        }
                                                        dataSource={items.filter(
                                                            (info) =>
                                                                info.res_source ===
                                                                ResourceSource.BLANK,
                                                        )}
                                                        pagination={false}
                                                        rowKey="id"
                                                        locale={{
                                                            emptyText: (
                                                                <Empty
                                                                    iconSrc={
                                                                        dataEmpty
                                                                    }
                                                                    desc={__(
                                                                        '暂无数据',
                                                                    )}
                                                                />
                                                            ),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div
                                        key={item.key}
                                        className={classnames({
                                            [styles.contentWrapper]: index > 0,
                                        })}
                                    >
                                        <div className={styles.titleWrapper}>
                                            {hiddenInfo[index] ? (
                                                <CaretRightOutlined
                                                    className={styles.arrowIcon}
                                                    onClick={() =>
                                                        setHiddenInfo({
                                                            ...hiddenInfo,
                                                            [index]:
                                                                !hiddenInfo[
                                                                    index
                                                                ],
                                                        })
                                                    }
                                                />
                                            ) : (
                                                <CaretDownOutlined
                                                    className={styles.arrowIcon}
                                                    onClick={() =>
                                                        setHiddenInfo({
                                                            ...hiddenInfo,
                                                            [index]:
                                                                !hiddenInfo[
                                                                    index
                                                                ],
                                                        })
                                                    }
                                                />
                                            )}
                                            <div className={styles.title}>
                                                {item.title}
                                            </div>
                                        </div>
                                        <div
                                            hidden={hiddenInfo[index]}
                                            className={styles.detailContent}
                                        >
                                            {index === 0 && (
                                                <div
                                                    className={
                                                        styles.requirementNum
                                                    }
                                                >
                                                    NO {details?.demand_code}
                                                </div>
                                            )}
                                            <Row gutter={20}>
                                                {item.fields.map((field) => {
                                                    if (
                                                        project === 'tc' &&
                                                        [
                                                            'developer_name',
                                                            'developer_code',
                                                            'reference_files',
                                                        ].includes(field.value)
                                                    )
                                                        return null
                                                    return (
                                                        <Col
                                                            span={
                                                                field.col || 12
                                                            }
                                                            key={field.value}
                                                        >
                                                            <div
                                                                className={
                                                                    styles.fieldItem
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.fieldLabel
                                                                    }
                                                                >
                                                                    {
                                                                        field.label
                                                                    }
                                                                </div>
                                                                <div
                                                                    className={classnames(
                                                                        {
                                                                            [styles.fieldValue]:
                                                                                true,
                                                                            [styles.noEllipsis]:
                                                                                [
                                                                                    'business_purpose',
                                                                                    'app_value',
                                                                                    'app_effect',
                                                                                    'demand_title',
                                                                                    'description',
                                                                                    'rela_business_system',
                                                                                    'dept_name',
                                                                                ].includes(
                                                                                    field.value,
                                                                                ),
                                                                        },
                                                                    )}
                                                                    title={getValue(
                                                                        field,
                                                                    )}
                                                                >
                                                                    {getValue(
                                                                        field,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Col>
                                                    )
                                                })}
                                            </Row>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        <Drawer
                            title={__('查看配置')}
                            open={configDetailsOpen}
                            onClose={() => setConfigDetailsOpen(false)}
                            destroyOnClose
                            width={640}
                            getContainer={false}
                        >
                            <ConfigDetails itemInfo={itemInfo} />
                        </Drawer>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default RuquirementDetails
