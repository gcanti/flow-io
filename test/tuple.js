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

describe('tuple', () => {

  it('should succeed validating a valid value', () => {
    const T = t.tuple([t.number, t.string])
    assertValidationSuccess(t.validate([1, 'a'], T))
    assertValidationSuccess(t.validate([1, 'a', 1], T))
  })

  it('should return the same reference if validation succeeded and nothing changed', () => {
    const T = t.tuple([t.number, t.string])
    const value = [1, 'a']
    assert.strictEqual(t.fromSuccess(t.validate(value, T)), value)
  })

  it('should return the a new reference if validation succeeded and something changed', () => {
    const T = t.tuple([number2, t.string])
    const value = [1, 'a']
    assert.deepEqual(t.fromSuccess(t.validate(value, T)), [2, 'a'])
  })

  it('should fail validating an invalid value', () => {
    const T = t.tuple([t.number, t.string])
    assertValidationFailure(t.validate([], T), [
      'Invalid value undefined supplied to [number, string]/0: number',
      'Invalid value undefined supplied to [number, string]/1: string'
    ])
    assertValidationFailure(t.validate([1], T), [
      'Invalid value undefined supplied to [number, string]/1: string'
    ])
    assertValidationFailure(t.validate([1, 1], T), [
      'Invalid value 1 supplied to [number, string]/1: string'
    ])
  })

})
