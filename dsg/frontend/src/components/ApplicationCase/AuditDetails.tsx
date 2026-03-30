import { Drawer } from 'antd'
import __ from './locale'
import Details from './Details'

interface AuditDetailsProps {
    open: boolean
    onClose: () => void
    id: string
    title: string
}
const AuditDetails = ({ open, onClose, id, title }: AuditDetailsProps) => {
    return (
        <Drawer
            title={title}
            open={open}
            onClose={onClose}
            destroyOnClose
            width={800}
        >
            <Details id={id} />
        </Drawer>
    )
}

export default AuditDetails
