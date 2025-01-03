import { onUnmounted, unref, watch } from 'vue'
import { get, has } from 'lodash-es'
import { uid } from '../../utils/id'
import { usePath } from '../path/usePath'
import { useInjectInternalForm } from '../context'
import type { BaseForm } from '../types'
import { warnOnce } from '../../utils/warn'
import type { BaseField, FieldOptions } from './types'
import { provideField, useInjectField } from './context'
import { useShow } from './useShow'
import { useValue } from './useValue'

interface CreateFieldOptions {
  /**
   * 是否为列表字段
   * @default false
   */
  isList?: boolean
}
export function createField<T = any>(
  fieldOptions: FieldOptions<T> = {},
  { isList = false }: CreateFieldOptions = {},
) {
  const {
    hidden,
    visible,
    initialValue,
    path: propPath,
    preserve = true,
    value: propValue,
    dependencies = [],
    onChange,
    postValue,
    transform,
    onInputValue,
    ...customValues
  } = fieldOptions

  const id = uid()
  const parent = useInjectField(true)
  const form = useInjectInternalForm()

  const {
    path,
    index,
    stringPath,
    analysisPath,
  } = usePath(propPath)

  const { show } = useShow(
    hidden,
    visible,
  )

  const {
    value,
    uidValue,
    doUpdateValue,
  } = useValue(id, path, { onInputValue })

  const field: BaseField = {
    id,
    show,
    path,
    index,
    parent,
    isList,
    preserve,
    propValue,
    stringPath,
    dependencies,
    touching: false,
    meta: fieldOptions,
    value: isList ? uidValue : value,
    onChange,
    postValue,
    transform,
    analysisPath,
    doUpdateValue,
    ...customValues,
  }

  if (!form) {
    if (process.env.NODE_ENV !== 'production')
      warnOnce(`You should use the 'createForm' api at the root`)
  }

  if (form) {
    watch(
      show,
      (visible) => {
        visible
          ? mountFieldValue(form, field)
          : unmountFieldValue(form, field)
      },
    )

    watch(
      () => unref(propValue),
      (val) => {
        if (show.value && path.value.length > 0)
          form.valueStore.setFieldValue(path.value, val)
      },
    )

    form.depStore.add(field)
    mountFieldValue(form, field)
    onUnmounted(() => unmountFieldValue(form, field))
  }
  provideField(field)
  return field
}

function mountFieldValue(form: BaseForm, field: BaseField) {
  const {
    show,
    meta,
    path,
    isList,
    propValue,
  } = field

  if (!show.value || path.value.length <= 0)
    return

  form.fieldStore.mountField(field)

  const p = path.value
  const { initialValue } = meta
  let val: any
  /**
   * priority：form.valueStore > value > initialValue > initialValues
   */
  if (form.valueStore.has(p))
    val = form.valueStore.getFieldValue(p)
  else if (unref(propValue) !== undefined)
    val = unref(propValue)
  else if (initialValue !== undefined)
    val = initialValue
  else if (!form.mounted.value && has(form.valueStore.initialValues, p))
    val = get(form.valueStore.initialValues, p)

  if (isList && val === undefined) {
    val = []
  }
  form.valueStore.setFieldValue(p, val)
  if (!form.mounted.value)
    form.valueStore.setInitialValue(p, val)
}

function unmountFieldValue(form: BaseForm, field: BaseField) {
  if (!field.preserve) {
    const oldField = form.fieldStore.getFieldByPath(field.path.value)
    if (oldField?.id === field.id) {
      form.valueStore.delete(field.path.value)
    }
  }
  form.fieldStore.unmountField(field)
}
