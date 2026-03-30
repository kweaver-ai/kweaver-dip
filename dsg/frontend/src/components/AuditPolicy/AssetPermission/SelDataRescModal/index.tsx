import {
    Button,
    Modal,
    ModalProps,
    Select,
    Tooltip,
    Dropdown,
    Space,
    MenuProps,
    message,
    Radio,
} from 'antd'
import React, { memo, useEffect, useMemo, useState } from 'react'
import Icon, {
    InfoCircleFilled,
    DownOutlined,
    CloseOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons'
import { uniqBy } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import { ViewType, unCategorizedKey, viewOptionList } from './helper'
import ArchitectureDirTree from '@/components/BusinessArchitecture/ArchitectureDirTree'
import GlossaryDirTree from '@/components/BusinessDomain/GlossaryDirTree'
import { Architecture } from '@/components/BusinessArchitecture/const'
import { UNGROUPED } from '@/components/BusiArchitecture/const'
import DatasourceTree from '@/components/DatasheetView/DatasourceTree'
import DataRescList from './DataRescList'
import { DsType } from '@/components/DatasheetView/const'
import { BusinessDomainType } from '@/components/BusinessDomain/const'
import { getDataRescTypeIcon } from '@/components/DataAssetsCatlg/DataResc/helper'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import IndicatorViewDetail from '@/components/DataAssetsCatlg/IndicatorViewDetail'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import { PolicyDataRescType } from '@/core'
import { RescCatlgType } from '@/components/ResourcesDir/const'
import ResourcesDirTree from '@/components/ResourcesDir/ResourcesDirTree'
import { rescCatlgItems } from '@/components/ResourcesDir/helper'
import { getPopupContainer } from '@/utils'

// 单条策略最多可添加1000个审核资源
export const policyRescMaxNum = 1000

interface ISelDataRescModal extends ModalProps {
    open: boolean
    removeIds?: string[] // 移除的资源id
    originCheckedList?: Array<any>[]
    onClose: () => void
    onSure: (info) => void
}
/**
 * 库表选择窗
 */
const SelDataRescModal: React.FC<ISelDataRescModal> = ({
    open,
    removeIds = [],
    originCheckedList = [],
    onClose,
    onSure,
    ...props
}) => {
    const [checkedItem, setCheckedItem] = useState<Array<any>>([])
    const [viewKey, setViewKey] = useState<string>()
    const [selectedNode, setSelectedNode] = useState<any>()
    const [dataType, setDataType] = useState<DsType>()
    const [dropdownItems, setDropdownItems] = useState<any>([])

    const [selectedResc, setSelectedResc] = useState<any>()
    // 视图详情
    const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)
    // 接口详情
    const [interfaceDetailOpen, setInterfaceDetailOpen] =
        useState<boolean>(false)
    // 指标详情
    const [indicatorDetailOpen, setIndicatorDetailOpen] =
        useState<boolean>(false)

    // 本次可添加资源数最大值
    const curOptionalMaxCount = useMemo(() => {
        const count =
            policyRescMaxNum -
            (originCheckedList?.length || 0) -
            (checkedItem?.length || 0)
        return count > 0 ? count : 0
    }, [originCheckedList, checkedItem])

    const bindItems = useMemo(() => {
        // 过滤掉包含 status 属性的数据 即保留选中但未更新的数据
        return originCheckedList?.filter(
            (item) => !Object.prototype.hasOwnProperty.call(item, 'status'),
        )
    }, [originCheckedList])

    const handleClickDetail = (item) => {
        setSelectedResc(item)
        const { type } = item
        if (type === PolicyDataRescType.LOGICALVIEW) {
            setViewDetailOpen(true)
        } else if (type === PolicyDataRescType.INTERFACE) {
            setInterfaceDetailOpen(true)
        } else if (type === PolicyDataRescType.INDICATOR) {
            setIndicatorDetailOpen(true)
        }
    }

    const handleOk = async () => {
        onSure(uniqBy([...originCheckedList, ...checkedItem], 'id'))
        setCheckedItem([])
    }

    const removeDropList = (key: string) => {
        let newCheckItems: any = []
        if (key !== 'all') {
            newCheckItems = checkedItem.filter(
                (checkItem) => checkItem.id !== key,
            )
        }
        setCheckedItem(newCheckItems)
    }

    useEffect(() => {
        const initailItem = {
            label: (
                <div
                    className={styles['choose-lv-bottom-title']}
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className={styles['choose-lv-bottom-title-text']}>
                        {__('本次已选')}：{checkedItem.length} 个
                    </span>
                    <a
                        className={styles['choose-lv-bottom-title-clearAll']}
                        onClick={() => removeDropList('all')}
                    >
                        {__('清空')}
                    </a>
                </div>
            ),
            key: `initail`,
        }
        const dropList = checkedItem.map((listItem: any) => {
            const { type } = listItem
            return {
                label: (
                    <div
                        className={styles['choose-lv-bottom-item']}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Space size={8}>
                            {getDataRescTypeIcon(
                                {
                                    type,
                                    indicator_type: listItem.sub_type,
                                },
                                20,
                            )}
                            <span
                                className={styles['choose-lv-bottom-text']}
                                title={listItem.name}
                                onClick={() => handleClickDetail(listItem)}
                            >
                                {listItem.name || listItem.name}
                            </span>
                        </Space>
                        <CloseOutlined
                            onClick={() => removeDropList(listItem.id)}
                        />
                    </div>
                ),
                key: `${listItem.id}`,
            }
        })
        const newDropList = [initailItem, ...dropList]
        setDropdownItems(newDropList)
    }, [checkedItem])

    const footer = (
        <div className={styles['choose-lv-bottom']}>
            <div className={styles['choose-lv-bottom-box']}>
                <div className={styles['choose-lv-bottom-box-tip']}>
                    <InfoCircleOutlined style={{ fontSize: '16px' }} />
                    <span>{__('展示已上线的资源')}</span>
                </div>

                {checkedItem?.length > 0 && (
                    <Dropdown
                        menu={{
                            items: dropdownItems,
                        }}
                        trigger={['click']}
                        getPopupContainer={(node) => node}
                    >
                        <a onClick={(e) => e.preventDefault()}>
                            <Space>
                                <span>
                                    {__('本次已选')}：{checkedItem.length} 个
                                </span>
                                <DownOutlined />
                            </Space>
                        </a>
                    </Dropdown>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    style={{ width: 80, height: 32, marginRight: 12 }}
                    onClick={onClose}
                >
                    {__('取消')}
                </Button>
                <Tooltip
                    placement="topRight"
                    overlayStyle={{ maxWidth: 400 }}
                    title={
                        checkedItem.length
                            ? (originCheckedList?.length || 0) +
                                  (checkedItem.length || 0) >
                              policyRescMaxNum
                                ? __(
                                      '您选择的资源已超出策略上限，请至少移除${text}个资源。',
                                      {
                                          text:
                                              Math.abs(
                                                  (originCheckedList?.length ||
                                                      0) +
                                                      (checkedItem.length ||
                                                          0) -
                                                      policyRescMaxNum,
                                              ) || '0',
                                      },
                                  )
                                : ''
                            : __('请先选择数据资源')
                    }
                >
                    <Button
                        style={{ width: 80, height: 32 }}
                        type="primary"
                        disabled={
                            !checkedItem?.length ||
                            (originCheckedList?.length || 0) +
                                (checkedItem.length || 0) >
                                policyRescMaxNum
                        }
                        onClick={handleOk}
                    >
                        {__('确定')}
                    </Button>
                </Tooltip>
            </div>
        </div>
    )

    return (
        <>
            <Modal
                title={
                    <div className={styles.modalTitleWrapper}>
                        <div className={styles.modalTitle}>
                            {__('添加审核资源')}
                        </div>
                        <div className={styles.modalTitleTip}>
                            {__(
                                '（当前策略还允许添加${text}个资源，上限1000个）',
                                {
                                    text: curOptionalMaxCount || '0',
                                },
                            )}
                        </div>
                    </div>
                }
                width={1024}
                maskClosable={false}
                open={open}
                onCancel={onClose}
                onOk={handleOk}
                destroyOnClose
                getContainer={false}
                okButtonProps={{
                    disabled: checkedItem.length === 0,
                }}
                footer={footer}
                bodyStyle={{ height: 484, padding: 0 }}
                className={styles.selDataRescModal}
                {...props}
            >
                <div className={styles['choose-lv']}>
                    <div className={styles['choose-lv-left']}>
                        <ResourcesDirTree
                            getCurTabKey={setViewKey}
                            getSelectedNode={(node) => {
                                if (node) {
                                    setSelectedNode(node)
                                } else {
                                    setSelectedNode({ id: '' })
                                }
                            }}
                            // ref={ref}
                            initNodeType={[
                                Architecture.ORGANIZATION,
                                Architecture.DEPARTMENT,
                            ].join()}
                            selectOptions={rescCatlgItems.filter((currentTab) =>
                                [
                                    RescCatlgType.DOAMIN,
                                    RescCatlgType.ORGSTRUC,
                                ].includes(currentTab.value),
                            )}
                            filterDomainType={[
                                BusinessDomainType.subject_domain_group,
                                BusinessDomainType.subject_domain,
                                BusinessDomainType.business_object,
                                BusinessDomainType.business_activity,
                            ]}
                            limitDomainTypes={[
                                BusinessDomainType.business_object,
                                BusinessDomainType.business_activity,
                            ]}
                            domainPlaceholder={__(
                                '搜索主题域分组、主题域、业务对象/活动',
                            )}
                            defaultActiveKey={RescCatlgType.DOAMIN}
                            needUncategorized
                            unCategorizedKey={unCategorizedKey}
                        />
                    </div>
                    <div className={styles['choose-lv-right']}>
                        <DataRescList
                            viewKey={viewKey}
                            selectedNode={selectedNode}
                            bindItems={bindItems}
                            checkItems={checkedItem}
                            setCheckItems={setCheckedItem}
                            removeIds={removeIds}
                            onTabChange={(activeTabKey) => {
                                // setSelectedNode()
                            }}
                            handleClickDetail={handleClickDetail}
                        />
                    </div>
                </div>
            </Modal>

            {viewDetailOpen && (
                <LogicViewDetail
                    open={viewDetailOpen}
                    onClose={() => {
                        setViewDetailOpen(false)
                    }}
                    hasPermission={selectedResc?.has_permission}
                    id={selectedResc?.id}
                    // isIntroduced={isIntroduced}
                    canChat
                    getContainer={getPopupContainer()}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: 0,
                    }}
                />
            )}
            {indicatorDetailOpen && (
                <IndicatorViewDetail
                    open={indicatorDetailOpen}
                    // isIntroduced={isIntroduced}
                    id={selectedResc?.id}
                    onClose={() => {
                        setIndicatorDetailOpen(false)
                    }}
                    indicatorType={selectedResc?.indicator_type || ''}
                    canChat
                    getContainer={getPopupContainer()}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: 0,
                    }}
                />
            )}
            {interfaceDetailOpen && (
                <div hidden={!interfaceDetailOpen}>
                    <ApplicationServiceDetail
                        open={interfaceDetailOpen}
                        onClose={() => {
                            setInterfaceDetailOpen(false)
                            // 提交申请后，更新列表状态
                            // getApplicationData([], searchKeyword)
                        }}
                        hasPermission={selectedResc?.has_permission}
                        serviceCode={selectedResc?.id}
                        getContainer={getPopupContainer()}
                        style={{
                            position: 'fixed',
                            width: '100vw',
                            height: '100vh',
                            top: 0,
                        }}
                    />
                </div>
            )}
        </>
    )
}

export default SelDataRescModal
