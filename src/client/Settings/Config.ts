import type { GraphQLSchema } from 'graphql'
import type { RequireProperties } from '../../lib/prelude.js'
import type { TransportHttp, TransportMemory } from '../../types/Transport.js'
import type { TransportHttpInput } from '../transportHttp/request.js'

export type OutputChannel = 'throw' | 'return'

export type OutputChannelConfig = 'throw' | 'return' | 'default'

export type ErrorCategory = 'execution' | 'other'

export const readConfigErrorCategoryOutputChannel = (
  config: Config,
  errorCategory: ErrorCategory,
): OutputChannel | false => {
  if (config.output.errors[errorCategory] === `default`) {
    return config.output.defaults.errorChannel
  }
  return config.output.errors[errorCategory]
}

export const traditionalGraphqlOutput = {
  defaults: { errorChannel: `throw` },
  envelope: { enabled: true, errors: { execution: true, other: false } },
  errors: { execution: `default`, other: `default` },
} satisfies OutputConfig

export const traditionalGraphqlOutputThrowing: OutputConfig = {
  ...traditionalGraphqlOutput,
  envelope: {
    ...traditionalGraphqlOutput.envelope,
    errors: {
      ...traditionalGraphqlOutput.envelope.errors,
      execution: false,
    },
  },
}

export const isContextConfigTraditionalGraphQLOutput = (config: Config) => {
  return config.output.envelope.enabled && config.output.envelope.errors.execution
    && !config.output.envelope.errors.other
}

export type OutputConfig = {
  defaults: {
    errorChannel: OutputChannel
  }
  envelope: {
    enabled: boolean
    errors: {
      execution: boolean
      other: boolean
    }
  }
  errors: {
    execution: OutputChannelConfig
    other: OutputChannelConfig
  }
}

export const outputConfigDefault: OutputConfigDefault = {
  defaults: {
    errorChannel: `throw`,
  },
  envelope: {
    enabled: false,
    errors: {
      execution: true,
      other: false,
    },
  },
  errors: {
    execution: `default`,
    other: `default`,
  },
}

export type OutputConfigDefault = {
  defaults: {
    errorChannel: 'throw'
  }
  envelope: {
    enabled: false
    errors: {
      execution: true
      other: false
    }
  }
  errors: {
    execution: 'default'
    other: 'default'
  }
}

export interface TransportConfigHttp {
  type: TransportHttp
  url: string | URL
  config: RequireProperties<TransportHttpInput, 'methodMode'>
}

export interface TransportConfigMemory {
  type: TransportMemory
  schema: GraphQLSchema
}

export type Config = {
  output: OutputConfig
  transport: TransportConfigHttp | TransportConfigMemory
}
