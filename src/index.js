// @flow

import type { Either } from 'flow-static-land/lib/Either'

import * as either from 'flow-static-land/lib/Either'
import { unsafeCoerce } from 'flow-static-land/lib/Unsafe'

type ExtractType<T, RT: Type<T>> = T; // eslint-disable-line no-unused-vars

export type TypeOf<RT> = ExtractType<*, RT>;

export type ContextEntry = {
  key: string,
  name: string
};

export type Context = Array<ContextEntry>;

export type ValidationError = {
  value: mixed,
  context: Context,
  description: string
};

export type ValidationResult<T> = Either<Array<ValidationError>, T>;

export interface Type<T> {
  name: string;
  validate: (value: mixed, context: Context) => ValidationResult<T>;
}

export function validate<T>(value: mixed, type: Type<T>): ValidationResult<T> {
  return type.validate(value, getDefaultContext(type))
}

export function is<T>(value: mixed, type: Type<T>): boolean {
  return either.isRight(validate(value, type))
}

export function fail(message: string): void {
  throw new TypeError(`[flow-runtime failure]\n${message}`)
}

export function assert(guard: boolean, message?: () => string): void {
  if (guard !== true) {
    fail(message ? message() : 'Assert failed (turn on "Pause on exceptions" in your Source panel)')
  }
}

export function check<T>(value: mixed, type: Type<T>): T {
  const validation = validate(value, type)
  if (either.isLeft(validation)) {
    const errors = either.fromLeft(validation)
    fail(errors.map(e => e.description).join('\n'))
  }
  return either.fromRight(validation)
}

//
// helpers
//

function getDefaultContext<T>(type: Type<T>): Context {
  return [{ key: '', name: type.name }]
}

function getErrorDescription(value: mixed, context: Context): string {
  return `Invalid value ${JSON.stringify(value)} supplied to ${context.map(({ key, name }) => `${key}: ${name}`).join('/')}`
}

function createValidationError(value: mixed, context: Context): ValidationError {
  return {
    value,
    context,
    description: getErrorDescription(value, context)
  }
}

function createValidationResult<T>(value: mixed, context: Context): ValidationResult<T> {
  return either.left([createValidationError(value, context)])
}

function createContextEntry<T>(key: string, type: Type<T>): ContextEntry {
  return {
    key,
    name: type.name
  }
}

export function getTypeName<T>(type: Type<T>): string {
  return type.name
}

function getFunctionName(f: Function): string {
  return f.displayName || f.name || '<function' + f.length + '>'
}

function getObjectKeys<O: { [key: string]: any }>(o: O): $ObjMap<O, () => true> {
  const keys = {}
  for (let k in o) {
    keys[k] = true
  }
  return keys
}

function pushAll<A>(xs: Array<A>, ys: Array<A>): void {
  Array.prototype.push.apply(xs, ys)
}

function checkAdditionalProps(props: Props, o: Object, c: Context): Array<ValidationError> {
  const errors = []
  for (let k in o) {
    if (!props.hasOwnProperty(k)) {
      errors.push(createValidationError(o[k], c.concat(createContextEntry(k, nil))))
    }
  }
  return errors
}

//
// literals
//

export interface LiteralType<T> extends Type<T> {
  kind: 'literal';
  value: T;
}

export function literal<T: string | number | boolean, O: $Exact<{ value: T }>>(o: O): LiteralType<$PropertyType<O, 'value'>> { // eslint-disable-line no-unused-vars
  const value = o.value
  return {
    kind: 'literal',
    value,
    name: JSON.stringify(value),
    validate: (v, c) => {
      return v === value ? either.right(value) : createValidationResult(v, c)
    }
  }
}

//
// classes
//

export interface ClassType<T> extends Type<T> {
  kind: 'class';
  ctor: Class<T>;
}

export function instanceOf<T>(ctor: Class<T>, name?: string): ClassType<T> {
  return {
    kind: 'class',
    ctor,
    name: name || getFunctionName(ctor),
    validate: (v, c) => v instanceof ctor ? either.right(v) : createValidationResult(v, c)
  }
}

//
// irreducibles
//

export interface IrreducibleType<T> extends Type<T> {
  kind: 'irreducible';
}

function isNil(v: mixed) /* : boolean %checks */ {
  return v === void 0 || v === null
}

export const nil: IrreducibleType<void | null> = {
  kind: 'irreducible',
  name: 'nil',
  validate: (v, c) => isNil(v) ? either.right(v) : createValidationResult(v, c)
}

export const any: IrreducibleType<any> = {
  kind: 'irreducible',
  name: 'any',
  validate: (v, c) => either.right(v) // eslint-disable-line no-unused-vars
}

function isString(v: mixed) /* : boolean %checks */ {
  return typeof v === 'string'
}

export const string: IrreducibleType<string> = {
  kind: 'irreducible',
  name: 'string',
  validate: (v, c) => isString(v) ? either.right(v) : createValidationResult(v, c)
}

function isNumber(v: mixed) /* : boolean %checks */ {
  return typeof v === 'number' && isFinite(v) && !isNaN(v)
}

export const number: IrreducibleType<number> = {
  kind: 'irreducible',
  name: 'number',
  validate: (v, c) => isNumber(v) ? either.right(v) : createValidationResult(v, c)
}

function isBoolean(v: mixed) /* : boolean %checks */ {
  return typeof v === 'boolean'
}

export const boolean: IrreducibleType<boolean> = {
  kind: 'irreducible',
  name: 'boolean',
  validate: (v, c) => isBoolean(v) ? either.right(v) : createValidationResult(v, c)
}

export const arr: IrreducibleType<Array<any>> = {
  kind: 'irreducible',
  name: 'Array',
  validate: (v, c) => Array.isArray(v) ? either.right(v) : createValidationResult(v, c)
}

function isObject(v: mixed) /* : boolean %checks */ {
  return !isNil(v) && typeof v === 'object' && !Array.isArray(v)
}

export const obj: IrreducibleType<Object> = {
  kind: 'irreducible',
  name: 'Object',
  validate: (v, c) => isObject(v) ? either.right(v) : createValidationResult(v, c)
}

function isFunction(v: mixed) /* : boolean %checks */ {
  return typeof v === 'function'
}

export const fun: IrreducibleType<Function> = {
  kind: 'irreducible',
  name: 'Function',
  validate: (v, c) => isFunction(v) ? either.right(v) : createValidationResult(v, c)
}

//
// arrays
//

export interface ArrayType<T> extends Type<Array<T>> {
  kind: 'array';
  type: Type<T>;
}

export function getDefaultListName<T>(type: Type<T>): string {
  return `Array<${getTypeName(type)}>`
}

export function array<T>(type: Type<T>, name?: string): ArrayType<T> {
  return {
    kind: 'array',
    type,
    name: name || getDefaultListName(type),
    validate: (v, c) => {
      return either.chain(a => {
        const errors = []
        for (let i = 0, len = a.length; i < len; i++) {
          const validation = type.validate(a[i], c.concat(createContextEntry(String(i), type)))
          if (either.isLeft(validation)) {
            pushAll(errors, either.fromLeft(validation))
          }
        }
        return errors.length ? either.left(errors) : either.right(a)
      }, arr.validate(v, c))
    }
  }
}

//
// unions
//

export interface UnionType<TS, T> extends Type<T> {
  kind: 'union';
  types: TS;
}

export function getDefaultUnionName(types: Array<Type<*>>): string {
  return `(${types.map(getTypeName).join(' | ')})`
}

declare function union<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>, TS: [TA, TB, TC, TD, TE]>(types: TS, name?: string) : UnionType<TS, A | B | C | D | E>; // eslint-disable-line no-redeclare
declare function union<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TS: [TA, TB, TC, TD]>(types: TS, name?: string) : UnionType<TS, A | B | C | D>; // eslint-disable-line no-redeclare
declare function union<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>, TS: [TA, TB, TC]>(types: TS, name?: string) : UnionType<TS, A | B | C>; // eslint-disable-line no-redeclare
declare function union<A, B, TA: Type<A>, TB: Type<B>, TS: [TA, TB]>(types: TS, name?: string) : UnionType<TS, A | B>; // eslint-disable-line no-redeclare

export function union(types: Array<Type<*>>, name?: string): UnionType<*, *> {  // eslint-disable-line no-redeclare
  return {
    kind: 'union',
    types,
    name: name || getDefaultUnionName(types),
    validate: (v, c) => {
      for (let i = 0, len = types.length; i < len; i++) {
        const type = types[i]
        const validation = type.validate(v, c)
        if (either.isRight(validation)) {
          return validation
        }
      }
      return createValidationResult(v, c)
    }
  }
}

//
// tuples
//

export interface TupleType<TS, T> extends Type<T> {
  kind: 'tuple';
  types: TS;
}

export function getDefaultTupleName(types: Array<Type<*>>): string {
  return `[${types.map(getTypeName).join(', ')}]`
}

declare function tuple<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>, TS: [TA, TB, TC, TD, TE]>(types: TS, name?: string) : TupleType<TS, [A, B, C, D, E]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TS: [TA, TB, TC, TD]>(types: TS, name?: string) : TupleType<TS, [A, B, C, D]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>, TS: [TA, TB, TC]>(types: TS, name?: string) : TupleType<TS, [A, B, C]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, TA: Type<A>, TB: Type<B>, TS: [TA, TB]>(types: TS, name?: string) : TupleType<TS, [A, B]>; // eslint-disable-line no-redeclare

export function tuple(types: Array<Type<*>>, name?: string): TupleType<*, *> {  // eslint-disable-line no-redeclare
  return {
    kind: 'tuple',
    types,
    name: name || getDefaultTupleName(types),
    validate: (v, c) => {
      return either.chain(a => {
        const errors = []
        for (let i = 0, len = a.length; i < len; i++) {
          const type = types[i]
          const validation = type.validate(a[i], c.concat(createContextEntry(String(i), type)))
          if (either.isLeft(validation)) {
            pushAll(errors, either.fromLeft(validation))
          }
        }
        return errors.length ? either.left(errors) : either.right(a)
      }, arr.validate(v, c))
    }
  }
}

//
// intersections
//

export interface IntersectionType<TS, T> extends Type<T> {
  kind: 'intersection';
  types: TS;
}

export function getDefaultIntersectionName(types: Array<Type<*>>): string {
  return `(${types.map(getTypeName).join(' & ')})`
}

declare function intersection<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>, TS: [TA, TB, TC, TD, TE]>(types: TS, name?: string) : IntersectionType<TS, A & B & C & D & E>; // eslint-disable-line no-redeclare
declare function intersection<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TS: [TA, TB, TC, TD]>(types: TS, name?: string) : IntersectionType<TS, A & B & C & D>; // eslint-disable-line no-redeclare
declare function intersection<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>, TS: [TA, TB, TC]>(types: TS, name?: string) : IntersectionType<TS, A & B & C>; // eslint-disable-line no-redeclare
declare function intersection<A, B, TA: Type<A>, TB: Type<B>, TS: [TA, TB]>(types: TS, name?: string) : IntersectionType<TS, A & B>; // eslint-disable-line no-redeclare

export function intersection(types: Array<Type<*>>, name?: string): IntersectionType<*, *> {  // eslint-disable-line no-redeclare
  return {
    kind: 'intersection',
    types,
    name: name || getDefaultIntersectionName(types),
    validate: (v, c) => {
      const errors = []
      for (let i = 0, len = types.length; i < len; i++) {
        const type = types[i]
        const validation = type.validate(v, c.concat(createContextEntry(String(i), type)))
        if (either.isLeft(validation)) {
          pushAll(errors, either.fromLeft(validation))
        }
      }
      return errors.length ? either.left(errors) : either.right(v)
    }
  }
}

//
// maybe
//

export interface MaybeType<T> extends Type<?T> {
  kind: 'maybe';
  type: Type<T>;
}

export function getDefaultMaybeName<T>(type: Type<T>): string {
  return `?${getTypeName(type)}`
}

export function maybe<T>(type: Type<T>, name?: string): MaybeType<T> {
  return {
    kind: 'maybe',
    type,
    name: name || getDefaultMaybeName(type),
    validate: (v, c) => {
      return unsafeCoerce(isNil(v) ? either.right(v) : type.validate(v, c))
    }
  }
}

//
// map objects
//

export interface MapType<D, C> extends Type<{ [key: D]: C }> {
  kind: 'map';
  domain: Type<D>;
  codomain: Type<C>;
}

export function getDefaultMapName<D, C>(domain: Type<D>, codomain: Type<C>): string {
  return `{ [key: ${getTypeName(domain)}]: ${getTypeName(codomain)} }`
}

export function map<D, C>(domain: Type<D>, codomain: Type<C>, name?: string): MapType<D, C> {
  return {
    kind: 'map',
    domain,
    codomain,
    name: name || getDefaultMapName(domain, codomain),
    validate: (v, c) => {
      return either.chain(o => {
        const errors = []
        for (let k in o) {
          const domainValidation = domain.validate(o[k], c.concat(createContextEntry(k, domain)))
          if (either.isLeft(domainValidation)) {
            pushAll(errors, either.fromLeft(domainValidation))
          }
          const codomainValidation = codomain.validate(o[k], c.concat(createContextEntry(k, codomain)))
          if (either.isLeft(codomainValidation)) {
            pushAll(errors, either.fromLeft(codomainValidation))
          }
        }
        return errors.length ? either.left(errors) : either.right(o)
      }, obj.validate(v, c))
    }
  }
}

//
// refinements
//

export type Predicate<T> = (value: T) => boolean;

export interface RefinementType<T> extends Type<T> {
  kind: 'refinement';
  predicate: Predicate<T>;
}

export function getDefaultRefinementName<T>(type: Type<T>, predicate: Predicate<T>): string {
  return `(${getTypeName(type)} | ${getFunctionName(predicate)})`
}

export function refinement<T>(type: Type<T>, predicate: Predicate<T>, name?: string): RefinementType<T> {
  return {
    kind: 'refinement',
    predicate,
    name: name || getDefaultRefinementName(type, predicate),
    validate: (v, c) => {
      return either.chain(
        t => predicate(t) ? either.right(t) : createValidationResult(v, c),
        type.validate(v, c)
      )
    }
  }
}

//
// recursive types
//

export function recursion<T>(name: string, definition: (self: Type<T>) => Type<T>): Type<T> {
  const Self = {
    name,
    validate: (v, c) => Result.validate(v, c)
  }
  const Result = definition(Self)
  Result.name = name
  return Result
}

//
// $Keys
//

export interface $KeysType<P> extends Type<$Keys<P>> {
  kind: '$keys';
  type: ObjectType<P>;
}

export function getDefault$KeysName<P: Props>(type: ObjectType<P>): string {
  return `$Keys<${type.name}>`
}

export function $keys<P: Props>(type: ObjectType<P>, name?: string): $KeysType<P> {
  const keys = getObjectKeys(type.props)
  return {
    kind: '$keys',
    type,
    name: name || getDefault$KeysName(type),
    validate: (v, c) => {
      return either.chain(
        s => keys.hasOwnProperty(v) ? either.right(s) : createValidationResult(v, c),
        string.validate(v, c)
      )
    }
  }
}

//
// $Exact
//

export interface $ExactType<P: Props> extends Type<$Exact<$ObjMap<P, <T>(v: Type<T>) => T>>> {
  kind: '$exact';
  props: P;
}

export function getDefault$ExactName(props: Props): string {
  return `$Exact<${getDefaultObjectName(props)}>`
}

export function $exact<P: Props>(props: P, name?: string): $ExactType<P> {
  name = name || getDefault$ExactName(props)
  const type = object(props, name)
  return {
    kind: '$exact',
    props,
    name,
    validate: (v, c) => {
      return either.chain(o => {
        const errors = checkAdditionalProps(props, o, c)
        return errors.length ? either.left(errors) : either.right(unsafeCoerce(o))
      }, type.validate(v, c))
    }
  }
}

//
// $Shape
//

export interface $ShapeType<P> extends Type<$Shape<$ObjMap<P, <T>(v: Type<T>) => T>>> {
  kind: '$shape';
  type: ObjectType<P>;
}

export function getDefault$ShapeName<P: Props>(type: ObjectType<P>): string {
  return `$Shape<${type.name}>`
}

export function $shape<P: Props>(type: ObjectType<P>, name?: string): $ShapeType<P> {
  const props = type.props
  return {
    kind: '$shape',
    type,
    name: name || getDefault$ShapeName(type),
    validate: (v, c) => {
      return either.chain(o => {
        const errors = []
        for (let prop in props) {
          if (o.hasOwnProperty(prop)) {
            const type = props[prop]
            const validation = type.validate(o[prop], c.concat(createContextEntry(prop, type)))
            if (either.isLeft(validation)) {
              pushAll(errors, either.fromLeft(validation))
            }
          }
        }
        pushAll(errors, checkAdditionalProps(props, o, c))
        return errors.length ? either.left(errors) : either.right(o)
      }, obj.validate(v, c))
    }
  }
}

//
// objects
//

export type Props = {[key: string]: Type<any>};

export interface ObjectType<P: Props> extends Type<$ObjMap<P, <T>(v: Type<T>) => T>> {
  kind: 'object';
  props: P;
}

export function getDefaultObjectName(props: Props): string {
  return `{ ${Object.keys(props).map(k => `${k}: ${props[k].name}`).join(', ')} }`
}

export function object<P: Props>(props: P, name?: string): ObjectType<P> {
  return {
    kind: 'object',
    props,
    name: name || getDefaultObjectName(props),
    validate: (v, c) => {
      return either.chain(o => {
        const errors = []
        for (let k in props) {
          const type = props[k]
          const validation = type.validate(o[k], c.concat(createContextEntry(k, type)))
          if (either.isLeft(validation)) {
            pushAll(errors, either.fromLeft(validation))
          }
        }
        return errors.length ? either.left(errors) : either.right(o)
      }, obj.validate(v, c))
    }
  }
}
