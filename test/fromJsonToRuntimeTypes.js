// @flow

declare var describe: (title: string, f: () => void) => void;
declare var it: (title: string, f: () => void) => void;

import assert from 'assert'
import { parse } from 'babylon'
import generate from 'babel-generator'
import { fromTypesToJson } from '../src/transformers/fromTypesToJson'
import { fromJsonToRuntimeTypes } from '../src/transformers/fromJsonToRuntimeTypes'

const parseOptions = {
  sourceType: 'module',
  plugins: [
    'flow'
  ]
}

const generateOptions = {
  quotes: 'single'
}

function equalCode(source, expected) {
  const ast = parse(source, parseOptions)
  const json = fromTypesToJson(ast.program)
  const rast = fromJsonToRuntimeTypes(json)
  assert.strictEqual(generate(rast, generateOptions).code, `import * as t from 'flow-runtime';\n${expected}`)
}

describe('fromJsonToRuntimeTypes', () => {

  it('TypeAlias', () => {
    equalCode(`type A = any;`, `const A = t.any;`)
  })

  it('ExportNamedDeclaration', () => {
    equalCode(`export type A = any;`, `export const A = t.any;`)
  })

  it('MappingType', () => {
    equalCode(`export type A = { [key: string]: number };`, `export const A = t.mapping([t.string, t.number], 'A');`)
  })

  it('ObjectType', () => {
    equalCode(`export type A = { name: string };`, `export const A = t.object({
  name: t.string
}, 'A');`)
  })

})
