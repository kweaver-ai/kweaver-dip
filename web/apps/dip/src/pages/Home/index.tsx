import { Flex } from 'antd'
import clsx from 'clsx'
import { memo } from 'react'
import intl from 'react-intl-universal'
import { useNavigate } from 'react-router-dom'
import AiPromptInput from '@/components/DipChatKit/components/AiPromptInput'
import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types'
import { useUserInfoStore } from '@/stores/userInfoStore'
import styles from './index.module.less'

const Home = () => {
  const { userInfo } = useUserInfoStore()
  const navigate = useNavigate()

  const handleSubmit = (data: AiPromptSubmitPayload) => {
    const submitToken = `submit_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`
    navigate(`/studio/conversation?employee=${data.employees[0].value}`, {
      state: {
        submitData: data,
        submitToken,
      },
    })
  }

  const displayName = userInfo?.vision_name || intl.get('home.defaultName')

  return (
    <div className={clsx('Home', styles.homePage)}>
      <div className={styles.homeContent}>
        <Flex vertical align="center" className={styles.hero}>
          {/* 遵守 AGENTS.md 规范：不使用 Typography.Title，改为原生 h1 标签 */}
          <h1 className={styles.title}>{intl.get('home.title', { name: displayName })}</h1>
          {/* 遵守 AGENTS.md 规范：不使用 Typography.Text，改为原生 div 标签 */}
          <div className={styles.subtitle}>{intl.get('home.subtitle')}</div>
        </Flex>

        <div className={styles.promptSection}>
          <AiPromptInput
            placeholder={intl.get('home.inputPlaceholder')}
            onSubmit={handleSubmit}
            autoSize={{ minRows: 3, maxRows: 6 }}
            // assignEmployeeValue={"vendor-risk"}
          />
        </div>
      </div>
    </div>
  )
}

export default memo(Home)
