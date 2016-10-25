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

describe('object', () => {

  it('should succeed validating a valid value', () => {
    const T = t.object({ a: t.string })
    assertValidationSuccess(t.validate({ a: 's' }, T))
  })

  it('should preserve additional props', () => {
    const T = t.object({ a: t.string })
    assert.deepEqual(t.fromSuccess(t.validate({ a: 's', b: 1 }, T)), { a: 's', b: 1 })
  })

  it('should return the same reference if validation succeeded and nothing changed', () => {
    const T = t.object({ a: t.string })
    const value = { a: 's' }
    assert.strictEqual(t.fromSuccess(t.validate(value, T)), value)
  })

  it('should return the a new reference if validation succeeded and something changed', () => {
    const T = t.object({ a: number2, b: t.number })
    const value = { a: 1, b: 2, c: 3 }
    assert.deepEqual(t.fromSuccess(t.validate(value, T)), { a: 2, b: 2, c: 3 })
  })

  it('should fail validating an invalid value', () => {
    const T = t.object({ a: t.string })
    assertValidationFailure(t.validate(1, T), [
      'Invalid value 1 supplied to : { a: string }'
    ])
    assertValidationFailure(t.validate({}, T), [
      'Invalid value undefined supplied to : { a: string }/a: string'
    ])
    assertValidationFailure(t.validate({ a: 1 }, T), [
      'Invalid value 1 supplied to : { a: string }/a: string'
    ])
  })

  it('should allow for additional props', () => {
    const T = t.object({ a: t.string })
    assertValidationSuccess(t.validate({ a: 's', additional: 2 }, T))
  })

})
