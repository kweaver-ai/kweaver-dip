import { Button, Checkbox, Modal, Space, Tooltip } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import classNames from 'classnames'
import __ from './locale'
import styles from './styles.module.less'
import { Empty, Loader, SearchInput } from '@/ui'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    formatError,
    getSSZDCatalogReportRecord,
    ISSZDCatalogReportRecordItem,
    mountResource,
} from '@/core'
import { IMountResource } from './const'

const catalogField = [
    {
        label: __('挂接数据资源'),
        key: 'mount_resource_name',
    },
    {
        label: __('资源类型'),
        key: 'mount_resource_type',
    },
    {
        label: __('所属部门'),
        key: 'mount_department_path',
    },
]

interface IChooseCatalog {
    open: boolean
    onClose: () => void
    getCatalogs: (catalogs: ISSZDCatalogReportRecordItem[]) => void
    initCatalogIds?: string[]
    departmentId?: string
}
const ChooseCatalog = ({
    open,
    onClose,
    getCatalogs,
    initCatalogIds = [],
    departmentId,
}: IChooseCatalog) => {
    const [catalogs, setCatalogs] = useState<ISSZDCatalogReportRecordItem[]>([])

    const [checkedCatalogs, setCheckedCatalogs] = useState<
        ISSZDCatalogReportRecordItem[]
    >([])
    const [selectedCatalog, setSelectedCatalog] =
        useState<ISSZDCatalogReportRecordItem>()
    const [keyword, setKeyword] = useState('')
    const [mountResourceMap, setMountResourceMap] = useState<
        Record<string, IMountResource>
    >({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (initCatalogIds?.length > 0 && catalogs?.length > 0) {
            setCheckedCatalogs(
                catalogs.filter((c) => initCatalogIds.includes(c.catalog_id)),
            )
        }
    }, [catalogs, initCatalogIds])

    const getReportCatalogs = async (key: string) => {
        const res = await getSSZDCatalogReportRecord({
            limit: 2000,
            query_type: 'reported',
            org_code: departmentId,
            keyword: key,
        })
        setCatalogs(res.entries)
    }

    useEffect(() => {
        if (departmentId) {
            getReportCatalogs('')
        }
    }, [departmentId])

    const showCatalogs = useMemo(() => {
        if (!keyword) return catalogs
        return catalogs.filter(
            (c) =>
                c.catalog_title
                    .toLocaleLowerCase()
                    .includes(keyword.toLocaleLowerCase()) ||
                c.catalog_code
                    .toLocaleLowerCase()
                    .includes(keyword.toLocaleLowerCase()),
        )
    }, [catalogs, keyword])

    const handleCheck = (e: CheckboxChangeEvent, catalog) => {
        e.stopPropagation()
        if (e.target.checked) {
            setCheckedCatalogs([...checkedCatalogs, catalog])
        } else {
            setCheckedCatalogs(
                checkedCatalogs.filter(
                    (c) => c.catalog_code !== catalog.catalog_code,
                ),
            )
        }
    }

    const handleCatalogClick = async (
        catalog: ISSZDCatalogReportRecordItem,
    ) => {
        if (mountResourceMap[catalog.catalog_id]) {
            setSelectedCatalog(catalog)
            return
        }
        try {
            setLoading(true)
            const { mount_resource } = await mountResource(catalog.catalog_id)
            if (mount_resource.length > 0) {
                setMountResourceMap({
                    ...mountResourceMap,
                    [catalog.catalog_id]: {
                        mount_resource_name: mount_resource[0].name,
                        mount_resource_type: mount_resource[0].resource_type,
                        mount_department_path:
                            mount_resource[0].department_path,
                    },
                })
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
        setSelectedCatalog(catalog)
    }

    const handleOk = async () => {
        getCatalogs(checkedCatalogs)
        onClose()
    }

    return (
        <Modal
            title={__('选择数据资源')}
            width={893}
            bodyStyle={{ padding: '16px 24px 14px' }}
            open={open}
            onCancel={onClose}
            wrapClassName={styles['choose-catalog-modal']}
            footer={
                <Space size={8} style={{ float: 'right' }}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Tooltip
                        title={
                            checkedCatalogs.length === 0
                                ? __('请选择资源目录')
                                : ''
                        }
                    >
                        <Button
                            type="primary"
                            onClick={handleOk}
                            disabled={checkedCatalogs.length === 0}
                        >
                            {__('确定')}
                        </Button>
                    </Tooltip>
                </Space>
            }
        >
            <div className={styles['choose-catalog-wrapper']}>
                <div className={styles.left}>
                    <SearchInput
                        placeholder={__('搜索数据资源目录名称、编码')}
                        onKeyChange={(k: string) => setKeyword(k)}
                    />
                    {showCatalogs.length > 0 ? (
                        <div className={styles.catalogs}>
                            {showCatalogs.map((catalog) => (
                                <div
                                    className={classNames(
                                        styles.catalog,
                                        selectedCatalog?.catalog_code ===
                                            catalog.catalog_code &&
                                            styles['selected-catalog'],
                                    )}
                                    key={catalog.catalog_code}
                                    onClick={() => handleCatalogClick(catalog)}
                                >
                                    <Checkbox
                                        checked={
                                            !!checkedCatalogs.find(
                                                (c) =>
                                                    c.catalog_code ===
                                                    catalog.catalog_code,
                                            )
                                        }
                                        onChange={(e) =>
                                            handleCheck(e, catalog)
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <FontIcon
                                        type={IconType.COLOREDICON}
                                        name="icon-shujumuluguanli1"
                                        className={styles['catalog-icon']}
                                    />
                                    <div className={styles['catalog-info']}>
                                        <div
                                            className={styles.name}
                                            title={catalog.catalog_title}
                                        >
                                            {catalog.catalog_title}
                                        </div>
                                        <div
                                            className={styles.code}
                                            title={catalog.catalog_code}
                                        >
                                            {catalog.catalog_code}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : keyword ? (
                        <Empty />
                    ) : (
                        <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                    )}
                </div>
                <div className={styles.right}>
                    {loading ? (
                        <Loader />
                    ) : selectedCatalog && selectedCatalog.catalog_id ? (
                        <>
                            <div className={styles['selected-name']}>
                                {selectedCatalog.catalog_title}
                            </div>
                            {catalogField.map((f) => (
                                <div
                                    className={styles['field-item']}
                                    key={f.key}
                                >
                                    <div className={styles['field-label']}>
                                        {f.label}
                                        {__('：')}
                                    </div>
                                    <div
                                        className={styles['field-value']}
                                        title={f.key}
                                    >
                                        {
                                            mountResourceMap[
                                                selectedCatalog.catalog_id
                                            ]?.[f.key]
                                        }
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    )}
                </div>
            </div>
        </Modal>
    )
}

export default ChooseCatalog
