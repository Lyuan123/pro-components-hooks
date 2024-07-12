import { extendRef } from '@vueuse/core'
import { ref } from 'vue-demi'
import { get as _get, has as _has, set as _set, isArray, isPlainObject, isUndefined, merge, toPath, unset } from 'lodash-es'

type InternalPath = Array<string | number>
type Path = string | InternalPath

export interface UseControlRefOptions {
  /**
   * 后置状态钩子，可以再次更改值
   * @param path 路径
   * @param val 值
   * @returns 新的值
   */
  postState?: (path: InternalPath | null, val: any) => any
  /**
   * 值发生变化后调用的钩子
   * @param path 路径
   * @param val 值
   */
  onChange?: (path: InternalPath | null, val: any) => void
  /**
   * 是否跳过当前和子项的遍历
   * @param path 路径
   * @param val 值
   */
  skipTraversal?: (path: InternalPath | null, val: any) => boolean
}

export function createControlRef<T extends (Record<string, any> | Array<any>)>(initial: T, options: UseControlRefOptions = {}) {
  const {
    onChange,
    postState,
    skipTraversal,
  } = options
  const initialRef = ref(initial)
  const tactics = ['__v_merge__', '__v_overlay__']

  function joinPath(...args: Array<Path | number | null>) {
    return args.reduce<Array<string | number>>((p, path) => {
      p = p.concat(toPath(path))
      return p
    }, [])
  }

  function traverse<T extends (Record<string, any> | Array<any>)>(data: T, callback: (path: Array<string | number>, value: any) => void) {
    const _traverse = (data: T, parentPath: InternalPath | null, set = new Set()) => {
      if (set.has(data))
        return data
      set.add(data)
      for (const key in data) {
        const value = data[key]
        if (set.has(value))
          return value
        const path = joinPath(parentPath, key)
        if (skipTraversal && skipTraversal(path, value))
          continue

        callback(path, value)
        if (isPlainObject(value) || isArray(value))
          _traverse(value as T, path, set)
      }
    }
    _traverse(data, null)
  }

  function get(): T
  function get(path: Path): any
  function get(path?: Path) {
    return isUndefined(path)
      ? initialRef.value
      : _get(initialRef.value, path)
  }

  function set(val: Partial<T>, tactic?: '__v_merge__' | '__v_overlay__'): void
  function set(path: Path, val: any, triggerChange?: boolean): void
  function set(pathOrVal: Path | Partial<T>, valOrTactic?: any, triggerChange = true) {
    const args = arguments.length
    if (args === 1 || tactics.includes(valOrTactic)) {
      const tactic = valOrTactic ?? '__v_merge__'
      const source = Array.isArray(initial) ? [] : {}
      traverse(
        pathOrVal as Partial<T>,
        (path, value) => {
          const newValue = postState ? postState(path, value) : value
          _set(source, path, newValue)
          onChange && onChange(path, newValue)
        },
      )
      tactic === '__v_merge__'
        ? merge(initialRef.value, source)
        : initialRef.value = source as any
    }
    else {
      const val = valOrTactic
      const path = toPath(pathOrVal)
      if (path.length <= 0)
        return
      const value = postState ? postState(path, val) : val
      _set(initialRef.value as T, path, value)
      onChange && triggerChange && onChange(path, value)
    }
  }

  function remove(path: Path) {
    return unset(initialRef.value, path)
  }

  function has(path: Path) {
    return _has(initialRef.value, path)
  }

  return extendRef(initialRef, { get, set, has, delete: remove })
}
