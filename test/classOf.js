// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import assert from 'assert'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('classOf', () => {

  it('should succeed validating a valid value', () => {
    class A {}
    class B extends A {}
    const T = t.classOf(A)
    assertValidationSuccess(t.validate(A, T))
    assertValidationSuccess(t.validate(B, T))
  })

  it('should return the same reference if validation succeeded', () => {
    class A {}
    const T = t.classOf(A)
    const value = A
    assert.strictEqual(t.fromSuccess(t.validate(value, T)), value)
  })

  it('should fail validating an invalid value', () => {
    class A {}
    class C {}
    const T = t.classOf(A)
    assertValidationFailure(t.validate(C, T), [
      'Invalid value C supplied to Class<A>'
    ])
  })

})
