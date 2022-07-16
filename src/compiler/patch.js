import { isReserveTag } from '../utils.js'
import Vue from '../index.js'

/**
 * 负责初始渲染和后续更新
 * @param {*} oldVnode 老的 VNode
 * @param {*} VNode  新的 VNode
 */
export default function patch(oldVnode, vnode) {
  if (oldVnode && !vnode) {
    // 销毁组件
    return
  }
  if (!oldVnode) {
    // 说明是子组件首次渲染
    createElm(vnode)
  } else {
    if (oldVnode.nodeType) {
      // 说明是真实节点，则表示首次渲染根组件
      const parent = oldVnode.parentNode
      // 参考节点是第一个 script 标签
      const referNode = oldVnode.nextSibling
      // 创建元素，将 vnode 变成真实节点，并添加到父节点上
      createElm(vnode, parent, referNode)
      // 移除老的 vnode，其实就是模板节点
      parent.removeChild(oldVnode)
    } else {
      // 后续更新
      patchVnode(oldVnode, vnode)
    }
  }
}

/**
 * 创建真实节点
 * @param {*} vnode
 * @param {*} parent
 * @param {*} referNode
 * @returns
 */
function createElm(vnode, parent = undefined, referNode) {
  // 在 vnode 上纪记录自己的节点
  vnode.parent = parent

  // 创建自定义组件，如果是非组件,则继续后面的流程
  if (createComponent(vnode)) return
  // 说明当前节点是一个原生标签，走DOM API 创建这些标签，然后添加到父节点内
  const { tag, attr, children, text } = vnode
  if (text) {
    // 说明是文本节点
    vnode.elm = createTextNode(vnode)
  } else {
    // 普通的文本节点
    vnode.elm = document.createElement(tag)
    // 给元素设置属性
    setAttribute(attr, vnode)
    for (let i = 0, len = children.length; i < len; i++) {
      createElm(children[i], vnode.elm)
    }
  }
  // 节点创建完毕，将创建完成的节点插入到父节点内
  if (parent) {
    const { elm } = vnode
    if (referNode) {
      parent.insertBefore(elm, referNode)
    } else {
      parent.appendChild(elm)
    }
  }
}

/**
 * 创建自定义组件
 * @param {*} vnode
 */
function createComponent(vnode) {
  if (vnode.tag && !isReserveTag(vnode.tag)) {
    // 获取组件的基本配置信息
    const {
      tag,
      context: {
        $options: { components },
      },
    } = vnode
    const compOptions = components[tag]
    // 实例化子组件
    const compIns = new Vue(compOptions)
    // 记录子组件 vnode 的父节点信息
    compIns._parentVnode = vnode
    compIns.$mount()
    // 将子组件添加到父节点内
    vnode.parent.appendChild(compIns._vnode.elm)
  }
}

/**
 * 创建文本节点
 * @param {*} textVnode
 */
function createTextNode(textVnode) {
  let { text } = textVnode,
    textNode = null
  if (text.expression) {
    // 说明当前文本节点含有表达式
    const value = textVnode.context[text.expression]
    textNode = document.createTextNode(
      typeof value === 'object' ? JSON.stringify(value) : value
    )
  } else {
    // 创建纯文本节点
    textNode = document.createTextNode(text.text)
  }

  return textNode
}

/**
 * 给节点设置属性
 * @param {*} attr
 * @param {*} vnode
 */
function setAttribute(attr, vnode) {
  // 遍历属性对象，如果是普通属性，直接设置，如果是指令，则特殊处理
  for (const name in attr) {
    if (name === 'vModel') {
      // 处理 v-model 指令
      setVModel(vnode.tag, vnode.attr.vModel.value, vnode)
    } else if (name === 'vBind') {
      setVBind(vnode)
      // 处理 v-bind 指令
    } else if (name === 'vOn') {
      // 处理 v-on 指令
      setVOn(vnode)
    } else {
      // 普通属性，直接处理
      vnode.elm.setAttribute(name, attr[name])
    }
  }
}

/**
 * v-model 原理
 * @param {*} tag 标签名
 * @param {*} value 属性值
 * @param {*} vnode 节点
 */
function setVModel(tag, value, vnode) {
  const { context: vm, elm } = vnode
  if (tag === 'select') {
    Promise.resolve().then(() => (elm.value = vm[value]))
    elm.addEventListener('change', function () {
      vm[value] = elm.value
    })
  } else if (tag === 'input' && vnode.elm.type === 'text') {
    elm.value = vm[value]
    elm.addEventListener('input', function () {
      vm[value] = elm.value
    })
  } else if (tag === 'input' && vnode.elm.type === 'checkbox') {
    elm.checked = vm[value]
    elm.addEventListener('change', function () {
      vm[value] = elm.checked
    })
  }
}

/**
 *
 * @param {*} vnode
 */
function setVBind(vnode) {
  const {
    attr: { vBind },
    elm,
    context: vm,
  } = vnode

  for (const attrName in vBind) {
    elm.setAttribute(attrName, vm[attrName])
    elm.removeAttribute(`v-bind:${attrName}`)
  }
}

/**
 *
 * @param {*} vnode
 */
function setVOn(vnode) {
  const {
    attr: { vOn },
    elm,
    context: vm,
  } = vnode
  for (const eventName in vOn) {
    elm.addEventListener(eventName, function (...args) {
      vm.$options.methods[vOn[eventName]].apply(vm, args)
    })
  }
}

/**
 * 对比新旧节点，找出其中的不同，然后更新老节点
 * @param {*} oldVnode
 * @param {*} vnode
 */
function patchVnode(oldVnode, vnode) {
  if (oldVnode === vnode) return

  // 将 oldVnode 上的真实节点同步到 vnode上，否则后续更新会出现 vnode.elm===null 的情况
  vnode.elm = oldVnode.elm

  // 拿到新老节点的孩子节点
  const ch = vnode.children
  const oldCh = oldVnode.children

  if (!vnode.text) {
    // 新节点不存在文本节点
    if (ch && oldCh) {
      // 新老节点都有孩子
      updateChildren(ch, oldCh)
    } else if (ch) {
      // 老节点没有孩子，新节点有孩子，则新增这些孩子节点
    } else if (oldCh) {
      // 老节点有孩子，新节点没有孩子，则删除这些老节点的孩子节点
    }
  } else {
    // 新节点存在文本节点
    if (vnode.text.expression) {
      // 说明存在表达式，获取表达式的新值
      const value = JSON.stringify(vnode.context[vnode.text.expression])
      try {
        // 获取旧节点上的旧值
        const oldValue = oldVnode.elm.textContent
        if (value !== oldValue) {
          // 新老值不一样，则更新
          oldVnode.elm.textContent = value
        }
      } catch (e) {
        // 防止更新时遇到插槽，导致报错
        // 目前不处理插槽的响应式更新
        console.log(e)
      }
    }
  }
}

/**
 * diff 孩子节点找出不同，更新不同点到老节点
 * 具体的更新工作由 patchVnode 完成
 * @param {*} ch
 * @param {*} oldCh
 */
function updateChildren(ch, oldCh) {
  // 新孩子节点的开始节点、结束节点
  let newStartIdx = 0,
    newEndIdx = ch.length - 1
  // 老孩子节点的开始节点、结束节点
  let oldStartIdx = 0,
    oldEndIdx = oldCh.length - 1

  // 循环遍历所有的新老节点，找出节点不一样的地方，然后更新
  while (newStartIdx <= newEndIdx || oldStartIdx <= oldEndIdx) {
    // ch =>    a b c d
    // oldCh => a b c d
    const newStartNode = ch[newStartIdx],
      newEndNode = ch[newEndIdx]
    const oldStartNode = oldCh[oldStartIdx],
      oldEndNode = oldCh[oldEndIdx]

    /* 四种假设，如果命中可以减少一次遍历 */
    if (sameVnode(newStartNode, oldStartNode)) {
      // 假设新开始和老开始是同一个节点
      patchVnode(oldStartNode, newStartNode)
      oldStartIdx++
      newStartIdx++
    } else if (sameVnode(newStartNode, oldEndNode)) {
      // 假设新开始和老结束是同一个节点
      patchVnode(oldEndNode, newStartNode)
      // 将老结束节点移动到新开始的位置
      oldEndNode.elm.parentNode.insertBefore(
        oldEndNode.elm,
        oldCh[newStartIdx].elm
      )
      oldEndIdx--
      newStartIdx++
    } else if (sameVnode(newEndNode, oldStartNode)) {
      // 假设新结束和老开始是同一个节点
      patchVnode(oldStartNode, newEndNode)
      // 将老开始节点移动到新结束的位置
      oldStartNode.elm.parentNode.insertBefore(
        oldStartNode.elm,
        oldCh[newEndIdx].elm.nextSibling
      )
      oldStartIdx++
      newEndIdx--
    } else if (sameVnode(newEndNode, oldEndNode)) {
      // 假设新结束和老结束是同一个节点
      patchVnode(oldEndNode, newEndNode)
      oldEndIdx--
      newEndIdx--
    } else {
      // 说明四种假设都没有命中，则老老实实的去遍历，找出新老节点的相同节点
    }
  }

  // 跳出循环，说明有一个节点遍历结束，处理下后续的事情
  if (newStartIdx < newEndIdx) {
    // 说明老节点先遍历结束，则将剩余的新节点添加到 DOM 中
  } else if (oldStartIdx < oldEndIdx) {
    // 说明新节点先遍历结束，则将剩余的老节点删除
  }
}
/**
 * 判断两个节点是否是同一个节点
 * @param {*} a
 * @param {*} b
 */
function sameVnode(a, b) {
  return a.key === b.key && a.tag === b.tag
}
