import type { OperationTypeNode } from 'graphql'
import type { Grafaid } from '../../lib/grafaid/__.js'
import { type ExcludeNull } from '../../lib/prelude.js'
import type { Schema } from '../../types/Schema/__.js'
import type { OutputObject } from './OutputObject.js'

// dprint-ignore
export type OperationQuery<$SelectionSet, $Schema extends Schema> =
  Operation<$SelectionSet, $Schema, OperationTypeNode.QUERY>

// dprint-ignore
export type OperationMutation<$SelectionSet, $Schema extends Schema> =
  Operation<$SelectionSet, $Schema, OperationTypeNode.MUTATION>

// dprint-ignore
export type OperationSubscription<$SelectionSet, $Schema extends Schema> =
  Operation<$SelectionSet, $Schema, OperationTypeNode.SUBSCRIPTION>

export type Operation<
  $SelectionSet,
  $Schema extends Schema,
  $OperationType extends Grafaid.Document.OperationTypeNode,
> = OutputObject<$SelectionSet, $Schema, ExcludeNull<$Schema['Root'][$OperationType]>>
