import { useOEMConfigStore } from '@/stores/oemConfigStore'

function Footer() {
  const { getOEMBasicConfig } = useOEMConfigStore()
  const oemBasicConfig = getOEMBasicConfig()

  // 根据 OEM 配置决定是否展示“用户协议”和“隐私政策”
  // 默认为 true，保证在未配置时保持现有行为
  const showUserAgreement = oemBasicConfig?.showUserAgreement ?? false
  const showPrivacyPolicy = oemBasicConfig?.showPrivacyPolicy ?? false

  const showSeparator = showUserAgreement && showPrivacyPolicy

  // 如果两个都不展示，则整个 footer 隐藏
  if (!(showUserAgreement || showPrivacyPolicy)) {
    return null
  }

  return (
    <div className="mt-1.5 flex items-center justify-center text-[13px] text-[rgba(127,131,145,0.7)] leading-[23px]">
      <div>登录即表示同意</div>
      {showUserAgreement && (
        <a
          href="/Agreement/UserAgreement/ServiceAgreement-CN.html"
          className="text-[rgba(52,97,236,0.75)] hover:text-[--dip-link-color]"
          target="_blank"
          rel="noopener noreferrer"
        >
          用户协议
        </a>
      )}
      {showSeparator && <div>、</div>}
      {showPrivacyPolicy && (
        <a
          href="/Agreement/Privacy/Privacy-CN.html"
          className="text-[rgba(52,97,236,0.75)] hover:text-[--dip-link-color]"
          target="_blank"
          rel="noopener noreferrer"
        >
          隐私政策
        </a>
      )}
    </div>
  )
}

export default Footer
