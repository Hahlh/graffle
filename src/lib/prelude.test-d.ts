import { assertEqual } from './assert-equal.js'
import { type GetLastValue, type OmitKeysWithPrefix, type ToParameters, type Tuple } from './prelude.js'

// dprint-ignore
{

assertEqual<OmitKeysWithPrefix<{ a: 1; b: 2 }, 'a'>         , { a: 1; b: 2 }>()
assertEqual<OmitKeysWithPrefix<{ foo_a: 1; b: 2 }, 'foo'>   , { b: 2 }>()

assertEqual<ToParameters<{ a:1 }>                           , [{ a:1 }]>()
assertEqual<ToParameters<{ a?:1 }>                          , [{ a?:1 }]|[]>()
assertEqual<ToParameters<{}>                                , []>()
assertEqual<ToParameters<{ a:1; b?:2 }>                     , [{ a:1; b?:2 }]>()
assertEqual<ToParameters<{ a?:1; b?:2 }>                    , [{ a?:1; b?:2 }]|[]>()

assertEqual<GetLastValue<[1, 2, 3]>, 3>()
// @ts-expect-error
GetLastValue<[]>

// Tuple.*

assertEqual<Tuple.DropUntilIndex<[1, 2, 3], 0>, [1, 2, 3]>()
assertEqual<Tuple.DropUntilIndex<[1, 2, 3], 2>, [3]>()
assertEqual<Tuple.DropUntilIndex<[1, 2, 3], 3>, []>()

assertEqual<Tuple.GetAtNextIndex<[1, 2, 3], 0>, 2>()
assertEqual<Tuple.GetAtNextIndex<[1, 2, 3], 2>, undefined>()

assertEqual<Tuple.GetNextIndexOr<[1, 2, 3], 0, false>, 2>()
assertEqual<Tuple.GetNextIndexOr<[1, 2, 3], 2, false>, false>()
}
