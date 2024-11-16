import type { Get, Paths, Simplify } from 'type-fest'

export type StringKeyof<Values = any> = Exclude<Paths<Values>, symbol | number>

export type PathToObject<T extends string[], Values = any> = Simplify<{
  [K in T[number] as K extends `${infer X}.${string}` ? X : K]: K extends `${infer X}.${infer Y}`
    ? PathToObject<[Y], Get<Values, X>>
    : Get<Values, K>
}>
