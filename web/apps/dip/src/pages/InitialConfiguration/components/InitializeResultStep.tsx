import { memo, useEffect, useRef } from 'react'
import type { GuideInitializeResponse } from '@/apis/dip-studio/guide'
import fireworksUrl from '@/assets/images/fireworks.png'
import styles from './index.module.less'

type InitializeResultStepProps = {
  initResult: GuideInitializeResponse | null
}

const InitializeResultStep = ({ initResult: _initResult }: InitializeResultStepProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const width = 220
    const height = 220
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const colors = [
      '#ff4d6d',
      '#ffa940',
      '#9254de',
      '#13c2c2',
      '#fadb14',
      '#73d13d',
      '#40a9ff',
      '#eb2f96',
    ]

    type Particle = {
      x: number
      y: number
      vx: number
      vy: number
      w: number
      h: number
      angle: number
      spin: number
      life: number
      color: string
      kind: 'dot' | 'rect'
    }

    const particles: Particle[] = Array.from({ length: 52 }).map((_, i) => {
      const a = (Math.PI * 2 * i) / 52 + (Math.random() - 0.5) * 0.28
      const speed = 1.7 + Math.random() * 2.3
      return {
        x: width / 2,
        y: height / 2 - 2,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - (1.1 + Math.random() * 1.4),
        w: 2.6 + Math.random() * 2.4,
        h: Math.random() > 0.5 ? 5.2 + Math.random() * 3.2 : 2.8 + Math.random() * 1.4,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.22,
        life: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        kind: Math.random() > 0.45 ? 'rect' : 'dot',
      }
    })

    const gravity = 0.08
    const drag = 0.992
    let raf = 0
    let start = performance.now()

    const draw = (now: number) => {
      const dt = Math.min(1.8, (now - start) / 16.67)
      start = now
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.life += dt
        p.vx *= drag
        p.vy = p.vy * drag + gravity * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.angle += p.spin * dt

        const alpha = Math.max(0, 1 - p.life / 58)
        if (alpha <= 0) continue

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        if (p.kind === 'dot') {
          ctx.beginPath()
          ctx.arc(0, 0, p.w * 0.5, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h)
        }
        ctx.restore()
      }

      if (particles.some((p) => p.life < 58)) {
        raf = window.requestAnimationFrame(draw)
      }
    }

    raf = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(raf)
  }, [])

  // if (!initResult) {
  //   return null
  // }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className={styles.fireworksBurstWrap}>
        <canvas ref={canvasRef} className={styles.fireworksCanvas} />
        <img src={fireworksUrl} alt="fireworks" className={styles.fireworksCenter} />
      </div>
      <div className="mt-5 text-[26px] font-bold text-[--dip-text-color] pr-2">连接成功</div>
      <div className="mt-3 text-sm text-black/50">
        您的系统现在已就绪，开始创建属于你的数字员工吧。
      </div>
    </div>
  )
}

export default memo(InitializeResultStep)
