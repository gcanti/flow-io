// @flow

import type { Type } from '../src/index'

import * as either from 'flow-static-land/lib/Either'
import * as t from '../src/index'

// irreducibles

const T1: Type<number> = t.number
const vr1 = t.validate(1, T1)
if (either.isRight(vr1)) {
  const v1 = either.fromRight(vr1)
  ;(v1: number)
  // $ExpectError
  ;(v1: string)
}

// classes

class A {}
const T2: Type<A> = t.instanceOf(A)
const vr2 = t.validate(new A(), T2)
if (either.isRight(vr2)) {
  const v2 = either.fromRight(vr2)
  ;(v2: A)
  // $ExpectError
  ;(v2: string)
}

// literals

const T3: Type<'a'> = t.literal({ value: 'a' })
const vr3 = t.validate('a', T3)
if (either.isRight(vr3)) {
  const v3 = either.fromRight(vr3)
  ;(v3: 'a')
  // $ExpectError
  ;(v3: 'b')
}

// arrays

const T4: Type<Array<number>> = t.array(t.number)
const vr4 = t.validate([1, 2, 3], T4)
if (either.isRight(vr4)) {
  const v4 = either.fromRight(vr4)
  ;(v4: Array<number>)
  // $ExpectError
  ;(v4: Array<string>)
}

// unions

const T5: Type<string | number> = t.union([t.string, t.number])
const vr5 = t.validate(1, T5)
if (either.isRight(vr5)) {
  const v5 = either.fromRight(vr5)
  ;(v5: string | number)
  // $ExpectError
  ;(v5: string)
}

// tuples

const T6: Type<[string, number]> = t.tuple([t.string, t.number])
const vr6 = t.validate(['a', 1], T6)
if (either.isRight(vr6)) {
  const v6 = either.fromRight(vr6)
  ;(v6: [string, number])
  // $ExpectError
  ;(v6: [number, number])
}

// intersections

const T7: Type<{ a: number } & { b: number }> = t.intersection([t.object({ a: t.number }), t.object({ b: t.number })])
const vr7 = t.validate({ a: 1, b: 2 }, T7)
if (either.isRight(vr7)) {
  const v7 = either.fromRight(vr7)
  ;(v7: { a: number } & { b: number })
  ;(v7: { a: number })
  ;(v7: { b: number })
  // $ExpectError
  ;(v7: { a: string })
}

// maybes

const T8: Type<?number> = t.maybe(t.number)
const vr8 = t.validate(null, T8)
if (either.isRight(vr8)) {
  const v8 = either.fromRight(vr8)
  ;(v8: ?number)
  // $ExpectError
  ;(v8: ?string)
}

// map objects

const T9: Type<{ [key: 'a' | 'b']: number }> = t.map(t.union([t.literal({ value: 'a' }), t.literal({ value: 'b' })]), t.number)
const vr9 = t.validate(null, T9)
if (either.isRight(vr9)) {
  const v9 = either.fromRight(vr9)
  ;(v9: { [key: 'a' | 'b']: number })
  // $ExpectError
  ;(v9: { [key: string]: number })
}

// refinements

const T10: Type<number> = t.refinement(t.number, n => n >= 0)
const vr10 = t.validate(1, T10)
if (either.isRight(vr10)) {
  const v10 = either.fromRight(vr10)
  ;(v10: number)
  // $ExpectError
  ;(v10: string)
}

// recursive types

type T11T = {
  a: number,
  b: ?T11T
};
const T11: Type<T11T> = t.recursion('T11', self => t.object({
  a: t.number,
  b: t.maybe(self)
}))
const vr11 = t.validate({ a: 1 }, T11)
if (either.isRight(vr11)) {
  const v11 = either.fromRight(vr11)
  ;(v11: T11T)
  // $ExpectError
  ;(v11: string)
}

// $Keys

const T12: Type<'a' | 'b'> = t.$keys(t.object({ a: t.number, b: t.number }))
const vr12 = t.validate('a', T12)
if (either.isRight(vr12)) {
  const v12 = either.fromRight(vr12)
  ;(v12: 'a' | 'b')
  ;(v12: string)
  // $ExpectError
  ;(v12: number)
}

// $Exact

const T13: Type<{| a: number |}> = t.$exact({ a: t.number })
const vr13 = t.validate(1, T13)
if (either.isRight(vr13)) {
  const v13 = either.fromRight(vr13)
  ;(v13: {| a: number |})
  // $ExpectError
  ;(v13: number)
}

// $Shape

const T14: Type<$Shape<{ a: number }>> = t.$shape(t.object({ a: t.number }))
const vr14 = t.validate({}, T14)
if (either.isRight(vr14)) {
  const v14 = either.fromRight(vr14)
  ;(v14: $Shape<{ a: number }>)
  // $ExpectError
  ;(v14: { a: number, b: number })
}

// objects

type T15T = {
  a: number,
  b: {
    c: string,
    d: {
      e: number
    }
  }
};
const T15: Type<T15T> = t.object({
  a: t.number,
  b: t.object({
    c: t.string,
    d: t.object({
      e: t.number
    })
  })
})
const vr15 = t.validate({}, T15)
if (either.isRight(vr15)) {
  const v15 = either.fromRight(vr15)
  ;(v15: T15T)
  // $ExpectError
  ;(v15.b.d.e: string)
}
