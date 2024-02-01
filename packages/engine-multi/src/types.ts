import type { Logger, SanitizePolicies } from '@openfn/logger';
import type { ExecutionPlan } from '@openfn/runtime';
import type { EventEmitter } from 'node:events';

import type { ExternalEvents, EventMap } from './events';
import type { EngineOptions } from './engine';
import type { ExecOpts } from './worker/pool';

export type Resolver<T> = (id: string) => Promise<T>;

export type Resolvers = {
  credential?: Resolver<Credential>;
  state?: Resolver<any>;
};

export type EventHandler = (event: any) => void;

export type WorkflowState = {
  id: string;
  name?: string; // TODO what is name? this is irrelevant?
  status: 'pending' | 'running' | 'done' | 'err';
  threadId?: string;
  startTime?: number;
  duration?: number;
  error?: string;
  result?: any; // State
  plan: ExecutionPlan; // this doesn't include options
  options: any; // TODO this is wf specific options, like logging policy
};

export type CallWorker = (
  task: string,
  args: any[],
  events?: any,
  options?: Omit<ExecOpts, 'on'>
) => Promise<any>;

export type ExecutionContextConstructor = {
  state: WorkflowState;
  logger: Logger;
  callWorker: CallWorker;
  options: ExecutionContextOptions;
};

export type ExecutionContextOptions = EngineOptions & {
  sanitize?: SanitizePolicies;
};

export interface ExecutionContext extends EventEmitter {
  constructor(args: ExecutionContextConstructor): ExecutionContext;
  options: EngineOptions;
  state: WorkflowState;
  logger: Logger;
  callWorker: CallWorker;
  versions: Versions;

  emit<T extends ExternalEvents>(
    event: T,
    payload: Omit<EventMap[T], 'workflowId'>
  ): boolean;
}

export interface EngineAPI extends EventEmitter {
  callWorker: CallWorker;
  closeWorkers: (instant?: boolean) => void;
}

export interface RuntimeEngine {
  version: string;

  options: EngineOptions;

  // TODO should return an unsubscribe hook
  listen(runId: string, listeners: any): void;

  execute(
    plan: ExecutionPlan,
    options?: Partial<EngineOptions>
  ): Pick<EventEmitter, 'on' | 'off' | 'once'>;

  destroy(): void;

  on: (evt: string, fn: (...args: any[]) => void) => void;

  // TODO my want some maintenance APIs, like getStatus. idk
}

export type Versions = {
  node: string;
  engine: string;
  compiler: string;
  [adaptor: string]: string;
};
