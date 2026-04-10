import { useMemo, useState } from 'react'
import * as Icons from '../src/index'
import {
  previewManifest,
  type PreviewManifestItem,
} from '../src/preview-manifest'
import {
  filterPreviewItems,
  groupPreviewItems,
  toPreviewCopySnippet,
} from '../src/preview-utils'
import './styles.css'

type IconComponent = (props: {
  size?: number | string
  color?: string
}) => JSX.Element

const iconMap = Icons as Record<string, IconComponent>

type ActiveTab = 'outlined' | 'colored'

function PreviewCard({
  item,
  onCopied,
}: {
  item: PreviewManifestItem
  onCopied: () => void
}) {
  const Icon = iconMap[item.componentName]

  const handleIconClick = async () => {
    try {
      await navigator.clipboard.writeText(toPreviewCopySnippet(item.componentName))
      onCopied()
    } catch {
      // ignore
    }
  }

  return (
    <article className="icon-card">
      <div className="icon-card__raw">{item.iconfontName}</div>
      <button
        type="button"
        className="icon-card__preview"
        onClick={handleIconClick}
        title="点击复制 JSX"
      >
        {Icon ? (
          <Icon
            size={40}
            color={item.kind === 'outlined' ? '#666' : undefined}
          />
        ) : (
          <span className="icon-card__missing">Missing export</span>
        )}
      </button>
      <div className="icon-card__name">{item.componentName}</div>
    </article>
  )
}

function PreviewSection({
  items,
  onCopied,
}: {
  items: PreviewManifestItem[]
  onCopied: () => void
}) {
  return (
    <div className="icon-grid">
      {items.map((item) => (
        <PreviewCard
          key={`${item.kind}-${item.iconfontName}-${item.componentName}`}
          item={item}
          onCopied={onCopied}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [keyword, setKeyword] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('outlined')
  const [showToast, setShowToast] = useState(false)

  const filteredItems = useMemo(
    () => filterPreviewItems(previewManifest, keyword),
    [keyword],
  )
  const groupedItems = useMemo(() => groupPreviewItems(filteredItems), [filteredItems])

  const handleCopied = () => {
    setShowToast(true)
    window.setTimeout(() => setShowToast(false), 1500)
  }

  const currentItems = activeTab === 'outlined' ? groupedItems.outlined : groupedItems.colored

  return (
    <main className="preview-page">
      {showToast && <div className="preview-toast">已复制</div>}

      <header className="preview-page__header">
        <div>
          <h1>@kweaver-web/icons 预览</h1>
          <p>展示当前生成组件、iconfont 原始名称，点击卡片复制组件。</p>
        </div>
        <input
          className="preview-page__search"
          type="search"
          placeholder="搜索 iconfont 名称或组件名"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </header>

      <div className="preview-tabs">
        <button
          type="button"
          className={`preview-tabs__btn ${activeTab === 'outlined' ? 'active' : ''}`}
          onClick={() => setActiveTab('outlined')}
        >
          Outlined ({groupedItems.outlined.length})
        </button>
        <button
          type="button"
          className={`preview-tabs__btn ${activeTab === 'colored' ? 'active' : ''}`}
          onClick={() => setActiveTab('colored')}
        >
          Colored ({groupedItems.colored.length})
        </button>
      </div>

      <PreviewSection items={currentItems} onCopied={handleCopied} />
    </main>
  )
}
