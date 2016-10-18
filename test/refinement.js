// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import assert from 'assert'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('refinement', () => {

  it('should succeed validating a valid value', () => {
    const T = t.refinement(t.number, n => n >= 0)
    assertValidationSuccess(t.validate(0, T))
    assertValidationSuccess(t.validate(1, T))
  })

  it('should return the same reference if validation succeeded', () => {
    const T = t.refinement(t.obj, () => true)
    const value = {}
    assert.strictEqual(t.fromSuccess(t.validate(value, T)), value)
  })

  it('should fail validating an invalid value', () => {
    const T = t.refinement(t.number, n => n >= 0)
    assertValidationFailure(t.validate(-1, T), [
      'Invalid value -1 supplied to : (number | <function1>)'
    ])
  })

})
