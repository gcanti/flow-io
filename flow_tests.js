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

const T3 = t.literal({ value: 'a' })
t.map(v3 => {
  (v3: 'a')
  ;(v3: TypeOf<typeof T3>)
  // $ExpectError
  ;(v3: 'b')
}, t.validate('a', T3))
// $ExpectError
;(1: TypeOf<typeof T3>)

// runtime type introspection
const RTI3 = t.literal({ value: 'a' })
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
// ;(RTI4.type.props: Props)
// ;(RTI4.type.props.a: Type<number>)

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
// ;(RTI5.types[1]: ObjectType<Props>)
// ;(RTI5.types[1].props: Props)
// ;(RTI5.types[1].props.a: Type<number>)

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
// ;(RTI6.types[1]: ObjectType<Props>)
// ;(RTI6.types[1].props: Props)
// ;(RTI6.types[1].props.a: Type<number>)

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
// ;(RTI7.types[1]: ObjectType<Props>)
// ;(RTI7.types[1].props: Props)
// ;(RTI7.types[1].props.b: Type<number>)

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
// ;(RTI8.type: ObjectType<Props>)
// ;(RTI8.type.props: Props)
// ;(RTI8.type.props.a: Type<number>)

//
// mappings
//

const T9 = t.mapping(t.union([t.literal({ value: 'a' }), t.literal({ value: 'b' })]), t.number)
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
const RTI9 = t.mapping(t.union([t.literal({ value: 'a' }), t.literal({ value: 'b' })]), t.object({ a: t.number }))
;(RTI9.name: string)
// ;(RTI9.domain: Type<'a'| 'b'>)
// ;(RTI9.codomain: ObjectType<Props>)
// ;(RTI9.codomain.props: Props)
// ;(RTI9.codomain.props.a: Type<number>)

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
// ;(RTI10.type: ObjectType<Props>)
// ;(RTI10.type.props: Props)
// ;(RTI10.type.props.a: Type<number>)
// ;(RTI10.predicate: Predicate<{ a: number }>)

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
// ;(RTI11.props: Props)
// ;(RTI11.props.a: Type<number>)
// ;(RTI11.props.b: Type<?T11T>)

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
// $ExpectError
;({
  // a: 'a', // <= Flow bug???
  // b: 'b'
}: TypeOf<typeof T15>)

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
// ;(RTI15.props.b.props.c: Type<string>)
// ;(RTI15.props.b.props.d: ObjectType<Props>)
// ;(RTI15.props.b.props.d.props.e: Type<number>)

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
