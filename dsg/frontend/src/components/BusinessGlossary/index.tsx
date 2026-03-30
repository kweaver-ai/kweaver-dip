import { Button, message } from 'antd'
import { useRef, useState } from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import empty from '@/assets/emptyAdd.svg'
import { delCategories, delGlossary, delterms } from '@/core'
import Empty from '@/ui/Empty'
import { confirm } from '@/utils/modalHelper'
import __ from '../BusinessDomain/locale'
import DragBox from '../DragBox'
import GlossaryDetail from './GlossaryDetail'
import GlossaryModal from './GlossaryModal'
import GlossaryMoveTree from './GlossaryMoveTree'
import MoveModal from './MoveModal'
import { GlossaryType, optionType } from './const'
import styles from './styles.module.less'

const BusinessGlossary = () => {
    const treeRef: any = useRef()
    const modalRef: any = useRef()
    const detailRef: any = useRef()
    const moveModalRef: any = useRef()
    const [defaultSize, setDefaultSize] = useState<Array<number>>([15, 85])
    const [opType, setOpType] = useState<string>('')
    const [modalCurrentData, setModalCurrentData] = useState<any>({})
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [selectedNode, setSelectedNode] = useState<any>({})

    const renderDomainEmpty = () => {
        return (
            <Empty
                desc={
                    <div>
                        {__('点击')}
                        <Button
                            type="link"
                            onClick={() => handleOperate('addGlossary')}
                        >
                            【{__('新建术语表')}】
                        </Button>
                        {__('按钮，可新建术语表')}
                    </div>
                }
                iconSrc={empty}
            />
        )
    }

    const handleOperate = async (op, data: any = {}) => {
        setOpType(op)
        await setModalCurrentData(data)
        switch (op) {
            case 'del':
                confirm({
                    title: `${__(`确定要删除吗？`)}`,
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#F5222D' }} />
                    ),
                    content: `${__(`删除后后将无法找回，请谨慎操作！`)}`,
                    async onOk() {
                        const action: any =
                            data.type === GlossaryType.GLOSSARY
                                ? delGlossary
                                : data.type === GlossaryType.CATEGORIES
                                ? delCategories
                                : delterms
                        try {
                            const res = await action(data.id)
                            message.success(__(`删除成功`))
                            if (data.type === GlossaryType.GLOSSARY) {
                                // treeRef.current?.getGlossaryList()
                                treeRef.current?.getAllGlossary()
                                treeRef.current?.delGlossaryTree(res.id)
                            } else {
                                updateTree(data.glossary_id)
                                if (
                                    data?.glossary_id ===
                                    selectedNode.glossary_id
                                ) {
                                    detailRef.current?.getDetails()
                                    detailRef.current?.getCategoriesAndTermsList()
                                }
                                if (data.id === res.id) {
                                    treeRef.current?.selectTreeNodeById(
                                        [],
                                        data.parent_id,
                                    )
                                }
                            }
                        } catch (res) {
                            message.error(res?.data?.description)
                        }
                    },
                    onCancel() {},
                })
                break
            case 'move':
                moveModalRef?.current?.setOpen(true)
                break
            default:
                modalRef?.current?.setOpen(true)
        }
    }

    /**
     * 新增、编辑弹窗
     * @param type  操作类型：addCategories 新增类别;addTerms 新增术语;edit 编辑;move 移动
     * @param id  对应操作接口返回的id
     * @returns
     */
    const modalOk = async (type, id: string) => {
        // 新增、编辑树，需要更新所有术语表
        if (modalCurrentData?.glossary_id) {
            await updateTree()
        }
        // 更新术语表
        if (type === 'addGlossary') {
            treeRef.current?.addGlossaryTree(id)
            treeRef.current?.getAllGlossary()
        }
        // 新增类别、术语，展开父节点
        if (type === 'addTerms' || type === 'addCategories') {
            treeRef.current?.onExpand(
                [
                    ...(treeRef?.current?.expandedKeys || []),
                    modalCurrentData.id,
                ],
                {
                    expanded: true,
                    node: modalCurrentData,
                },
            )
        }
        if (
            opType === 'edit' &&
            modalCurrentData.type === GlossaryType.GLOSSARY
        ) {
            treeRef.current?.getAllGlossary()
        }
        // 操作树节点ID和详情ID相同时，才更新详情数据
        if (modalCurrentData?.glossary_id === selectedNode.glossary_id) {
            detailRef.current?.getDetails()
            detailRef.current?.getCategoriesAndTermsList()
        }
    }

    const updateTree = (glossary_id?: string) => {
        treeRef.current?.updataGlossaryTree({
            glossary_id: glossary_id || modalCurrentData.glossary_id,
        })
    }

    return (
        <div className={styles.businessGlossaryWrapper}>
            <DragBox
                defaultSize={defaultSize}
                minSize={[160, 500]}
                maxSize={[426, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    <GlossaryMoveTree
                        getSelectedNode={(node) => {
                            setIsEmpty(!node.id)
                            if (!node.id) {
                                return
                            }
                            setSelectedNode(node)
                        }}
                        // defalutValue={selectedNode.id}
                        // contentId={selectedGlossary}
                        handleOperate={(op, data) => handleOperate(op, data)}
                        ref={treeRef}
                    />
                </div>
                <div className={styles.right}>
                    {isEmpty ? (
                        <div className={styles.emptyBox}>
                            {renderDomainEmpty()}
                        </div>
                    ) : (
                        <GlossaryDetail
                            id={selectedNode.id}
                            currentData={selectedNode}
                            handleOperate={(op, data) =>
                                handleOperate(op, data)
                            }
                            ref={detailRef}
                        />
                    )}
                </div>
            </DragBox>
            <GlossaryModal
                ref={modalRef}
                type={opType}
                currentData={modalCurrentData}
                onOk={modalOk}
            />
            <MoveModal
                optionsType={optionType.Move}
                currentData={modalCurrentData}
                ref={moveModalRef}
                onOk={updateTree}
            />
        </div>
    )
}

export default BusinessGlossary
