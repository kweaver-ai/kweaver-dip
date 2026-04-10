import { Form, Input } from 'antd'

const NAME_MAX_LENGTH = 128
const DESCRIPTION_MAX_LENGTH = 400

const NAME_RULES = [{ required: true, message: '请输入名称' }]

const NameDescriptionFields = () => {
  return (
    <>
      <Form.Item label="名称" name="name" rules={NAME_RULES}>
        <Input placeholder="请输入数字员工名称" maxLength={NAME_MAX_LENGTH} />
      </Form.Item>

      <Form.Item label="简介" name="creature">
        <Input.TextArea
          placeholder="请输入数字员工简介"
          rows={4}
          maxLength={DESCRIPTION_MAX_LENGTH}
          showCount
          autoSize={{ minRows: 5, maxRows: 5 }}
        />
      </Form.Item>
    </>
  )
}

export default NameDescriptionFields
