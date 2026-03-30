import { CaretDownFilled } from '@ant-design/icons'
import { Collapse } from 'antd'
import classnames from 'classnames'
import {
    ReactNode,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import { AssetTypeEnum, formatError, IDatasheetField } from '@/core'
import ColFilter, { IColFilter } from './ColFilter'
import RowFilter, { IRowFilter } from './RowFilter'
import styles from './styles.module.less'
import { RowCard } from './RowColView'
import __ from './locale'

const { Panel } = Collapse

type IColProps = IColFilter & { title: ReactNode }
type IRowProps = IRowFilter & { title: ReactNode }

type FieldItem = {
    id: string
    name_en: string
}

type IRelation = 'and' | 'or'

type MemberItem = {
    id: string
    operator: string
    value: string
    name_en: string
    data_type: string
    name: string
}
type RowItem = {
    member: MemberItem[]
    relation?: IRelation
}

type IRowLine = {
    where: RowItem[]
    where_relation: IRelation
}

export const FilterHeader = (title: ReactNode, isExpand: boolean) => {
    return (
        <div className={styles['filter-header-box']}>
            <CaretDownFilled
                className={classnames(
                    styles['filter-header-box-icon'],
                    isExpand && styles.expand,
                )}
            />
            <span>{title}</span>
        </div>
    )
}

interface IRowAndColFilter {
    row: IRowProps
    col?: IColProps
    value?: string
    /** 授权范围的配置 */
    extend?: IRowLine
    /** 授权范围配置是否可编辑 */
    canEditExtend?: boolean
    /** 授权范围配置的列 */
    scopeFields?: IDatasheetField[]
    /** 资产类型 */
    type?: AssetTypeEnum
}

/**
 * 行列限定
 */
const RowAndColFilter = forwardRef(
    (
        {
            row,
            col,
            value,
            extend,
            scopeFields,
            canEditExtend,
            type,
        }: IRowAndColFilter,
        ref,
    ) => {
        const [loading, setLoading] = useState<boolean>(false)
        const { title: colTitle, ...colProps } = col || {}
        const { title: rowTitle, ...rowProps } = row
        const [activeKey, setActiveKey] = useState<string[]>(['col', 'row'])
        const colRef = useRef<any>()
        const rowRef = useRef<any>()
        const rowFixedRef = useRef<any>()
        const [checked, setChecked] = useState<string[]>([])
        const [relations, setRelations] = useState<IRowLine>()
        const [extendRelations, setExtendRelations] = useState<IRowLine>()

        const init = () => {
            setLoading(true)
            const data = JSON.parse(value || '{}')
            const ids = (data?.fields || []).map((o) => o.id)
            setChecked(ids)
            setRelations(data?.row_filters)
            setExtendRelations(extend || data?.fixed_row_filters)
            setLoading(false)
        }

        const expandAndClearSearch = async () => {
            setActiveKey(['col', 'row'])
            colRef.current?.clearSearch()
        }

        useEffect(() => {
            init()
        }, [value, extend])

        const reset = () => {
            init()
            expandAndClearSearch()
        }

        const onFinish = async () => {
            let detail
            try {
                const items = await colRef.current?.onFinish()
                const fields = (items || []).map((o) => ({
                    id: o?.id,
                    name_en: o?.technical_name,
                    name: o?.business_name,
                    data_type: o?.data_type,
                }))
                const row_filters = await rowRef.current?.onFinish()
                const fixed_row_filters = await rowFixedRef.current?.onFinish()

                const params = {
                    scope_fields: scopeFields?.map((o) => o.id),
                    fields,
                    row_filters,
                    fixed_row_filters,
                }
                if (type === AssetTypeEnum.SubService) {
                    delete params.scope_fields
                    delete params.fields
                }
                detail = JSON.stringify(params)
            } catch (error) {
                if (!error?.errorFields) {
                    formatError(error)
                }
            }
            return detail
        }

        const onValidateFilter = async () => {
            try {
                await rowRef.current?.onValidateFields()
                return true
            } catch (error) {
                if (!error.errorFields) {
                    formatError(error)
                }
                return false
            }
        }

        const onSnapshot = async () => {
            let detail
            try {
                const items = await colRef.current?.onFinish()
                const fields = (items || []).map((o) => ({
                    id: o?.id,
                    name_en: o?.technical_name,
                    name: o?.business_name,
                    data_type: o?.data_type,
                }))
                const row_filters = await rowRef.current?.getSnapshot()
                const fixed_row_filters =
                    await rowFixedRef.current?.getSnapshot()

                const params = {
                    scope_fields: scopeFields?.map((o) => o.id),
                    fields,
                    row_filters,
                    fixed_row_filters,
                }
                if (type === AssetTypeEnum.SubService) {
                    delete params.scope_fields
                    delete params.fields
                }
                detail = JSON.stringify(params)
            } catch (error) {
                if (!error?.errorFields) {
                    formatError(error)
                }
            }
            return detail
        }

        useImperativeHandle(ref, () => ({
            onFinish,
            onSnapshot,
            onValidateFilter,
            reset,
        }))

        return (
            <div className={styles['row-col-filter']} id="row-col">
                <Collapse
                    bordered={false}
                    ghost
                    activeKey={activeKey}
                    onChange={(keys) => setActiveKey(keys as string[])}
                >
                    {!!col && (
                        <Panel
                            header={FilterHeader(
                                colTitle,
                                activeKey.includes('col'),
                            )}
                            key="col"
                            showArrow={false}
                        >
                            <ColFilter
                                {...(colProps as any)}
                                {...(!canEditExtend
                                    ? { value: scopeFields }
                                    : {})}
                                initCheck={checked}
                                ref={colRef}
                                loading={loading}
                            />
                        </Panel>
                    )}

                    <Panel
                        header={FilterHeader(
                            rowTitle,
                            activeKey.includes('row'),
                        )}
                        key="row"
                        showArrow={false}
                    >
                        <div
                            className={styles['row-col-filter-extends']}
                            hidden={!extendRelations?.where?.length}
                        >
                            {canEditExtend ? (
                                <RowFilter
                                    {...rowProps}
                                    initValues={extendRelations}
                                    ref={rowFixedRef}
                                    loading={loading}
                                    canAdd={false}
                                />
                            ) : (
                                <RowCard value={extendRelations} />
                            )}
                            <div className={styles['and-split']}>
                                <span>{__('且')}</span>
                            </div>
                        </div>

                        <RowFilter
                            {...rowProps}
                            initValues={relations}
                            ref={rowRef}
                            loading={loading}
                        />
                    </Panel>
                </Collapse>
            </div>
        )
    },
)

export default RowAndColFilter
