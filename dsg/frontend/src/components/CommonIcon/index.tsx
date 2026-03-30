import React from 'react'
import Icon from '@ant-design/icons'

const CommonIcon: React.FC<any> = ({ icon, ...props }) => {
    return <Icon component={icon} {...props} />
}
export default CommonIcon
