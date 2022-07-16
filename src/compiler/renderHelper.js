import VNode from './vnode.js'

/**
 * 负责运行时生成 VNode 的工具方法
 * @param {*} target Vue实例
 */
export default function renderHelper(target) {
  target._c = createElement
  target._v = createTextNode
  target._t = renderSlot
}

/**
 * 为指定标签创建虚拟 DOM
 * @param {*} tag
 * @param {*} attr
 * @param {*} children
 */
function createElement(tag, attr, children) {
  return VNode(tag, attr, children, this)
}

/**
 * 创建文本节点的虚拟 DOM
 * @param {*} textAst
 */
function createTextNode(textAst) {
  return VNode(null, null, null, this, textAst)
}

/**
 *
 * @param {*} attr
 * @param {*} children
 */
function renderSlot(attrs, children) {
  const parentArr = this._parentVnode.attr
  let vnode = null
  if (parentArr.scopedSlots) {
    // 说明当前组件的插槽传送了内容
    // 获取插槽信息
    const slotName = attrs.name
    const slotInfo = parentArr.scopedSlots[slotName]
    this[slotInfo.scopeSlot] = this[Object.keys(attrs.vBind)[0]]
    vnode = genVnode(slotInfo.children, this)
  } else {
    // 插槽默认内容
    // 将 children 变成 vnode 数组
    vnode = genVnode(children, this)
  }
  if (children.length === 1) return vnode[0]
  return createElement(this, 'div', {}, vnode)
}

/**
 * 将一批 ast 节点（数组）转换成 vnode 数组
 * @param {*} childs
 * @param {*} vm
 */
function genVnode(childs, vm) {
  const vnode = []
  for (let i = 0, len = childs.length; i < len; i++) {
    const { tag, attr, children, text } = childs[i]
    if (text) {
      // 文本节点
      if (typeof text === 'string') {
        // text 为字符串
        // 构造文本节点的 AST 对象
        const textAst = {
          type: 3,
          text,
        }
        if (text.match(/{{(.*)}}/)) {
          // 说明有表达式
          textAst.expression = RegExp.$1.trim()
        }
        vnode.push(createTextNode.call(vm, textAst))
      } else {
        vnode.push(createTextNode.call(vm, text))
      }
    } else {
      // 元素节点
      vnode.push(createElement.call(vm, tag, attr, genVnode(children, vm)))
    }
    return vnode
  }
}
