# The idea

A value of type `Type<T>` (called "runtime type") is a representation of the type `T`:

```js
interface Type<T> {
  name: string;
  validate: (value: mixed, context: Context) => ValidationResult<T>;
}
```

For example the runtime type representing the type `string` is

```js
function isString(v: mixed) /* : boolean %checks */ {
  return typeof v === 'string'
}

export const string: Type<string> = {
  name: 'string',
  validate: (v, c) => isString(v) ? ...
}
```

The type `T` can be extracted from a runtime type

```js
import * as t from 'flow-runtime'

type ExtractType<A, TA: Type<A>> = A;
type TypeOf<T> = ExtractType<*, T>;

const Person = t.object({
  name: t.string,
  age: t.number
})

// this is equivalent to
// type PersonT = { name: string, age: number };
type PersonT = TypeOf<typeof Person>;
```

A runtime type can be used to validate an object in memory (for example an API payload)

```js
// ok
t.check(JSON.parse('{"name":"Giulio","age":43}'), Person)

// throws Invalid value undefined supplied to : { name: string, age: number }/age: number
t.check(JSON.parse('{"name":"Giulio"}'), Person)

// doesn't throw, returns a data structure containing
// the validation errors
t.validate(JSON.parse('{"name":"Giulio"}'), Person)
```

# Runtime type introspection

Runtime types can be inspected

```js
const nameType: Type<string> = Person.props.name
const ageType: Type<number> = Person.props.age
```

# Implemented types / combinators

| Type | Flow syntax | Runtime type / combinator |
|------|-------|-------------|
| string | `string` | `string` |
| number | `number` | `number` |
| boolean | `boolean` | `boolean` |
| generic array | `Array<any>` | `arr` |
| generic object | `Object` | `obj` |
| function | `Function` | `fun` |
| class `C` | `C` | `instanceOf(C)` |
| intersection | `A & B` | `intersection([A, B])` |
| literal | `'s'` | `literal({ value: 's' })` |
| maybe | `?A` | `maybe(A)` |
| map | `{ [key: A]: B }` | `map(A, B)` |
| refinement | ✘ | `refinement(A, predicateOnA)` |
| object | `{ name: string }` | `object({ name: string })` |
| tuple | `[A, B]` | `tuple([A, B])` |
| union | `A | B` | `union([A, B])` |
| $Keys | `$Keys<A>` | `$keys(A)` |
| $Exact | `{| name: string |}` | `$exact({ name: string })` |
| $Shape | `$Shape<A>` | `$shape(A)` |
