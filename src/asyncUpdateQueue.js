// 存放所有 watcher 实例
const queue = []
// 当前正在刷新
let flushing = false
// 标识 callbacks 数组中是否存在一个刷新 watcher 队列的函数了
let waiting = false
// 标识浏览器当前任务队列s是否已经存在刷新 callbacks 数组的函数
let pending = false

// 存放刷新 watcher 队列的函数，或用户调用 Vue.nextTick 存放的函数
const callbacks = []

export default function queueWatcher(watcher) {
  if (!queue.includes(watcher)) {
    // 防止 watcher 重复入队
    if (!flushing) {
      // 说明 watcher 队列没有被刷新，直接入队
      queue.push(watcher)
    } else {
      // 当前 watcher 回调函数存在更改响应式数据的情况，这个情况下就会出现刷新 watcher 时进来新 watcher 的情况
      // 刷新 watcher 队列时，整个队列是有序的，需要将新 watcher 插入到合适的位置

      // 标识当前 watcher是否在 for 循环入队
      let flag = false

      for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i].uid < watcher.uid) {
          queue.splice(i + 1, 0, watcher)
          flag = true
          break
        }
      }
      if (!flag) {
        queue.unshift(watcher)
      }
    }
  }

  if (!waiting) {
    // 保证 callbacks 数组中只有一个刷新 watcher 队列的函数
    waiting = true
    nextTick(flushSchedulerQueue)
  }
}

/**
 * 负责刷新 watcher 队列的函数，由 flushCallbacks 函数调用
 */
function flushSchedulerQueue() {
  flushing = true
  // 给 watcher 队列排序，根据 watcher.uid 从小到大排序
  queue.sort((a, b) => a.uid - b.uid)
  while (queue.length) {
    const watcher = queue.shift()
    watcher.run()
  }
  flushing = waiting = false
}

/**
 *
 */
function nextTick(cb) {
  callbacks.push(cb)
  if (!pending) {
    // 标识浏览器当前任务队列只有一个刷新 callbacks 数组的函数
    // 将刷新 callbacks 数组的函数放到浏览器的异步任务队列中
    pending = true
    Promise.resolve().then(flushCallbacks)
  }
}

/**
 * 负责刷新 callbacks 数组
 * 本质是执行 callbacks 数组中的每一个函数
 */
function flushCallbacks() {
  // 标识浏览器中的 flushCallbacks 函数已经拿到执行栈执行了
  pending = false
  while (callbacks.length) {
    const cb = callbacks.shift()
    // 执行回调函数
    cb()
  }
}
