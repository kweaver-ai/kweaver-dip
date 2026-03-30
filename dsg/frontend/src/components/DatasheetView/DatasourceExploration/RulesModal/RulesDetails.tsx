import React, { useEffect, useMemo, useState } from 'react'
import { Drawer } from 'antd'
import __ from '../locale'
import { ExplorationRuleTabs } from '../const'
import { useDataViewContext } from '../../DataViewProvider'
import RulesDetailsCard from './RulesDetailsCard'

interface IRulesModal {
    open: boolean
    onClose: () => void
    ruleId: string
}

const RulesModal: React.FC<IRulesModal> = ({ open, onClose, ruleId }) => {
    const { explorationData } = useDataViewContext()

    const title = useMemo(() => {
        const explorationRule = explorationData?.explorationRule
        return ExplorationRuleTabs.find((item) => item.key === explorationRule)
            ?.label
    }, [explorationData.explorationRule])

    return (
        <Drawer
            title={title + __('详情')}
            width={500}
            open={open}
            onClose={onClose}
            maskClosable
            zIndex={1002}
            footer={null}
        >
            <RulesDetailsCard ruleId={ruleId} />
        </Drawer>
    )
}

export default RulesModal
