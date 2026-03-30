import { Drawer, DrawerProps, Tabs } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { SearchInput } from '@/ui'
import { RestrictViewList } from '@/components/DataAssetsCatlg/IndicatorViewDetail/IndicatorViewCard'
import __ from './locale'
import styles from './styles.module.less'
import { FieldLabel } from '../DatasheetView/DataPreview/ScrollFilter/ToolSideBar/FieldLabel'
import {
    formatError,
    getDatasheetViewDetails,
    getSingleCatalogDetail,
} from '@/core'

interface FieldType {
    data_type: string
    business_name: string
}

interface SingleDirDetail {
    name: string
    description: string
    fields: FieldType[]
    data_catalog_name: string
    config: any
}

interface Props extends DrawerProps {
    detailId: string
}

const Details = (props: Props) => {
    const { open, detailId, ...restProps } = props
    const [details, setDetails] = useState<SingleDirDetail | null>({
        name: 'ce',
        description: '说明文本',
        fields: [{ data_type: 'varchar', business_name: 'all_roads' }],
        data_catalog_name: 'XXXXXXXXXXXXXXXX',
        config: {},
    })
    const initFieldsRef = useRef<FieldType[]>([])

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await getSingleCatalogDetail(detailId)
                const { configs, fields, resource_id, ...rest } = res
                const viewsRes = await getDatasheetViewDetails(resource_id)
                let compeletedFields = [] as any[]

                if (viewsRes.fields) {
                    compeletedFields = viewsRes.fields.filter((field) =>
                        fields.includes(field.id),
                    )
                    initFieldsRef.current = compeletedFields
                }

                const parseConfig = JSON.parse(configs || '{}')
                const { rule_expression } = parseConfig ?? {}
                const config = {
                    ...rule_expression,
                    where: (rule_expression?.where || []).map((item) => {
                        const { member } = item
                        return {
                            ...item,
                            member: member.map((mem) => {
                                const { data_type, name, ...restMem } = mem
                                return {
                                    ...restMem,
                                    field: {
                                        data_type,
                                        business_name: name,
                                    },
                                }
                            }),
                        }
                    }),
                }
                setDetails({
                    config,
                    fields: compeletedFields,
                    ...rest,
                })
            } catch (err) {
                formatError(err)
            }
        }
        if (open) {
            fetchDetail()
        } else {
            setDetails(null)
        }
    }, [open])

    const handleSearch = (e) => {
        const { value } = e.target
        let filteredFields = [] as FieldType[]
        if (value === '' || value === undefined || value === null) {
            filteredFields = initFieldsRef.current
        } else {
            filteredFields = initFieldsRef.current.filter((item) =>
                item.business_name
                    ?.toLowerCase()
                    ?.includes(value?.trim().toLowerCase()),
            )
        }
        setDetails((prevState: any) => {
            return {
                ...(prevState ?? {}),
                fields: filteredFields,
            }
        })
    }

    const baseinfo = (
        <>
            <div className={styles.detailRow}>
                <span>{__('模板名称')}：</span>
                <span style={{ color: 'rgb(0 0 0 / 85%)' }}>
                    {details?.name ?? '--'}
                </span>
            </div>
            <div className={styles.detailRow}>
                <span>{__('模板说明')}：</span>
                <span>{details?.description ?? '--'}</span>
            </div>
            <div className={styles.detailRow}>
                <span>{__('查询数据目录')}：</span>
                <span>{details?.data_catalog_name ?? '--'}</span>
            </div>
        </>
    )

    const fieldFilter = (
        <>
            <SearchInput
                placeholder={__('搜索字段名称')}
                onChange={handleSearch}
            />
            <div className={styles.fieldListWrapper}>
                {details?.fields.map((item) => (
                    <FieldLabel item={item} canViewChange />
                ))}
            </div>
        </>
    )

    const dataFilter = (
        <div>
            <div>{`${
                details?.config?.where?.length &&
                details?.config?.where?.length > 1
                    ? __('每组间满足“${relation}”条件', {
                          relation:
                              details?.config?.where_relation === 'or'
                                  ? __('或')
                                  : __('且'),
                      })
                    : ''
            }`}</div>
            <div>
                <RestrictViewList
                    where={(details?.config?.where || []) as any}
                />
            </div>
        </div>
    )
    const tabMenus = [
        { label: __('基本信息'), key: 'baseinfo', children: baseinfo },
        { label: __('字段过滤'), key: 'field', children: fieldFilter },
        { label: __('数据过滤'), key: 'data', children: dataFilter },
    ]
    return (
        <Drawer open={open} width={400} title={__('模板详情')} {...restProps}>
            <Tabs centered items={tabMenus} />
        </Drawer>
    )
}

export default Details
