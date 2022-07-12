import compileAttribute from "./compileAttribute.js"
import compileTextNode from "./compileTextNode.js"

export default function compileNode(nodes, vm) {
    for (const node of nodes) {
        if (node.nodeType === 1) {
            // 编译元素节点上的各个属性，比如v-bind，v-model,v-on:$event
            compileAttribute(node, vm)
            compileNode(Array.from(node.childNodes), vm)
        } else if (node.nodeType === 3 && node.textContent.match(/{{.*}}/)) {
            // 当前节点为文本节点
            compileTextNode(node, vm)
        }
    }
}
