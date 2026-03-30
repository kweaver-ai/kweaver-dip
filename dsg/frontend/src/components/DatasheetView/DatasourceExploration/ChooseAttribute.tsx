import React, { useEffect, useState } from 'react'
import { Button, Checkbox, Dropdown, Modal, Radio, Space, Tooltip } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import List from 'rc-virtual-list'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import __ from '../locale'
import { SearchInput } from '@/ui'
import Loader from '@/ui/Loader'
import {
    IAttributeWithLabel,
    ISubjectDomainItem,
    formatError,
    getAttributesByParentId,
} from '@/core'
import Empty from '@/ui/Empty'
import GlossaryDirTree from '../../BusinessDomain/GlossaryDirTree'
import { BusinessDomainType } from '../../BusinessDomain/const'
import dataEmpty from '@/assets/dataEmpty.svg'
import { ClassifyType } from '../const'
import DropDownFilter from '@/components/DropDownFilter'

interface IChooseAttribute {
    open: boolean
    onClose: () => void
    onOk: (params) => void
    isStart?: boolean
    selectedData?: Array<any>
}
const ChooseAttribute: React.FC<IChooseAttribute> = ({
    open,
    onClose,
    onOk,
    isStart = false,
    selectedData = [],
}) => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<ISubjectDomainItem[]>([])
    const [selectedAttr, setSelectedAttr] = useState<Array<any>>([])
    const [searchValue, setSearchValue] = useState('')
    const [attributes, setAttributes] = useState<IAttributeWithLabel[]>([])
    const [selectedTreeId, setSelectedTreeId] = useState('')
    const [dropdownOpen, setDropdownOpen] = useState(false)

    useEffect(() => {
        if (selectedData) {
            setSelectedAttr(selectedData)
        }
    }, [selectedData])

    const getData = async (id: string, keyword: string = '') => {
        try {
            setLoading(true)
            const res = await getAttributesByParentId({
                parent_id: id,
                keyword,
            })
            setAttributes(res.attributes)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const getSelectedDomain = (so: ISubjectDomainItem) => {
        setSelectedTreeId(so.id)
        getData(so.id, searchValue)
    }

    const handleOk = () => {
        if (selectedAttr) {
            onOk(selectedAttr)
            onClose()
        }
    }
    /**
     * 点击属性
     * @param attr
     */
    const handleClickAttr = (attr: IAttributeWithLabel) => {
        const foundAttr = selectedAttr?.find((item) => item.id === attr.id)
        if (foundAttr) {
            setSelectedAttr(
                selectedAttr?.filter((item) => item.id !== attr.id) || [],
            )
        } else {
            setSelectedAttr([...selectedAttr, attr])
        }
    }

    /**
     * 下拉框内容
     * @returns
     */
    const dropDownRender = () => {
        return (
            <div className={styles.dropdownContainer}>
                <div className={styles.titleWrapper}>
                    <div className={styles.titleText}>
                        {__('已选择：${number}个', {
                            number: selectedAttr?.length || '0',
                        })}
                    </div>
                    <Button type="link" onClick={() => setSelectedAttr([])}>
                        {__('清空')}
                    </Button>
                </div>
                <div className={styles.listWrapper}>
                    {selectedAttr?.map((item) => (
                        <div className={styles.item}>
                            <div className={styles.textWrapper}>
                                <FontIcon
                                    name="icon-shuxing"
                                    className={styles.icon}
                                />
                                <span className={styles.text}>{item.name}</span>
                            </div>

                            <CloseOutlined
                                onClick={() => {
                                    handleClickAttr(item)
                                    setDropdownOpen(false)
                                }}
                                className={styles.closeIcon}
                            />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <Modal
            title={__('请选择分类属性')}
            width={800}
            open={open}
            bodyStyle={{ padding: 0, height: 492 }}
            onCancel={onClose}
            footer={
                <div className={styles['choose-attr-footer']}>
                    <Dropdown
                        dropdownRender={dropDownRender}
                        open={dropdownOpen}
                        onOpenChange={(currentOpen) => {
                            setDropdownOpen(currentOpen)
                        }}
                        getPopupContainer={(node) =>
                            node.parentNode as HTMLElement
                        }
                        trigger={['click']}
                    >
                        <Button
                            className={styles['selected-name']}
                            type="link"
                            disabled={!selectedAttr?.length}
                        >
                            {__('已选择：${number}个', {
                                number: selectedAttr?.length || '0',
                            })}
                        </Button>
                    </Dropdown>
                    <Space>
                        <Button onClick={onClose}>{__('取消')}</Button>
                        <Tooltip
                            title={!selectedAttr?.length && __('请先选择属性')}
                        >
                            <Button
                                type="primary"
                                onClick={handleOk}
                                disabled={!selectedAttr}
                            >
                                {__('确定')}
                            </Button>
                        </Tooltip>
                    </Space>
                </div>
            }
        >
            <div className={styles['choose-attr-wrapper']}>
                <div className={styles.left}>
                    <div className={styles['tree-container']}>
                        <div className={styles['left-title']}>
                            {__('业务对象')}
                        </div>
                        <GlossaryDirTree
                            getSelectedKeys={getSelectedDomain}
                            placeholder={__(
                                '搜索业务对象分组、业务对象、业务对象/活动或逻辑实体',
                            )}
                            filterType={[
                                BusinessDomainType.subject_domain_group,
                                BusinessDomainType.subject_domain,
                                BusinessDomainType.business_object,
                                BusinessDomainType.business_activity,
                                BusinessDomainType.logic_entity,
                            ]}
                            limitTypes={[BusinessDomainType.logic_entity]}
                        />
                    </div>
                </div>
                <div className={styles['middle-line']} />
                <div className={styles.right}>
                    {loading ? (
                        <div className={styles.loader}>
                            <Loader />
                        </div>
                    ) : (
                        <>
                            {!(attributes.length === 0 && !searchValue) && (
                                <>
                                    <div className={styles['right-title']}>
                                        {__('属性')}
                                    </div>
                                    <SearchInput
                                        placeholder={__('搜索属性')}
                                        value={searchValue}
                                        onKeyChange={(value: string) => {
                                            setSearchValue(value)
                                            getData(selectedTreeId, value)
                                        }}
                                        maxLength={300}
                                    />
                                </>
                            )}

                            <div className={styles['attr-items-container']}>
                                <div>
                                    {attributes.length === 0 && searchValue && (
                                        <Empty />
                                    )}
                                    {attributes.length === 0 &&
                                        !searchValue && (
                                            <div style={{ marginTop: 50 }}>
                                                <Empty
                                                    iconSrc={dataEmpty}
                                                    desc={__('无属性信息')}
                                                />
                                            </div>
                                        )}
                                </div>
                                <List
                                    data={attributes}
                                    height={386}
                                    itemHeight={58}
                                    itemKey="id"
                                >
                                    {(attr) => (
                                        <div
                                            className={classnames(
                                                styles['attr-item'],
                                                selectedAttr.find(
                                                    (item) =>
                                                        item.id === attr.id,
                                                ) &&
                                                    styles[
                                                        'attr-item-selected'
                                                    ],
                                            )}
                                            key={attr.id}
                                            onClick={() =>
                                                handleClickAttr(attr)
                                            }
                                        >
                                            <div
                                                className={
                                                    styles[
                                                        'attr-info-container'
                                                    ]
                                                }
                                            >
                                                <Checkbox
                                                    checked={selectedAttr?.find(
                                                        (item) =>
                                                            item.id === attr.id,
                                                    )}
                                                />
                                                <FontIcon
                                                    name="icon-shuxing"
                                                    className={
                                                        styles['attr-icon']
                                                    }
                                                />
                                                <div
                                                    className={
                                                        styles['attr-info']
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles['attr-name']
                                                        }
                                                        title={attr.name}
                                                    >
                                                        {attr.name}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles['attr-path']
                                                        }
                                                        title={attr.path_name.substring(
                                                            0,
                                                            attr.path_name
                                                                .length -
                                                                attr.name
                                                                    .length -
                                                                1,
                                                        )}
                                                    >
                                                        {attr.path_name.substring(
                                                            0,
                                                            attr.path_name
                                                                .length -
                                                                attr.name
                                                                    .length -
                                                                1,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className={
                                                    styles['flag-container']
                                                }
                                            >
                                                {attr.label_id &&
                                                    attr.label_name &&
                                                    isStart && (
                                                        <div
                                                            className={
                                                                styles[
                                                                    'attr-tag'
                                                                ]
                                                            }
                                                            style={{
                                                                color: attr.label_icon,
                                                                borderColor:
                                                                    attr.label_icon,
                                                            }}
                                                            title={`${__(
                                                                '数据分级标签：',
                                                            )}${
                                                                attr.label_name
                                                            }`}
                                                        >
                                                            <FontIcon
                                                                name="icon-biaoqianicon"
                                                                className={
                                                                    styles[
                                                                        'tag-icon'
                                                                    ]
                                                                }
                                                            />
                                                            <span>
                                                                {
                                                                    attr.label_name
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </List>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    )
}

export default ChooseAttribute
