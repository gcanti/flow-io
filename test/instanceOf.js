// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('instanceOf', () => {

  it('should succeed validating a valid value', () => {
    class A {}
    const T = t.instanceOf(A)
    assertValidationSuccess(t.validate(new A(), T))
  })

  it('should fail validating an invalid value', () => {
    class A {}
    const T = t.instanceOf(A)
    assertValidationFailure(t.validate(1, T), [
      'Invalid value 1 supplied to : A'
    ])
  })

})
