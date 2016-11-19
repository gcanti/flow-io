# The idea

A value of type `Type<T>` (called "runtime type") is a representation of the type `T`:

```js
class Type<T> {
  name: string;
  validate: (value: mixed, context: Context) => Validation<T>;
}
```

where `Context` and `Validation<T>` are defined as

```js
type ContextEntry = { key: string, name: string };
type Context = Array<ContextEntry>;
type ValidationError = { value: mixed, context: Context, description: string };
type Validation<T> = Either<Array<ValidationError>, T>;
```

Example: a runtime type representing the type `string` is

```js
import * as t from 'flow-io'

export const string: Type<string> = new Type(
  'string',
  (v, c) => typeof v === 'string' ? t.success(v) : t.failure(v, c)
)
```

A runtime type can be used to validate an object in memory (for example an API payload)

```js
import * as t from 'flow-io'

const Person = t.object({
  name: t.string,
  age: t.number
})

// ok
t.fromValidation(JSON.parse('{"name":"Giulio","age":43}'), Person) // => {name: "Giulio", age: 43}

// throws Invalid value undefined supplied to : { name: string, age: number }/age: number
t.fromValidation(JSON.parse('{"name":"Giulio"}'), Person)

// doesn't throw, returns an Either
const validation = t.validate(JSON.parse('{"name":"Giulio"}'), Person)
t.map(person => console.log(person), validation)
```

# Runtime type introspection

Runtime types can be inspected

```js
const Name: Type<string> = Person.props.name
const Age: Type<number> = Person.props.age
```

# Error reporters

A reporter implements the following interface

```js
export interface Reporter<A> {
  report: (validation: Validation<*>) => A;
}
```

This package exports two default reporters

- `PathReporter: Reporter<Array<string>>`
- `ThrowReporter: Reporter<void>`

Example

```js
import * as t from 'flow-io'
import { PathReporter, ThrowReporter } from 'flow-io/lib/reporters/default'

const validation = t.validate('a', t.number)
console.log(PathReporter.report(validation)) // => ["Invalid value "a" supplied to : number"]
ThrowReporter.report(validation) // => throws Invalid value "a" supplied to : number
```

# Implemented types / combinators

| Type | Flow syntax | Runtime type / combinator |
|------|-------|-------------|
| string | `string` | `string` |
| number | `number` | `number` |
| boolean | `boolean` | `boolean` |
| generic object | `Object` | `Object` |
| generic function | `Function` | `Function` |
| instance of `C` | `C` | `instanceOf(C)` |
| class of `C` | `Class<C>` | `classOf(C)` |
| array | `Array<A>` | `array(A)` |
| intersection | `A & B` | `intersection([A, B])` |
| literal | `'s'` | `literal('s')` |
| maybe | `?A` | `maybe(A)` |
| map | `{ [key: A]: B }` | `mapping(A, B)` |
| refinement | ✘ | `refinement(A, predicate)` |
| object | `{ name: string }` | `object({ name: string })` |
| tuple | `[A, B]` | `tuple([A, B])` |
| union | `A | B` | `union([A, B])` |
| $Exact | `{| name: string |}` | `$exact({ name: string })` |
| function | `(a: A) => B` | ✘ |
