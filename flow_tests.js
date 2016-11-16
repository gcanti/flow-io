// @flow

import type {
  ContextEntry,
  Context,
  ValidationError,
  Validation,
  Validate,
  TypeOf,
  Predicate,
  Props
} from './src/index'

import {
  Type,
  LiteralType,
  InstanceOfType,
  ClassType,
  ArrayType,
  UnionType,
  TupleType,
  IntersectionType,
  MaybeType,
  MappingType,
  RefinementType,
  $ExactType,
  ObjectType,
} from './src/index'

import * as t from './src/index'

//
// irreducibles
//

const T1 = t.number
t.map(v1 => {
  (v1: number)
  ;(v1: TypeOf<typeof T1>)
  // $ExpectError
  ;(v1: string)
}, t.validate(1, T1))
// $ExpectError
;('a': TypeOf<typeof T1>)

// runtime type introspection
const RTI1 = t.number
;(RTI1.name: string)

//
// instanceOf
//

class A {}
const T2 = t.instanceOf(A)
t.map(v2 => {
  (v2: A)
  ;(v2: TypeOf<typeof T2>)
  // $ExpectError
  ;(v2: string)
}, t.validate(new A(), T2))
// $ExpectError
;(1: TypeOf<typeof T2>)

// runtime type introspection
const RTI2 = t.instanceOf(A)
;(RTI2.name: string)
;(RTI2.ctor: Class<A>)

//
// literals
//

const T3 = t.literal('a')
t.map(v3 => {
  (v3: 'a')
  ;(v3: TypeOf<typeof T3>)
  // $ExpectError
  ;(v3: 'b')
}, t.validate('a', T3))
// $ExpectError
;(1: TypeOf<typeof T3>)
;('b': TypeOf<typeof T3>)

// runtime type introspection
const RTI3 = t.literal('a')
;(RTI3.name: string)
;(RTI3.value: string)

//
// arrays
//

const T4 = t.array(t.number)
t.map(v4 => {
  (v4: Array<number>)
  ;(v4: TypeOf<typeof T4>)
  // $ExpectError
  ;(v4: Array<string>)
}, t.validate([1, 2, 3], T4))
// $ExpectError
;(1: TypeOf<typeof T4>)
// $ExpectError
;(['a']: TypeOf<typeof T4>)

// runtime type introspection
const RTI4 = t.array(t.object({ a: t.number }))
;(RTI4.name: string)
;(RTI4.type: Type<{ a: number }>)

//
// unions
//

const T5 = t.union([t.string, t.number])
t.map(v5 => {
  (v5: string | number)
  ;(v5: TypeOf<typeof T5>)
  // $ExpectError
  ;(v5: string)
}, t.validate(1, T5))
// $ExpectError
;(true: TypeOf<typeof T5>)

// runtime type introspection
const RTI5 = t.union([t.string, t.object({ a: t.number })])
;(RTI5.name: string)
;(RTI5.types[0]: Type<string>)
;(RTI5.types[1]: Type<{ a: number }>)

//
// tuples
//

const T6 = t.tuple([t.string, t.number])
t.map(v6 => {
  (v6: [string, number])
  ;(v6: TypeOf<typeof T6>)
  // $ExpectError
  ;(v6: [number, number])
}, t.validate(['a', 1], T6))
// $ExpectError
;([1, 2]: TypeOf<typeof T6>)

// runtime type introspection
const RTI6 = t.tuple([t.string, t.object({ a: t.number })])
;(RTI6.name: string)
;(RTI6.types[0]: Type<string>)
;(RTI6.types[1]: Type<{ a: number }>)

//
// intersections
//

// $ExpectError
t.intersection()

// $ExpectError
t.intersection([])

const T7 = t.intersection([t.object({ a: t.number }), t.object({ b: t.number })])
t.map(v7 => {
  (v7: { a: number } & { b: number })
  ;(v7: TypeOf<typeof T7>)
  ;(v7: { a: number })
  ;(v7: { b: number })
  // $ExpectError
  ;(v7: { a: string })
}, t.validate({ a: 1, b: 2 }, T7))
// $ExpectError
;(1: TypeOf<typeof T7>)

// runtime type introspection
const RTI7 = t.intersection([t.object({ a: t.number }), t.object({ b: t.number })])
;(RTI7.name: string)
;(RTI7.types[0]: Type<{ a: number }>)
;(RTI7.types[1]: Type<{ b: number }>)

//
// maybes
//

const T8 = t.maybe(t.number)
t.map(v8 => {
  (v8: ?number)
  ;(v8: TypeOf<typeof T8>)
  // $ExpectError
  ;(v8: ?string)
}, t.validate(null, T8))
;(null: TypeOf<typeof T8>)
;(undefined: TypeOf<typeof T8>)
// $ExpectError
;('a': TypeOf<typeof T8>)

// runtime type introspection
const RTI8 = t.maybe(t.object({ a: t.number }))
;(RTI8.name: string)
;(RTI8.type: Type<{ a: number }>)

//
// mappings
//

const T9 = t.mapping(t.union([t.literal('a'), t.literal('b')]), t.number)
t.map(v9 => {
  (v9: { [key: 'a' | 'b']: number })
  ;(v9: TypeOf<typeof T9>)
  // $ExpectError
  ;(v9: { [key: string]: number })
}, t.validate(null, T9))
;({}: TypeOf<typeof T9>)
// $ExpectError
;(1: TypeOf<typeof T9>)

// runtime type introspection
const RTI9 = t.mapping(t.union([t.literal('a'), t.literal('b')]), t.object({ a: t.number }))
;(RTI9.name: string)
;(RTI9.domain: Type<'a' | 'b'>)
;(RTI9.codomain: Type<{ a: number }>)

//
// refinements
//

const T10 = t.refinement(t.number, n => n >= 0)
t.map(v10 => {
  (v10: number)
  ;(v10: TypeOf<typeof T10>)
  // $ExpectError
  ;(v10: string)
}, t.validate(1, T10))
// $ExpectError
;('a': TypeOf<typeof T10>)

// runtime type introspection
const RTI10 = t.refinement(t.object({ a: t.number }), () => true)
;(RTI10.name: string)
;(RTI10.type: Type<{ a: number }>)

//
// recursive types
//

type T11T = {
  a: number,
  b: ?T11T
};
const T11 = t.recursion('T11', self => t.object({
  a: t.number,
  b: t.maybe(self)
}))
t.map(v11 => {
  (v11: T11T)
  ;(v11: TypeOf<typeof T11>)
  // $ExpectError
  ;(v11: string)
}, t.validate({ a: 1 }, T11))
// $ExpectError
;(1: TypeOf<typeof T11>)

// runtime type introspection
const RTI11 = t.recursion('T11', self => t.object({
  a: t.number,
  b: t.maybe(self)
}))
;(RTI11.name: string)

//
// $Exact
//

const T13 = t.$exact({ a: t.number })
t.map(v13 => {
  (v13: {| a: number |})
  ;(v13: TypeOf<typeof T13>)
  // $ExpectError
  ;(v13: number)
}, t.validate(1, T13))
// $ExpectError
;(1: TypeOf<typeof T13>)

// runtime type introspection
const RTI13 = t.$exact({ a: t.number })
;(RTI13.name: string)
;(RTI13.props: Props)
;(RTI13.props.a: Type<number>)

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
const T15 = t.object({
  a: t.number,
  b: t.object({
    c: t.string,
    d: t.object({
      e: t.number
    })
  })
})
t.map(v15 => {
  (v15: T15T)
  ;(v15: TypeOf<typeof T15>)
  // $ExpectError
  ;(v15.b.d.e: string)
}, t.validate({}, T15))
// $ExpectError
;(1: TypeOf<typeof T15>)
// $ExpectError
;({}: TypeOf<typeof T15>)

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

//
// classOf
//

const T16 = t.classOf(A)
t.map(v16 => {
  (v16: Class<A>)
  ;(v16: TypeOf<typeof T16>)
  // $ExpectError
  ;(v16: string)
}, t.validate(A, T16))
// $ExpectError
;(1: TypeOf<typeof T16>)

// runtime type introspection
const RTI16 = t.classOf(A)
;(RTI16.name: string)
;(RTI16.ctor: Class<A>)
