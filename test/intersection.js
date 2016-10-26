// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import assert from 'assert'
import {
  assertValidationFailure,
  assertValidationSuccess,
  number2
} from './helpers'

describe('intersection', () => {

  it('should succeed validating a valid value', () => {
    const T = t.intersection([t.object({ a: t.number }), t.object({ b: t.number })])
    assertValidationSuccess(t.validate({ a: 1, b: 2 }, T))
    assertValidationSuccess(t.validate({ a: 1, b: 2, c: 3 }, T))
  })

  it('should return the same reference if validation succeeded and nothing changed', () => {
    const T = t.intersection([t.object({ a: t.number }), t.object({ b: t.number })])
    const value = { a: 1, b: 2 }
    assert.strictEqual(t.fromSuccess(t.validate(value, T)), value)
  })

  it('should return the a new reference if validation succeeded and something changed', () => {
    const T = t.intersection([t.object({ a: number2 }), t.object({ b: t.number })])
    const value = { a: 1, b: 2 }
    assert.deepEqual(t.fromSuccess(t.validate(value, T)), { a: 2, b: 2 })
  })

  it('should fail validating an invalid value', () => {
    const T = t.intersection([t.object({ a: t.number }), t.object({ b: t.number })])
    assertValidationFailure(t.validate({ a: 1 }, T), [
      'Invalid value undefined supplied to ({ a: number } & { b: number })/1/b: number'
    ])
  })

})
