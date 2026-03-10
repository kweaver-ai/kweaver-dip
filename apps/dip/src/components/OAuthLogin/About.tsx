import { useEffect, useState } from 'react'
import { useOEMConfigStore } from '@/stores/oemConfigStore'

function About() {
  const [version, setVersion] = useState<string>('')
  const { getOEMBasicConfig } = useOEMConfigStore()
  const oemBasicConfig = getOEMBasicConfig()

  const getVersion = async () => {
    // 可以根据实际需求获取版本信息
    // 这里先使用固定值
    // const v = '1.0.0'
    // setVersion(v)
  }

  useEffect(() => {
    getVersion()
  }, [])

  const recordNumber = oemBasicConfig?.recordNumber

  // 如果既没有版本信息也没有备案号，则不显示
  if (!(version || recordNumber)) {
    return null
  }

  return (
    <div className="flex items-center justify-center text-xs text-[#7f8391] leading-5">
      {version && <div>版本信息 {version}</div>}
      {version && recordNumber && <div className="mx-2 h-2.5 w-px border-r border-[#7f8391]" />}
      {recordNumber && <div>{recordNumber}</div>}
    </div>
  )
}

export default About
