// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import * as t from '../src/index'
import { assertValidationFailure, assertValidationSuccess } from './helpers'

describe('$keys', () => {

  it('should succeed validating a valid value (object type)', () => {
    const T = t.$keys(t.object({ a: t.string, b: t.number }))
    assertValidationSuccess(t.validate('a', T))
    assertValidationSuccess(t.validate('b', T))
  })

  it('should succeed validating a valid value (exact object type)', () => {
    const T = t.$keys(t.$exact({ a: t.string, b: t.number }))
    assertValidationSuccess(t.validate('a', T))
    assertValidationSuccess(t.validate('b', T))
  })

  it('should fail validating an invalid value (object type)', () => {
    const T = t.$keys(t.object({ a: t.string, b: t.number }))
    assertValidationFailure(t.validate('c', T), [
      'Invalid value "c" supplied to : $Keys<{ a: string, b: number }>'
    ])
  })

  it('should fail validating an invalid value (exact object type)', () => {
    const T = t.$keys(t.$exact({ a: t.string, b: t.number }))
    assertValidationFailure(t.validate('c', T), [
      'Invalid value "c" supplied to : $Keys<$Exact<{ a: string, b: number }>>'
    ])
  })

})
