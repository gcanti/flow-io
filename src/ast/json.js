// @flow

import type {
  LiteralTypeValue
} from '../index'

export type Type =
  | RecursionType
  | LiteralType
  | IrreducibleType
  | GenericType
  | MaybeType
  | ArrayType
  | ObjectType
  | $ExactType
  | UnionType
  | IntersectionType
  | TupleType
  | MappingType
  ;

export type Props = { [key: string]: Type };

export type ExportNamedDeclaration = {
  tag: 'ExportNamedDeclaration',
  declaration: TypeAlias
};

export type TypeAlias = {
  tag: 'TypeAlias',
  name: string,
  type: Type
};

export type Json = ExportNamedDeclaration | TypeAlias;

export type RecursionType = {
  tag: 'RecursionType',
  self: GenericType,
  type: Type
};

export type LiteralTypeKind = 'string' | 'number' | 'boolean';

export type LiteralType = {
  tag: 'LiteralType',
  value: LiteralTypeValue,
  kind: LiteralTypeKind
};

export type IrreducibleType = {
  tag: 'IrreducibleType',
  name: string
};

export type ObjectType = {
  tag: 'ObjectType',
  props: Props
};

export type $ExactType = {
  tag: '$ExactType',
  props: Props
};

export type GenericType = {
  tag: 'GenericType',
  name: string
};

export type MaybeType = {
  tag: 'MaybeType',
  type: Type
};

export type ArrayType = {
  tag: 'ArrayType',
  type: Type
};

export type UnionType = {
  tag: 'UnionType',
  types: Array<Type>
};

export type IntersectionType = {
  tag: 'IntersectionType',
  types: Array<Type>
};

export type TupleType = {
  tag: 'TupleType',
  types: Array<Type>
};

export type MappingType = {
  tag: 'MappingType',
  domain: Type,
  codomain: Type
};
