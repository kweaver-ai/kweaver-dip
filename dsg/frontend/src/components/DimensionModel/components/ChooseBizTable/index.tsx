import { Button, Modal, Tooltip } from 'antd'
import React, {
    memo,
    useEffect,
    useMemo,
    useState,
    useContext,
    ReactNode,
} from 'react'
import { messageError } from '@/core'
import CatalogList from './CatalogList'
import CatalogListMultiSelect from './CatalogListMultiSelect'
import FieldList from './FieldList'
import { IFieldItem } from './index.d'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import __ from '../../locale'
import styles from './styles.module.less'
import aiGuide from '@/assets/guideImage/aiGuide.png'
import { SceneGraphContext } from '@/components/SceneAnalysis/SceneGraph'
import { CongSearchProvider } from '@/components/SceneAnalysis/AiSearchProvider'
import AiDialog from '@/components/SceneAnalysis/AiDialog'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { cancelRequest } from '@/utils'

interface IChooseBizTable {
    title?: string
    visible: boolean
    bindIds?: string[]
    checked?: any
    onClose: () => void
    onSure: (info, arrs?) => void
    // 确认按钮禁用文案
    okBtnDiableText?: string
    owner?: boolean
    hasAiButton?: boolean
    formDataApp?: boolean
    emptyRender?: ReactNode
    // 是否使用数据预览接口
    useDataPreviewApi?: boolean
    // 是否检查库表字段读取权限
    checkReadablePerm?: boolean
}
interface ContextType {
    setAiOpen?: React.Dispatch<React.SetStateAction<boolean>>
    setIsDialogClick?: React.Dispatch<React.SetStateAction<boolean>>
}
/**
 * 关联子流程组件
 * @param visible 显示/隐藏
 * @param bindIds 已关联ID数组
 * @param onClose 关闭
 * @param onSure 确定
 */
const ChooseBizTable: React.FC<IChooseBizTable> = ({
    title,
    visible,
    checked,
    bindIds,
    onClose,
    onSure,
    okBtnDiableText,
    owner = false,
    hasAiButton = false,
    formDataApp = false,
    emptyRender,
    useDataPreviewApi = false,
    checkReadablePerm = false,
}) => {
    const [{ using }, updateUsing] = useGeneralConfig()
    const [node, setNode] = useState<any>()
    const [checkNodes, setCheckNodes] = useState<any>([])
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const { setAiOpen, setIsDialogClick } =
        useContext<ContextType>(SceneGraphContext)
    // 来自数据产品
    const [aiShow, setAiShow] = useState(false)
    const [isDialogShowClick, setIsDialogShowClick] = useState(true)

    useEffect(() => {
        if (checked && visible) {
            setNode(checked)
        } else {
            setNode(undefined)
        }
    }, [visible, checked])

    // 保存数据
    const handleOk = async () => {
        // 没有选中项不处理
        if (!node) {
            messageError(title ? __('请') + title : __('请选择数据资源目录'))
            return
        }
        onSure(node)
    }

    const handleOkCheckNodes = async () => {
        // 没有选中项不处理
        if (!checkNodes.length) {
            messageError(title ? __('请') + title : __('添加数据'))
            return
        }
        onSure(node, checkNodes)
    }

    const handleItemCheck = (isChecked: boolean, item: any) => {
        if (node?.id) {
            cancelRequest(`/api/data-view/v1/form-view/${node.id}`, 'get')
        }
        if (isChecked) {
            setNode(item)
        } else {
            setNode(undefined)
        }
    }

    const detachCheckedBindIds = useMemo(() => {
        if (!checked) return bindIds
        return (bindIds || [])?.filter((k) => k !== checked?.id)
    }, [checked, bindIds])

    // 库表字段
    const [selNodeFields, setSelNodeFields] = useState<IFieldItem[]>()

    const handleAiOpen = () => {
        setAiOpen?.(true)
        setIsDialogClick?.(true)
        onClose?.()
    }

    const handleAiShow = () => {
        setAiShow(true)
        onClose?.()
        setIsDialogClick?.(true)
    }

    return (
        <div>
            <Modal
                title={title || __('选择数据资源目录')}
                width={1000}
                maskClosable={false}
                open={visible}
                onCancel={onClose}
                onOk={handleOk}
                destroyOnClose
                getContainer={false}
                // okButtonProps={{
                //     disabled: !node || (checked && node?.id === checked?.id),
                //     // ||
                //     // (okBtnDiableText && !selNodeFields?.length),
                // }}
                // okText={
                //     // <Tooltip title={123}>123</Tooltip>
                //     <Tooltip
                //         title={
                //             !node || (checked && node?.id === checked?.id)
                //             //     ||
                //             // (okBtnDiableText && !selNodeFields?.length)
                //             //     ? okBtnDiableText
                //             //     : ''
                //         }
                //     >
                //         <div
                //             title={
                //                 !node ||
                //                 (checked && node?.id === checked?.id) ||
                //                 (okBtnDiableText && !selNodeFields?.length)
                //                     ? okBtnDiableText
                //                     : ''
                //             }
                //         >
                //             {__('确定')}
                //         </div>
                //     </Tooltip>
                // }
                className={styles['biz-wrapper']}
                bodyStyle={{ height: 534, padding: 0 }}
                footer={
                    <div className={styles.bizFooter}>
                        <span className={styles.openAi}>
                            {hasAiButton && using === 2 && (
                                <>
                                    不知道或找不到要用的数据？试试
                                    <span
                                        className={styles.configIcon}
                                        onClick={
                                            formDataApp
                                                ? handleAiShow
                                                : handleAiOpen
                                        }
                                    >
                                        <img
                                            src={aiGuide}
                                            alt=""
                                            className={styles.aiImg}
                                        />
                                        <span>AI找数</span>
                                    </span>
                                </>
                            )}
                        </span>
                        <span>
                            <Button onClick={onClose}>取消</Button>
                            {formDataApp ? (
                                <Button
                                    type="primary"
                                    disabled={checkNodes.length <= 0}
                                    onClick={handleOkCheckNodes}
                                >
                                    确定
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    disabled={
                                        !node ||
                                        (checked && node?.id === checked?.id)
                                    }
                                    onClick={handleOk}
                                >
                                    确定
                                </Button>
                            )}
                        </span>
                    </div>
                }
            >
                {isEmpty ? (
                    <div className={styles['biz-wrapper-empty']}>
                        {emptyRender || (
                            <Empty
                                desc={__('系统中暂无已发布的库表')}
                                iconSrc={dataEmpty}
                            />
                        )}
                    </div>
                ) : (
                    <div className={styles['biz-wrapper-content']}>
                        <div className={styles['biz-wrapper-content-left']}>
                            {formDataApp ? (
                                <CatalogListMultiSelect
                                    title={__('库表')}
                                    bindIds={detachCheckedBindIds}
                                    selected={node}
                                    onSelect={handleItemCheck}
                                    multiChecked={(arr) => setCheckNodes(arr)}
                                    onInitEmpty={(flag) => setIsEmpty(flag)}
                                    owner={owner}
                                />
                            ) : (
                                <CatalogList
                                    title={__('添加数据')}
                                    bindIds={detachCheckedBindIds}
                                    selected={node}
                                    onSelect={handleItemCheck}
                                    onInitEmpty={(flag) => setIsEmpty(flag)}
                                    owner={owner}
                                />
                            )}
                        </div>
                        <div className={styles['biz-wrapper-content-right']}>
                            <FieldList
                                title={__('预览')}
                                selectedId={node?.id}
                                search={false}
                                onSwitchNode={(
                                    fields: IFieldItem[] | undefined,
                                ) => setSelNodeFields(fields)}
                                showCode
                                useDataPreviewApi={useDataPreviewApi}
                                checkReadablePerm={checkReadablePerm}
                            />
                        </div>
                    </div>
                )}
            </Modal>
            {aiShow && (
                <CongSearchProvider>
                    <AiDialog
                        onStartDrag={() => {}}
                        setIsDialogClick={setIsDialogShowClick}
                        isDialogClick={isDialogShowClick}
                        graphCase={null}
                        setAiOpen={setAiShow}
                        aiOpen={aiShow}
                        isUseData
                        selectorId="graphAIIcon"
                        style={{ left: '300px' }}
                    />
                </CongSearchProvider>
            )}
        </div>
    )
}

export default memo(ChooseBizTable)
