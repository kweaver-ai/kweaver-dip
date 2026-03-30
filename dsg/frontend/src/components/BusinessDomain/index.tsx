import { Button, message } from 'antd'
import { useMemo, useRef, useState } from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import { dropRight, last } from 'lodash'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import empty from '@/assets/emptyAdd.svg'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { delCategories, formatError, PermissionScope } from '@/core'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { getPlatformNumber } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import DragBox from '../DragBox'
import ExportSubjectDomains from './ExportSubjectDomains'
import GlossaryDetail from './GlossaryDetail'
import GlossaryDirTree from './GlossaryDirTree'
import GlossaryModal from './GlossaryModal'
import ImportSubjectDomains from './ImportSubjectDomains'
import { BusinessDomainType } from './const'
import __ from './locale'
import styles from './styles.module.less'

const BusinessGlossary = () => {
    const treeRef: any = useRef()
    const navigator = useNavigate()
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [opType, setOpType] = useState<string>('')
    const [modalCurrentData, setModalCurrentData] = useState<any>({})
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const modalRef: any = useRef()
    const detailRef: any = useRef()
    const [selectedNode, setSelectedNode] = useState<any>({})
    const [importVisible, setImportVisible] = useState<boolean>(false)
    const [exportVisible, setExportVisible] = useState<boolean>(false)
    const { checkPermission } = useUserPermCtx()
    const platformNumber = getPlatformNumber()

    const hasAddPermission = useMemo(
        () =>
            checkPermission([
                {
                    key: 'manageDataClassification',
                    scope: PermissionScope.All,
                },
            ]),
        [checkPermission],
    )

    const moreItems = useMemo(() => {
        const items = [
            { key: 'import', label: __('导入') },
            { key: 'export', label: __('导出') },
        ]
        return hasAddPermission
            ? items
            : items.filter((item) => item.key !== 'import')
    }, [hasAddPermission])

    const toAdd = () => {
        handleOperate('addTerms', { type: '' })
    }

    const renderDomainEmpty = () => {
        return (
            <Empty
                desc={
                    hasAddPermission ? (
                        <div>
                            {__('点击')}
                            <Button type="link" onClick={() => toAdd()}>
                                【{__('新建')}】
                            </Button>
                            {__('或')}
                            <Button
                                type="link"
                                onClick={() => handleMore({ key: 'import' })}
                            >
                                【{__('导入')}】
                            </Button>
                            {
                                // platformNumber === LoginPlatform.default
                                //     ? __('按钮，可新建主题域分组')
                                //     :
                                __('按钮，可新建业务对象分组')
                            }
                        </div>
                    ) : (
                        <div>
                            {
                                // platformNumber === LoginPlatform.default
                                //     ? __('您当前没有创建主题域分组的权限')
                                //     :
                                __('您当前没有创建业务对象分组的权限')
                            }
                        </div>
                    )
                }
                iconSrc={hasAddPermission ? empty : dataEmpty}
            />
        )
    }

    const handleOperate = (op, data) => {
        setOpType(op)
        setModalCurrentData(data)
        switch (op) {
            case 'del':
                confirm({
                    title: `${__(`确定要删除吗？`)}`,
                    icon: (
                        <ExclamationCircleFilled
                            style={{ color: 'rgb(250 173 20)' }}
                        />
                    ),
                    content: __(
                        '删除后将无法找回，同时关联的业务表字段会一并删除，请谨慎操作！',
                    ),
                    async onOk() {
                        try {
                            await delCategories(data.id)
                            message.success(__(`删除成功`))
                            await treeRef.current?.execNode('delete', data.id)
                            detailRef.current?.setSearchParams((prev) => ({
                                ...prev,
                                offset:
                                    detailRef.current?.categoriesAndTermsData
                                        ?.entries?.length === 1
                                        ? prev.offset - 1 || 1
                                        : prev.offset,
                            }))
                        } catch (error) {
                            if (
                                error.data.code ===
                                'BusinessGrooming.Glossary.ObjectNotExist'
                            ) {
                                message.error(
                                    __('${name}被删除，请刷新后重试', {
                                        name: data.name,
                                    }),
                                )
                                return
                            }
                            formatError(error)
                        }
                    },
                    onCancel() {},
                    okText: __('确定'),
                    cancelText: __('取消'),
                })
                break
            case 'editDefine':
                navigator(
                    `/standards/define?objId=${data.id}&name=${data.name}&type=${data.type}`,
                )
                break
            default:
                modalRef?.current?.setOpen(true)
        }
    }

    const modalOk = async (type: string, data) => {
        // 新建业务域
        if (!modalCurrentData.type) {
            detailRef.current?.getGlossaryLevelList()
        }
        // 操作树节点ID和详情ID相同时，才更新详情数据
        if (modalCurrentData?.id === selectedNode.id) {
            if (selectedNode.type && type !== 'addTerms')
                detailRef.current?.getDetails()
        } else if (
            last(dropRight(modalCurrentData?.path_id?.split('/'), 1)) ===
            selectedNode.id
        ) {
            detailRef.current?.getGlossaryLevelList()
        }

        // 新建
        if (type === 'addTerms') {
            await treeRef.current?.execNode(
                'add',
                modalCurrentData?.id,
                data.id,
            )
        }
        // 编辑
        if (type === 'edit') {
            await treeRef.current?.execNode('edit', modalCurrentData?.id)
            // 若选中节点为L3 编辑时更新名字或类型时，画布中要更新名字和图标
            // 选中L3且需操作节点为当前节点才更新
            if (
                [
                    BusinessDomainType.business_activity,
                    BusinessDomainType.business_object,
                ].includes(selectedNode.type) &&
                data &&
                selectedNode?.id === data?.id
            ) {
                setSelectedNode({ ...selectedNode, ...data })
            }
        }
    }

    // 更多操作
    const handleMore = ({ key }) => {
        switch (key) {
            case 'import':
                setImportVisible(true)
                break
            case 'export':
                setExportVisible(true)
                break
            default:
                break
        }
    }

    return (
        <div className={styles.businessGlossaryWrapper}>
            {isLoading && (
                <div className={styles.emptyBox}>
                    <Loader />
                </div>
            )}
            {isEmpty && (
                <div className={styles.emptyBox}>{renderDomainEmpty()}</div>
            )}
            <div style={{ display: isLoading || isEmpty ? 'none' : 'block' }}>
                <DragBox
                    defaultSize={defaultSize}
                    minSize={[280, 270]}
                    maxSize={[800, Infinity]}
                    onDragEnd={(size) => {
                        setDefaultSize(size)
                    }}
                >
                    <div className={styles.left}>
                        <div className={styles['left-title']}>
                            {/* {platformNumber === LoginPlatform.default
                                ? __('主题定义')
                                : __('业务对象分组')} */}
                            {__('业务对象分组')}
                        </div>
                        <GlossaryDirTree
                            ref={treeRef}
                            getSelectedKeys={setSelectedNode}
                            selectedNode={selectedNode}
                            handleLoadOrEmpty={(loadState, emptyState) => {
                                setIsLoading(loadState)
                                setIsEmpty(emptyState)
                            }}
                            handleOperate={(op, data) =>
                                handleOperate(op, data)
                            }
                            moreItems={moreItems}
                            handleMore={handleMore}
                            filterType={[
                                BusinessDomainType.business_activity,
                                BusinessDomainType.business_object,
                                BusinessDomainType.subject_domain,
                                BusinessDomainType.subject_domain_group,
                            ]}
                            // limitTypes={[BusinessDomainType.subject_domain]}
                        />
                    </div>
                    <div className={styles.right}>
                        <GlossaryDetail
                            currentData={selectedNode}
                            handleOperate={(op, data) =>
                                handleOperate(op, data)
                            }
                            ref={detailRef}
                            setSelectedNode={setSelectedNode}
                        />
                    </div>
                </DragBox>
            </div>
            <GlossaryModal
                ref={modalRef}
                type={opType}
                currentData={modalCurrentData}
                onOk={modalOk}
            />
            <ImportSubjectDomains
                open={importVisible}
                onClose={(res) => {
                    setImportVisible(false)
                    if (res) {
                        treeRef.current?.execNode('import', '')
                    }
                }}
            />
            <ExportSubjectDomains
                open={exportVisible}
                onClose={() => {
                    setExportVisible(false)
                }}
            />
        </div>
    )
}

export default BusinessGlossary
