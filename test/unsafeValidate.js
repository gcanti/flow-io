// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import assert from 'assert'
import * as t from '../src/index'

describe('fromValidation', () => {

  it('should return T if validation succeeded', () => {
    assert.strictEqual(t.fromValidation('a', t.string), 'a')
  })

  it('should throw if validation failed', () => {
    assert.throws(() => {
      t.fromValidation(1, t.string)
    })
  })

})
