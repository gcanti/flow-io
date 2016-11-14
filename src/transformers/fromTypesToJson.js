// @flow

// Transforms a babylon ast containing types to the JSON representation

import type {
  GenericTypeAnnotation,
  ObjectTypeProperty,
  ObjectTypeAnnotation,
  Annotation,
  TypeAlias,
  Statement,
  Program
} from '../ast/babylon'

import type {
  Json
} from '../ast/json'

import * as json from '../builders/json'

function toObjectTypeProperties(properties: Array<ObjectTypeProperty>) {
  const props = {}
  properties.forEach(p => {
    const [k, v] = getObjectTypeProperty(p)
    props[k] = v
  })
  return props
}

function getObjectTypeProperty(p: ObjectTypeProperty) {
  return [p.key.name, toAnnotation(p.value)]
}

function toGenericTypeAnnotation(ast: GenericTypeAnnotation) {
  const name = ast.id.name
  if (name === 'Object' || name === 'Function') {
    return json.irreducible(name)
  }
  if (name === 'Array') {
    if (!ast.typeParameters || ast.typeParameters.params.length !== 1) {
      throw new Error('Incorrect number of type parameters (expected 1)')
    }
    return json.array(toAnnotation(ast.typeParameters.params[0]))
  }
  return json.generic(name)
}

function toObjectTypeAnnotation(ast: ObjectTypeAnnotation) {
  const indexersLength = ast.indexers.length
  if (indexersLength > 0) {
    if (indexersLength !== 1) {
      throw new Error('Incorrect number of type indexers (expected 1)')
    }
    const { key, value } = ast.indexers[0]
    return json.mapping(toAnnotation(key), toAnnotation(value))
  }
  const properties = toObjectTypeProperties(ast.properties)
  return ast.exact ?
    json.$exact(properties) :
    json.object(properties)
}

function toAnnotation(ast: Annotation) {
  switch (ast.type) {
    case 'GenericTypeAnnotation' :
      return toGenericTypeAnnotation(ast)
    case 'ObjectTypeAnnotation' :
      return toObjectTypeAnnotation(ast)
    case 'StringTypeAnnotation' :
      return json.irreducible('string')
    case 'NumberTypeAnnotation' :
      return json.irreducible('number')
    case 'BooleanTypeAnnotation' :
      return json.irreducible('boolean')
    case 'AnyTypeAnnotation' :
      return json.irreducible('any')
    case 'NullableTypeAnnotation' :
      return json.maybe(toAnnotation(ast.typeAnnotation))
    case 'UnionTypeAnnotation' :
      return json.union(ast.types.map(toAnnotation))
    case 'IntersectionTypeAnnotation' :
      return json.intersection(ast.types.map(toAnnotation))
    case 'TupleTypeAnnotation' :
      return json.tuple(ast.types.map(toAnnotation))
    case 'StringLiteralTypeAnnotation' :
      return json.literal(ast.value, 'string')
    case 'NumberLiteralTypeAnnotation' :
      return json.literal(ast.value, 'number')
    case 'BooleanLiteralTypeAnnotation' :
      return json.literal(ast.value, 'boolean')
    default :
      (ast: empty)
      throw `Unexpected AST type ${ast.type}`
  }
}

function isRecursive(ast: TypeAlias): boolean {
  return Array.isArray(ast.leadingComments) && ast.leadingComments.some(comment => /recursive/.test(comment.value))
}

function toRecursion(name: string, ast: Annotation) {
  return json.recursion(name, toAnnotation(ast))
}

export function toTypeAlias(ast: TypeAlias) {
  if (ast.typeParameters) {
    throw new Error('Incorrect number of type parameters (expected 0)')
  }
  const name = ast.id.name
  const type = isRecursive(ast) ? toRecursion(name, ast.right) : toAnnotation(ast.right)
  return json.typeAlias(name, type)
}

export function toStatement(ast: Statement): Json {
  switch (ast.type) {
    case 'TypeAlias' :
      return toTypeAlias(ast)
    case 'ExportNamedDeclaration' :
      return json.exportNamedDeclaration(toTypeAlias(ast.declaration))
    default :
      (ast: empty)
      throw `Unexpected AST type ${ast.type}`
  }
}

export function fromTypesToJson(ast: Program): Array<Json> {
  return ast.body.map(toStatement)
}
