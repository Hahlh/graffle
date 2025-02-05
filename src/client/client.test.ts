import { describe, expect, expectTypeOf } from 'vitest'
import { createResponse, test } from '../../tests/_/helpers.js'
import { Graffle as Graffle2 } from '../../tests/_/schemas/kitchen-sink/graffle/__.js'
import { schema } from '../../tests/_/schemas/kitchen-sink/schema.js'
import { Graffle } from '../entrypoints/main.js'
import { Throws } from '../extensions/Throws/Throws.js'

const endpoint = new URL(`https://foo.io/api/graphql`)

describe(`without a registered client, document builder is not statically available but still works at runtime`, () => {
  const graffle = Graffle.create({ name: `unknown`, schema: endpoint }).use(Throws())

  test(`unavailable methods`, () => {
    // @ts-expect-error
    expect(typeof graffle.document).toEqual(`function`)
    // @ts-expect-error
    expect(typeof graffle.query).toEqual(`object`)
    // @ts-expect-error
    expect(typeof graffle.mutation).toEqual(`object`)
  })

  test(`available methods`, () => {
    expect(graffle.gql).toBeTypeOf(`function`)
  })
})

describe(`output`, () => {
  test(`when using envelope and transport is http, response property is available`, async ({ fetch }) => {
    fetch.mockImplementationOnce(() => Promise.resolve(createResponse({ data: { id: `abc` } })))
    const graffle = Graffle2.create({ schema: endpoint, output: { envelope: true } })
    const result = await graffle.query.id()
    expectTypeOf(result.response).toEqualTypeOf<Response>()
    expect(result.response.status).toEqual(200)
    // sanity check
    expect(result.data).toEqual({ 'id': `abc` })
  })
  test(`when using envelope and transport is memory, response property is NOT available`, async () => {
    const graffle = Graffle2.create({ schema, output: { envelope: true } })
    const result = await graffle.query.id()
    // @ts-expect-error not present
    expectTypeOf(result.response).toEqualTypeOf<Response>()
    // @ts-expect-error not present
    expect(result.response).toEqual(undefined)
    // sanity check
    expect(result.data).toEqual({ 'id': `abc` })
  })
})
