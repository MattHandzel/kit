import { createMockLogger, Logger } from '@openfn/logger';
import type { State } from '@openfn/lexicon';
import type {
  Operation,
  ExecutionPlan,
  JobNodeID,
  ExecutionCallbacks,
} from './types';
import type { LinkerOptions } from './modules/linker';
import executePlan from './execute/plan';
import clone from './util/clone';
import parseRegex from './util/regex';

export const TIMEOUT = 5 * 60 * 1000; // 5 minutes

export type Options = {
  start?: JobNodeID;
  logger?: Logger;
  jobLogger?: Logger;

  timeout?: number; // this is timeout used per job, not per workflow
  strict?: boolean; // Be strict about handling of state returned from jobs

  // Treat state as immutable (likely to break in legacy jobs)
  immutableState?: boolean;

  // TODO currently unused
  // Ensure that all incoming jobs are sandboxed / loaded as text
  // In practice this means throwing if someone tries to pass live js
  forceSandbox?: boolean;

  linker?: LinkerOptions;

  callbacks?: ExecutionCallbacks;

  // inject globals into the environment
  globals?: any;

  // all listed props will be removed from the state object at the end of a job
  statePropsToRemove?: string[];
};

type RawOptions = Omit<Options, 'linker'> & {
  linker?: Omit<LinkerOptions, 'whitelist'> & {
    whitelist?: Array<RegExp | string>;
  };
};

const defaultState = { data: {}, configuration: {} };

// Log nothing by default
const defaultLogger = createMockLogger();

// TODO doesn't really make sense to pass in a state object to an xplan,
// so maybe state becomes an option in the opts object
const run = (
  expressionOrXPlan: string | Operation[] | ExecutionPlan,
  state?: State,
  opts: RawOptions = {}
) => {
  const logger = opts.logger || defaultLogger;

  // Strict state handling by default
  if (!opts.hasOwnProperty('strict')) {
    opts.strict = true;
  }
  if (!opts.hasOwnProperty('statePropsToRemove')) {
    opts.statePropsToRemove = ['configuration'];
  }
  if (opts.linker?.whitelist) {
    opts.linker.whitelist = opts.linker.whitelist.map((w) => {
      if (typeof w === 'string') {
        return parseRegex(w);
      }
      return w;
    });
  }

  // TODO the plan doesn't have an id, should it be given one?
  // Ditto the jobs?
  let plan: ExecutionPlan;
  if (
    typeof expressionOrXPlan == 'string' ||
    !expressionOrXPlan.hasOwnProperty('jobs')
  ) {
    // Build an execution plan for an incoming expression
    plan = {
      jobs: [
        {
          expression: expressionOrXPlan,
        },
      ],
    } as ExecutionPlan;
    logger.debug('Generated execution plan for incoming expression');
    // TODO how do we sanitise state.config?
    logger.debug(plan);
  } else {
    plan = expressionOrXPlan as ExecutionPlan;
  }

  if (state) {
    plan.initialState = clone(state);
  } else if (!plan.initialState) {
    plan.initialState = defaultState;
  }

  return executePlan(plan, opts as Options, logger);
};

export default run;
