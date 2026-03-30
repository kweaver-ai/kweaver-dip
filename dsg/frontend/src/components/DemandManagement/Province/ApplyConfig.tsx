import { Button, Divider, Drawer, Select, Space, Switch, Table } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { ellipse } from '@antv/x6/lib/registry/port-layout/ellipse'
import __ from '../locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty, SearchInput } from '@/ui'
import { ISSZDCatalogInfoItem, ISSZDDictItem } from '@/core'

interface ISelectDataResource {
    open: boolean
    onClose: () => void
    infoItems: ISSZDCatalogInfoItem[]
    selectedInfoItems: ISSZDCatalogInfoItem[]
    onOk: (items: ISSZDCatalogInfoItem[], shareType: string) => void
    shareTypeOptions: ISSZDDictItem[]
    initShareType: string
}

const ApplyConfig = ({
    open,
    onClose,
    infoItems,
    selectedInfoItems,
    onOk,
    shareTypeOptions,
    initShareType,
}: ISelectDataResource) => {
    const [searchValue, setSearchValue] = useState<string>('')
    const [items, setItems] = useState<ISSZDCatalogInfoItem[]>(infoItems)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>(
        selectedInfoItems.map((i) => i.column_code),
    )
    // 只看选中时的选中keys
    const [checkedSelectedRowKeys, setCheckedSelectedRowKeys] = useState<
        string[]
    >([])
    const [checked, setChecked] = useState(false)
    const [shareType, setShareType] = useState<string>(initShareType)

    const showItems = useMemo(() => {
        return checked
            ? items
                  .filter((item) =>
                      (checked
                          ? [...checkedSelectedRowKeys]
                          : [...selectedRowKeys]
                      ).includes(item.column_code),
                  )
                  .filter(
                      (item) =>
                          item.column_name_cn
                              .toLocaleLowerCase()
                              .includes(searchValue) ||
                          item.column_name_en
                              .toLocaleLowerCase()
                              .includes(searchValue),
                  )
            : items.filter(
                  (item) =>
                      item.column_name_cn
                          .toLocaleLowerCase()
                          .includes(searchValue) ||
                      item.column_name_en
                          .toLocaleLowerCase()
                          .includes(searchValue),
              )
    }, [checked, searchValue, selectedRowKeys, checkedSelectedRowKeys])

    const columns = [
        {
            title: __('信息项业务名称'),
            dataIndex: 'column_name_cn',
            key: 'column_name_cn',
            ellipse: true,
        },
        {
            title: __('信息项技术名称'),
            dataIndex: 'column_name_en',
            key: 'column_name_en',
            ellipse: true,
        },
    ]

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        if (checked) {
            if (searchValue) {
                // 搜索时改变选中项，将原有的选中项中去除掉搜索结果的全部key，在与新的选中项合并
                setCheckedSelectedRowKeys([
                    ...checkedSelectedRowKeys.filter(
                        (key) =>
                            !showItems
                                .map((item) => item.column_code)
                                .includes(key),
                    ),
                    ...(newSelectedRowKeys as string[]),
                ])
            } else {
                setCheckedSelectedRowKeys(newSelectedRowKeys as string[])
            }
        } else if (searchValue) {
            setSelectedRowKeys([
                ...selectedRowKeys.filter(
                    (key) =>
                        !showItems
                            .map((item) => item.column_code)
                            .includes(key),
                ),
                ...(newSelectedRowKeys as string[]),
            ])
        } else {
            setSelectedRowKeys(newSelectedRowKeys as string[])
        }
    }

    const rowSelection = {
        selectedRowKeys: checked ? checkedSelectedRowKeys : selectedRowKeys,
        onChange: onSelectChange,
    }

    const handleOk = () => {
        onOk(
            items.filter((item) => selectedRowKeys.includes(item.column_code)),
            shareType || '',
        )
        onClose()
    }

    return (
        <Drawer
            title={__('申请配置')}
            width={640}
            open={open}
            onClose={onClose}
            bodyStyle={{ padding: '16px 24px' }}
            footer={
                <Space className={styles['choose-resource-footer']}>
                    <Button onClick={onClose} className={styles.btn}>
                        {__('取消')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleOk}
                        className={styles.btn}
                        style={{ width: 80 }}
                    >
                        {__('保存')}
                    </Button>
                </Space>
            }
        >
            <div className={styles['apply-config-wrapper']}>
                <div className={styles['res-name']}>
                    <FontIcon
                        name="icon-shujumuluguanli1"
                        type={IconType.COLOREDICON}
                        className={styles.icon}
                    />
                    数据资源目录
                </div>
                <div className={styles['share-type-label']}>
                    {__('共享类型')}
                </div>
                <Select
                    placeholder={__('请选择')}
                    className={styles['share-type-select']}
                    options={shareTypeOptions}
                    fieldNames={{ label: 'dict_value', value: 'dict_key' }}
                    value={shareType || undefined}
                    onChange={(e) => setShareType(e)}
                />
                <div className={styles['info-items-label']}>
                    <span className={styles['required-flag']}>*</span>
                    {__('信息项配置')}
                </div>
                <div className={styles['operate-container']}>
                    <div className={styles['operate-left']}>
                        {__('已选：')}
                        {`(${selectedRowKeys.length}/${items.length})`}
                        <FontIcon
                            name="icon-qingkong"
                            type={IconType.COLOREDICON}
                            className={styles['clear-icon']}
                            onClick={() => {
                                if (checked) {
                                    setCheckedSelectedRowKeys([])
                                } else {
                                    setSelectedRowKeys([])
                                }
                            }}
                        />
                        <Divider type="vertical" />
                        {__('只看已选')}
                        <Switch
                            size="small"
                            className={styles.switch}
                            checked={checked}
                            onChange={(e) => {
                                if (e) {
                                    setCheckedSelectedRowKeys(selectedRowKeys)
                                } else {
                                    setSelectedRowKeys(checkedSelectedRowKeys)
                                }
                                setChecked(e)
                            }}
                        />
                    </div>
                    <SearchInput
                        style={{ width: 286, height: 32 }}
                        placeholder={__('业务名称/技术名称')}
                        value={searchValue}
                        onKeyChange={(kw: string) => setSearchValue(kw)}
                    />
                </div>
                <Table
                    dataSource={showItems}
                    columns={columns}
                    rowKey="column_code"
                    locale={{ emptyText: <Empty /> }}
                    rowSelection={rowSelection}
                    pagination={{ hideOnSinglePage: true, size: 'small' }}
                />
            </div>
        </Drawer>
    )
}

export default ApplyConfig
