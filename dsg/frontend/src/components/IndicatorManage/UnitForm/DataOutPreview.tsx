import React, { useEffect, useMemo, useState } from 'react'
import { List, Modal, Tooltip } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import { IFormulaFields } from '@/core'
import __ from '../locale'
import Empty from '@/ui/Empty'
import { SearchInput } from '@/ui'
import { FieldsData } from '../FieldsData'
import Icons from '@/components/BussinessConfigure/Icons'
import { FormulaType } from '../const'
import dataEmpty from '@/assets/dataEmpty.svg'

interface IDataOutPreview {
    visible: boolean
    title?: string
    items: IFormulaFields[]
    fieldsData?: FieldsData
    allowPrimary?: boolean
    formulaType?: FormulaType
    onClose: () => void
}
/**
 * 数据输出预览组件
 * @param visible 显示/隐藏
 * @param items 所有字段
 * @param fieldsData 字段元数据
 * @param allowPrimary 显示主键标识
 * @param onClose 关闭
 */
const DataOutPreview: React.FC<IDataOutPreview> = ({
    visible,
    title = __('预览输出字段'),
    items,
    fieldsData,
    allowPrimary = false,
    formulaType,
    onClose,
}) => {
    const pageLimit = 20
    // 搜索数据集
    const [searchItems, setSearchItems] = useState<any[]>([])
    // 展示数据集
    const [showItems, setShowItems] = useState<any[]>([])
    // 分页
    const [offset, setOffset] = useState<number>(1)

    useMemo(() => {
        setShowItems(
            searchItems.slice(pageLimit * (offset - 1), pageLimit * offset),
        )
    }, [offset, searchItems])

    useEffect(() => {
        setSearchItems(items)
        setOffset(1)
    }, [visible])

    // 搜索
    const handleSearch = async (search: string) => {
        setOffset(1)
        if (search === '') {
            setSearchItems(items)
            return
        }
        setSearchItems(
            items.filter((info) => {
                const findItem = fieldsData?.data.find((c) => info?.id === c.id)
                return (
                    info.alias?.includes(search) ||
                    info.alias?.match(new RegExp(search, 'ig')) ||
                    (info?.name_en || findItem?.name_en)?.includes(search) ||
                    (info?.name_en || findItem?.name_en)?.match(
                        new RegExp(search, 'ig'),
                    )
                )
            }),
        )
    }

    return (
        <Modal
            title={title}
            width={480}
            maskClosable={false}
            open={visible}
            onCancel={onClose}
            destroyOnClose
            footer={null}
            getContainer={false}
            className={styles.dataOutPreviewWrap}
            bodyStyle={{ height: 505, padding: 0 }}
        >
            <div style={{ padding: '16px 24px 10px' }}>
                <SearchInput
                    placeholder={__('搜索业务名称、技术名称')}
                    onKeyChange={handleSearch}
                    onPressEnter={(e: any) =>
                        handleSearch(e.target.value.trim())
                    }
                    maxLength={255}
                />
            </div>
            <div
                style={{
                    height: 'calc(100% - 68px)',
                }}
            >
                <List
                    className={styles.dop_list}
                    split={false}
                    dataSource={searchItems}
                    renderItem={(item) => {
                        const findItem = fieldsData?.data.find(
                            (c) => item?.id === c.id,
                        )
                        return (
                            <List.Item>
                                <div className={styles.dop_listItemWrap}>
                                    <div className={styles.dop_nameWrap}>
                                        <Icons
                                            type={
                                                item?.data_type ||
                                                findItem?.data_type
                                            }
                                        />
                                        <div>
                                            <div className={styles.dop_name}>
                                                <div
                                                    className={styles.name}
                                                    title={item.alias}
                                                >
                                                    {item.alias}
                                                </div>
                                                {allowPrimary &&
                                                    (item?.primary_key ??
                                                        findItem?.primary_key) && (
                                                        <span
                                                            className={
                                                                styles.uniqueIcon
                                                            }
                                                        >
                                                            {__('主键')}
                                                        </span>
                                                    )}
                                            </div>
                                            <div
                                                className={styles.dop_name_en}
                                                title={
                                                    item?.name_en ||
                                                    findItem.name_en
                                                }
                                            >
                                                {item?.name_en ||
                                                    findItem.name_en}
                                            </div>
                                        </div>
                                    </div>
                                    <Tooltip title={__('该字段名称重复')}>
                                        <ExclamationCircleOutlined
                                            hidden={
                                                !item.editError ||
                                                item.editError.length === 0
                                            }
                                            style={{ color: '#f5222d' }}
                                        />
                                    </Tooltip>
                                </div>
                            </List.Item>
                        )
                    }}
                    locale={{
                        emptyText:
                            items.length === 0 ? (
                                <Empty
                                    iconSrc={dataEmpty}
                                    desc={__('暂无数据')}
                                />
                            ) : (
                                <Empty />
                            ),
                    }}
                />
                {/* <Pagination
                    current={offset}
                    pageSize={pageLimit}
                    onChange={(page) => {
                        setOffset(page)
                    }}
                    total={searchItems.length}
                    showSizeChanger={false}
                    hideOnSinglePage
                    size="small"
                    style={{ marginRight: 10, float: 'right' }}
                /> */}
            </div>
        </Modal>
    )
}

export default DataOutPreview
