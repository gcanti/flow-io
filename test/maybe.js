// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('maybe', () => {

  it('should succeed validating a valid value', () => {
    const T = t.maybe(t.number)
    assertValidationSuccess(t.validate(null, T))
    assertValidationSuccess(t.validate(undefined, T))
    assertValidationSuccess(t.validate(1, T))
  })

  it('should fail validating an invalid value', () => {
    const T = t.maybe(t.number)
    assertValidationFailure(t.validate('s', T), [
      'Invalid value "s" supplied to : ?number'
    ])
  })

})
