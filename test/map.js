// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('map', () => {

  it('should succeed validating a valid value', () => {
    const T = t.map(t.refinement(t.string, s => s.length >= 2), t.number)
    assertValidationSuccess(t.validate({}, T))
    assertValidationSuccess(t.validate({ aa: 1 }, T))
  })

  it('should fail validating an invalid value', () => {
    const T = t.map(t.refinement(t.string, s => s.length >= 2), t.number)
    assertValidationFailure(t.validate({ a: 1 }, T), [
      'Invalid value "a" supplied to : { [key: (string | <function1>)]: number }/a: (string | <function1>)'
    ])
    assertValidationFailure(t.validate({ aa: 's' }, T), [
      'Invalid value "s" supplied to : { [key: (string | <function1>)]: number }/aa: number'
    ])
  })

})
