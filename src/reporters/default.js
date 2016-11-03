// @flow
import type { Reporter } from './Reporter'
import type { Context } from '../index'
import { fold, getFunctionName, isFailure } from '../index'

function stringify(value: mixed): string {
  return typeof value === 'function' ? getFunctionName(value) : JSON.stringify(value)
}

function getContextPath(context: Context): string {
  return context.map(({ key, type }) => `${key}: ${type.name}`).join('/')
}

export const PathReporter: Reporter<Array<string>> = {
  report: validation => fold(
    es => es.map(e => `Invalid value ${stringify(e.value)} supplied to ${getContextPath(e.context)}`),
    () => ['No errors!'],
    validation
  )
}

export const ThrowReporter: Reporter<void> = {
  report: validation => {
    if (isFailure(validation)) {
      throw PathReporter.report(validation).join('\n')
    }
  }
}
