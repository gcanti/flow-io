// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import assert from 'assert'
import { fromTypesToJson } from '../src/transformers/fromTypesToJson'
import { parse } from 'babylon'

const parseOptions = {
  sourceType: 'module',
  plugins: [
    'flow'
  ]
}

function deepEqualJson(source: string, expected: Array<Object>) {
  const json = fromTypesToJson(parse(source, parseOptions).program)
  assert.deepEqual(json, expected)
}

describe('fromTypesToJson', () => {

  it('should throw with type parameters', () => {
    assert.throws(() => {
      fromTypesToJson(parse(`type A<T> = string`, parseOptions).program)
    })
  })

  it('IntersectionType', () => {
    deepEqualJson(`type A = string & number;`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'IntersectionType',
        types: [
          {
            tag: 'IrreducibleType',
            name: 'string'
          },
          {
            tag: 'IrreducibleType',
            name: 'number'
          }
        ]
      }
    }])
  })

  it('TupleType', () => {
    deepEqualJson(`type A = [string, number];`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'TupleType',
        types: [
          {
            tag: 'IrreducibleType',
            name: 'string'
          },
          {
            tag: 'IrreducibleType',
            name: 'number'
          }
        ]
      }
    }])
  })

  it('UnionType', () => {
    deepEqualJson(`type A = string | number;`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'UnionType',
        types: [
          {
            tag: 'IrreducibleType',
            name: 'string'
          },
          {
            tag: 'IrreducibleType',
            name: 'number'
          }
        ]
      }
    }])
  })

  it('ExportNamedDeclaration', () => {
    deepEqualJson(`export type A = any;`, [{
      tag: 'ExportNamedDeclaration',
      declaration: {
        tag: 'TypeAlias',
        name: 'A',
        type: {
          tag: 'IrreducibleType',
          name: 'any'
        }
      }
    }])
  })

  it('any', () => {
    deepEqualJson(`type A = any;`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'IrreducibleType',
        name: 'any'
      }
    }])
  })

  it('string', () => {
    deepEqualJson(`type A = string;`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'IrreducibleType',
        name: 'string'
      }
    }])
  })

  it('objectType', () => {
    deepEqualJson(`type A = Object;`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'IrreducibleType',
        name: 'Object'
      }
    }])
  })

  it('MaybeType', () => {
    deepEqualJson(`type A = ?string;`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'MaybeType',
          type: {
          tag: 'IrreducibleType',
          name: 'string'
        }
      }
    }])
  })

  it('ArrayType', () => {
    deepEqualJson(`type A = Array<string>;`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'ArrayType',
          type: {
          tag: 'IrreducibleType',
          name: 'string'
        }
      }
    }])
  })

  it('ArrayType should throw with wrong type parameters', () => {
    assert.throws(() => {
      fromTypesToJson(parse(`type A = Array`, parseOptions).program)
    })
    assert.throws(() => {
      fromTypesToJson(parse(`type A = Array<>`, parseOptions).program)
    })
    assert.throws(() => {
      fromTypesToJson(parse(`type A = Array<number, number>`, parseOptions).program)
    })
  })

  it('$ExactType', () => {
    deepEqualJson(`type A = {||};`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: '$ExactType',
        props: []
      }
    }])

    deepEqualJson(`type A = {| a: string |};`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: '$ExactType',
        props: {
          a: {
            tag: 'IrreducibleType',
            name: 'string'
          }
        }
      }
    }])
  })

  it('MappingType', () => {
    deepEqualJson(`type A = { [key: string]: number };`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'MappingType',
        domain: {
          tag: 'IrreducibleType',
          name: 'string'
        },
        codomain: {
          tag: 'IrreducibleType',
          name: 'number'
        }
      }
    }])
  })

  it('ObjectType', () => {
    deepEqualJson(`type A = {};`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'ObjectType',
        props: []
      }
    }])

    deepEqualJson(`type A = { a: string };`, [{
      tag: 'TypeAlias',
      name: 'A',
      type: {
        tag: 'ObjectType',
        props: {
          a: {
            tag: 'IrreducibleType',
            name: 'string'
          }
        }
      }
    }])
  })

})
