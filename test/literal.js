// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('literal', () => {

  it('should succeed validating a valid value', () => {
    const T = t.literal('a')
    assertValidationSuccess(t.validate('a', T))
  })

  it('should fail validating an invalid value', () => {
    const T = t.literal('a')
    assertValidationFailure(t.validate(1, T), [
      'Invalid value 1 supplied to : "a"'
    ])
  })

})
