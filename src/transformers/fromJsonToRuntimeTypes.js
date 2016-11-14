// @flow

import type {
  Json,
  Type,
  LiteralType,
  IrreducibleType,
  ObjectType,
  ArrayType,
  UnionType,
  IntersectionType,
  TupleType,
  MappingType,
  TypeAlias
} from '../ast/json'

import type {
  Program
} from '../ast/babylon'

import { builders as b } from 'ast-types'

function toLiteralTypeValue(json: LiteralType) {
  switch (json.kind) {
    case 'string' :
      return b.stringLiteral(json.value)
    case 'number' :
      return b.numberLiteral(json.value)
    case 'boolean' :
      return b.booleanLiteral(json.value)
  }
}

function toLiteralType(json: LiteralType) {
  return b.callExpression(
    b.memberExpression(
      b.identifier('t'),
      b.identifier('literal')
    ),
    [b.objectExpression([b.objectProperty(b.identifier('value'), toLiteralTypeValue(json))])]
  )
}

function toIrreducibleType(json: IrreducibleType) {
  switch (json.name) {
    case 'string' :
      return b.memberExpression(b.identifier('t'), b.identifier('string'))
    case 'number' :
      return b.memberExpression(b.identifier('t'), b.identifier('number'))
    case 'boolean' :
      return b.memberExpression(b.identifier('t'), b.identifier('boolean'))
    case 'any' :
      return b.memberExpression(b.identifier('t'), b.identifier('any'))
    case 'Object' :
      return b.memberExpression(b.identifier('t'), b.identifier('objectType'))
    case 'Function' :
      return b.memberExpression(b.identifier('t'), b.identifier('functionType'))
    default :
      throw `Unexpected JSON name ${json.name}`
  }
}

function addName(params, name) {
  if (name) {
    return params.concat(b.stringLiteral(name))
  }
  return params
}

function objectTypeProperty(key, json) {
  return b.objectProperty(
    b.identifier(key),
    toAnnotation(json)
  )
}

function objectType(json: ObjectType, name?: string) {
  return b.callExpression(
    b.memberExpression(
      b.identifier('t'),
      b.identifier('object')
    ),
    addName([b.objectExpression(Object.keys(json.props).map(key => objectTypeProperty(key, json.props[key])))], name)
  )
}

function arrayType(json: ArrayType, name?: string) {
  return b.callExpression(
    b.memberExpression(
      b.identifier('t'),
      b.identifier('array')
    ),
    addName([toAnnotation(json.type)], name)
  )
}

function unionType(json: UnionType, name?: string) {
  return b.callExpression(
    b.memberExpression(
      b.identifier('t'),
      b.identifier('union')
    ),
    addName([b.arrayExpression(json.types.map(type => toAnnotation(type)))], name)
  )
}

function intersectionType(json: IntersectionType, name?: string) {
  return b.callExpression(
    b.memberExpression(
      b.identifier('t'),
      b.identifier('intersection')
    ),
    addName([b.arrayExpression(json.types.map(type => toAnnotation(type)))], name)
  )
}

function tupleType(json: TupleType, name?: string) {
  return b.callExpression(
    b.memberExpression(
      b.identifier('t'),
      b.identifier('tuple')
    ),
    addName([b.arrayExpression(json.types.map(type => toAnnotation(type)))], name)
  )
}

function mappingType(json: MappingType, name?: string) {
  return b.callExpression(
    b.memberExpression(
      b.identifier('t'),
      b.identifier('mapping')
    ),
    addName([b.arrayExpression([toAnnotation(json.domain), toAnnotation(json.codomain)])], name)
  )
}

function toAnnotation(json: Type, name?: string) {
  switch (json.tag) {
    case 'LiteralType' :
      return toLiteralType(json)
    case 'IrreducibleType' :
      return toIrreducibleType(json)
    case 'MappingType' :
      return mappingType(json, name)
    case 'ObjectType' :
      return objectType(json, name)
    case 'GenericType' :
      return b.identifier(json.name)
    case 'ArrayType' :
      return arrayType(json, name)
    case 'UnionType' :
      return unionType(json, name)
    case 'IntersectionType' :
      return intersectionType(json, name)
    case 'TupleType' :
      return tupleType(json, name)
    default :
      (json: empty)
      throw `Unexpected JSON tag ${json.tag}`
  }
}

function typeAlias(json: TypeAlias) {
  return b.variableDeclaration(
    'const',
    [b.variableDeclarator(b.identifier(json.name), toAnnotation(json.type, json.name))]
  )
}

function toStatement(json: Json) {
  switch (json.tag) {
    case 'TypeAlias' :
      return typeAlias(json)
    case 'ExportNamedDeclaration' :
      return b.exportNamedDeclaration(
        typeAlias(json.declaration),
        [],
        null,
        'value'
      )
    default :
      (json: empty)
      throw `Unexpected JSON tag ${json.tag}`
  }
}

export function fromJsonToRuntimeTypes(json: Array<Json>): Program {
  return b.program(
    [b.importDeclaration(
      [b.importNamespaceSpecifier(b.identifier('t'))],
      b.stringLiteral('flow-runtime')
    )].concat(json.map(toStatement))
  )
}
