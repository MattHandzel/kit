import { SanitizePolicies } from './sanitize';
import defaultEmitter from './util/default-emitter';
import jsonEmitter from './util/json-emitter';

export type LogLevel = 'debug' | 'info' | 'default' | 'none';

export type LogEmitter = typeof console & {
  success: typeof console.log;
  always: typeof console.log;
};

export type LogOptions = {
  level?: LogLevel;

  // a log object, allowing total override of the output#
  logger?: LogEmitter;

  hideNamespace?: boolean;
  hideIcons?: boolean;

  // TODO if the output extends beyond the screenwith, wrap a bit
  //      just enough to avoid the [type][level] column (like this comment)
  wrap?: boolean;

  // or is this a terminal concern?
  showTimestamps?: boolean;

  // paths to stuff in the state object we should obfuscate
  // this should work with language adaptors
  // like if we on sensitive c in a.b.c, console.log(c) should
  sanitizePaths?: string[];

  sanitizeState?: boolean; // defaults to true
  detectState?: boolean; // defaults to true

  json?: boolean; // output as json objects

  sanitize?: SanitizePolicies;
};

export const defaults: Required<LogOptions> = {
  level: 'default',

  hideNamespace: false,
  hideIcons: false,
  logger: defaultEmitter,

  // Not implemented
  wrap: false,
  showTimestamps: false,
  sanitizeState: false,
  sanitize: 'none',
  detectState: false,
  sanitizePaths: ['configuration'],
  json: false,
};

// This will return a fully defined options object
const parseOptions = (opts: LogOptions = {}): Required<LogOptions> => {
  // First default all values
  const options = {
    ...defaults,
    // If logging to json, and no emitter is provided,
    // use this emitter which will serialise the output to JSON
    logger: opts.json ? jsonEmitter : defaultEmitter,
    ...opts,
  };

  return options;
};

export default parseOptions;
