import React, { useEffect, useState } from 'react'
import { Button, Modal, Radio, Space, Tooltip } from 'antd'
import classnames from 'classnames'
import List from 'rc-virtual-list'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { SearchInput } from '@/ui'
import Loader from '@/ui/Loader'
import {
    IAttributeWithLabel,
    ISubjectDomainItem,
    formatError,
    getAttributesByParentId,
} from '@/core'
import Empty from '@/ui/Empty'
import GlossaryDirTree from '../BusinessDomain/GlossaryDirTree'
import { BusinessDomainType } from '../BusinessDomain/const'
import dataEmpty from '@/assets/dataEmpty.svg'
import { ClassifyType } from './const'

interface IChooseAttribute {
    open: boolean
    onClose: () => void
    onOk: (params) => void
    dataSheetId: string
    fieldId: string
    isStart?: boolean
    selectedData?: any
}
const ChooseAttribute: React.FC<IChooseAttribute> = ({
    open,
    onClose,
    onOk,
    dataSheetId,
    fieldId,
    isStart = false,
    selectedData,
}) => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<ISubjectDomainItem[]>([])
    const [selectedAttr, setSelectedAttr] = useState<IAttributeWithLabel>()
    const [searchValue, setSearchValue] = useState('')
    const [attributes, setAttributes] = useState<IAttributeWithLabel[]>([])
    const [selectedTreeId, setSelectedTreeId] = useState('')

    useEffect(() => {
        if (selectedData) {
            setSelectedAttr({
                ...selectedData,
                id: selectedData.attribute_id,
                name: selectedData?.attribute_name,
                path_name: selectedData?.attribute_path,
            })
        }
    }, [selectedData])

    const getData = async (id: string, keyword: string = '') => {
        try {
            setLoading(true)
            const res = await getAttributesByParentId({
                parent_id: id,
                keyword,
                view_id: dataSheetId,
                field_id: fieldId,
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
            onOk({
                attribute_id: selectedAttr?.id,
                attribute_name: selectedAttr?.name,
                attribute_path: selectedAttr?.path_name,
                label_id: selectedAttr?.label_id,
                label_name: selectedAttr?.label_name,
                label_icon: selectedAttr?.label_icon,
                label_path: selectedAttr?.label_path,
                classfity_type: ClassifyType.Manual,
            })
            onClose()
        }
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
                    <div
                        className={styles['selected-name']}
                        title={selectedAttr?.path_name}
                    >
                        {__('已选择：')}
                        {selectedAttr?.name || '--'}
                    </div>
                    <Space>
                        <Button onClick={onClose}>{__('取消')}</Button>
                        <Tooltip title={!selectedAttr && __('请先选择属性')}>
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
                            placeholder={__('搜索业务对象或逻辑实体')}
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
                                                selectedAttr?.id === attr.id &&
                                                    styles[
                                                        'attr-item-selected'
                                                    ],
                                            )}
                                            key={attr.id}
                                            onClick={() =>
                                                setSelectedAttr(attr)
                                            }
                                        >
                                            <div
                                                className={
                                                    styles[
                                                        'attr-info-container'
                                                    ]
                                                }
                                            >
                                                <Radio
                                                    checked={
                                                        selectedAttr?.id ===
                                                        attr.id
                                                    }
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
                                                {attr.ls_recommend ? (
                                                    <div
                                                        className={
                                                            styles[
                                                                'recommend-flag'
                                                            ]
                                                        }
                                                    >
                                                        {__('推荐')}
                                                    </div>
                                                ) : (
                                                    <div />
                                                )}
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
