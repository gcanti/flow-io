// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('recursion', () => {

  it('should succeed validating a valid value', () => {
    const T = t.recursion('T', self => t.object({
      a: t.number,
      b: t.maybe(self)
    }))
    assertValidationSuccess(t.validate({ a: 1 }, T))
    assertValidationSuccess(t.validate({ a: 1, b: { a: 2 } }, T))
  })

  it('should fail validating an invalid value', () => {
    const T = t.recursion('T', self => t.object({
      a: t.number,
      b: t.maybe(self)
    }))
    assertValidationFailure(t.validate(1, T), [
      'Invalid value 1 supplied to : T'
    ])
    assertValidationFailure(t.validate({}, T), [
      'Invalid value undefined supplied to : T/a: number'
    ])
    assertValidationFailure(t.validate({ a: 1, b: {} }, T), [
      'Invalid value undefined supplied to : T/b: ?T/a: number'
    ])
  })

})
