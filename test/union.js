// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('union', () => {

  it('should succeed validating a valid value', () => {
    const T = t.union([t.string, t.number])
    assertValidationSuccess(t.validate('s', T))
    assertValidationSuccess(t.validate(1, T))
  })

  it('should fail validating an invalid value', () => {
    const T = t.union([t.string, t.number])
    assertValidationFailure(t.validate(true, T), [
      'Invalid value true supplied to : (string | number)'
    ])
  })

})
