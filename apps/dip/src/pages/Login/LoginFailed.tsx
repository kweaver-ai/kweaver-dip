import { Button, Result } from 'antd'
import GradientContainer from '@/components/GradientContainer'
import { getFullPath } from '@/utils/config'

const LoginFailed = () => {
  const handleReturnLoginPage = () => {
    window.location.replace(getFullPath('/login'))
  }

  return (
    <GradientContainer className="w-full h-full flex items-center justify-center">
      <Result
        status="warning"
        subTitle="您当前使用的账号未绑定任何角色，无法登录"
        extra={
          <Button type="primary" onClick={handleReturnLoginPage}>
            返回登录页面
          </Button>
        }
      />
    </GradientContainer>
  )
}

export default LoginFailed
