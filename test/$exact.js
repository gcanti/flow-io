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

describe('$exact', () => {

  it('should succeed validating a valid value', () => {
    const T = t.$exact({ a: t.string })
    assertValidationSuccess(t.validate({ a: 's' }, T))
  })

  it('should return the same reference if validation succeeded and nothing changed', () => {
    const T = t.$exact({ a: t.string })
    const value = { a: 's' }
    assert.strictEqual(t.fromSuccess(t.validate(value, T)), value)
  })

  it('should return a new reference if validation succeeded and something changed', () => {
    const T = t.$exact({ a: number2 })
    const value = { a: 1 }
    assert.deepEqual(t.fromSuccess(t.validate(value, T)), { a: 2 })
  })

  it('should fail validating an invalid value', () => {
    const T = t.$exact({ a: t.string })
    assertValidationFailure(t.validate(1, T), [
      'Invalid value 1 supplied to $Exact<{ a: string }>'
    ])
    assertValidationFailure(t.validate({}, T), [
      'Invalid value undefined supplied to $Exact<{ a: string }>/a: string'
    ])
    assertValidationFailure(t.validate({ a: 1 }, T), [
      'Invalid value 1 supplied to $Exact<{ a: string }>/a: string'
    ])
  })

  it('should check for additional props', () => {
    const T = t.$exact({ a: t.string })
    assertValidationFailure(t.validate({ a: 's', additional: 2 }, T), [
      'Invalid value 2 supplied to $Exact<{ a: string }>/additional: nil'
    ])
  })

})
