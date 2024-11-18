import { createEventHook } from '@vueuse/core'
import { toRaw } from 'vue'
import {
  insert as _insert,
  move as _move,
  moveDown as _moveDown,
  moveUp as _moveUp,
  pop as _pop,
  push as _push,
  remove as _remove,
  shift as _shift,
  unshift as _unshift,
} from '../utils/array'
import { useInjectInternalForm } from '../context'
import type { InternalPath } from '../path'
import { isInternalPath } from '../path'
import { stringifyPath } from '../utils/path'
import type { ValueMergeStrategy } from '../utils/value'
import { mergeByStrategy } from '../utils/value'
import { provideListField } from './context'
import { createField } from './createField'
import type { ArrayField, ArrayFieldActionName, FieldOptions } from './types'

export function createArrayField<T = any>(options: FieldOptions<T>) {
  const {
    on: onActionChange,
    trigger: triggerActionChange,
  } = createEventHook<ArrayFieldActionName>()

  const form = useInjectInternalForm()

  const field = createField(options, {
    isList: true,
  })

  function get(index: number, path: InternalPath) {
    if (form) {
      const fullPath = `${field.stringPath.value}.${index}.${stringifyPath(path)}`
      const value = form.getFieldValue(fullPath)
      triggerActionChange('get')
      return toRaw(value)
    }
  }

  function set(index: number, pathOrValues: InternalPath | object, valueOrStrategy?: ValueMergeStrategy) {
    if (form) {
      if (isInternalPath(pathOrValues)) {
        const path = pathOrValues
        const value = valueOrStrategy
        const fullPath = `${field.stringPath.value}.${index}.${stringifyPath(path)}`
        form.setFieldValue(fullPath, value)
      }
      else {
        const values = pathOrValues
        const strategy = valueOrStrategy
        const rowPath = `${field.stringPath.value}.${index}`
        const row = form.getFieldValue(rowPath)
        // 先清空行数据
        form.setFieldValue(rowPath, {})
        form.setFieldValue(rowPath, mergeByStrategy(
          row,
          values,
          strategy,
        ))
      }
      triggerActionChange('set')
    }
  }

  function push(...items: T[]) {
    field.value.value = _push(field.value.value ?? [], ...items)
    triggerActionChange('push')
  }

  function pop() {
    field.value.value = _pop(field.value.value ?? [])
    triggerActionChange('pop')
  }

  function insert(index: number, ...items: T[]) {
    field.value.value = _insert(field.value.value ?? [], index, ...items)
    triggerActionChange('insert')
  }

  function remove(index: number) {
    field.value.value = _remove(field.value.value ?? [], index)
    triggerActionChange('remove')
  }

  function shift() {
    field.value.value = _shift(field.value.value ?? [])
    triggerActionChange('shift')
  }

  function unshift(...items: T[]) {
    field.value.value = _unshift(field.value.value ?? [], ...items)
    triggerActionChange('unshift')
  }

  function move(from: number, to: number) {
    field.value.value = _move(field.value.value ?? [], from, to)
    triggerActionChange('move')
  }

  function moveUp(index: number) {
    field.value.value = _moveUp(field.value.value ?? [], index)
    triggerActionChange('moveUp')
  }

  function moveDown(index: number) {
    field.value.value = _moveDown(field.value.value ?? [], index)
    triggerActionChange('moveDown')
  }

  const arrayField: ArrayField = Object.assign(field, {
    get,
    set,
    pop,
    push,
    move,
    shift,
    insert,
    moveUp,
    remove,
    unshift,
    moveDown,
    onActionChange,
  })
  provideListField(arrayField)
  return arrayField
}
