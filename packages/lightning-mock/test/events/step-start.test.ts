import test from 'ava';
import { STEP_START } from '../../src/events';
import { join, setup, createRun } from '../util';

let server: any;
let client: any;

const port = 5501;

test.before(async () => ({ server, client } = await setup(port)));

test.serial('acknowledge valid message', async (t) => {
  return new Promise(async (done) => {
    const run = createRun();

    server.startRun(run.id);

    const event = {
      job_id: 'a',
      step_id: 'r:a',
      input_dataclip_id: 'x',
    };

    const channel = await join(client, run.id);

    channel.push(STEP_START, event).receive('ok', () => {
      t.pass('event acknowledged');
      done();
    });
  });
});

test.serial('save run id to state', async (t) => {
  return new Promise(async (done) => {
    const run = createRun();

    server.startRun(run.id);

    const event = {
      job_id: 'a',
      step_id: 'r:a',
      input_dataclip_id: 'x',
    };

    const channel = await join(client, run.id);

    channel.push(STEP_START, event).receive('ok', () => {
      t.deepEqual(server.state.pending[run.id].steps, {
        [event.job_id]: event.step_id,
      });
      done();
    });
  });
});

test.serial('error if no step_id', async (t) => {
  return new Promise(async (done) => {
    const run = createRun();

    server.startRun(run.id);

    const event = {
      job_id: 'a',
      step_id: undefined,
      input_dataclip_id: 'x',
    };

    const channel = await join(client, run.id);

    channel.push(STEP_START, event).receive('error', () => {
      t.pass('event rejected');
      done();
    });
  });
});

test.serial('error if no job_id', async (t) => {
  return new Promise(async (done) => {
    const run = createRun();

    server.startRun(run.id);

    const event = {
      job_id: undefined,
      step_id: 'r:a',
      input_dataclip_id: 'x',
    };

    const channel = await join(client, run.id);

    channel.push(STEP_START, event).receive('error', () => {
      t.pass('event rejected');
      done();
    });
  });
});

test.serial('error if no input_dataclip_id', async (t) => {
  return new Promise(async (done) => {
    const run = createRun();

    server.startRun(run.id);

    const event = {
      job_id: 'a',
      step_id: 'r:a',
      input_dataclip_id: undefined,
    };

    const channel = await join(client, run.id);

    channel.push(STEP_START, event).receive('error', () => {
      t.pass('event rejected');
      done();
    });
  });
});
