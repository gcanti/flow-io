# Example

```js
// @flow

import * as either from 'flow-static-land/lib/Either'
import * as t from 'flow-runtime/index'

const Person = t.type({
  name: t.string,
  age: t.number
})

const validation = t.validate({}, Person)
if (either.isRight(validation)) {
  const person: { name: string, age: number } = either.fromRight(validation)
} else {
  console.log(validation)
  // => Invalid value undefined supplied to : { name: string, age: number }/name: string
  // => Invalid value undefined supplied to : { name: string, age: number }/age: number
}
```
