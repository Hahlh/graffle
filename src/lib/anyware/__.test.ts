/* eslint-disable */

import { describe, expect, test, vi } from 'vitest'
import { Errors } from '../errors/__.js'
import type { ContextualError } from '../errors/ContextualError.js'
import { Anyware } from './__.js'
import { core, createHook, initialInput, oops, run, runWithOptions } from './__.test-helpers.js'
import { createRetryingInterceptor } from './Interceptor.js'

describe(`no extensions`, () => {
  test(`passthrough to implementation`, async () => {
    const result = await run()
    expect(result).toEqual({ value: `initial+a+b` })
  })
})

describe(`one extension`, () => {
  test(`can return own result`, async () => {
    expect(
      await run(async ({ a }) => {
        const { b } = await a(a.input)
        await b({ input: b.input })
        return 0
      }),
    ).toEqual(0)
    expect(core.hooks.a.run.mock.calls[0]).toMatchObject([{ input: { value: `initial` } }])
    expect(core.hooks.a.run).toHaveBeenCalled()
    expect(core.hooks.b.run).toHaveBeenCalled()
  })
  test('can call hook with no input, making the original input be used', () => {
    expect(
      run(async ({ a }) => {
        return await a()
      }),
    ).resolves.toEqual({ value: 'initial+a+b' })
    // todo why doesn't this work?
    // expect(core.hooks.a).toHaveBeenCalled()
    // expect(core.hooks.b).toHaveBeenCalled()
  })
  describe(`can short-circuit`, () => {
    test(`at start, return input`, async () => {
      expect(
        // todo arrow function expression parsing not working
        await run(({ a }) => {
          return a.input
        }),
      ).toEqual({ value: `initial` })
      expect(core.hooks.a.run).not.toHaveBeenCalled()
      expect(core.hooks.b.run).not.toHaveBeenCalled()
    })
    test(`at start, return own result`, async () => {
      expect(
        // todo arrow function expression parsing not working
        await run(({ a }) => {
          return 0
        }),
      ).toEqual(0)
      expect(core.hooks.a.run).not.toHaveBeenCalled()
      expect(core.hooks.b.run).not.toHaveBeenCalled()
    })
    test(`after first hook, return own result`, async () => {
      expect(
        await run(async ({ a }) => {
          const { b } = await a({ input: a.input })
          return b.input.value + `+x`
        }),
      ).toEqual(`initial+a+x`)
      expect(core.hooks.b.run).not.toHaveBeenCalled()
    })
  })
  describe(`can partially apply`, () => {
    test(`only first hook`, async () => {
      expect(
        await run(async ({ a }) => {
          return await a({ input: { value: a.input.value + `+ext` } })
        }),
      ).toEqual({ value: `initial+ext+a+b` })
    })
    test(`only second hook`, async () => {
      expect(
        await run(async ({ b }) => {
          return await b({ input: { value: b.input.value + `+ext` } })
        }),
      ).toEqual({ value: `initial+a+ext+b` })
    })
    test(`only second hook + end`, async () => {
      expect(
        await run(async ({ b }) => {
          const result = await b({ input: { value: b.input.value + `+ext` } })
          return result.value + `+end`
        }),
      ).toEqual(`initial+a+ext+b+end`)
    })
  })
})

describe(`two extensions`, () => {
  const run = runWithOptions({ entrypointSelectionMode: `optional` })
  test(`first can short-circuit`, async () => {
    const ex1 = () => 1
    const ex2 = vi.fn().mockImplementation(() => 2)
    expect(await run(ex1, ex2)).toEqual(1)
    expect(ex2).not.toHaveBeenCalled()
    expect(core.hooks.a.run).not.toHaveBeenCalled()
    expect(core.hooks.b.run).not.toHaveBeenCalled()
  })

  test(`each can adjust first hook then passthrough`, async () => {
    const ex1 = ({ a }: any) => a({ input: { value: a.input.value + `+ex1` } })
    const ex2 = ({ a }: any) => a({ input: { value: a.input.value + `+ex2` } })
    expect(await run(ex1, ex2)).toEqual({ value: `initial+ex1+ex2+a+b` })
  })

  test(`each can adjust each hook`, async () => {
    const ex1 = async ({ a }: any) => {
      const { b } = await a({ input: { value: a.input.value + `+ex1` } })
      return await b({ input: { value: b.input.value + `+ex1` } })
    }
    const ex2 = async ({ a }: any) => {
      const { b } = await a({ input: { value: a.input.value + `+ex2` } })
      return await b({ input: { value: b.input.value + `+ex2` } })
    }
    expect(await run(ex1, ex2)).toEqual({ value: `initial+ex1+ex2+a+ex1+ex2+b` })
  })

  test(`second can skip hook a`, async () => {
    const ex1 = async ({ a }: any) => {
      const { b } = await a({ input: { value: a.input.value + `+ex1` } })
      return await b({ input: { value: b.input.value + `+ex1` } })
    }
    const ex2 = async ({ b }: any) => {
      return await b({ input: { value: b.input.value + `+ex2` } })
    }
    expect(await run(ex1, ex2)).toEqual({ value: `initial+ex1+a+ex1+ex2+b` })
  })
  test(`second can short-circuit before hook a`, async () => {
    let ex1AfterA = false
    const ex1 = async ({ a }: any) => {
      const { b } = await a({ value: a.input.value + `+ex1` })
      ex1AfterA = true
    }
    const ex2 = async ({ a }: any) => {
      return 2
    }
    expect(await run(ex1, ex2)).toEqual(2)
    expect(ex1AfterA).toBe(false)
    expect(core.hooks.a.run).not.toHaveBeenCalled()
    expect(core.hooks.b.run).not.toHaveBeenCalled()
  })
  test(`second can short-circuit after hook a`, async () => {
    let ex1AfterB = false
    const ex1 = async ({ a }: any) => {
      const { b } = await a({ input: { value: a.input.value + `+ex1` } })
      await b({ value: b.input.value + `+ex1` })
      ex1AfterB = true
    }
    const ex2 = async ({ a }: any) => {
      await a({ value: a.input.value + `+ex2` })
      return 2
    }
    expect(await run(ex1, ex2)).toEqual(2)
    expect(ex1AfterB).toBe(false)
    expect(core.hooks.a.run).toHaveBeenCalledOnce()
    expect(core.hooks.b.run).not.toHaveBeenCalled()
  })
})

describe(`errors`, () => {
  test(`extension that throws a non-error is wrapped in error`, async () => {
    const result = await run(async ({ a }) => {
      throw `oops`
    }) as ContextualError
    expect({
      result,
      context: result.context,
      cause: result.cause,
    }).toMatchInlineSnapshot(`
      {
        "cause": [Error: oops],
        "context": {
          "hookName": "a",
          "interceptorName": "anonymous",
          "source": "extension",
        },
        "result": [ContextualError: There was an error in the interceptor "anonymous" (use named functions to improve this error message) while running hook "a".],
      }
    `)
  })
  test(`extension throws asynchronously`, async () => {
    const result = await run(async ({ a }) => {
      throw oops
    }) as ContextualError
    expect({
      result,
      context: result.context,
      cause: result.cause,
    }).toMatchInlineSnapshot(`
      {
        "cause": [Error: oops],
        "context": {
          "hookName": "a",
          "interceptorName": "anonymous",
          "source": "extension",
        },
        "result": [ContextualError: There was an error in the interceptor "anonymous" (use named functions to improve this error message) while running hook "a".],
      }
    `)
  })

  test(`if implementation fails, without extensions, result is the error`, async () => {
    core.hooks.a.run.mockReset().mockRejectedValueOnce(oops)
    const result = await run() as ContextualError
    expect({
      result,
      context: result.context,
      cause: result.cause,
    }).toMatchInlineSnapshot(`
      {
        "cause": [Error: oops],
        "context": {
          "hookName": "a",
          "source": "implementation",
        },
        "result": [ContextualError: There was an error in the core implementation of hook "a".],
      }
    `)
  })
  test('calling a hook twice leads to clear error', async () => {
    let neverRan = true
    const result = await run(async ({ a }) => {
      await a()
      await a()
      neverRan = false
    }) as ContextualError
    expect(neverRan).toBe(true)
    const cause = result.cause as ContextualError
    expect(cause.message).toMatchInlineSnapshot(
      `"Only a retrying extension can retry hooks."`,
    )
    expect(cause.context).toMatchInlineSnapshot(`
      {
        "extensionsAfter": [],
        "hookName": "a",
      }
    `)
  })
  describe('certain errors can be configured to be re-thrown without wrapping error', () => {
    class SpecialError1 extends Error {}
    class SpecialError2 extends Error {}
    const a = createHook({
      slots: {},
      run: ({ input }: { slots: object; input: { throws: Error } }) => {
        if (input.throws) throw input.throws
      },
    })

    test('via passthroughErrorInstanceOf (one)', async () => {
      const anyware = Anyware.create<['a'], Anyware.HookDefinitionMap<['a']>>({
        hookNamesOrderedBySequence: [`a`],
        hooks: { a },
        passthroughErrorInstanceOf: [SpecialError1],
      })
      // dprint-ignore
      expect(anyware.run({ initialInput: { throws: new Error('oops') }, interceptors: [] })).resolves.toBeInstanceOf(Errors.ContextualError)
      // dprint-ignore
      expect(anyware.run({ initialInput: { throws: new SpecialError1('oops') }, interceptors: [] })).resolves.toBeInstanceOf(SpecialError1)
    })
    test('via passthroughErrorInstanceOf (multiple)', async () => {
      const anyware = Anyware.create<['a'], Anyware.HookDefinitionMap<['a']>>({
        hookNamesOrderedBySequence: [`a`],
        hooks: { a },
        passthroughErrorInstanceOf: [SpecialError1, SpecialError2],
      })
      // dprint-ignore
      expect(anyware.run({ initialInput: { throws: new Error('oops') }, interceptors: [] })).resolves.toBeInstanceOf(Errors.ContextualError)
      // dprint-ignore
      expect(anyware.run({ initialInput: { throws: new SpecialError2('oops') }, interceptors: [] })).resolves.toBeInstanceOf(SpecialError2)
    })
    test('via passthroughWith', async () => {
      const anyware = Anyware.create<['a'], Anyware.HookDefinitionMap<['a']>>({
        hookNamesOrderedBySequence: [`a`],
        hooks: { a },
        // todo type-safe hook name according to values passed to constructor
        // todo type-tests on signal { hookName, source, error }
        passthroughErrorWith: (signal) => {
          return signal.error instanceof SpecialError1
        },
      })
      // dprint-ignore
      expect(anyware.run({ initialInput: { throws: new Error('oops') }, interceptors: [] })).resolves.toBeInstanceOf(Errors.ContextualError)
      // dprint-ignore
      expect(anyware.run({ initialInput: { throws: new SpecialError1('oops') }, interceptors: [] })).resolves.toBeInstanceOf(SpecialError1)
    })
  })
})

describe('retrying extension', () => {
  test('if hook fails, extension can retry, then short-circuit', async () => {
    core.hooks.a.run.mockReset().mockRejectedValueOnce(oops).mockResolvedValueOnce(1)
    const result = await run(createRetryingInterceptor(async function foo({ a }) {
      const result1 = await a()
      expect(result1).toEqual(oops)
      const result2 = await a()
      expect(typeof result2.b).toEqual('function')
      expect(result2.b.input).toEqual(1)
      return result2.b.input
    }))
    expect(result).toEqual(1)
  })

  describe('errors', () => {
    test('not last extension', async () => {
      const result = await run(
        createRetryingInterceptor(async function foo({ a }) {
          return a()
        }),
        async function bar({ a }) {
          return a()
        },
      )
      expect(result).toMatchInlineSnapshot(`[ContextualError: Only the last extension can retry hooks.]`)
      expect((result as Errors.ContextualError).context).toMatchInlineSnapshot(`
        {
          "extensionsAfter": [
            {
              "name": "bar",
            },
          ],
        }
      `)
    })
    test('call hook twice even though it succeeded the first time', async () => {
      let neverRan = true
      const result = await run(
        createRetryingInterceptor(async function foo({ a }) {
          const result1 = await a()
          expect('b' in result1).toBe(true)
          await a() // <-- Extension bug here under test.
          neverRan = false
        }),
      )
      expect(neverRan).toBe(true)
      expect(result).toMatchInlineSnapshot(
        `[ContextualError: There was an error in the interceptor "foo".]`,
      )
      expect((result as Errors.ContextualError).context).toMatchInlineSnapshot(
        `
        {
          "hookName": "a",
          "interceptorName": "foo",
          "source": "extension",
        }
      `,
      )
      expect((result as Errors.ContextualError).cause).toMatchInlineSnapshot(
        `[ContextualError: Only after failure can a hook be called again by a retrying extension.]`,
      )
    })
  })
})

describe('slots', () => {
  test('have defaults that are called by default', async () => {
    await run()
    expect(core.hooks.a.slots.append.mock.calls[0]).toMatchObject(['a'])
    expect(core.hooks.b.slots.append.mock.calls[0]).toMatchObject(['b'])
  })
  test('extension can provide own function to slot on just one of a set of hooks', async () => {
    const result = await run(async ({ a }) => {
      return a({ using: { append: () => 'x' } })
    })
    expect(core.hooks.a.slots.append).not.toBeCalled()
    expect(core.hooks.b.slots.append.mock.calls[0]).toMatchObject(['b'])
    expect(result).toEqual({ value: 'initial+x+b' })
  })
  test('extension can provide own functions to slots on multiple of a set of hooks', async () => {
    const result = await run(async ({ a }) => {
      return a({ using: { append: () => 'x', appendExtra: () => '+x2' } })
    })
    expect(result).toEqual({ value: 'initial+x+x2+b' })
  })
  // todo hook with two slots
  test('two extensions can each provide own function to same slot on just one of a set of hooks, and the later one wins', async () => {
    const result = await run(async ({ a }) => {
      const { b } = await a({ using: { append: () => 'x' } })
      return b({ using: { append: () => 'y' } })
    })
    expect(core.hooks.a.slots.append).not.toBeCalled()
    expect(core.hooks.b.slots.append).not.toBeCalled()
    expect(result).toEqual({ value: 'initial+x+y' })
  })
})

describe('private hook parameter - previous', () => {
  test('contains inputs of previous hooks', async () => {
    await run(async ({ a }) => {
      return a()
    })
    expect(core.hooks.a.run.mock.calls[0]?.[0].previous).toEqual({})
    expect(core.hooks.b.run.mock.calls[0]?.[0].previous).toEqual({ a: { input: initialInput } })
  })

  test('contains the final input actually passed to the hook', async () => {
    const customInput = { value: 'custom' }
    await run(async ({ a }) => {
      return a({ input: customInput })
    })
    expect(core.hooks.a.run.mock.calls[0]?.[0].previous).toEqual({})
    expect(core.hooks.b.run.mock.calls[0]?.[0].previous).toEqual({ a: { input: customInput } })
  })
})
