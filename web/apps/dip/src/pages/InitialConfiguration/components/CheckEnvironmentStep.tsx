import { memo } from 'react'
import dipStudioLogo from '@/assets/favicons/dip-studio.png'
import styles from './index.module.less'

const CheckEnvironmentStep = () => {
  const OpenClawAnimatedSvg = () => (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.openclawSvg}
    >
      <title>OpenClaw</title>
      <path
        d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z"
        fill="url(#lobster-gradient)"
        className="claw-body"
      />
      <path
        d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z"
        fill="url(#lobster-gradient)"
        className="claw-left"
      />
      <path
        d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z"
        fill="url(#lobster-gradient)"
        className="claw-right"
      />
      <path
        d="M45 15 Q35 5 30 8"
        stroke="var(--coral-bright)"
        strokeWidth="2"
        strokeLinecap="round"
        className="antenna antenna-left"
      />
      <path
        d="M75 15 Q85 5 90 8"
        stroke="var(--coral-bright)"
        strokeWidth="2"
        strokeLinecap="round"
        className="antenna antenna-right"
      />
      <circle cx="45" cy="35" r="6" fill="#050810" className="eye" />
      <circle cx="75" cy="35" r="6" fill="#050810" className="eye" />
      <circle cx="46" cy="34" r="2" fill="#00e5cc" className="eye-glow" />
      <circle cx="76" cy="34" r="2" fill="#00e5cc" className="eye-glow" />
      <defs>
        <linearGradient id="lobster-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--logo-gradient-start)" />
          <stop offset="100%" stopColor="var(--logo-gradient-end)" />
        </linearGradient>
      </defs>
    </svg>
  )

  return (
    <div className="w-full flex flex-col">
      <div className="font-bold text-[--dip-text-color] text-[26px]">OpenClaw 服务连接</div>
      <div className="text-black/50 mt-3">系统正在尝试与 OpenClaw 建立安全隧道。</div>

      <div className="mt-12 flex items-center justify-center">
        <div className={styles.iconBox}>
          <img src={dipStudioLogo} alt="DIP Studio" className="w-16 h-16 object-contain" />
          <div className="mt-1.5 text-sm text-[--dip-text-color]">DIP Studio</div>
        </div>

        <div className="w-[120px] h-[2px] bg-[#D8D8D8] relative overflow-hidden">
          <div className={styles.flowSegment} />
        </div>

        <div className={styles.iconBox}>
          <div className={styles.openclawIconWrap}>
            <OpenClawAnimatedSvg />
          </div>
          <div className="mt-1.5 text-sm text-[--dip-text-color]">OpenClaw</div>
        </div>
      </div>
    </div>
  )
}

export default memo(CheckEnvironmentStep)
