import type { UnionToTuple } from 'type-fest'
import type { Schema } from '../../../entrypoints/schema.js'
import type { IsTupleMultiple } from '../../../lib/prelude.js'
import type { Select } from '../../2_Select/__.js'
import type { InferResult } from '../../3_InferResult/__.js'
import type { ClientContext } from '../fluent.js'
import { type HandleOutput } from '../handleOutput.js'

// dprint-ignore
export type DocumentRunner<
  $$ClientContext extends ClientContext,
  $$Schema extends Schema,
  $$Document extends Select.Document.SomeDocument,
  $$Name extends Select.Document.GetOperationNames<$$Document> = Select.Document.GetOperationNames<$$Document>
> = {
  run: <
    $Params extends (IsTupleMultiple<UnionToTuple<$$Name>> extends true ? [name: $$Name] : []),
    const $Name extends string = $Params extends [] ? $$Name : $Params[0],
  >(...params: $Params) =>
    Promise<
      HandleOutput<
        $$ClientContext,
        InferResult.Root<
          Select.Document.GetOperation<$$Document, $Name>,
          $$Schema,
          Select.Document.GetRootTypeNameOfOperation<$$Document, $Name>
        >
      >
      & {}
    >
}

// todo maybe bring back these validations, but need to understand the perf impact

// export type Document<$Index extends SchemaIndex> =
//   {
//     [name: string]:
//       $Index['Root']['Query'] extends null    ? { mutation: SelectionSet.Root<$Index, 'Mutation'> } :
//       $Index['Root']['Mutation'] extends null ? { query: SelectionSet.Root<$Index, 'Query'> } :
//                                                 MergeExclusive<
//                                                   {
//                                                     query: SelectionSet.Root<$Index, 'Query'>
//                                                   },
//                                                   {
//                                                     mutation: SelectionSet.Root<$Index, 'Mutation'>
//                                                   }
//                                                 >
//   }

// export type ValidateDocumentOperationNames<$Document> =
//   // This initial condition checks that the document is not already in an error state.
//   // Namely from for example { x: { mutation: { ... }}} where the schema has no mutations.
//   // Which is statically caught by the `Document` type. In that case the document type variable
//   // no longer functions per normal with regards to keyof utility, not returning exact keys of the object
//   // but instead this more general union. Not totally clear _why_, but we have tests covering this...
//   string | number extends keyof $Document
//     ? $Document
//     : keyof { [K in keyof $Document & string as Schema.Named.NameParse<K> extends never ? K : never]: K } extends never
//       ? $Document
//       : TSError<'ValidateDocumentOperationNames', `One or more Invalid operation name in document: ${keyof { [K in keyof $Document & string as Schema.Named.NameParse<K> extends never ? K : never]: K }}`>
