import { createRoot } from 'react-dom/client'
import UserSelectModal from './UserSelectModal'

const addReviewerInWorkflow = (): Promise<any[] | undefined> => {
    return new Promise<any[] | undefined>((resolve) => {
        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)

        const handleOk = (selectedUsers) => {
            resolve(selectedUsers)
            root.unmount()
            document.body.removeChild(container)
        }

        const handleCancel = () => {
            // AS addAccessorFn 取消时返回 undefined。但调试时代码报错，故此处先返回空数组
            resolve([])
            root.unmount()
            document.body.removeChild(container)
        }

        root.render(<UserSelectModal onOk={handleOk} onCancel={handleCancel} />)
    })
}

export default addReviewerInWorkflow
