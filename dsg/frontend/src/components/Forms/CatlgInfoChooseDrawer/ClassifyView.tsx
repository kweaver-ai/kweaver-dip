import React, { useEffect, useState } from 'react'
import styles from './styles.module.less'
import __ from './locale'
import ResourcesCustomTree from '@/components/ResourcesDir/ResourcesCustomTree'

interface IProps {
    onSelectNode: (value: any) => void
}

const ClassifyView = ({ onSelectNode }: IProps) => {
    return (
        <div className={styles.classifyView}>
            <ResourcesCustomTree
                onChange={onSelectNode}
                defaultCategotyId="00000000-0000-0000-0000-000000000001"
                needUncategorized
                organizationNeedUncategorized={false}
                wapperStyle={{ height: 'calc(100vh - 108px)' }}
            />
        </div>
    )
}

export default ClassifyView
