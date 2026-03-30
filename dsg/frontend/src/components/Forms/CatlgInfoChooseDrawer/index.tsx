import React, { useEffect, useState } from 'react'
import { Button, Drawer, Space, Tooltip } from 'antd'
import classnames from 'classnames'
import { Resizable } from 're-resizable'
import styles from './styles.module.less'
import __ from './locale'
import { CloseOutlined } from '@/icons'
import ClassifyView from './ClassifyView'
import ColumnListView from './ColumnListView'
import CatlgListView from './CatlgListView'

interface IProps {
    open: boolean
    // 标题
    title?: string
    // 已选数据
    selDataItems: any[]
    // 选择模式 single单选，multiple多选
    mode?: 'single' | 'multiple'
    // 选择对象 column字段，catlg目录
    selectType?: 'column' | 'catlg'
    onClose: () => void
    onSure: (addItems: any[], delItems: any[], checkedItems: any[]) => void
    // 获取目录参数
    catlgParams?: any

    // 自定义底部内容
    footerTitle?: React.ReactNode
}

const CatlgInfoChooseDrawer = ({
    open,
    title,
    selDataItems = [],
    onClose,
    onSure,
    mode = 'multiple',
    selectType = 'column',
    catlgParams = {},
    footerTitle,
}: IProps) => {
    const [checkedItems, setCheckedItems] = useState<any[]>(selDataItems)
    const [selectedNode, setSelectedNode] = useState<any>({
        name: '全部',
        id: '',
    })
    // 当前查看的数据资源目录
    const [selCatlg, setSelCatlg] = useState<any>()
    // 是否展开更多
    const [isOpenMore, setIsOpenMore] = useState(false)

    useEffect(() => {
        if (open) {
            setCheckedItems(selDataItems)
            if (selectType === 'catlg' || mode === 'single') {
                setSelCatlg(selDataItems?.[0])
            }
        } else {
            setCheckedItems([])
            setSelCatlg(undefined)
        }
    }, [open])

    const handleOk = async () => {
        const addItems = checkedItems.filter(
            (item) => !selDataItems.find((_item) => _item.id === item.id),
        )
        const delItems = selDataItems.filter(
            (item) => !checkedItems.find((_item) => _item.id === item.id),
        )
        onSure(addItems, delItems, checkedItems)
    }

    // 选择/取消选择数据资源目录
    const handleChangeCatlg = (value?: any, isSel?: boolean) => {
        setSelCatlg(value)
        if (isSel) {
            if (selectType === 'catlg') {
                if (mode === 'single') {
                    setCheckedItems([value])
                } else {
                    setCheckedItems((prev) => [...(prev ?? []), value])
                }
            }
        } else if (selectType === 'catlg') {
            setCheckedItems((prev) =>
                prev?.filter((item) => item?.id !== value?.id),
            )
        }
    }

    // 选择/取消选择信息项
    const handleChangeColumn = (value?: any, isSel?: boolean) => {
        if (isSel) {
            if (mode === 'single') {
                setCheckedItems([value])
            } else {
                setCheckedItems((prev) => [...(prev ?? []), value])
            }
        } else {
            setCheckedItems((prev) =>
                prev?.filter((item) => item?.id !== value?.id),
            )
        }
    }

    const onDelete = (value: any) => {
        setCheckedItems(checkedItems.filter((item) => item.id !== value.id))
    }

    const getItemTooltipTitle = (item: any) => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                rowGap: 4,
                maxHeight: 400,
                overflow: 'hidden auto',
            }}
        >
            <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                {__('数据资源目录：')}
            </div>
            <div>{item.catalog_name}</div>
            <div style={{ color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                {__('字段名称：')}
            </div>
            <div>{item.business_name}</div>
        </div>
    )

    const getCheckedItemTag = (item: any) => {
        const isCatlg = selectType === 'catlg'
        const name = isCatlg ? item.name : item.business_name
        return (
            <div key={item.id} className={styles.selInfoItem}>
                <Tooltip
                    title={isCatlg ? '' : getItemTooltipTitle(item)}
                    color="#fff"
                    overlayInnerStyle={{
                        color: 'rgba(0,0,0,0.85)',
                    }}
                >
                    <div
                        className={styles.selFieldInfo}
                        title={isCatlg ? name : ''}
                    >
                        <div className={styles.selInfoItemName}>
                            {name || '--'}
                        </div>
                    </div>
                </Tooltip>
                {mode === 'multiple' && (
                    <CloseOutlined
                        className={styles.selInfoItemDelBtn}
                        onClick={() => onDelete(item)}
                    />
                )}
            </div>
        )
    }

    const footer = (
        <div className={styles.footer}>
            <div className={styles.selFieldList}>
                {footerTitle ? (
                    <div className={styles.footerTitle}>{footerTitle}</div>
                ) : (
                    <>
                        <div className={styles.selectedInfo}>
                            {__('已选（${text}）', {
                                text: checkedItems.length || '0',
                            })}
                        </div>
                        <div className={styles.selInfoItemsContWrapper}>
                            {checkedItems
                                ?.filter((item) => item.id)
                                ?.slice(0, 3)
                                ?.map((item) => getCheckedItemTag(item))}
                            {checkedItems.length > 3 && (
                                <Tooltip
                                    color="#fff"
                                    overlayInnerStyle={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        rowGap: 4,
                                        color: 'rgba(0,0,0,0.85)',
                                        maxHeight: 'calc(100vh - 133px)',
                                        overflow: 'hidden auto',
                                    }}
                                    trigger="click"
                                    placement="top"
                                    getPopupContainer={(n) =>
                                        n.parentElement || n
                                    }
                                    onOpenChange={(op) => {
                                        setIsOpenMore(op)
                                    }}
                                    title={checkedItems
                                        .slice(3)
                                        .map((item) => getCheckedItemTag(item))}
                                >
                                    <div
                                        className={classnames(
                                            styles.selInfoItemsMore,
                                            {
                                                [styles.moreOpen]: isOpenMore,
                                            },
                                        )}
                                    >
                                        {`+${checkedItems.length - 3}`}
                                    </div>
                                </Tooltip>
                            )}
                        </div>
                        {checkedItems.length > 0 && (
                            <div
                                onClick={() => setCheckedItems([])}
                                className={styles.clearAllBtn}
                            >
                                {__('清空')}
                            </div>
                        )}
                    </>
                )}
            </div>
            <Space size={8}>
                <Button onClick={onClose} className={styles.btnOp}>
                    {__('取消')}
                </Button>
                <Button
                    type="primary"
                    onClick={handleOk}
                    className={styles.btnOp}
                >
                    {__('确定')}
                </Button>
            </Space>
        </div>
    )
    return (
        <Drawer
            title={title || __('添加字段')}
            width="100%"
            maskClosable={false}
            open={open}
            onClose={onClose}
            footer={footer}
            destroyOnClose
            contentWrapperStyle={{
                maxWidth: '1000px',
            }}
            bodyStyle={{
                display: 'flex',
                padding: '0 0 0 0',
            }}
            className={styles.catlgInfoChooseDrawer}
        >
            <Resizable
                defaultSize={{ width: 250, height: '100%' }}
                maxWidth={250}
                minWidth={100}
                enable={{
                    right: true,
                }}
            >
                <ClassifyView onSelectNode={setSelectedNode} />
            </Resizable>
            <CatlgListView
                selectType={selectType}
                selectedNode={selectedNode}
                checkedItems={checkedItems}
                selCatlg={selCatlg}
                onChangeCatlg={handleChangeCatlg}
                catlgParams={catlgParams}
            />
            <Resizable
                defaultSize={{ width: 250, height: '100%' }}
                maxWidth={250}
                minWidth={100}
                boundsByDirection
                enable={{
                    left: true,
                }}
            >
                <ColumnListView
                    selectType={selectType}
                    selCatlg={selCatlg}
                    checkedItems={checkedItems}
                    onChangeColumn={handleChangeColumn}
                />
            </Resizable>
        </Drawer>
    )
}

export default CatlgInfoChooseDrawer
