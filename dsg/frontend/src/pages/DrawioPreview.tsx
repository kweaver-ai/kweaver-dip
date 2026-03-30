import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getActualUrl } from '@/utils'

function DrawioPreview() {
    const [searchParams] = useSearchParams()
    const mid = searchParams.get('mid')
    const fid = searchParams.get('fid')
    const did = searchParams.get('did')
    const title = searchParams.get('title') || ''
    const navigator = useNavigate()

    const iframeRef = `${window.location.origin}${getActualUrl(
        `/drawio-app/?viewmode=1&mid=${mid}&fid=${fid}&title=${encodeURIComponent(
            title,
        )}`,
    )}`

    useEffect(() => {
        const handleMessage = (e) => {
            try {
                if (typeof e?.data === 'string') {
                    const data = JSON.parse(e?.data)
                    if (data?.event === 'goback') {
                        navigator(`/business/domain/${did}/model`)
                    }
                }
            } catch (error) {
                // console.log(error)
            }
        }
        window.addEventListener('message', handleMessage, false)

        return () => {
            window.removeEventListener('message', handleMessage, false)
        }
    }, [])

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <iframe
                id="preview"
                src={iframeRef}
                title="流程图"
                name="流程图"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 0,
                }}
            />
        </div>
    )
}

export default DrawioPreview
