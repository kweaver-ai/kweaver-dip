import { Modal } from 'antd'
import { useOEMConfigStore } from '@/stores/oemConfigStore'

function About() {
  const { getOEMBasicConfig, getOEMResourceConfig } = useOEMConfigStore()
  const oemResourceConfig = getOEMResourceConfig('zh-CN')
  const oemBasicConfig = getOEMBasicConfig()
  const [modal, contextHolder] = Modal.useModal()

  const recordNumber = oemBasicConfig?.recordNumber
  const customVersion = oemBasicConfig?.customVersion
  const logo = oemResourceConfig?.['logo.png'] || undefined

  // 如果既没有版本信息也没有备案号，则不显示
  if (!(customVersion || recordNumber)) {
    return null
  }

  return (
    <>
      {contextHolder}
      <div className="flex items-center justify-center text-xs leading-5">
        {customVersion && (
          <button
            type="button"
            className="hover:text-[--dip-link-color]"
            onClick={() => {
              modal.info({
                title: <div className="text-base font-medium">关于</div>,
                width: 420,
                icon: null,
                footer: null,
                closable: true,
                content: (
                  <div className="text-xs text-[#4c4f5d] leading-6 px-6 py-3 gap-y-1 flex flex-col">
                    <div className="mb-4 flex items-center">
                      <img src={logo} alt="AnyShare" className="h-8" />
                    </div>
                    <div>当前版本：{customVersion}</div>
                    <div>版权所有 © 2011-2026 上海爱数信息技术股份有限公司</div>
                  </div>
                ),
              })
            }}
          >
            版本信息
          </button>
        )}
        {customVersion && recordNumber && (
          <div className="mx-2 h-2.5 w-px border-r border-[#7f8391]" />
        )}
        {recordNumber && (
          <a
            href="http://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[--dip-link-color]"
          >
            {recordNumber}
          </a>
        )}
      </div>
    </>
  )
}

export default About
