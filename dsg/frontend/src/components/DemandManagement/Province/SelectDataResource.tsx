import { Button, Drawer, message, Radio, Space, Tooltip } from 'antd'

import { InfoCircleOutlined, SyncOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import classNames from 'classnames'
import moment from 'moment'
import ProvinceOrganTree from '@/components/ProvincialOriganizationalStructure/ProvinceOrganTree'
import __ from '../locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { Empty, Expand, SearchInput } from '@/ui'
import { IconType } from '@/icons/const'
import dataEmpty from '@/assets/dataEmpty.svg'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import {
    ISSZDCatalog,
    SSZDSyncTaskEnum,
    createSSZDSyncTask,
    formatError,
    getSSZDCatalog,
    getSSZDSyncTask,
} from '@/core'
import { ResourceType } from './const'

interface ISelectDataResource {
    open: boolean
    onClose: () => void
    getRes: (res: ISSZDCatalog, type?: ResourceType) => void
    depId?: string
    resType?: ResourceType
}
const SelectDataResource = ({
    open,
    onClose,
    getRes,
    depId,
    resType,
}: ISelectDataResource) => {
    const [selectedRes, setSelectedRes] = useState<ISSZDCatalog>()
    const [dataSource, setDataSource] = useState<ISSZDCatalog[]>([])
    const [keyword, setKeyword] = useState('')
    const [orgCode, setOrgCode] = useState('')
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncTime, setSyncTime] = useState<number>(0)
    const [type, setType] = useState<ResourceType>(resType || ResourceType.View)

    const handleOk = () => {
        getRes(selectedRes!, type)
        onClose()
    }

    const getSelectedNode = async (code) => {
        try {
            const res = await getSSZDCatalog({
                org_code: code,
                limit: 2000,
                keyword,
            })
            setDataSource(res.entries)
            setOrgCode(code)
            // if (res.entries.length > 0 && !selectedRes) {
            //     setSelectedRes(res.entries[0])
            // }
        } catch (error) {
            formatError(error)
        }
    }

    const handleKeyChange = async (kw: string) => {
        try {
            const res = await getSSZDCatalog({
                org_code: orgCode,
                limit: 2000,
                keyword: kw,
            })
            setDataSource(res.entries)
            setKeyword(kw)
            // if (res.entries.length > 0 && !selectedRes) {
            //     setSelectedRes(res.entries[0])
            // }
        } catch (error) {
            formatError(error)
        }
    }

    const CreateSyncTask = async () => {
        try {
            await createSSZDSyncTask(SSZDSyncTaskEnum.Catalog)
            setIsSyncing(true)
        } catch (error) {
            formatError(error)
        }
    }

    const getSyncTask = async () => {
        try {
            const res = await getSSZDSyncTask(SSZDSyncTaskEnum.Catalog)
            // 任务ID，无正在进行中的任务返空字符串
            setIsSyncing(!!res.id)
            // setSyncTime(res.last_sync_time)
            if (!res.id) {
                message.success(__('同步成功'))
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (!depId) {
            getSyncTask()
            // 每30秒调用一次
            const interval = setInterval(getSyncTask, 30 * 1000)
            // 组件卸载时清除定时器
            return () => clearInterval(interval)
        }
        return () => {}
    }, [])

    useEffect(() => {
        if (depId) {
            getSelectedNode(depId)
        }
    }, [depId])

    return (
        <Drawer
            title={__('选择数据资源目录')}
            width={depId ? 1000 : 1290}
            open={open}
            onClose={onClose}
            bodyStyle={{ padding: 0, overflow: 'hidden' }}
            footer={
                <Space className={styles['choose-resource-footer']}>
                    <div className={styles['choose-resource-footer-desc']}>
                        {depId ? null : (
                            <>
                                <FontIcon
                                    name="icon-xinxitishi"
                                    className={styles.icon}
                                />
                                {__('仅为您提供未挂接资源的数据目录')}
                            </>
                        )}
                    </div>
                    <Space>
                        <Button onClick={onClose} className={styles.btn}>
                            {__('取消')}
                        </Button>
                        <Tooltip
                            title={!selectedRes ? __('请选择数据资源目录') : ''}
                        >
                            <Button
                                type="primary"
                                onClick={() => handleOk()}
                                className={styles.btn}
                                style={{ width: 80 }}
                                disabled={!selectedRes}
                            >
                                {__('确定')}
                            </Button>
                        </Tooltip>
                    </Space>
                </Space>
            }
        >
            <div className={styles['select-res-wrapper']}>
                {depId ? null : (
                    <div className={styles['left-tree']}>
                        <ProvinceOrganTree getSelectedNode={getSelectedNode} />
                    </div>
                )}

                <div className={styles['right-content']}>
                    {depId ? null : (
                        <div className={styles['right-content-top']}>
                            <div className={styles.operation}>
                                <Tooltip title={isSyncing ? __('同步中') : ''}>
                                    <Button
                                        className={styles['reload-btn']}
                                        onClick={CreateSyncTask}
                                        icon={<SyncOutlined spin={isSyncing} />}
                                        disabled={isSyncing}
                                    >
                                        {__('数据同步')}
                                    </Button>
                                </Tooltip>
                                <InfoCircleOutlined
                                    className={styles['info-icon']}
                                />
                                <span className={styles['info-decs']}>
                                    {__('您可以手动同步省级数据资源目录')}
                                </span>
                            </div>
                            <span className={styles['sync-time']}>
                                {__('数据同步时间：')}
                                {syncTime
                                    ? moment(syncTime).format(
                                          'YYYY-MM-DD HH:mm:ss',
                                      )
                                    : '--'}
                            </span>
                        </div>
                    )}

                    <div
                        className={classNames(
                            styles['right-content-bottom'],
                            depId && styles['right-content-all'],
                        )}
                    >
                        <div className={styles['content-left']}>
                            <SearchInput
                                placeholder={__('搜索数据资源目录名称、编码')}
                                onKeyChange={handleKeyChange}
                                maxLength={128}
                                style={{ width: '100%' }}
                            />
                            {dataSource.length === 0 ? (
                                <div className={styles['empty-container']}>
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={
                                            //   __('抱歉，没有找到相关内容')
                                            __('暂无数据')
                                        }
                                    />
                                </div>
                            ) : (
                                <div className={styles['view-items']}>
                                    {dataSource.map((item) => (
                                        <div
                                            key={item.id}
                                            className={classNames(
                                                styles['view-item'],
                                                selectedRes?.id === item.id &&
                                                    styles[
                                                        'selected-view-item'
                                                    ],
                                            )}
                                            onClick={() => setSelectedRes(item)}
                                        >
                                            <Radio
                                                checked={
                                                    selectedRes?.id === item.id
                                                }
                                                disabled={item.status === '0'}
                                            />
                                            <div
                                                className={styles['view-info']}
                                            >
                                                <FontIcon
                                                    name="icon-shujumuluguanli1"
                                                    type={IconType.COLOREDICON}
                                                    className={styles.icon}
                                                />
                                                <div
                                                    className={
                                                        styles['view-names']
                                                    }
                                                >
                                                    <div
                                                        className={styles.top}
                                                        title={item.title}
                                                    >
                                                        <div
                                                            className={
                                                                styles[
                                                                    'catalog-name'
                                                                ]
                                                            }
                                                        >
                                                            {item.title}
                                                        </div>
                                                        {/* 失效标签 */}
                                                        {item.status ===
                                                            '0' && (
                                                            <div
                                                                className={
                                                                    styles[
                                                                        'invalid-tag'
                                                                    ]
                                                                }
                                                            >
                                                                {__('已失效')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.bottom
                                                        }
                                                        title={item.org_code}
                                                    >
                                                        {item.org_code}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className={styles['content-right']}>
                            {selectedRes ? (
                                <>
                                    <div className={styles['res-name']}>
                                        {selectedRes?.title}
                                    </div>
                                    {depId ? (
                                        <>
                                            <div className={styles['row-info']}>
                                                <div className={styles.label}>
                                                    {__('选择资源类型：')}
                                                </div>
                                                <div className={styles.value}>
                                                    <Radio.Group
                                                        value={type}
                                                        onChange={(e) =>
                                                            setType(
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        <Radio
                                                            value={
                                                                ResourceType.View
                                                            }
                                                        >
                                                            {__('库表')}
                                                        </Radio>
                                                        <Radio
                                                            value={
                                                                ResourceType.Api
                                                            }
                                                        >
                                                            {__('接口')}
                                                        </Radio>
                                                    </Radio.Group>
                                                </div>
                                            </div>
                                            <div className={styles['row-info']}>
                                                <div className={styles.label}>
                                                    {__('对应资源名称：')}
                                                </div>
                                                <div className={styles.value}>
                                                    {selectedRes
                                                        ?.resource_groups[
                                                        type
                                                    ]?.[0]?.resource_name ||
                                                        '--'}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles['row-info']}>
                                            <div className={styles.label}>
                                                {__('资源类型：')}
                                            </div>
                                            <div className={styles.value}>
                                                --
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles['row-info']}>
                                        <div className={styles.label}>
                                            {depId
                                                ? __('资源描述：')
                                                : __('描述：')}
                                        </div>
                                        <div
                                            className={classNames(
                                                styles.value,
                                                styles.abstract,
                                            )}
                                        >
                                            <Expand
                                                content={selectedRes?.abstract}
                                                expandTips={__('展开')}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles['info-title']}>
                                        {__('信息项')}
                                    </div>
                                    <div
                                        className={
                                            styles['field-items-container']
                                        }
                                    >
                                        {selectedRes?.info_items.map(
                                            (field) => (
                                                <div
                                                    className={
                                                        styles['field-item']
                                                    }
                                                    key={field.column_code}
                                                >
                                                    <div
                                                        className={styles.names}
                                                    >
                                                        <div
                                                            title={
                                                                field.column_name_cn
                                                            }
                                                            className={
                                                                styles[
                                                                    'business-info'
                                                                ]
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles.icon
                                                                }
                                                            >
                                                                {getFieldTypeEelment(
                                                                    {
                                                                        ...field,
                                                                        type: 'char',
                                                                    },
                                                                    20,
                                                                )}
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles[
                                                                        'business-name'
                                                                    ]
                                                                }
                                                            >
                                                                {
                                                                    field.column_name_cn
                                                                }
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles[
                                                                        'unique-tag'
                                                                    ]
                                                                }
                                                            >
                                                                {__('唯一标识')}
                                                            </div>
                                                        </div>
                                                        <div
                                                            title={
                                                                field.column_name_en
                                                            }
                                                            className={
                                                                styles[
                                                                    'technical-name'
                                                                ]
                                                            }
                                                        >
                                                            {
                                                                field.column_name_en
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                        {selectedRes?.info_items.length ===
                                            0 && (
                                            <Empty
                                                iconSrc={dataEmpty}
                                                desc={__('暂无数据')}
                                            />
                                        )}
                                    </div>
                                </>
                            ) : (
                                <Empty
                                    iconSrc={dataEmpty}
                                    desc={__('暂无数据')}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default SelectDataResource
