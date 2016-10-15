// @flow

import type {
  Type,
  Predicate,
  Props,
  ObjectType
} from '../src/index'

import * as either from 'flow-static-land/lib/Either'
import * as t from '../src/index'

//
// irreducibles
//

const T1: Type<number> = t.number
const vr1 = t.validate(1, T1)
if (either.isRight(vr1)) {
  const v1 = either.fromRight(vr1)
  ;(v1: number)
  // $ExpectError
  ;(v1: string)
}

// runtime type introspection
const RTI1 = t.number
;(RTI1.name: string)

//
// instanceOf
//

class A {}
const T2: Type<A> = t.instanceOf(A)
const vr2 = t.validate(new A(), T2)
if (either.isRight(vr2)) {
  const v2 = either.fromRight(vr2)
  ;(v2: A)
  // $ExpectError
  ;(v2: string)
}

// runtime type introspection
const RTI2 = t.instanceOf(A)
;(RTI2.name: string)
;(RTI2.ctor: Class<A>)

//
// literals
//

const T3: Type<'a'> = t.literal({ value: 'a' })
const vr3 = t.validate('a', T3)
if (either.isRight(vr3)) {
  const v3 = either.fromRight(vr3)
  ;(v3: 'a')
  // $ExpectError
  ;(v3: 'b')
}

// runtime type introspection
const RTI3 = t.literal({ value: 'a' })
;(RTI3.name: string)
;(RTI3.value: string)

//
// arrays
//

const T4: Type<Array<number>> = t.array(t.number)
const vr4 = t.validate([1, 2, 3], T4)
if (either.isRight(vr4)) {
  const v4 = either.fromRight(vr4)
  ;(v4: Array<number>)
  // $ExpectError
  ;(v4: Array<string>)
}

// runtime type introspection
const RTI4 = t.array(t.object({ a: t.number }))
;(RTI4.name: string)
;(RTI4.type: Type<{ a: number }>)
;(RTI4.type.props: Props)
;(RTI4.type.props.a: Type<number>)

//
// unions
//

const T5: Type<string | number> = t.union([t.string, t.number])
const vr5 = t.validate(1, T5)
if (either.isRight(vr5)) {
  const v5 = either.fromRight(vr5)
  ;(v5: string | number)
  // $ExpectError
  ;(v5: string)
}

// runtime type introspection
const RTI5 = t.union([t.string, t.object({ a: t.number })])
;(RTI5.name: string)
;(RTI5.types[0]: Type<string>)
;(RTI5.types[1]: ObjectType<Props>)
;(RTI5.types[1].props: Props)
;(RTI5.types[1].props.a: Type<number>)

//
// tuples
//

const T6: Type<[string, number]> = t.tuple([t.string, t.number])
const vr6 = t.validate(['a', 1], T6)
if (either.isRight(vr6)) {
  const v6 = either.fromRight(vr6)
  ;(v6: [string, number])
  // $ExpectError
  ;(v6: [number, number])
}

// runtime type introspection
const RTI6 = t.tuple([t.string, t.object({ a: t.number })])
;(RTI6.name: string)
;(RTI6.types[0]: Type<string>)
;(RTI6.types[1]: ObjectType<Props>)
;(RTI6.types[1].props: Props)
;(RTI6.types[1].props.a: Type<number>)

//
// intersections
//

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

// runtime type introspection
const RTI7 = t.intersection([t.object({ a: t.number }), t.object({ b: t.number })])
;(RTI7.name: string)
;(RTI7.types[0]: Type<{ a: number }>)
;(RTI7.types[1]: ObjectType<Props>)
;(RTI7.types[1].props: Props)
;(RTI7.types[1].props.b: Type<number>)

//
// maybes
//

const T8: Type<?number> = t.maybe(t.number)
const vr8 = t.validate(null, T8)
if (either.isRight(vr8)) {
  const v8 = either.fromRight(vr8)
  ;(v8: ?number)
  // $ExpectError
  ;(v8: ?string)
}

// runtime type introspection
const RTI8 = t.maybe(t.object({ a: t.number }))
;(RTI8.name: string)
;(RTI8.type: ObjectType<Props>)
;(RTI8.type.props: Props)
;(RTI8.type.props.a: Type<number>)

//
// map objects
//

const T9: Type<{ [key: 'a' | 'b']: number }> = t.map(t.union([t.literal({ value: 'a' }), t.literal({ value: 'b' })]), t.number)
const vr9 = t.validate(null, T9)
if (either.isRight(vr9)) {
  const v9 = either.fromRight(vr9)
  ;(v9: { [key: 'a' | 'b']: number })
  // $ExpectError
  ;(v9: { [key: string]: number })
}

// runtime type introspection
const RTI9 = t.map(t.union([t.literal({ value: 'a' }), t.literal({ value: 'b' })]), t.object({ a: t.number }))
;(RTI9.name: string)
;(RTI9.domain: Type<'a'| 'b'>)
;(RTI9.codomain: ObjectType<Props>)
;(RTI9.codomain.props: Props)
;(RTI9.codomain.props.a: Type<number>)

//
// refinements
//

const T10: Type<number> = t.refinement(t.number, n => n >= 0)
const vr10 = t.validate(1, T10)
if (either.isRight(vr10)) {
  const v10 = either.fromRight(vr10)
  ;(v10: number)
  // $ExpectError
  ;(v10: string)
}

// runtime type introspection
const RTI10 = t.refinement(t.object({ a: t.number }), () => true)
;(RTI10.name: string)
;(RTI10.type: ObjectType<Props>)
;(RTI10.type.props: Props)
;(RTI10.type.props.a: Type<number>)
;(RTI10.predicate: Predicate<{ a: number }>)

//
// recursive types
//

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

// runtime type introspection
const RTI11 = t.recursion('T11', self => t.object({
  a: t.number,
  b: t.maybe(self)
}))
;(RTI11.name: string)
;(RTI11.props: Props)
;(RTI11.props.a: Type<number>)
;(RTI11.props.b: Type<?T11T>)

//
// $Keys
//

const T12: Type<'a' | 'b'> = t.$keys(t.object({ a: t.number, b: t.number }))
const vr12 = t.validate('a', T12)
if (either.isRight(vr12)) {
  const v12 = either.fromRight(vr12)
  ;(v12: 'a' | 'b')
  ;(v12: string)
  // $ExpectError
  ;(v12: number)
}

// runtime type introspection
const RTI12 = t.$keys(t.object({ a: t.number, b: t.number }))
;(RTI12.name: string)
;(RTI12.type: ObjectType<Props>)
;(RTI12.type.props: Props)
;(RTI12.type.props.a: Type<number>)

//
// $Exact
//

const T13: Type<{| a: number |}> = t.$exact({ a: t.number })
const vr13 = t.validate(1, T13)
if (either.isRight(vr13)) {
  const v13 = either.fromRight(vr13)
  ;(v13: {| a: number |})
  // $ExpectError
  ;(v13: number)
}

// runtime type introspection
const RTI13 = t.$exact({ a: t.number })
;(RTI13.name: string)
;(RTI13.props: Props)
;(RTI13.props.a: Type<number>)

//
// $Shape
//

const T14: Type<$Shape<{ a: number }>> = t.$shape(t.object({ a: t.number }))
const vr14 = t.validate({}, T14)
if (either.isRight(vr14)) {
  const v14 = either.fromRight(vr14)
  ;(v14: $Shape<{ a: number }>)
  // $ExpectError
  ;(v14: { a: number, b: number })
}

// runtime type introspection
const RTI14 = t.$shape(t.object({ a: t.number }))
;(RTI14.name: string)
;(RTI14.type: ObjectType<Props>)
;(RTI14.type.props: Props)
;(RTI14.type.props.a: Type<number>)

//
// objects
//

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

const RTI15 = t.object({
  a: t.number,
  b: t.object({
    c: t.string,
    d: t.object({
      e: t.number
    })
  })
})
;(RTI15.name: string)
;(RTI15.props: Props)
;(RTI15.props.a: Type<number>)
;(RTI15.props.b.props.c: Type<string>)
;(RTI15.props.b.props.d: ObjectType<Props>)
;(RTI15.props.b.props.d.props.e: Type<number>)

//
// classOf
//

const T16: Type<Class<A>> = t.classOf(A)
const vr16 = t.validate(A, T16)
if (either.isRight(vr16)) {
  const v16 = either.fromRight(vr16)
  ;(v16: Class<A>)
  // $ExpectError
  ;(v16: string)
}

// runtime type introspection
const RTI16 = t.classOf(A)
;(RTI16.name: string)
;(RTI16.ctor: Class<A>)

