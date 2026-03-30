import AddVisitorModal from '../AccessPolicy/components/AddVisitorModal'
import { VisitorType } from '../AccessPolicy/const'
import __ from './locale'

const UserSelectModal = ({ onOk, onCancel }: any) => {
    // 点击确定
    const handleOk = (items: any[]) => {
        // 参照 AS addAccessorFn 实现：选择个人时将用户信息 userid 等返回（当前未处理所有数据）
        const newItems = items.map((item) => ({
            ...item,
            userid: item.id,
        }))
        onOk(newItems)
    }

    // 点击取消
    const handleCancel = () => {
        onCancel()
    }

    return (
        <AddVisitorModal
            visible
            onSure={handleOk}
            onClose={handleCancel}
            visitorTypes={[VisitorType.USER]}
            title={__('添加用户')}
            modalButtonStyle={{
                background: '#126ee3',
            }}
        />
    )
}

export default UserSelectModal
