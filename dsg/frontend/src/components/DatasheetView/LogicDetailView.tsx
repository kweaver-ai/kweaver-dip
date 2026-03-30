import { FC, useEffect, useRef, useState } from 'react'
import { CloseOutlined, RightOutlined } from '@ant-design/icons'
import { Anchor, Drawer, Space, Spin, Tooltip } from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import styles from './styles.module.less'
import __ from './locale'
import {
    formatError,
    getDataViewBaseInfo,
    getDatasheetViewDetails,
} from '@/core'
import {
    IEditFormData,
    filterEmptyProperties,
    moreInfoList,
    onLineStatusList,
} from './const'
import { BusinessDomainType } from '../BusinessDomain/const'
import ArchitectureIcons from '@/components/BusinessArchitecture/Icons'
import { Architecture } from '@/components/BusinessArchitecture/const'
import { GlossaryIcon } from '../BusinessDomain/GlossaryIcons'
import OwnerDisplay from '../OwnerDisplay'

interface ILogicDetailView {
    id: string
    onClose: () => void
    isConsanguinity?: boolean
    mask?: boolean
    style?
}

const LogicDetailView: FC<ILogicDetailView> = ({
    id,
    onClose,
    isConsanguinity = false,
    mask = false,
    style = { position: 'absolute', top: '53px' },
}) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [detailData, setDetailData] = useState<any>()
    const container = useRef<any>(null)
    const anchorRef = useRef<any>(null)
    const bodyContainer: any = useRef(null)
    const { Link } = Anchor

    useEffect(() => {
        getLogicDetail()
    }, [id])

    const getLogicDetail = async () => {
        try {
            setLoading(true)
            const res = await getDatasheetViewDetails(id)
            const baseRes = await getDataViewBaseInfo(id)
            const baseResValue: IEditFormData = filterEmptyProperties(baseRes)
            setDetailData({
                ...baseResValue,
                id,
                viewStatus: res?.status,
                datasource_id: res?.datasource_id,
                last_publish_time: res?.last_publish_time,
                fields: res?.fields,
                business_update_time: res?.business_update_time,
            })
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }
    // 获取预览内容
    const getViewContent = (viewKey) => {
        switch (viewKey) {
            case 'online_status':
                return (
                    onLineStatusList.find(
                        (o) => o.value === detailData.online_status,
                    )?.label || '--'
                )
            case 'updated_at':
                return moment(detailData.updated_at).format(
                    'YYYY-MM-DD HH:mm:ss',
                )
            case 'created_at':
                return moment(detailData.created_at).format(
                    'YYYY-MM-DD HH:mm:ss',
                )

            case 'description':
                return (
                    detailData[viewKey] || (
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('暂无描述')}
                        </span>
                    )
                )
            case 'subject':
                return (
                    <div>
                        {detailData[viewKey] ? (
                            <>
                                <GlossaryIcon
                                    width="20px"
                                    type={
                                        detailData.subject_path_id.split('/')
                                            .length === 2
                                            ? BusinessDomainType.subject_domain
                                            : BusinessDomainType.business_activity
                                    }
                                    fontSize="20px"
                                    styles={{ marginRight: '4px' }}
                                />
                                <span className={styles.textCont}>
                                    {detailData[viewKey]}
                                </span>
                            </>
                        ) : (
                            '--'
                        )}
                    </div>
                )
            case 'department':
                return (
                    <div className={classnames(styles.ownerItem)}>
                        {detailData[viewKey] ? (
                            <Space>
                                <ArchitectureIcons
                                    type={Architecture.DEPARTMENT}
                                />
                                <span>{detailData[viewKey]}</span>
                            </Space>
                        ) : (
                            '--'
                        )}
                    </div>
                )
            case 'owners':
                return <OwnerDisplay value={detailData[viewKey]} />

            default:
                return detailData[viewKey] || '--'
        }
    }

    const getViewTableCompont = (viewData: Array<any> = []) => {
        return (
            <table className={styles.viewTable}>
                {viewData.map((item) => (
                    <tr>
                        <td
                            className={styles.tableTd}
                            style={{ background: '#f4f7fc' }}
                        >
                            <div className={styles.leftContent}>
                                {item?.label}
                            </div>
                        </td>
                        <td className={styles.tableTd}>
                            <div className={styles.rightContent}>
                                {getViewContent(item.key)}
                            </div>
                        </td>
                    </tr>
                ))}
            </table>
        )
    }

    const getGroupElementData = ({
        title = '',
        viewData = [],
        listId,
    }: {
        title: string
        viewData: Array<any>

        listId: string
    }) => {
        return (
            // <Panel
            //     header={}
            //     key={currentKey}
            //     collapsible="icon"
            // >

            // </Panel>
            <div className={styles.viewTableContainer} id={listId}>
                <div className={styles.continerTitle}>{title}</div>
                {getViewTableCompont(viewData || [])}
            </div>
        )
    }

    return (
        <div
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
        >
            <Drawer
                width={640}
                title={
                    isConsanguinity ? (
                        <div
                            className={styles.viewLogicTitle}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                        >
                            <div className={styles.editTitle}>
                                <span
                                    onClick={() => {
                                        onClose()
                                    }}
                                    className={styles.icon}
                                >
                                    <RightOutlined />
                                </span>
                                <span>{__('收起元数据库表详情')}</span>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={styles.viewLogicTitle}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                        >
                            <div className={styles.editTitle}>
                                {__('元数据库表详情')}
                            </div>
                            <div className={styles.closeButton}>
                                <CloseOutlined
                                    onClick={() => {
                                        onClose()
                                    }}
                                />
                            </div>
                        </div>
                    )
                }
                placement="right"
                closable={false}
                onClose={() => {
                    onClose()
                }}
                mask={mask}
                open
                getContainer={false}
                style={style}
                className={styles.nodeConfigWrapper}
                footer={null}
                destroyOnClose
                bodyStyle={{
                    padding: '4px 0 24px 24px',
                }}
                push={{ distance: 0 }}
            >
                <div ref={container} className={styles.configViewWrapper}>
                    <div className={styles.formContainer}>
                        {loading ? (
                            <div className={styles.viewloading}>
                                <Spin />
                            </div>
                        ) : (
                            <div
                                className={styles.viewBody}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                }}
                                ref={bodyContainer}
                            >
                                {moreInfoList
                                    .map((info, idx) => {
                                        if (idx === 0) {
                                            const { list } = info
                                            return {
                                                ...info,
                                                list: list
                                                    .filter(
                                                        (li) =>
                                                            li.key !== 'status',
                                                    )
                                                    .sort((pre, next) => {
                                                        // 将描述挪到最后一个
                                                        if (
                                                            pre.key ===
                                                            'description'
                                                        ) {
                                                            return 1
                                                        }
                                                        if (
                                                            next.key ===
                                                            'description'
                                                        ) {
                                                            return -1
                                                        }
                                                        return 0
                                                    }),
                                            }
                                        }
                                        return {
                                            ...info,
                                            list: info.list.filter(
                                                (li) =>
                                                    li.key !==
                                                    'data_updated_at',
                                            ),
                                        }
                                    })
                                    .map((currentData, index) =>
                                        getGroupElementData({
                                            title: currentData.label,
                                            viewData: currentData.list,
                                            listId: [
                                                'view-logic-basic',
                                                'view-logic-other',
                                            ][index],
                                        }),
                                    )}
                            </div>
                        )}
                    </div>
                    <div className={styles.menuContainer} ref={anchorRef}>
                        <Anchor
                            targetOffset={160}
                            getContainer={() =>
                                (container.current as HTMLElement) || window
                            }
                            className={styles.anchorWrapper}
                            onClick={(e: any) => {
                                e.preventDefault()
                            }}
                        >
                            <Link
                                href="#view-logic-basic"
                                title={__('基本属性')}
                            />
                            <Link
                                href="#view-logic-other"
                                title={__('其他信息')}
                            />
                        </Anchor>
                    </div>
                </div>
            </Drawer>
        </div>
    )
}

export default LogicDetailView
