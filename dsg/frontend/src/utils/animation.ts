interface animationType {
    duration: number
    from: number
    to: number
}

export const animation = (
    duration: number,
    from: number,
    to: number,
    onProgress,
) => {
    let value = from

    const speed = (to - from) / duration

    const start = Date.now()

    const run = () => {
        const t = Date.now() - start

        if (t >= duration) {
            value = to
            onProgress(value)
            return
        }
        value = from + t * speed
        onProgress(value)
        requestAnimationFrame(run)
    }
    run()
}
