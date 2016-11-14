// @flow

import type { Either } from 'flow-static-land/lib/Either'

import * as either from 'flow-static-land/lib/Either'
import { unsafeCoerce } from 'flow-static-land/lib/Unsafe'

//
// type extractor
//

type ExtractType<T, RT: Type<T>> = T; // eslint-disable-line no-unused-vars

export type TypeOf<RT> = ExtractType<*, RT>;

//
// `Type` type class
//

export type Validate<T> = (value: mixed, context: Context) => Validation<T>;

export type Type<T> = {
  name: string;
  validate: Validate<T>;
};

export type ContextEntry<T> = {
  key: string,
  type: Type<T>,
};

export type Context = Array<ContextEntry<any>>;

export type ValidationError = {
  value: mixed,
  context: Context
};

export type Validation<T> = Either<Array<ValidationError>, T>;

//
// helpers
//

function getValidationError(value: mixed, context: Context): ValidationError {
  return {
    value,
    context
  }
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

function getFunctionName(f: Function): string {
  return f.displayName || f.name || `<function${f.length}>`
}

function getContextEntry<T>(key: string, type: Type<T>): ContextEntry<T> {
  return {
    key,
    type
  }
}

function getDefaultContext<T>(type: Type<T>): Context {
  return [{ key: '', type }]
}

function getTypeName<T>(type: Type<T>): string {
  return type.name
}

function failures<T>(errors: Array<ValidationError>): Validation<T> {
  return either.left(errors)
}

function failure<T>(value: mixed, context: Context): Validation<T> {
  return either.left([getValidationError(value, context)])
}

function success<T>(value: T): Validation<T> {
  return either.right(value)
}

function isFailure<T>(validation: Validation<T>): boolean {
  return either.isLeft(validation)
}

function isSuccess<T>(validation: Validation<T>): boolean {
  return either.isRight(validation)
}

function fromFailure<T>(validation: Validation<T>): Array<ValidationError> {
  return either.fromLeft(validation)
}

function fromSuccess<T>(validation: Validation<T>): T {
  return either.fromRight(validation)
}

function of<A>(a: A): Validation<A> {
  return either.of(a)
}

function map<A, B>(f: (a: A) => B, validation: Validation<A>): Validation<B> {
  return either.map(f, validation)
}

function ap<A, B>(f: Validation<(a: A) => B>, validation: Validation<A>): Validation<B> {
  return either.ap(f, validation)
}

function chain<A, B>(f: (a: A) => Validation<B>, validation: Validation<A>): Validation<B> {
  return either.chain(f, validation)
}

function fold<A, R>(failure: (errors: Array<ValidationError>) => R, success: (value: A) => R, validation: Validation<A>): R {
  return isFailure(validation) ? failure(fromFailure(validation)) : success(fromSuccess(validation))
}

function validateWithContext<T>(value: mixed, context: Context, type: Type<T>): Validation<T> {
  return type.validate(value, context)
}

function validate<T>(value: mixed, type: Type<T>): Validation<T> {
  return validateWithContext(value, getDefaultContext(type), type)
}

function unsafeValidate<T>(value: mixed, type: Type<T>): T {
  return fromSuccess(validate(value, type))
}

function is<T>(value: mixed, type: Type<T>): boolean {
  return isSuccess(validate(value, type))
}

//
// literals
//

export interface LiteralType<T> extends Type<T> {
  tag: 'LiteralType';
  value: T;
}

export type LiteralTypeValue = string | number | boolean;

function literal<T: LiteralTypeValue, O: $Exact<{ value: T }>>(o: O): LiteralType<$PropertyType<O, 'value'>> {
  const value = o.value
  return {
    tag: 'LiteralType',
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
  tag: 'InstanceOfType';
  ctor: Class<T>;
}

function instanceOf<T>(ctor: Class<T>, name?: string): InstanceOfType<T> {
  return {
    tag: 'InstanceOfType',
    ctor,
    name: name || getFunctionName(ctor),
    validate: (v, c) => v instanceof ctor ? success(v) : failure(v, c)
  }
}

//
// classes
//

export interface ClassType<T> extends Type<T> {
  tag: 'ClassType';
  ctor: T;
}

function classOf<T>(ctor: Class<T>, name?: string): ClassType<Class<T>> {
  const type = refinement(functionType, f => f === ctor || f.prototype instanceof ctor, name)
  return {
    tag: 'ClassType',
    ctor,
    name: name || `Class<${getFunctionName(ctor)}>`,
    validate: (v, c) => type.validate(v, c)
  }
}

//
// irreducibles
//

export interface IrreducibleType<T> extends Type<T> {
  tag: 'IrreducibleType';
}

function isNil(v: mixed) /* : boolean %checks */ {
  return v === void 0 || v === null
}

const nullType: IrreducibleType<null> = {
  tag: 'IrreducibleType',
  name: 'null',
  validate: (v, c) => v === null ? success(v) : failure(v, c)
}

const voidType: IrreducibleType<void> = {
  tag: 'IrreducibleType',
  name: 'void',
  validate: (v, c) => v === void 0 ? success(v) : failure(v, c)
}

const nil: IrreducibleType<void | null> = {
  tag: 'IrreducibleType',
  name: 'nil',
  validate: (v, c) => isNil(v) ? success(v) : failure(v, c)
}

const any: IrreducibleType<any> = {
  tag: 'IrreducibleType',
  name: 'any',
  validate: (v, c) => success(v) // eslint-disable-line no-unused-vars
}

const string: IrreducibleType<string> = {
  tag: 'IrreducibleType',
  name: 'string',
  validate: (v, c) => typeof v === 'string' ? success(v) : failure(v, c)
}

const number: IrreducibleType<number> = {
  tag: 'IrreducibleType',
  name: 'number',
  validate: (v, c) => typeof v === 'number' && isFinite(v) && !isNaN(v) ? success(v) : failure(v, c)
}

const boolean: IrreducibleType<boolean> = {
  tag: 'IrreducibleType',
  name: 'boolean',
  validate: (v, c) => typeof v === 'boolean' ? success(v) : failure(v, c)
}

const arrayType: IrreducibleType<Array<mixed>> = {
  tag: 'IrreducibleType',
  name: 'Array',
  validate: (v, c) => Array.isArray(v) ? success(v) : failure(v, c)
}

const objectType: IrreducibleType<Object> = {
  tag: 'IrreducibleType',
  name: 'Object',
  validate: (v, c) => !isNil(v) && typeof v === 'object' && !Array.isArray(v) ? success(v) : failure(v, c)
}

const functionType: IrreducibleType<Function> = {
  tag: 'IrreducibleType',
  name: 'Function',
  validate: (v, c) => typeof v === 'function' ? success(v) : failure(v, c)
}

//
// arrays
//

export interface ArrayType<RT> extends Type<Array<TypeOf<RT>>> {
  tag: 'ArrayType';
  type: RT;
}

function array<T, RT: Type<T>>(type: RT, name?: string): ArrayType<RT> {
  return {
    tag: 'ArrayType',
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
      }, arrayType.validate(v, c))
    }
  }
}

//
// unions
//

export interface UnionType<TS, T> extends Type<T> {
  tag: 'UnionType';
  types: TS;
}

declare function union<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>, TS: [TA, TB, TC, TD, TE]>(types: TS, name?: string) : UnionType<TS, A | B | C | D | E>; // eslint-disable-line no-redeclare
declare function union<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TS: [TA, TB, TC, TD]>(types: TS, name?: string) : UnionType<TS, A | B | C | D>; // eslint-disable-line no-redeclare
declare function union<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>, TS: [TA, TB, TC]>(types: TS, name?: string) : UnionType<TS, A | B | C>; // eslint-disable-line no-redeclare
declare function union<A, B, TA: Type<A>, TB: Type<B>, TS: [TA, TB]>(types: TS, name?: string) : UnionType<TS, A | B>; // eslint-disable-line no-redeclare

function union<TS: Array<Type<mixed>>>(types: TS, name?: string): UnionType<TS, *> { // eslint-disable-line no-redeclare
  return {
    tag: 'UnionType',
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
  tag: 'TupleType';
  types: TS;
}

declare function tuple<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>, TS: [TA, TB, TC, TD, TE]>(types: TS, name?: string) : TupleType<TS, [A, B, C, D, E]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TS: [TA, TB, TC, TD]>(types: TS, name?: string) : TupleType<TS, [A, B, C, D]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>, TS: [TA, TB, TC]>(types: TS, name?: string) : TupleType<TS, [A, B, C]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, TA: Type<A>, TB: Type<B>, TS: [TA, TB]>(types: TS, name?: string) : TupleType<TS, [A, B]>; // eslint-disable-line no-redeclare

function tuple<TS: Array<Type<*>>>(types: TS, name?: string): TupleType<TS, *> { // eslint-disable-line no-redeclare
  return {
    tag: 'TupleType',
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
      }, arrayType.validate(v, c))
    }
  }
}

//
// intersections
//

export interface IntersectionType<TS, T> extends Type<T> {
  tag: 'IntersectionType';
  types: TS;
}

declare function intersection<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>, TS: [TA, TB, TC, TD, TE]>(types: TS, name?: string) : IntersectionType<TS, A & B & C & D & E>; // eslint-disable-line no-redeclare
declare function intersection<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TS: [TA, TB, TC, TD]>(types: TS, name?: string) : IntersectionType<TS, A & B & C & D>; // eslint-disable-line no-redeclare
declare function intersection<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>, TS: [TA, TB, TC]>(types: TS, name?: string) : IntersectionType<TS, A & B & C>; // eslint-disable-line no-redeclare
declare function intersection<A, B, TA: Type<A>, TB: Type<B>, TS: [TA, TB]>(types: TS, name?: string) : IntersectionType<TS, A & B>; // eslint-disable-line no-redeclare

function intersection<TS: Array<Type<mixed>>>(types: TS, name?: string): IntersectionType<TS, *> {  // eslint-disable-line no-redeclare
  return {
    tag: 'IntersectionType',
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
  tag: 'MaybeType';
  type: RT;
}

function maybe<T, RT: Type<T>>(type: RT, name?: string): MaybeType<RT> {
  return {
    tag: 'MaybeType',
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
  tag: 'MappingType';
  domain: RTD;
  codomain: RTC;
}

function mapping<D: string, RTD: Type<D>, C, RTC: Type<C>>(domain: RTD, codomain: RTC, name?: string): MappingType<RTD, RTC> {
  return {
    tag: 'MappingType',
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
      }, objectType.validate(v, c))
    }
  }
}

//
// refinements
//

export type Predicate<T> = (value: T) => boolean;

export interface RefinementType<RT> extends Type<TypeOf<RT>> {
  tag: 'RefinementType';
  type: RT;
  predicate: Predicate<TypeOf<RT>>;
}

function refinement<T, RT: Type<T>>(type: RT, predicate: Predicate<T>, name?: string): RefinementType<RT> {
  return {
    tag: 'RefinementType',
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

function recursion<T, RT: Type<T>>(name: string, definition: (self: Type<T>) => RT): RT {
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
  tag: '$KeysType';
  type: RT;
}

function getKeys<P: Props>(type: ObjectType<P> | $ExactType<P> | $ShapeType<*>) {
  if (type.tag === 'ObjectType' || type.tag === '$ExactType') {
    const keys = {}
    for (let k in type.props) {
      keys[k] = true
    }
    return keys
  }
  return getKeys(type.type)
}

function $keys<P: Props, ORT, RT: ObjectType<P> | $ExactType<P> | $ShapeType<ORT>>(type: RT, name?: string): $KeysType<RT> {
  const keys = getKeys(type)
  return {
    tag: '$KeysType',
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
  tag: '$ExactType';
  props: P;
}

// accepts props instead of a generic type because of https://github.com/facebook/flow/issues/2626
function $exact<P: Props>(props: P, name?: string): $ExactType<P> {
  name = name || `$Exact<${getDefaultObjectTypeName(props)}>`
  const type = object(props, name)
  return {
    tag: '$ExactType',
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
  tag: '$ShapeType';
  type: RT
}

function $shape<P: Props, RT: ObjectType<P> | $ExactType<P>>(type: RT, name?: string): $ShapeType<RT> {
  const props = type.props
  return {
    tag: '$ShapeType',
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
      }, objectType.validate(v, c))
    }
  }
}

//
// objects
//

export type Props = { [key: string]: Type<*> };

export interface ObjectType<P: Props> extends Type<PropsType<P>> {
  tag: 'ObjectType';
  props: P;
}

function getDefaultObjectTypeName(props: Props): string {
  return `{ ${Object.keys(props).map(k => `${k}: ${props[k].name}`).join(', ')} }`
}

function object<P: Props>(props: P, name?: string): ObjectType<P> {
  return {
    tag: 'ObjectType',
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
      }, objectType.validate(v, c))
    }
  }
}

export {
  unsafeCoerce,
  getFunctionName,
  getContextEntry,
  getDefaultContext,
  getTypeName,
  failures,
  failure,
  success,
  isFailure,
  isSuccess,
  fromFailure,
  fromSuccess,
  of,
  map,
  ap,
  chain,
  fold,
  validateWithContext,
  validate,
  unsafeValidate,
  is,
  any,
  string,
  number,
  boolean,
  nullType as null,
  voidType as void,
  objectType as Object,
  functionType as Function,
  literal,
  instanceOf,
  classOf,
  array,
  union,
  tuple,
  maybe,
  refinement,
  recursion,
  mapping,
  intersection,
  $shape,
  $keys,
  $exact,
  object
}

