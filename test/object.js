// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('object', () => {

  it('should succeed validating a valid value', () => {
    const T = t.object({ a: t.string })
    assertValidationSuccess(t.validate({ a: 's' }, T))
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
