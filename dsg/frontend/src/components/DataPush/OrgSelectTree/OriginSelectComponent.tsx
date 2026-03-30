import { FC } from 'react'
import { noop } from 'lodash'
import { Architecture } from '@/components/BusinessArchitecture/const'
import OrgAndDepartmentFilterTree from './OrgAndDepartmentFilterTree'

const OriginSelectComponent: FC<{
    value?: any
    onChange?: (value: any) => void
}> = ({ onChange = noop, value }) => {
    return (
        <OrgAndDepartmentFilterTree
            defaultValue={value}
            getSelectedNode={(sn) => {
                onChange(sn.id)
            }}
            filterType={[
                Architecture.ORGANIZATION,
                Architecture.DEPARTMENT,
            ].join()}
        />
    )
}

export default OriginSelectComponent
