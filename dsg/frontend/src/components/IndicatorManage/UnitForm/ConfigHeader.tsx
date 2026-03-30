import React, { HTMLAttributes, useMemo } from 'react'
import { Button, Tooltip } from 'antd'
import { Node } from '@antv/x6'
import { CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from '../locale'
import { IFormula } from '@/core'
import {
    FormulaError,
    FormulaType,
    formulaInfo,
    configErrorList,
} from '../const'
import Icons from '../Icons'

interface IConfigHeader extends HTMLAttributes<HTMLDivElement> {
    // 节点
    node?: Node
    // 算子
    formulaItem?: IFormula
    // 确定请求加载
    loading?: boolean
    // 展开/收起状态
    dragExpand?: boolean
    // 切换展开状态
    onChangeExpand?: (closed: boolean) => void
    onClose?: () => void
    onSure?: () => void
}

const ConfigHeader: React.FC<IConfigHeader> = ({
    node,
    formulaItem,
    loading = false,
    dragExpand,
    onChangeExpand,
    onClose,
    onSure,
}) => {
    const editDisabled = useMemo(
        () =>
            !!(
                formulaItem?.errorMsg &&
                ![...configErrorList, FormulaError.NodeChange].includes(
                    formulaItem?.errorMsg as FormulaError,
                )
            ),
        [formulaItem],
    )

    return (
        <div className={styles.configHeaderWrap}>
            <div className={styles.ch_titleWrap} style={{ maxWidth: '60%' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginRight: 8,
                        height: 20,
                    }}
                >
                    <Icons
                        type={formulaItem?.type || FormulaType.FORM}
                        colored
                        fontSize={20}
                    />
                </div>
                <span style={{ flexShrink: 0 }}>
                    {`${
                        formulaInfo[formulaItem?.type || FormulaType.FORM].name
                    }`}
                </span>
                <div className={styles.ch_desc}>
                    <span style={{ flexShrink: 0 }}>（{__('来自节点：')}</span>
                    <span
                        className={styles.ch_descName}
                        title={node?.data?.name || __('未命名')}
                    >
                        {node?.data?.name || __('未命名')}
                    </span>
                    ）
                </div>
            </div>
            <div className={styles.ch_btnWrap}>
                <Tooltip
                    title={__('收起')}
                    getPopupContainer={(n) => n.parentElement!}
                >
                    <div
                        hidden={!dragExpand}
                        className={styles.expandIcon}
                        style={{ marginRight: 8 }}
                        onClick={() => onChangeExpand?.(false)}
                    >
                        <DownOutlined />
                    </div>
                </Tooltip>
                <Tooltip
                    title={__('展开')}
                    getPopupContainer={(n) => n.parentElement!}
                >
                    <div
                        hidden={dragExpand}
                        className={styles.expandIcon}
                        style={{ marginRight: 8 }}
                        onClick={() => onChangeExpand?.(false)}
                    >
                        <UpOutlined />
                    </div>
                </Tooltip>
                <Tooltip
                    title={__('关闭')}
                    getPopupContainer={(n) => n.parentElement!}
                >
                    <div
                        className={styles.expandIcon}
                        onClick={() => onChangeExpand?.(true)}
                        hidden={!editDisabled}
                    >
                        <CloseOutlined />
                    </div>
                </Tooltip>
                <Button
                    style={{ marginRight: 12 }}
                    onClick={onClose}
                    hidden={editDisabled}
                >
                    {__('取消')}
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    onClick={onSure}
                    hidden={editDisabled}
                >
                    {__('确定')}
                </Button>
            </div>
        </div>
    )
}

export default ConfigHeader
