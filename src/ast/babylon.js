// @flow

export type Identifier = {
  type: 'Identifier',
  name: string
};

export type StringTypeAnnotation = {
  type: 'StringTypeAnnotation'
};

export type NumberTypeAnnotation = {
  type: 'NumberTypeAnnotation'
};

export type BooleanTypeAnnotation = {
  type: 'BooleanTypeAnnotation'
};

export type AnyTypeAnnotation = {
  type: 'AnyTypeAnnotation'
};

export type NullLiteralTypeAnnotation = {
  type: 'NullLiteralTypeAnnotation'
};

export type VoidTypeAnnotation = {
  type: 'VoidTypeAnnotation'
};

export type ObjectTypeProperty = {
  type: 'ObjectTypeProperty',
  key: Identifier,
  value: Annotation,
  optional: boolean
};

export type ObjectTypeIndexer = {
  type: 'ObjectTypeIndexer',
  id: Identifier,
  key: Annotation,
  value: Annotation
};

export type ObjectTypeAnnotation = {
  type: 'ObjectTypeAnnotation',
  exact: boolean,
  properties: Array<ObjectTypeProperty>,
  indexers: Array<ObjectTypeIndexer>,
  exact: boolean
};

export type TypeParameterInstantiation = {
  type: 'TypeParameterInstantiation',
  params: Array<Annotation>
};

export type GenericTypeAnnotation = {
  type: 'GenericTypeAnnotation',
  id: Identifier,
  typeParameters: ?TypeParameterInstantiation
};

export type UnionTypeAnnotation = {
  type: 'UnionTypeAnnotation',
  types: Array<Annotation>
};

export type IntersectionTypeAnnotation = {
  type: 'IntersectionTypeAnnotation',
  types: Array<Annotation>
};

export type TupleTypeAnnotation = {
  type: 'TupleTypeAnnotation',
  types: Array<Annotation>
};

export type StringLiteralTypeAnnotation = {
  type: 'StringLiteralTypeAnnotation',
  value: string
};

export type NumberLiteralTypeAnnotation = {
  type: 'NumberLiteralTypeAnnotation',
  value: number
};

export type BooleanLiteralTypeAnnotation = {
  type: 'BooleanLiteralTypeAnnotation',
  value: boolean
};

export type Annotation =
  | GenericTypeAnnotation
  | ObjectTypeAnnotation
  | StringTypeAnnotation
  | NumberTypeAnnotation
  | BooleanTypeAnnotation
  | AnyTypeAnnotation
  | UnionTypeAnnotation
  | StringLiteralTypeAnnotation
  | NumberLiteralTypeAnnotation
  | BooleanLiteralTypeAnnotation
  ;

export type CommentLine = {
  type: 'CommentLine',
  value: string
};

export type TypeParameterDeclaration = {
  type: 'TypeParameterDeclaration',
  params: Array<Annotation>
};

export type TypeAlias = {
  type: 'TypeAlias',
  id: Identifier,
  right: Annotation,
  typeParameters: ?TypeParameterDeclaration,
  leadingComments: Array<CommentLine>
};

export type ExportNamedDeclaration = {
  type: 'ExportNamedDeclaration',
  declaration: TypeAlias,
  leadingComments: Array<CommentLine>
};

export type Statement =
  | ExportNamedDeclaration
  | TypeAlias;

export type Program = {
  type: 'Program',
  body: Array<Statement>
};

