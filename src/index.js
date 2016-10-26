// @flow

import type { Either } from 'flow-static-land/lib/Either'

import * as either from 'flow-static-land/lib/Either'
import { unsafeCoerce } from 'flow-static-land/lib/Unsafe'

export { unsafeCoerce }

//
// type extractor
//

type ExtractType<T, RT: Type<T>> = T; // eslint-disable-line no-unused-vars

export type TypeOf<RT> = ExtractType<*, RT>;

//
// `Type` type class
//

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

export type Validation<T> = (value: mixed, context: Context) => ValidationResult<T>;

export type Type<T> = {
  name: string;
  validate: Validation<T>;
};

//
// helpers
//

function stringify(value: mixed): string {
  return isFunction(value) ? getFunctionName(value) : JSON.stringify(value)
}

function getContextPath(context: Context): string {
  return context.map(({ key, name }, index) => {
    if (index === context.length - 1) {
      return key ? `${key}: ${name}` : name;
    }
    return key || name;
  }).join('/');
}

function getDefaultDescription(value: mixed, context: Context): string {
  return `Invalid value ${stringify(value)} supplied to ${getContextPath(context)}`
}

function getValidationError(value: mixed, context: Context): ValidationError {
  return {
    value,
    context,
    description: getDefaultDescription(value, context)
  }
}

function getFunctionName(f: Function): string {
  return f.displayName || f.name || `<function${f.length}>`
}

function pushAll<A>(xs: Array<A>, ys: Array<A>): void {
  Array.prototype.push.apply(xs, ys)
}

function checkAdditionalProps(props: Props, o: Object, c: Context): Array<ValidationError> {
  const errors = []
  for (let k in o) {
    if (!props.hasOwnProperty(k)) {
      errors.push(getValidationError(o[k], c.concat(getContextEntry(k, nil))))
    }
  }
  return errors
}

//
// API
//

export function getContextEntry<T>(key: string, type: Type<T>): ContextEntry {
  return {
    key,
    name: type.name
  }
}

export function getDefaultContext<T>(type: Type<T>): Context {
  return [{ key: '', name: type.name }]
}

export function getTypeName<T>(type: Type<T>): string {
  return type.name
}

export function failures<T>(errors: Array<ValidationError>): ValidationResult<T> {
  return either.left(errors)
}

export function failure<T>(value: mixed, context: Context): ValidationResult<T> {
  return either.left([getValidationError(value, context)])
}

export function success<T>(value: T): ValidationResult<T> {
  return either.right(value)
}

export function isFailure<T>(validation: ValidationResult<T>): boolean {
  return either.isLeft(validation)
}

export function isSuccess<T>(validation: ValidationResult<T>): boolean {
  return either.isRight(validation)
}

export function fromFailure<T>(validation: ValidationResult<T>): Array<ValidationError> {
  return either.fromLeft(validation)
}

export function fromSuccess<T>(validation: ValidationResult<T>): T {
  if (isFailure(validation)) {
    crash(fromFailure(validation).map(e => e.description).join('\n'))
  }
  return either.fromRight(validation)
}

export function of<A>(a: A): ValidationResult<A> {
  return either.of(a)
}

export function map<A, B>(f: (a: A) => B, validation: ValidationResult<A>): ValidationResult<B> {
  return either.map(f, validation)
}

export function ap<A, B>(f: ValidationResult<(a: A) => B>, validation: ValidationResult<A>): ValidationResult<B> {
  return either.ap(f, validation)
}

export function chain<A, B>(f: (a: A) => ValidationResult<B>, validation: ValidationResult<A>): ValidationResult<B> {
  return either.chain(f, validation)
}

export function validateWithContext<T>(value: mixed, context: Context, type: Type<T>): ValidationResult<T> {
  return type.validate(value, context)
}

export function validate<T>(value: mixed, type: Type<T>): ValidationResult<T> {
  return validateWithContext(value, getDefaultContext(type), type)
}

export function unsafeValidate<T>(value: mixed, type: Type<T>): T {
  return fromSuccess(validate(value, type))
}

export function is<T>(value: mixed, type: Type<T>): boolean {
  return isSuccess(validate(value, type))
}

export function crash(message: string): void {
  throw new TypeError(`[flow-runtime failure]\n${message}`)
}

export function assert(guard: boolean, message?: () => string): void {
  if (guard !== true) {
    crash(message ? message() : 'Assert failed (turn on "Pause on exceptions" in your Source panel)')
  }
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
      return v === value ? success(value) : failure(v, c)
    }
  }
}

//
// class instances
//

export interface InstanceOfType<T> extends Type<T> {
  kind: 'instanceOf';
  ctor: Class<T>;
}

export function instanceOf<T>(ctor: Class<T>, name?: string): InstanceOfType<T> {
  return {
    kind: 'instanceOf',
    ctor,
    name: name || getFunctionName(ctor),
    validate: (v, c) => v instanceof ctor ? success(v) : failure(v, c)
  }
}

//
// classes
//

export interface ClassType<T> extends Type<T> {
  kind: 'class';
  ctor: T;
}

export function classOf<T>(ctor: Class<T>, name?: string): ClassType<Class<T>> {
  const type = refinement(fun, f => f === ctor || f.prototype instanceof ctor, name)
  return {
    kind: 'class',
    ctor,
    name: name || `Class<${getFunctionName(ctor)}>`,
    validate: (v, c) => type.validate(v, c)
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
  validate: (v, c) => isNil(v) ? success(v) : failure(v, c)
}

export const any: IrreducibleType<any> = {
  kind: 'irreducible',
  name: 'any',
  validate: (v, c) => success(v) // eslint-disable-line no-unused-vars
}

function isString(v: mixed) /* : boolean %checks */ {
  return typeof v === 'string'
}

export const string: IrreducibleType<string> = {
  kind: 'irreducible',
  name: 'string',
  validate: (v, c) => isString(v) ? success(v) : failure(v, c)
}

function isNumber(v: mixed) /* : boolean %checks */ {
  return typeof v === 'number' && isFinite(v) && !isNaN(v)
}

export const number: IrreducibleType<number> = {
  kind: 'irreducible',
  name: 'number',
  validate: (v, c) => isNumber(v) ? success(v) : failure(v, c)
}

function isBoolean(v: mixed) /* : boolean %checks */ {
  return typeof v === 'boolean'
}

export const boolean: IrreducibleType<boolean> = {
  kind: 'irreducible',
  name: 'boolean',
  validate: (v, c) => isBoolean(v) ? success(v) : failure(v, c)
}

export const arr: IrreducibleType<Array<mixed>> = {
  kind: 'irreducible',
  name: 'Array',
  validate: (v, c) => Array.isArray(v) ? success(v) : failure(v, c)
}

function isObject(v: mixed) /* : boolean %checks */ {
  return !isNil(v) && typeof v === 'object' && !Array.isArray(v)
}

export const obj: IrreducibleType<Object> = {
  kind: 'irreducible',
  name: 'Object',
  validate: (v, c) => isObject(v) ? success(v) : failure(v, c)
}

function isFunction(v: mixed) /* : boolean %checks */ {
  return typeof v === 'function'
}

export const fun: IrreducibleType<Function> = {
  kind: 'irreducible',
  name: 'Function',
  validate: (v, c) => isFunction(v) ? success(v) : failure(v, c)
}

//
// arrays
//

export interface ArrayType<RT> extends Type<Array<TypeOf<RT>>> {
  kind: 'array';
  type: RT;
}

export function array<T, RT: Type<T>>(type: RT, name?: string): ArrayType<RT> { // eslint-disable-line no-unused-vars
  return {
    kind: 'array',
    type,
    name: name || `Array<${getTypeName(type)}>`,
    validate: (v, c) => {
      return either.chain((as: Array<mixed>) => {
        const t = []
        const errors = []
        let changed = false
        for (let i = 0, len = as.length; i < len; i++) {
          const a = as[i]
          const validation = type.validate(a, c.concat(getContextEntry(String(i), type)))
          if (isFailure(validation)) {
            pushAll(errors, fromFailure(validation))
          }
          else {
            const va = fromSuccess(validation)
            changed = changed || ( va !== a )
            t.push(va)
          }
        }
        return errors.length ? failures(errors) : success(changed ? t : unsafeCoerce(as))
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

declare function union<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>, TS: [TA, TB, TC, TD, TE]>(types: TS, name?: string) : UnionType<TS, A | B | C | D | E>; // eslint-disable-line no-redeclare
declare function union<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TS: [TA, TB, TC, TD]>(types: TS, name?: string) : UnionType<TS, A | B | C | D>; // eslint-disable-line no-redeclare
declare function union<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>, TS: [TA, TB, TC]>(types: TS, name?: string) : UnionType<TS, A | B | C>; // eslint-disable-line no-redeclare
declare function union<A, B, TA: Type<A>, TB: Type<B>, TS: [TA, TB]>(types: TS, name?: string) : UnionType<TS, A | B>; // eslint-disable-line no-redeclare

export function union<TS: Array<Type<mixed>>>(types: TS, name?: string): UnionType<TS, *> { // eslint-disable-line no-redeclare
  return {
    kind: 'union',
    types,
    name: name || `(${types.map(getTypeName).join(' | ')})`,
    validate: (v, c) => {
      for (let i = 0, len = types.length; i < len; i++) {
        const validation = types[i].validate(v, c)
        if (isSuccess(validation)) {
          return validation
        }
      }
      return failure(v, c)
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

declare function tuple<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>, TS: [TA, TB, TC, TD, TE]>(types: TS, name?: string) : TupleType<TS, [A, B, C, D, E]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TS: [TA, TB, TC, TD]>(types: TS, name?: string) : TupleType<TS, [A, B, C, D]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>, TS: [TA, TB, TC]>(types: TS, name?: string) : TupleType<TS, [A, B, C]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, TA: Type<A>, TB: Type<B>, TS: [TA, TB]>(types: TS, name?: string) : TupleType<TS, [A, B]>; // eslint-disable-line no-redeclare

export function tuple<TS: Array<Type<*>>>(types: TS, name?: string): TupleType<TS, *> { // eslint-disable-line no-redeclare
  return {
    kind: 'tuple',
    types,
    name: name || `[${types.map(getTypeName).join(', ')}]`,
    validate: (v, c) => {
      return either.chain(as => {
        const t = []
        const errors = []
        let changed = false
        for (let i = 0, len = types.length; i < len; i++) {
          const a = as[i]
          const type = types[i]
          const validation = type.validate(a, c.concat(getContextEntry(String(i), type)))
          if (isFailure(validation)) {
            pushAll(errors, fromFailure(validation))
          }
          else {
            const va = fromSuccess(validation)
            changed = changed || ( va !== a )
            t.push(va)
          }
        }
        return errors.length ? failures(errors) : success(changed ? t : as)
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

declare function intersection<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>, TS: [TA, TB, TC, TD, TE]>(types: TS, name?: string) : IntersectionType<TS, A & B & C & D & E>; // eslint-disable-line no-redeclare
declare function intersection<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TS: [TA, TB, TC, TD]>(types: TS, name?: string) : IntersectionType<TS, A & B & C & D>; // eslint-disable-line no-redeclare
declare function intersection<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>, TS: [TA, TB, TC]>(types: TS, name?: string) : IntersectionType<TS, A & B & C>; // eslint-disable-line no-redeclare
declare function intersection<A, B, TA: Type<A>, TB: Type<B>, TS: [TA, TB]>(types: TS, name?: string) : IntersectionType<TS, A & B>; // eslint-disable-line no-redeclare

export function intersection<TS: Array<Type<mixed>>>(types: TS, name?: string): IntersectionType<TS, *> {  // eslint-disable-line no-redeclare
  return {
    kind: 'intersection',
    types,
    name: name || `(${types.map(getTypeName).join(' & ')})`,
    validate: (v, c) => {
      let t = v
      let changed = false
      const errors = []
      for (let i = 0, len = types.length; i < len; i++) {
        const type = types[i]
        const validation = type.validate(t, c.concat(getContextEntry(String(i), type)))
        if (isFailure(validation)) {
          pushAll(errors, fromFailure(validation))
        }
        else {
          const vv = fromSuccess(validation)
          changed = changed || ( vv !== t )
          t = vv
        }
      }
      return errors.length ? failures(errors) : success(changed ? t : v)
    }
  }
}

//
// maybes
//

export interface MaybeType<RT> extends Type<?TypeOf<RT>> {
  kind: 'maybe';
  type: RT;
}

export function maybe<T, RT: Type<T>>(type: RT, name?: string): MaybeType<RT> { // eslint-disable-line no-unused-vars
  return {
    kind: 'maybe',
    type,
    name: name || `?${getTypeName(type)}`,
    validate: (v, c) => {
      return unsafeCoerce(isNil(v) ? success(v) : type.validate(v, c))
    }
  }
}

//
// map objects
//

export interface MappingType<RTD, RTC> extends Type<{ [key: TypeOf<RTD>]: TypeOf<RTC> }> {
  kind: 'mapping';
  domain: RTD;
  codomain: RTC;
}

export function mapping<D: string, RTD: Type<D>, C, RTC: Type<C>>(domain: RTD, codomain: RTC, name?: string): MappingType<RTD, RTC> { // eslint-disable-line no-unused-vars
  return {
    kind: 'mapping',
    domain,
    codomain,
    name: name || `{ [key: ${getTypeName(domain)}]: ${getTypeName(codomain)} }`,
    validate: (v, c) => {
      return either.chain(o => {
        const t = {}
        const errors = []
        let changed = false
        for (let k in o) {
          const ok = o[k]
          const domainValidation = domain.validate(k, c.concat(getContextEntry(k, domain)))
          const codomainValidation = codomain.validate(ok, c.concat(getContextEntry(k, codomain)))
          if (isFailure(domainValidation)) {
            pushAll(errors, fromFailure(domainValidation))
          }
          else {
            const vk = fromSuccess(domainValidation)
            changed = changed || ( vk !== k )
            k = vk
          }
          if (isFailure(codomainValidation)) {
            pushAll(errors, fromFailure(codomainValidation))
          }
          else {
            const vok = fromSuccess(codomainValidation)
            changed = changed || ( vok !== ok )
            t[k] = vok
          }
        }
        return errors.length ? failures(errors) : success(changed ? t : o)
      }, obj.validate(v, c))
    }
  }
}

//
// refinements
//

export type Predicate<T> = (value: T) => boolean;

export interface RefinementType<RT> extends Type<TypeOf<RT>> {
  kind: 'refinement';
  type: RT;
  predicate: Predicate<TypeOf<RT>>;
}

export function refinement<T, RT: Type<T>>(type: RT, predicate: Predicate<T>, name?: string): RefinementType<RT> { // eslint-disable-line no-unused-vars
  return {
    kind: 'refinement',
    type,
    predicate,
    name: name || `(${getTypeName(type)} | ${getFunctionName(predicate)})`,
    validate: (v, c) => {
      return either.chain(
        t => predicate(t) ? success(t) : failure(v, c),
        type.validate(v, c)
      )
    }
  }
}

//
// recursive types
//

export function recursion<T, RT: Type<T>>(name: string, definition: (self: Type<T>) => RT): RT {
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

export interface $KeysType<RT> extends Type<$Keys<TypeOf<RT>>> {
  kind: '$keys';
  type: RT;
}

function getKeys<P: Props>(type: ObjectType<P> | $ExactType<P> | $ShapeType<*>) {
  if (type.kind === 'object' || type.kind === '$exact') {
    const keys = {}
    for (let k in type.props) {
      keys[k] = true
    }
    return keys
  }
  return getKeys(type.type)
}

export function $keys<P: Props, ORT, RT: ObjectType<P> | $ExactType<P> | $ShapeType<ORT>>(type: RT, name?: string): $KeysType<RT> { // eslint-disable-line no-unused-vars
  const keys = getKeys(type)
  return {
    kind: '$keys',
    type,
    name: name || `$Keys<${type.name}>`,
    validate: (v, c) => {
      return either.chain(
        k => keys.hasOwnProperty(v) ? success(unsafeCoerce(k)) : failure(v, c),
        string.validate(v, c)
      )
    }
  }
}

//
// $Exact
//

export type PropsType<P: Props> = $ObjMap<P, <T>(v: Type<T>) => T>;

export interface $ExactType<P: Props> extends Type<$Exact<PropsType<P>>> {
  kind: '$exact';
  props: P;
}

// accepts props instead of a generic type because of https://github.com/facebook/flow/issues/2626
export function $exact<P: Props>(props: P, name?: string): $ExactType<P> {
  name = name || `$Exact<${getDefaultObjectTypeName(props)}>`
  const type = object(props, name)
  return {
    kind: '$exact',
    props,
    name,
    validate: (v, c) => {
      return either.chain(o => {
        const errors = checkAdditionalProps(props, o, c)
        return errors.length ? failures(errors) : success(unsafeCoerce(o))
      }, type.validate(v, c))
    }
  }
}

//
// $Shape
//

type ExtractProps<P, RT: ObjectType<P> | $ExactType<P>> = P; // eslint-disable-line no-unused-vars

export type PropsOf<T> = ExtractProps<*, T>;

export interface $ShapeType<RT> extends Type<$Shape<PropsType<PropsOf<RT>>>> {
  kind: '$shape';
  type: RT
}

export function $shape<P: Props, RT: ObjectType<P> | $ExactType<P>>(type: RT, name?: string): $ShapeType<RT> { // eslint-disable-line no-unused-vars
  const props = type.props
  return {
    kind: '$shape',
    type,
    name: name || `$Shape<${type.name}>`,
    validate: (v, c) => {
      return either.chain(o => {
        const t = {}
        const errors = []
        let changed = false
        for (let k in props) {
          if (o.hasOwnProperty(k)) {
            const ok = o[k]
            const type = props[k]
            const validation = type.validate(ok, c.concat(getContextEntry(k, type)))
            if (isFailure(validation)) {
              pushAll(errors, fromFailure(validation))
            }
            else {
              const vok = fromSuccess(validation)
              changed = changed || ( vok !== ok )
              t[k] = vok
            }
          }
        }
        pushAll(errors, checkAdditionalProps(props, o, c))
        return errors.length ? failures(errors) : success(changed ? t : o)
      }, obj.validate(v, c))
    }
  }
}

//
// objects
//

export type Props = { [key: string]: Type<*> };

export interface ObjectType<P: Props> extends Type<PropsType<P>> {
  kind: 'object';
  props: P;
}

export function getDefaultObjectTypeName(props: Props): string {
  return `{ ${Object.keys(props).map(k => `${k}: ${props[k].name}`).join(', ')} }`
}

export function object<P: Props>(props: P, name?: string): ObjectType<P> {
  return {
    kind: 'object',
    props,
    name: name || getDefaultObjectTypeName(props),
    validate: (v, c) => {
      return either.chain(o => {
        const t = Object.assign({}, o)
        const errors = []
        let changed = false
        for (let k in props) {
          const ok = o[k]
          const type = props[k]
          const validation = type.validate(ok, c.concat(getContextEntry(k, type)))
          if (isFailure(validation)) {
            pushAll(errors, fromFailure(validation))
          }
          else {
            const vok = fromSuccess(validation)
            changed = changed || ( vok !== ok )
            t[k] = vok
          }
        }
        return errors.length ? failures(errors) : success(changed ? t : o)
      }, obj.validate(v, c))
    }
  }
}
