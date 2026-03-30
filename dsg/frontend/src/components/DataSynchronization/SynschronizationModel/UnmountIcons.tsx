import { Root, createRoot } from 'react-dom/client'
import { ConfigProvider, Tooltip } from 'antd'
import { ToolsView, EdgeView } from '@antv/x6'
import { UnQuoteOutlined } from '@/icons'

export interface TooltipToolOptions extends ToolsView.ToolItem.Options {
    tooltip?: string
    onDelete: (id: string) => void
}

class TooltipTool extends ToolsView.ToolItem<EdgeView, TooltipToolOptions> {
    private knob: HTMLDivElement | null = null

    private rectRoot: Root | null = null

    render() {
        if (!this.knob) {
            this.knob = ToolsView.createElement('div', false) as HTMLDivElement
            this.knob.style.position = 'absolute'
            this.container.appendChild(this.knob)
        }
        return this
    }

    private toggleTooltip(visible: boolean) {
        if (this.knob) {
            if (this.rectRoot) {
                this.rectRoot.unmount()
            }
            this.rectRoot = createRoot(this.knob)
            // ReactDom.unmountComponentAtNode(this.knob)
            if (visible) {
                this.rectRoot.render(
                    <ConfigProvider
                        prefixCls="any-fabric-ant"
                        iconPrefixCls="any-fabric-anticon"
                    >
                        <div
                            style={{
                                width: '24px',
                                height: '24px',
                                justifyContent: 'center',
                                alignItems: 'center',
                                background: '#fff',
                                borderRadius: '24px',
                                border: '1px solid rgba(18, 110, 227, 0.85)',
                                color: 'rgba(18, 110, 227, 0.85)',
                                display: 'flex',
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                this.options.onDelete(this.cell.id)
                            }}
                        >
                            <Tooltip
                                title={this.options.tooltip || ''}
                                placement="top"
                            >
                                <UnQuoteOutlined />
                            </Tooltip>
                        </div>
                    </ConfigProvider>,
                )
            }
        }
    }

    private onMosueEnter({ e }: { e: MouseEvent }) {
        this.updatePosition(e)
        this.toggleTooltip(true)
    }

    private onMouseLeave(e) {
        this.updatePosition()
        this.toggleTooltip(true)
    }

    // private onMouseMove() {
    //     this.updatePosition()
    //     this.toggleTooltip(false)
    // }

    delegateEvents() {
        this.cellView.on('cell:mouseenter', this.onMosueEnter, this)
        this.cellView.on('cell:mouseleave', this.onMouseLeave, this)
        // this.cellView.on('cell:mousemove', this.onMouseMove, this)
        return super.delegateEvents()
    }

    private updatePosition(e?: MouseEvent) {
        const { x, y } = this.cellView.getBBox()
        if (this.knob) {
            const { style } = this.knob
            if (e) {
                const p = this.graph.clientToGraph(x + 70, y + 40)
                style.display = 'block'
                style.left = `${p.x}px`
                style.top = `${p.y}px`
            } else {
                style.display = 'none'
                // style.left = '-1000px'
                // style.top = '-1000px'
            }
        }
    }

    protected onRemove() {
        this.toggleTooltip(false)
        this.cellView.off('cell:mouseenter', this.onMosueEnter, this)
        this.cellView.off('cell:mouseleave', this.onMouseLeave, this)
        // this.cellView.off('cell:mousemove', this.onMouseMove, this)
    }
}

export default TooltipTool
