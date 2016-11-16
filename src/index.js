// @flow

import type { Either } from 'flow-static-land/lib/Either'

import * as either from 'flow-static-land/lib/Either'
import { unsafeCoerce } from 'flow-static-land/lib/Unsafe'

//
// type extractor
//

type ExtractType<T, RT: Type<T>> = T; // eslint-disable-line no-unused-vars

export type TypeOf<RT> = ExtractType<*, RT>;

export type Validate<T> = (value: mixed, context: Context) => Validation<T>;

export class Type<T> {
  name: string;
  validate: Validate<T>;
  constructor(name: string, validate: Validate<T>) {
    this.name = name
    this.validate = validate
  }
}

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

function fromValidation<T>(value: mixed, type: Type<T>): T {
  return fromSuccess(validate(value, type))
}

function is<T>(value: mixed, type: Type<T>): boolean {
  return isSuccess(validate(value, type))
}

//
// literals
//

export class LiteralType<T> extends Type<T> {
  value: T;
  constructor(name: string, validate: Validate<T>, value: T) {
    super(name, validate)
    this.value = value
  }
}

export type LiteralTypeValue = string | number | boolean;

function literal<T: LiteralTypeValue>(value: T): LiteralType<T> {
  return new LiteralType(
    JSON.stringify(value),
    (v, c) => v === value ? success(value) : failure(v, c),
    value
  )
}

//
// class instances
//

export class InstanceOfType<T> extends Type<T> {
  ctor: Class<T>;
  constructor(name: string, validate: Validate<T>, ctor: Class<T>) {
    super(name, validate)
    this.ctor = ctor
  }
}

function instanceOf<T>(ctor: Class<T>, name?: string): InstanceOfType<T> {
  return new InstanceOfType(
    name || getFunctionName(ctor),
    (v, c) => v instanceof ctor ? success(v) : failure(v, c),
    ctor
  )
}

//
// classes
//

export class ClassType<T> extends Type<T> {
  ctor: T;
}

function classOf<T>(ctor: Class<T>, name?: string): ClassType<Class<T>> {
  const type = refinement(functionType, f => f === ctor || f.prototype instanceof ctor, name)
  return new ClassType(
    name || `Class<${getFunctionName(ctor)}>`,
    (v, c) => type.validate(v, c),
    ctor
  )
}

//
// irreducibles
//

function isNil(v: mixed) /* : boolean %checks */ {
  return v === void 0 || v === null
}

const nullType: Type<null> = new Type(
  'null',
  (v, c) => v === null ? success(v) : failure(v, c)
)

const voidType: Type<void> = new Type(
  'void',
  (v, c) => v === void 0 ? success(v) : failure(v, c)
)

const nil: Type<void | null> = new Type(
  'nil',
  (v, c) => isNil(v) ? success(v) : failure(v, c)
)

const any: Type<any> = new Type(
  'any',
  (v, c) => success(v) // eslint-disable-line no-unused-vars
)

const string: Type<string> = new Type(
  'string',
  (v, c) => typeof v === 'string' ? success(v) : failure(v, c)
)

const number: Type<number> = new Type(
  'number',
  (v, c) => typeof v === 'number' && isFinite(v) && !isNaN(v) ? success(v) : failure(v, c)
)

const boolean: Type<boolean> = new Type(
  'boolean',
  (v, c) => typeof v === 'boolean' ? success(v) : failure(v, c)
)

const arrayType: Type<Array<mixed>> = new Type(
  'Array',
  (v, c) => Array.isArray(v) ? success(v) : failure(v, c)
)

const objectType: Type<Object> = new Type(
  'Object',
  (v, c) => !isNil(v) && typeof v === 'object' && !Array.isArray(v) ? success(v) : failure(v, c)
)

const functionType: Type<Function> = new Type(
  'Function',
  (v, c) => typeof v === 'function' ? success(v) : failure(v, c)
)

//
// arrays
//

export class ArrayType<T> extends Type<T> {
  type: Type<*>;
  constructor(name: string, validate: Validate<T>, type: Type<*>) {
    super(name, validate)
    this.type = type
  }
}

function array<T, RT: Type<T>>(type: RT, name?: string): ArrayType<Array<T>> {
  return new ArrayType(
    name || `Array<${getTypeName(type)}>`,
    (v, c) => {
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
    },
    type
  )
}

//
// unions
//

export class UnionType<T> extends Type<T> {
  types: Array<Type<*>>;
  constructor(name: string, validate: Validate<T>, types: Array<Type<*>>) {
    super(name, validate)
    this.types = types
  }
}

declare function union<A, B, C, D, E>(types: [Type<A>, Type<B>, Type<C>, Type<E>], name?: string) : UnionType<A | B | C | D | E>; // eslint-disable-line no-redeclare
declare function union<A, B, C, D>(types: [Type<A>, Type<B>, Type<C>, Type<D>], name?: string) : UnionType<A | B | C | D>; // eslint-disable-line no-redeclare
declare function union<A, B, C>(types: [Type<A>, Type<B>, Type<C>], name?: string) : UnionType<A | B | C>; // eslint-disable-line no-redeclare
declare function union<A, B>(types: [Type<A>, Type<B>], name?: string) : UnionType<A | B>; // eslint-disable-line no-redeclare

function union(types: Array<Type<*>>, name?: string): UnionType<*> { // eslint-disable-line no-redeclare
  return new UnionType(
    name || `(${types.map(getTypeName).join(' | ')})`,
    (v, c) => {
      for (let i = 0, len = types.length; i < len; i++) {
        const validation = types[i].validate(v, c)
        if (isSuccess(validation)) {
          return validation
        }
      }
      return failure(v, c)
    },
    types
  )
}

//
// tuples
//

export class TupleType<T> extends Type<T> {
  types: Array<Type<*>>;
  constructor(name: string, validate: Validate<T>, types: Array<Type<*>>) {
    super(name, validate)
    this.types = types
  }
}

declare function tuple<A, B, C, D, E>(types: [Type<A>, Type<B>, Type<C>, Type<E>], name?: string) : TupleType<[A, B, C, E]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, C, D>(types: [Type<A>, Type<B>, Type<C>, Type<D>], name?: string) : TupleType<[A, B, C, D]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, C>(types: [Type<A>, Type<B>, Type<C>], name?: string) : TupleType<[A, B, C]>; // eslint-disable-line no-redeclare
declare function tuple<A, B>(types: [Type<A>, Type<B>], name?: string) : TupleType<[A, B]>; // eslint-disable-line no-redeclare

function tuple(types: Array<Type<*>>, name?: string): TupleType<*> { // eslint-disable-line no-redeclare
  return new TupleType(
    name || `[${types.map(getTypeName).join(', ')}]`,
    (v, c) => {
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
    },
    types
  )
}

//
// intersections
//

export class IntersectionType<T> extends Type<T> {
  types: Array<Type<*>>;
  constructor(name: string, validate: Validate<T>, types: Array<Type<*>>) {
    super(name, validate)
    this.types = types
  }
}

declare function intersection<A, B, C, D, E>(types: [Type<A>, Type<B>, Type<C>, Type<E>], name?: string) : IntersectionType<A & B & C & D & E>; // eslint-disable-line no-redeclare
declare function intersection<A, B, C, D>(types: [Type<A>, Type<B>, Type<C>, Type<D>], name?: string) : IntersectionType<A & B & C & D>; // eslint-disable-line no-redeclare
declare function intersection<A, B, C>(types: [Type<A>, Type<B>, Type<C>], name?: string) : IntersectionType<A & B & C>; // eslint-disable-line no-redeclare
declare function intersection<A, B>(types: [Type<A>, Type<B>], name?: string) : IntersectionType<A & B>; // eslint-disable-line no-redeclare

function intersection(types: Array<Type<*>>, name?: string): IntersectionType<*> {  // eslint-disable-line no-redeclare
  return new IntersectionType(
    name || `(${types.map(getTypeName).join(' & ')})`,
    (v, c) => {
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
    },
    types
  )
}

//
// maybes
//

export class MaybeType<T> extends Type<T> {
  type: Type<*>;
  constructor(name: string, validate: Validate<T>, type: Type<*>) {
    super(name, validate)
    this.type = type
  }
}

function maybe<T>(type: Type<T>, name?: string): MaybeType<?T> {
  return new MaybeType(
    name || `?${getTypeName(type)}`,
    (v, c) => unsafeCoerce(isNil(v) ? success(v) : type.validate(v, c)),
    type
  )
}

//
// map objects
//

export class MappingType<T> extends Type<T> {
  domain: Type<*>;
  codomain: Type<*>;
  constructor(name: string, validate: Validate<T>, domain: Type<*>, codomain: Type<*>) {
    super(name, validate)
    this.domain = domain
    this.codomain = codomain
  }
}

function mapping<D: string, RTD: Type<D>, C, RTC: Type<C>>(domain: RTD, codomain: RTC, name?: string): MappingType<{ [key: D]: C }> {
  return new MappingType(
    name || `{ [key: ${getTypeName(domain)}]: ${getTypeName(codomain)} }`,
    (v, c) => {
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
    },
    domain,
    codomain
  )
}

//
// refinements
//

export type Predicate<T> = (value: T) => boolean;

export class RefinementType<T> extends Type<T> {
  type: Type<*>;
  predicate: Predicate<T>;
  constructor(name: string, validate: Validate<T>, type: Type<*>, predicate: Predicate<T>) {
    super(name, validate)
    this.type = type
    this.predicate = predicate
  }
}

function refinement<T>(type: Type<T>, predicate: Predicate<T>, name?: string): RefinementType<T> {
  return new RefinementType(
    name || `(${getTypeName(type)} | ${getFunctionName(predicate)})`,
    (v, c) => either.chain(
      t => predicate(t) ? success(t) : failure(v, c),
      type.validate(v, c)
    ),
    type,
    predicate
  )
}

//
// recursive types
//

function recursion<T, RT: *>(name: string, definition: (self: Type<T>) => RT): RT {
  const Self = new Type(
    name,
    (v, c) => Result.validate(v, c)
  )
  const Result = definition(Self)
  Result.name = name
  return Result
}

//
// $Exact
//

export type PropsType<P: Props> = $ObjMap<P, <T>(v: Type<T>) => T>;

export class $ExactType<T> extends Type<T> {
  props: Props;
  constructor(name: string, validate: Validate<T>, props: Props) {
    super(name, validate)
    this.props = props
  }
}

function $exact<P: Props>(props: P, name?: string): $ExactType<$Exact<PropsType<P>>> {
  name = name || `$Exact<${getDefaultObjectTypeName(props)}>`
  const type = object(props, name)
  return new $ExactType(
    name,
    (v, c) => either.chain(o => {
      const errors = checkAdditionalProps(props, o, c)
      return errors.length ? failures(errors) : success(unsafeCoerce(o))
    }, type.validate(v, c)),
    props
  )
}

//
// objects
//

export type Props = { [key: string]: Type<*> };

export class ObjectType<T> extends Type<T> {
  props: Props;
  constructor(name: string, validate: Validate<T>, props: Props) {
    super(name, validate)
    this.props = props
  }
}

function getDefaultObjectTypeName(props: Props): string {
  return `{ ${Object.keys(props).map(k => `${k}: ${props[k].name}`).join(', ')} }`
}

function object<P: Props>(props: P, name?: string): ObjectType<PropsType<P>> {
  return new ObjectType(
    name || getDefaultObjectTypeName(props),
    (v, c) => {
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
    },
    props
  )
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
  fromValidation,
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
  $exact,
  object
}

