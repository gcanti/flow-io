// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import assert from 'assert'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('maybe', () => {

  it('should succeed validating a valid value', () => {
    const T = t.maybe(t.number)
    assertValidationSuccess(t.validate(null, T))
    assertValidationSuccess(t.validate(undefined, T))
    assertValidationSuccess(t.validate(1, T))
  })

  it('should return the same reference if validation succeeded', () => {
    const T = t.maybe(t.obj)
    const value = {}
    assert.strictEqual(t.fromSuccess(t.validate(value, T)), value)
  })

  it('should fail validating an invalid value', () => {
    const T = t.maybe(t.number)
    assertValidationFailure(t.validate('s', T), [
      'Invalid value "s" supplied to ?number'
    ])
  })

})
