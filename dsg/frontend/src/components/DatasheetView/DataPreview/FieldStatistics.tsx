import { Anchor, Modal, Tooltip } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import __ from './locale'
import styles from './styles.module.less'
import { Empty, SearchInput } from '@/ui'
import FieldItem from './FieldItem'
import { useDataViewContext } from '../DataViewProvider'
import dataEmpty from '@/assets/dataEmpty.svg'
import ScorePanel from './ScorePanel'
import { AnchorType, KVMap, ScoreType, TypeList } from './helper'
import { HasAccess } from '@/core'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const { Link } = Anchor
function FieldStatistics({ open, data, onClose }: any) {
    const container = useRef<any>(null)
    const { explorationData } = useDataViewContext()
    const [fieldsList, setFieldsList] = useState<any[]>([])
    const [searchKey, setSearchKey] = useState<string>('')
    const [activeField, setActiveField] = useState<string>()
    const [fieldsListFilter, setFieldsListFilter] = useState<any[]>([])
    const [fieldData, setFieldData] = useState<any>()
    const [types, setTypes] = useState<string[]>([])
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
        setFieldsList(explorationData?.fieldList)
    }, [explorationData])

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
        if (fieldsList?.length) {
            setFieldsListFilter(
                searchKey
                    ? fieldsList.filter(
                          (item) =>
                              item.business_name
                                  .toLowerCase()
                                  .includes(searchKey.toLowerCase()) ||
                              item.technical_name
                                  .toLowerCase()
                                  .includes(searchKey.toLowerCase()),
                      )
                    : fieldsList,
            )
        }
    }, [fieldsList, searchKey])

    return (
        <Modal
            title={__('字段探查详情')}
            open={open}
            width={1392}
            destroyOnClose
            footer={null}
            maskClosable={false}
            getContainer={false}
            onCancel={onClose}
            bodyStyle={{ padding: 0 }}
        >
            <div
                className={styles['field-statistics']}
                hidden={!fieldsList?.length}
            >
                <div className={styles['field-statistics-left']}>
                    <div className={styles['left-title']}>{__('字段列表')}</div>
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
                        <div className={styles['right-box']} ref={container}>
                            <div className={styles['right-content']}>
                                <ScorePanel data={fieldData} />
                                <div style={{ height: '20px' }} />
                            </div>
                            <div
                                className={styles['right-menu']}
                                hidden={types?.length <= 1}
                            >
                                <Anchor
                                    targetOffset={8}
                                    getContainer={() =>
                                        (container.current as HTMLElement) ||
                                        window
                                    }
                                    onClick={(e: any) => e.preventDefault()}
                                    className={styles.anchorWrapper}
                                >
                                    {types?.map((key) => (
                                        <Link
                                            key={key}
                                            href={`#${KVMap[key]}`}
                                            title={AnchorType[KVMap[key]]}
                                        />
                                    ))}
                                </Anchor>
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
                hidden={!!fieldsList?.length}
            >
                <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
            </div>
        </Modal>
    )
}

export default FieldStatistics
