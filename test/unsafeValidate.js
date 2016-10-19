// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import assert from 'assert'
import * as t from '../src/index'

describe('unsafeValidate', () => {

  it('should return T if validation succeeded', () => {
    assert.strictEqual(t.unsafeValidate('a', t.string), 'a')
  })

  it('should throw if validation failed', () => {
    assert.throws(() => {
      t.unsafeValidate(1, t.string)
    })
  })

})
