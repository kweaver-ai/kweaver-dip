import React, { useEffect, useState } from 'react'
import { Modal, Tabs, Table } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import ViewRules from './ViewRules'
import { getDatasheetViewDetails, formatError } from '@/core'
import { AuthorityNameMap } from './const'
import dataEmpty from '@/assets/dataEmpty.svg'
import { SearchInput, Empty } from '@/ui'

interface IViewRulesModal {
    open: boolean
    onClose: () => void
    rulesDetails: any
}

const ViewRulesModal: React.FC<IViewRulesModal> = ({
    open,
    onClose,
    rulesDetails,
}) => {
    const [activeKey, setActiveKey] = useState<string>('1')
    const [viewFields, setViewFields] = useState<any>([])
    const [logicViewDataSource, setLogicViewDataSource] = useState<any[]>([])
    const [tableList, setTableList] = useState<any[]>([])
    const [searchKey, setSearchKey] = useState<string>('')

    useEffect(() => {
        if (rulesDetails) {
            const users = (rulesDetails.references || [])
                .filter((o) => o.user)
                .map((o) => o.user)
            const departments = (rulesDetails.references || [])
                .filter((o) => o.department)
                .map((o) => o.department)

            const list = rulesDetails.policies?.map((o) => {
                const user = users?.find((it) => it.id === o.subject_id)
                const departs = departments?.filter((it) =>
                    user?.department_ids?.includes(it.id),
                )
                const department = departs?.map((it) => it?.name)?.join('/')
                return {
                    ...o,
                    subject_name: user?.name,
                    department,
                }
            })
            setTableList(list)
            setLogicViewDataSource(list)
            getFormViewfields(rulesDetails?.logic_view_id)
        }
    }, [])

    const items = [
        {
            label: __('申请规则'),
            key: '1',
        },
        {
            label: __('访问者列表'),
            key: '2',
        },
    ]
    const columns = [
        {
            title: __('访问者'),
            dataIndex: 'subject_name',
            key: 'subject_name',
            ellipsis: true,
        },
        {
            title: __('所属部门'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
        },
        {
            title: __('访问权限'),
            dataIndex: 'actions',
            key: 'actions',
            width: 220,
            render: (actions: string[]) =>
                actions
                    .sort(
                        (a, b) =>
                            b.toLowerCase().charCodeAt(0) -
                            a.toLowerCase().charCodeAt(0),
                    )
                    .map((action) => AuthorityNameMap[action])
                    .join('/'),
        },
    ]
    const getFormViewfields = async (logicViewId: string) => {
        try {
            if (!logicViewId) return
            const res = await getDatasheetViewDetails(logicViewId)
            setViewFields(res?.fields)
        } catch (err) {
            formatError(err)
        }
    }
    return (
        <Modal
            title={__('查看行/列规则')}
            onCancel={onClose}
            open={open}
            width={1144}
            className={styles.modalWrapper}
            footer={null}
            maskClosable={false}
        >
            <div className={styles.modalBox}>
                <Tabs
                    activeKey={activeKey}
                    onChange={setActiveKey}
                    items={items}
                />
                {activeKey === '1' ? (
                    <ViewRules
                        fields={viewFields}
                        detail={rulesDetails?.detail}
                    />
                ) : activeKey === '2' ? (
                    <div className={styles['table-container']}>
                        <div className={styles['table-container-inp']}>
                            <SearchInput
                                maxLength={255}
                                value={searchKey}
                                onKeyChange={(kw: string) => {
                                    setTableList(
                                        kw
                                            ? logicViewDataSource.filter(
                                                  (item) =>
                                                      item.subject_name
                                                          .toLocaleLowerCase()
                                                          .includes(
                                                              kw.toLocaleLowerCase(),
                                                          ),
                                              )
                                            : logicViewDataSource,
                                    )
                                    setSearchKey(kw)
                                }}
                                style={{ width: 272 }}
                                placeholder={__('搜索访问者')}
                            />
                        </div>
                        {logicViewDataSource?.length > 0 ? (
                            <Table
                                dataSource={tableList}
                                columns={columns}
                                pagination={false}
                                rowKey="id"
                                locale={{
                                    emptyText: <Empty />,
                                }}
                            />
                        ) : (
                            <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                        )}
                    </div>
                ) : null}
            </div>
        </Modal>
    )
}

export default ViewRulesModal
