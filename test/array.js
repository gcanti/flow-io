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

describe('array', () => {

  it('should succeed validating a valid value', () => {
    const T = t.array(t.number)
    assertValidationSuccess(t.validate([], T))
    assertValidationSuccess(t.validate([1, 2, 3], T))
  })

  it('should return the same reference if validation succeeded and nothing changed', () => {
    const T = t.array(t.number)
    const value = [1, 2, 3]
    assert.strictEqual(t.fromSuccess(t.validate(value, T)), value)
  })

  it('should return the a new reference if validation succeeded and something changed', () => {
    const T = t.array(number2)
    const value = [1, 2, 3]
    assert.deepEqual(t.fromSuccess(t.validate(value, T)), [2, 4, 6])
  })

  it('should fail validating an invalid value', () => {
    const T = t.array(t.number)
    assertValidationFailure(t.validate(1, T), [
      'Invalid value 1 supplied to Array<number>'
    ])
    assertValidationFailure(t.validate([1, 's', 3], T), [
      'Invalid value "s" supplied to Array<number>/1: number'
    ])
  })

})
