import { Tooltip } from 'antd'
import classNames from 'classnames'
import { useEffect, useMemo, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import FieldItem from '@/components/DatasheetView/DataPreview/FieldItem'
import { TypeList } from '@/components/DatasheetView/DataPreview/helper'
import { HasAccess } from '@/core'
import { Empty, SearchInput } from '@/ui'
import __ from '../locale'
import styles from './styles.module.less'
import ScorePanel from './ScorePanel'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

function FieldsInfo({ data, fieldsList }: any) {
    const [searchKey, setSearchKey] = useState<string>('')
    const [activeField, setActiveField] = useState<string>()
    const [fieldsListFilter, setFieldsListFilter] = useState<any[]>([])
    const [fieldData, setFieldData] = useState<any>()
    const [types, setTypes] = useState<string[]>([])
    const [scoreFields, setScoreFields] = useState<[]>([])
    const [scoreFieldIds, setScoreFieldIds] = useState<string[]>([])
    const { checkPermissions } = useUserPermCtx()

    // 是否拥有工程师角色
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    useEffect(() => {
        if (activeField) {
            const field = data?.find((o) => o.field_id === activeField)
            setFieldData(field)

            const fieldTypes = TypeList.filter((key) =>
                (field?.details || []).some((o) => o.dimension === key),
            )
            setTypes(fieldTypes)
        } else {
            setFieldData(undefined)
        }
    }, [data, activeField])

    useEffect(() => {
        const fields = (fieldsList || []).filter((o) =>
            scoreFieldIds.includes(o.id),
        )
        setScoreFields(fields)
    }, [scoreFieldIds, fieldsList])

    useEffect(() => {
        const ids = (data || [])
            .filter((o) => o.details?.length > 0)
            .map((o) => o.field_id)
        setScoreFieldIds(ids)
        if (ids?.length) {
            setActiveField(ids[0])
        }
    }, [data])

    useEffect(() => {
        if (scoreFields?.length) {
            setFieldsListFilter(
                searchKey
                    ? scoreFields.filter(
                          (item: any) =>
                              item?.business_name
                                  ?.toLowerCase()
                                  ?.includes(searchKey.toLowerCase()) ||
                              item?.technical_name
                                  ?.toLowerCase()
                                  ?.includes(searchKey.toLowerCase()),
                      )
                    : scoreFields,
            )
        }
    }, [scoreFields, searchKey])

    return (
        <div className={styles.fieldsInfo}>
            <div className={styles.fieldsInfoTop}>
                <div className={styles.fieldsInfoTitle}>字段探查详情</div>
            </div>
            <div
                className={styles['field-statistics']}
                hidden={!scoreFields?.length}
            >
                <div className={styles['field-statistics-left']}>
                    <div className={styles['left-search']}>
                        <SearchInput
                            value={searchKey}
                            onKeyChange={(kw: string) => {
                                setSearchKey(kw)
                            }}
                            placeholder={__('搜索字段业务名称、技术名称')}
                        />
                    </div>
                    <div className={styles['left-list']}>
                        {fieldsListFilter.map((item) => {
                            return (
                                <Tooltip
                                    title={
                                        scoreFieldIds.includes(item?.id) ? (
                                            ''
                                        ) : (
                                            <span
                                                style={{
                                                    color: 'rgba(0,0,0,0.85)',
                                                }}
                                            >
                                                {__('暂未配置探查规则')}
                                            </span>
                                        )
                                    }
                                    placement="right"
                                    color="white"
                                >
                                    <div
                                        key={item?.id}
                                        onClick={() => {
                                            if (
                                                scoreFieldIds.includes(item?.id)
                                            ) {
                                                setActiveField(item?.id)
                                            }
                                        }}
                                        className={classNames(
                                            styles['left-list-item'],
                                            item?.id === activeField &&
                                                styles.active,
                                            !scoreFieldIds.includes(item?.id) &&
                                                styles.noScore,
                                        )}
                                    >
                                        <FieldItem
                                            canShowSwitch={hasDataOperRole}
                                            data={{
                                                ...item,
                                                name: item.business_name,
                                                code: item.technical_name,
                                                type: item.data_type,
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                            )
                        })}
                    </div>
                </div>
                <div className={styles['field-statistics-right']}>
                    {fieldData ? (
                        <div className={styles['right-box']}>
                            <div className={styles['right-content']}>
                                <ScorePanel data={fieldData} />
                                <div style={{ height: '20px' }} />
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                width: '100%',
                                paddingTop: '15vh',
                            }}
                        >
                            <Empty
                                iconSrc={dataEmpty}
                                desc={__('暂未配置探查规则')}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div
                className={styles['field-empty']}
                hidden={!!scoreFields?.length}
            >
                <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
            </div>
        </div>
    )
}

export default FieldsInfo
