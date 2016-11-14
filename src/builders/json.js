// @flow

import type {
  LiteralTypeValue
} from '../index'

import type {
  Type,
  ExportNamedDeclaration,
  TypeAlias,
  GenericType,
  LiteralType,
  LiteralTypeKind,
  IrreducibleType,
  ObjectType,
  Props,
  RecursionType,
  MaybeType,
  ArrayType,
  $ExactType,
  UnionType,
  IntersectionType,
  TupleType,
  MappingType
} from '../ast/json'

export function typeAlias(name: string, type: Type): TypeAlias {
  return {
    tag: 'TypeAlias',
    name,
    type
  }
}

export function exportNamedDeclaration(declaration: TypeAlias): ExportNamedDeclaration {
  return {
    tag: 'ExportNamedDeclaration',
    declaration
  }
}

export function generic(name: string): GenericType {
  return {
    tag: 'GenericType',
    name
  }
}

export function recursion(self: string, type: Type): RecursionType {
  return {
    tag: 'RecursionType',
    self: {
      tag: 'GenericType',
      name: self
    },
    type
  }
}

export function literal(value: LiteralTypeValue, kind: LiteralTypeKind): LiteralType {
  return {
    tag: 'LiteralType',
    value,
    kind
  }
}

export function irreducible(name: string): IrreducibleType {
  return {
    tag: 'IrreducibleType',
    name
  }
}

export function maybe(type: Type): MaybeType {
  return {
    tag: 'MaybeType',
    type
  }
}

export function array(type: Type): ArrayType {
  return {
    tag: 'ArrayType',
    type
  }
}

export function object(props: Props): ObjectType {
  return {
    tag: 'ObjectType',
    props
  }
}

export function $exact(props: Props): $ExactType {
  return {
    tag: '$ExactType',
    props
  }
}

export function union(types: Array<Type>): UnionType {
  return {
    tag: 'UnionType',
    types
  }
}

export function intersection(types: Array<Type>): IntersectionType {
  return {
    tag: 'IntersectionType',
    types
  }
}

export function tuple(types: Array<Type>): TupleType {
  return {
    tag: 'TupleType',
    types
  }
}

export function mapping(domain: Type, codomain: Type): MappingType {
  return {
    tag: 'MappingType',
    domain,
    codomain
  }
}
