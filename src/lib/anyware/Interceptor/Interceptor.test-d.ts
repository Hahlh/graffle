import { describe, expectTypeOf, test } from 'vitest'
import { _ } from '../../prelude.js'
import { type Interceptor, Pipeline } from '../_.js'
import type { initialInput } from '../__.test-helpers.js'
import { results, slots } from '../__.test-helpers.js'
import type { SomePublicStepEnvelope } from '../hook/public.js'

const p1 = Pipeline.create<initialInput>()
  .step({ name: `a`, run: () => results.a })
  .step({ name: `b`, run: () => results.b })
  .step({ name: `c`, run: () => results.c })

type p1 = typeof p1

describe(`interceptor constructor`, () => {
  type i1 = Interceptor.InferConstructor<p1['context']>

  test(`receives keyword arguments, a step trigger for each step`, () => {
    expectTypeOf<Parameters<i1>>().toMatchTypeOf<[steps: { a: any; b: any; c: any }]>()
    expectTypeOf<Parameters<i1>>().toMatchTypeOf<[steps: {
      a: (params: { input?: initialInput }) => Promise<{ b: (params: { input?: results['a'] }) => any }>
      b: (params: { input?: results['a'] }) => Promise<{ c: (params: { input?: results['b'] }) => any }>
      c: (params: { input?: results['b'] }) => Promise<results['c']>
    }]>()
  })

  test(`trigger accepts slots if definition has them, otherwise does NOT so much as accept the slots key`, () => {
    const p = Pipeline.create<initialInput>().step({
      name: `a`,
      slots: { m: slots.m },
      run: () => Promise.resolve(results.a),
    })
      .step({ name: `b`, run: () => results.b })
    type i = Interceptor.InferConstructor<typeof p['context']>
    type stepAParameters = Parameters<Parameters<i>[0]['a']>
    expectTypeOf<stepAParameters>().toEqualTypeOf<[params: { input?: initialInput; slots?: { m?: slots['m'] } }]>
    type stepBParameters = Parameters<Parameters<i1>[0]['b']>
    expectTypeOf<stepBParameters>().toEqualTypeOf<[params: { input?: results['a'] }]> // no "slots" key!
  })

  // --- return ---

  test(`can return pipeline output or a step envelope`, () => {
    expectTypeOf<ReturnType<i1>>().toEqualTypeOf<Promise<results['c'] | SomePublicStepEnvelope>>()
  })

  test(`return type awaits pipeline output`, () => {
    const p = Pipeline.create<initialInput>().step({ name: `a`, run: () => Promise.resolve(results.a) })
    type i = Interceptor.InferConstructor<typeof p['context']>
    expectTypeOf<ReturnType<i>>().toEqualTypeOf<Promise<results['a'] | SomePublicStepEnvelope>>()
  })
})
