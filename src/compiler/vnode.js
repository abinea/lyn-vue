/**
 *
 * @param {*} tag 标签名
 * @param {*} attr 属性对象
 * @param {*} children 子节点 VNode 数组
 * @param {*} context Vue 实例
 * @param {*} text 文本节点的 AST 对象
 */
export default function VNode(
  tag,
  attr,
  children,
  context = null,
  text = null
) {
  return {
    tag,
    attr,
    children,
    context,
    text,
    // 当前节点的父节点，这是真实 DOM 节点
    parent: null,
    // 当前节点的真实节点
    elm: null,
  }
}
