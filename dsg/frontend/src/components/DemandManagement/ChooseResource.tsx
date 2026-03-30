import React, { useEffect, useState } from 'react'
import { Button, Checkbox, Drawer, Radio, Space, Tooltip } from 'antd'
import InfiniteScroll from 'react-infinite-scroll-component'
import classNames from 'classnames'
import __ from './locale'
import styles from './styles.module.less'
import GlossaryDirTree from '../BusinessDomain/GlossaryDirTree'
import { Empty, Loader, SearchInput } from '@/ui'
import {
    IDataRescQuery,
    SortDirection,
    formatError,
    getDataRescList,
    getDataRescList2,
    getDatasheetViewDetails,
} from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { BusinessDomainType } from '../BusinessDomain/const'
import {
    ViewInfoMode,
    ViewMode,
    viewInfoOptions,
    viewModeOptions,
} from './const'
import ArchitectureDirTree from '../BusinessArchitecture/ArchitectureDirTree'
import { Architecture } from '../BusinessArchitecture/const'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import FormViewExampleData from '../DatasheetView/FormViewExampleData'
import { getFieldTypeEelment } from '../DatasheetView/helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

export const menus = [
    { key: 'created_at', label: __('按创建时间排序') },
    { key: 'updated_at', label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: 'updated_at',
    sort: SortDirection.DESC,
}

interface IChooseResource {
    open: boolean
    onClose: () => void
    getResource: (resource) => void
    selectedIds?: string[]
}
const ChooseResource: React.FC<IChooseResource> = ({
    open,
    onClose,
    selectedIds,
    getResource,
}) => {
    const [{ using }, updateUsing] = useGeneralConfig()
    const [checkedData, setCheckedData] = useState<any[]>([])
    const [selectedData, setSelectedData] = useState<any>()
    const [searchCondition, setSearchCondition] = useState({
        keyword: '',
        department_id: '',
        subject_domain_id: '',
        type: 'data_view',
        is_publish: true,
        is_online: using === 1 ? undefined : true,
        fields: ['name', 'code'],
        orders: [
            {
                sort: using === 1 ? 'published_at' : 'online_at',
                direction: 'desc',
            },
        ],
    })
    const [dataSource, setDataSource] = useState<any[]>([])
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Domain)
    const [viewInfoMode, setViewInfoMode] = useState<ViewInfoMode>(
        ViewInfoMode.Field,
    )
    const [total, setTotal] = useState(0)
    const [nextFlag, setNextFlag] = useState<string[]>()
    const [fields, setFields] = useState<any[]>([])
    const [fieldsLoading, setFieldsLoading] = useState(false)

    const getSelectedNode = async (isRestData?: boolean) => {
        try {
            const { keyword, ...filter } = searchCondition
            const params: IDataRescQuery = {
                keyword,
                filter,
                next_flag: isRestData ? undefined : nextFlag,
            }
            const res = await getDataRescList2(params)
            setTotal(res.total_count)
            setNextFlag(res.next_flag)
            setDataSource(
                nextFlag && nextFlag.length > 0 && !isRestData
                    ? [...dataSource, ...(res.entries || [])]
                    : res.entries || [],
            )
            if (isRestData) {
                setSelectedData(res.entries?.[0])
            }
        } catch (error) {
            formatError(error)
        }
    }

    const getFields = async () => {
        try {
            setFieldsLoading(true)
            const res = await getDatasheetViewDetails(selectedData.id)
            setFields(res.fields || [])
        } catch (error) {
            formatError(error)
        } finally {
            setFieldsLoading(false)
        }
    }

    useEffect(() => {
        if (selectedData) {
            getFields()
        } else {
            setFields([])
        }
    }, [selectedData])

    useEffect(() => {
        getSelectedNode(true)
    }, [searchCondition])

    const handleOk = () => {
        getResource(checkedData)
        onClose()
    }

    const handleChecked = (checked: boolean, data) => {
        if (checked) {
            setCheckedData([...checkedData, data])
        } else {
            setCheckedData(checkedData.filter((item) => item.id !== data.id))
        }
    }

    return (
        <Drawer
            title={__('选择资源')}
            width={1320}
            open={open}
            onClose={onClose}
            bodyStyle={{ padding: 0, overflow: 'hidden' }}
            footer={
                <Space className={styles['choose-resource-footer']}>
                    <Button onClick={onClose} className={styles.btn}>
                        {__('取消')}
                    </Button>
                    <Tooltip
                        title={checkedData.length === 0 ? __('请选择资源') : ''}
                    >
                        <Button
                            type="primary"
                            onClick={() => handleOk()}
                            className={styles.btn}
                            style={{ width: 80 }}
                            disabled={checkedData.length === 0}
                        >
                            {__('确定')}
                        </Button>
                    </Tooltip>
                </Space>
            }
        >
            <div className={styles['choose-resource-wrapper']}>
                <div className={styles['left-content']}>
                    <div className={styles['title-container']}>
                        <Radio.Group
                            options={viewModeOptions}
                            onChange={(e) => {
                                setViewMode(e.target.value)
                                setNextFlag(undefined)
                            }}
                            value={viewMode}
                            optionType="button"
                            className={styles.viewModeRadioWrapper}
                            style={{ width: 280 }}
                        />
                    </div>
                    <div className={styles['tree-container']}>
                        {viewMode === ViewMode.Domain ? (
                            <GlossaryDirTree
                                getSelectedKeys={(nodeInfo) => {
                                    setSearchCondition({
                                        ...searchCondition,
                                        subject_domain_id: nodeInfo?.id || '',
                                        department_id: '',
                                    })
                                }}
                                filterType={[
                                    BusinessDomainType.subject_domain_group,
                                    BusinessDomainType.subject_domain,
                                ]}
                                limitTypes={[BusinessDomainType.subject_domain]}
                                placeholder={__('搜索主题域分组、主题域')}
                                needUncategorized
                                unCategorizedKey="Uncategorized"
                            />
                        ) : (
                            <ArchitectureDirTree
                                getSelectedNode={(nodeInfo) => {
                                    setSearchCondition({
                                        ...searchCondition,
                                        department_id: nodeInfo?.id || '',
                                        subject_domain_id: '',
                                    })
                                }}
                                filterType={[
                                    Architecture.ORGANIZATION,
                                    Architecture.DEPARTMENT,
                                ].join()}
                                needUncategorized
                                unCategorizedKey="Uncategorized"
                            />
                        )}
                    </div>
                </div>
                <div className={styles['mid-content']}>
                    <SearchInput
                        placeholder={__('搜索数据资源名称、编码')}
                        value={searchCondition.keyword}
                        onKeyChange={(keyword: string) => {
                            setSearchCondition({
                                ...searchCondition,
                                keyword,
                            })
                        }}
                        maxLength={128}
                        style={{ width: '100%' }}
                    />
                    {dataSource.length === 0 ? (
                        <div className={styles['empty-container']}>
                            <Empty
                                iconSrc={
                                    searchCondition.keyword
                                        ? searchEmpty
                                        : dataEmpty
                                }
                                desc={
                                    searchCondition.keyword
                                        ? __('抱歉，没有找到相关内容')
                                        : __('暂无数据')
                                }
                            />
                        </div>
                    ) : (
                        <>
                            <div
                                className={styles['view-items']}
                                id="analysis-choose-res"
                            >
                                <InfiniteScroll
                                    hasMore={dataSource.length < total}
                                    loader={
                                        <div className={styles.listLoading}>
                                            <Loader />
                                        </div>
                                    }
                                    next={() => {
                                        getSelectedNode(false)
                                    }}
                                    dataLength={dataSource.length}
                                    scrollableTarget="analysis-choose-res"
                                >
                                    {dataSource.map((item = {}) => (
                                        <div
                                            key={item.id}
                                            className={classNames(
                                                styles['view-item'],
                                                selectedData?.id === item.id &&
                                                    styles[
                                                        'selected-view-item'
                                                    ],
                                            )}
                                            onClick={() =>
                                                setSelectedData(item)
                                            }
                                        >
                                            <Tooltip
                                                title={
                                                    selectedIds?.includes(
                                                        item.id,
                                                    )
                                                        ? __('已添加')
                                                        : ''
                                                }
                                            >
                                                <Checkbox
                                                    checked={
                                                        !!checkedData.find(
                                                            (cd) =>
                                                                cd.id ===
                                                                item.id,
                                                        ) ||
                                                        selectedIds?.includes(
                                                            item.id,
                                                        )
                                                    }
                                                    disabled={selectedIds?.includes(
                                                        item.id,
                                                    )}
                                                    onChange={(e) =>
                                                        handleChecked(
                                                            e.target.checked,
                                                            item,
                                                        )
                                                    }
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                />
                                            </Tooltip>
                                            <div
                                                className={styles['view-info']}
                                            >
                                                <FontIcon
                                                    name="icon-shujubiaoshitu"
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
                                                        title={item.raw_name}
                                                    >
                                                        {item.raw_name}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.bottom
                                                        }
                                                        title={item.raw_code}
                                                    >
                                                        {item.raw_code}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </InfiniteScroll>
                            </div>
                            <div className={styles['selected-info']}>
                                {__('已选：')} {checkedData.length}
                                <Tooltip title={__('清除')}>
                                    <FontIcon
                                        name="icon-qingkong"
                                        type={IconType.COLOREDICON}
                                        className={styles['clear-icon']}
                                        onClick={() => setCheckedData([])}
                                    />
                                </Tooltip>
                            </div>
                        </>
                    )}
                </div>
                <div className={styles['right-content']}>
                    <div className={styles['title-row']}>
                        {__('预览')}
                        <Radio.Group
                            options={viewInfoOptions}
                            onChange={(e) => {
                                setViewInfoMode(e.target.value)
                            }}
                            value={viewInfoMode}
                            optionType="button"
                        />
                    </div>
                    {viewInfoMode === ViewInfoMode.Field ? (
                        fieldsLoading ? (
                            <Loader />
                        ) : (
                            <div className={styles['field-items-container']}>
                                {fields.map((field) => (
                                    <div
                                        className={styles['field-item']}
                                        key={field.id}
                                    >
                                        <span className={styles.icon}>
                                            {getFieldTypeEelment(
                                                {
                                                    ...field,
                                                    type: field.data_type,
                                                },
                                                20,
                                            )}
                                        </span>
                                        <div className={styles.names}>
                                            <div
                                                title={field.business_name}
                                                className={
                                                    styles['business-name']
                                                }
                                            >
                                                {field.business_name}
                                            </div>
                                            <div
                                                title={field.technical_name}
                                                className={
                                                    styles['technical-name']
                                                }
                                            >
                                                {field.technical_name}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {fields.length === 0 && (
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={__('暂无数据')}
                                    />
                                )}
                            </div>
                        )
                    ) : (
                        <div className={styles['example-data-container']}>
                            {selectedData?.id ? (
                                <FormViewExampleData id={selectedData?.id} />
                            ) : (
                                <div style={{ marginTop: 24 }}>
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={__('暂无数据')}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Drawer>
    )
}

export default ChooseResource
