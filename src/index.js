// @flow

import type { Either } from 'flow-static-land/lib/Either'

import * as either from 'flow-static-land/lib/Either'
import { unsafeCoerce } from 'flow-static-land/lib/Unsafe'

type ContextEntry = {
  key: string,
  name: string
};

type Context = Array<ContextEntry>;

type ValidationError = {
  value: mixed,
  context: Context,
  description: string
};

type ValidationResult<T> = Either<Array<ValidationError>, T>;

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

function createValidationError<T>(value: mixed, context: Context): ValidationResult<T> {
  return either.left([{
    value,
    context,
    description: `Invalid value ${JSON.stringify(value)} supplied to ${context.map(({ key, name }) => `${key}: ${name}`).join('/')}`
  }])
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

//
// irreducibles
//

export function of<T: string | number | boolean, O: { value: T }>(o: O): Type<$PropertyType<O, 'value'>> { // eslint-disable-line no-unused-vars
  return {
    name: JSON.stringify(o.value),
    validate: (v, c) => {
      return v === o.value ? either.right(o.value) : createValidationError(v, c)
    }
  }
}

export function instanceOf<T>(cl: Class<T>, name?: string): Type<T> {
  return {
    name: name || getFunctionName(cl),
    validate: (v, c) => v instanceof cl ? either.right(v) : createValidationError(v, c)
  }
}

function isNil(v: mixed) /* : boolean %checks */ {
  return v === void 0 || v === null
}

export const nil: Type<void | null> = {
  name: 'nil',
  validate: (v, c) => isNil(v) ? either.right(v) : createValidationError(v, c)
}

export const any: Type<any> = {
  name: 'any',
  validate: (v, c) => either.right(v) // eslint-disable-line no-unused-vars
}

function isString(v: mixed) /* : boolean %checks */ {
  return typeof v === 'string'
}

export const string: Type<string> = {
  name: 'string',
  validate: (v, c) => isString(v) ? either.right(v) : createValidationError(v, c)
}

function isNumber(v: mixed) /* : boolean %checks */ {
  return typeof v === 'number' && isFinite(v) && !isNaN(v)
}

export const number: Type<number> = {
  name: 'number',
  validate: (v, c) => isNumber(v) ? either.right(v) : createValidationError(v, c)
}

function isBoolean(v: mixed) /* : boolean %checks */ {
  return typeof v === 'boolean'
}

export const boolean: Type<boolean> = {
  name: 'boolean',
  validate: (v, c) => isBoolean(v) ? either.right(v) : createValidationError(v, c)
}

export const array: Type<Array<any>> = {
  name: 'Array',
  validate: (v, c) => Array.isArray(v) ? either.right(v) : createValidationError(v, c)
}

function isObject(v: mixed) /* : boolean %checks */ {
  return !isNil(v) && typeof v === 'object' && !Array.isArray(v)
}

export const object: Type<Object> = {
  name: 'Object',
  validate: (v, c) => isObject(v) ? either.right(v) : createValidationError(v, c)
}

function isFunction(v: mixed) /* : boolean %checks */ {
  return typeof v === 'function'
}

export const func: Type<Function> = {
  name: 'Function',
  validate: (v, c) => isFunction(v) ? either.right(v) : createValidationError(v, c)
}

//
// lists
//

function getDefaultListName<T>(type: Type<T>): string {
  return `Array<${getTypeName(type)}>`
}

export function list<T>(type: Type<T>, name?: string): Type<Array<T>> {
  return {
    name: name || getDefaultListName(type),
    validate: (v, c) => {
      return either.chain(a => {
        const errors = []
        for (let i = 0, len = a.length; i < len; i++) {
          const validation = type.validate(a[i], c.concat(createContextEntry(String(i), type)))
          if (either.isLeft(validation)) {
            Array.prototype.push.apply(errors, either.fromLeft(validation))
          }
        }
        return errors.length ? either.left(errors) : either.right(a)
      }, array.validate(v, c))
    }
  }
}

//
// unions
//

function getDefaultUnionName(types: Array<Type<*>>): string {
  return `(${types.map(getTypeName).join(' | ')})`
}

declare function union<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>>(types: [TA, TB, TC, TD, TE], name?: string) : Type<A | B | C | D | E>; // eslint-disable-line no-redeclare
declare function union<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>>(types: [TA, TB, TC, TD], name?: string) : Type<A | B | C | D>; // eslint-disable-line no-redeclare
declare function union<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>>(types: [TA, TB, TC], name?: string) : Type<A | B | C>; // eslint-disable-line no-redeclare
declare function union<A, B, TA: Type<A>, TB: Type<B>>(types: [TA, TB], name?: string) : Type<A | B>; // eslint-disable-line no-redeclare

export function union(types: Array<Type<*>>, name?: string): Type<*> {  // eslint-disable-line no-redeclare
  return {
    name: name || getDefaultUnionName(types),
    validate: (v, c) => {
      for (let i = 0, len = types.length; i < len; i++) {
        const type = types[i]
        const validation = type.validate(v, c)
        if (either.isRight(validation)) {
          return validation
        }
      }
      return createValidationError(v, c)
    }
  }
}

//
// tuples
//

function getDefaultTupleName(types: Array<Type<*>>): string {
  return `[${types.map(getTypeName).join(', ')}]`
}

declare function tuple<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>>(types: [TA, TB, TC, TD, TE], name?: string) : Type<[A, B, C, D, E]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>>(types: [TA, TB, TC, TD], name?: string) : Type<[A, B, C, D]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>>(types: [TA, TB, TC], name?: string) : Type<[A, B, C]>; // eslint-disable-line no-redeclare
declare function tuple<A, B, TA: Type<A>, TB: Type<B>>(types: [TA, TB], name?: string) : Type<[A, B]>; // eslint-disable-line no-redeclare

export function tuple(types: Array<Type<*>>, name?: string): Type<*> {  // eslint-disable-line no-redeclare
  return {
    name: name || getDefaultTupleName(types),
    validate: (v, c) => {
      return either.chain(a => {
        const errors = []
        for (let i = 0, len = a.length; i < len; i++) {
          const type = types[i]
          const validation = type.validate(a[i], c.concat(createContextEntry(String(i), type)))
          if (either.isLeft(validation)) {
            Array.prototype.push.apply(errors, either.fromLeft(validation))
          }
        }
        return errors.length ? either.left(errors) : either.right(a)
      }, array.validate(v, c))
    }
  }
}

//
// intersections
//

function getDefaultIntersectionName(types: Array<Type<*>>): string {
  return `(${types.map(getTypeName).join(' & ')})`
}

declare function intersection<A, B, C, D, E, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>, TE: Type<E>>(types: [TA, TB, TC, TD, TE], name?: string) : Type<A & B & C & D & E>; // eslint-disable-line no-redeclare
declare function intersection<A, B, C, D, TA: Type<A>, TB: Type<B>, TC: Type<C>, TD: Type<D>>(types: [TA, TB, TC, TD], name?: string) : Type<A & B & C & D>; // eslint-disable-line no-redeclare
declare function intersection<A, B, C, TA: Type<A>, TB: Type<B>, TC: Type<C>>(types: [TA, TB, TC], name?: string) : Type<A & B & C>; // eslint-disable-line no-redeclare
declare function intersection<A, B, TA: Type<A>, TB: Type<B>>(types: [TA, TB], name?: string) : Type<A & B>; // eslint-disable-line no-redeclare

export function intersection(types: Array<Type<*>>, name?: string): Type<*> {  // eslint-disable-line no-redeclare
  return {
    name: name || getDefaultIntersectionName(types),
    validate: (v, c) => {
      const errors = []
      for (let i = 0, len = types.length; i < len; i++) {
        const type = types[i]
        const validation = type.validate(v, c.concat(createContextEntry(String(i), type)))
        if (either.isLeft(validation)) {
          Array.prototype.push.apply(errors, either.fromLeft(validation))
        }
      }
      return errors.length ? either.left(errors) : either.right(v)
    }
  }
}

//
// maybe types (TODO testare che con usafeCorece non si persa il tyope checking del tipo wrappato)
//

function getDefaultMaybeName<T>(type: Type<T>): string {
  return `?${getTypeName(type)}`
}

export function maybe<T>(type: Type<T>, name?: string): Type<?T> {
  return {
    name: name || getDefaultMaybeName(type),
    validate: (v, c) => {
      return unsafeCoerce(isNil(v) ? either.right(v) : type.validate(v, c))
    }
  }
}

//
// map objects
//

function getDefaultMapName<D, C>(domain: Type<D>, codomain: Type<C>): string {
  return `{ [key: ${getTypeName(domain)}]: ${getTypeName(codomain)} }`
}

export function dictionary<D, C>(domain: Type<D>, codomain: Type<C>, name?: string): Type<{ [key: D]: C }> {
  return {
    name: name || getDefaultMapName(domain, codomain),
    validate: (v, c) => {
      return either.chain(o => {
        const errors = []
        for (let k in o) {
          const domainValidation = domain.validate(o[k], c.concat(createContextEntry(k, domain)))
          if (either.isLeft(domainValidation)) {
            Array.prototype.push.apply(errors, either.fromLeft(domainValidation))
          }
          const codomainValidation = codomain.validate(o[k], c.concat(createContextEntry(k, codomain)))
          if (either.isLeft(codomainValidation)) {
            Array.prototype.push.apply(errors, either.fromLeft(codomainValidation))
          }
        }
        return errors.length ? either.left(errors) : either.right(o)
      }, object.validate(v, c))
    }
  }
}

//
// refinements
//

type Predicate<T> = (value: T) => boolean;

function getDefaultRefineName<T>(type: Type<T>, predicate: Predicate<T>): string {
  return `(${getTypeName(type)} | ${getFunctionName(predicate)})`
}

export function refinement<T>(type: Type<T>, predicate: Predicate<T>, name?: string): Type<T> {
  return {
    name: name || getDefaultRefineName(type, predicate),
    validate: (v, c) => {
      return either.chain(
        t => predicate(t) ? either.right(t) : createValidationError(v, c),
        type.validate(v, c)
      )
    }
  }
}

type Props = {[key: string]: Type<any>};

function getDefaultTypeName(props: Props): string {
  return `{ ${Object.keys(props).map(k => `${k}: ${props[k].name}`).join(', ')} }`
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
// type aliases
//

export function type<P: Props>(props: P, name?: string): Type<$ObjMap<P, <T>(v: Type<T>) => T>> {
  return {
    name: name || getDefaultTypeName(props),
    validate: (v, c) => {
      return either.chain(o => {
        const errors = []
        for (let k in props) {
          const type = props[k]
          const validation = type.validate(o[k], c.concat(createContextEntry(k, type)))
          if (either.isLeft(validation)) {
            Array.prototype.push.apply(errors, either.fromLeft(validation))
          }
        }
        return errors.length ? either.left(errors) : either.right(o)
      }, object.validate(v, c))
    }
  }
}
