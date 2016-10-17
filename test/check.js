// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import assert from 'assert'
import * as t from '../src/index'

describe('check', () => {

  it('should return void', () => {
    assert.strictEqual(t.check('a', t.string), undefined)
  })

})
