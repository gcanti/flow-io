// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('array', () => {

  it('should succeed validating a valid value', () => {
    const T = t.array(t.number)
    assertValidationSuccess(t.validate([], T))
    assertValidationSuccess(t.validate([1, 2, 3], T))
  })

  it('should fail validating an invalid value', () => {
    const T = t.array(t.number)
    assertValidationFailure(t.validate(1, T), [
      'Invalid value 1 supplied to : Array<number>'
    ])
    assertValidationFailure(t.validate([1, 's', 3], T), [
      'Invalid value "s" supplied to : Array<number>/1: number'
    ])
  })

})
