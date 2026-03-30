const files = require.context('@/icons', false, /\.tsx$/)
const requireAll = (requireContext) => requireContext.keys()

const re = /\.\/(.*)\.tsx/
const icons = requireAll(files).map((key) => {
    const obj = {
        content: files(key).default || files(key),
        name: key.match(re)[1],
    }
    return obj
})

export default icons
