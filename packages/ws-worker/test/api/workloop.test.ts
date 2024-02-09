import test from 'ava';
import { createMockLogger } from '@openfn/logger';

import { sleep } from '../util';
import { mockChannel } from '../../src/mock/sockets';
import startWorkloop from '../../src/api/workloop';
import { CLAIM } from '../../src/events';

let cancel: any;

const logger = createMockLogger();

test.afterEach(() => {
  cancel?.(); // cancel any workloops
});

test('workloop can be cancelled', async (t) => {
  let count = 0;
  const app = {
    queueChannel: mockChannel({
      [CLAIM]: () => {
        count++;
        cancel();
        return { runs: [] };
      },
    }),
    execute: () => {},
  };

  cancel = startWorkloop(app as any, logger, 1, 1);

  await sleep(100);
  // A quirk of how cancel works is that the loop will be called a few times
  t.assert(count <= 5);
});

test('workloop sends the runs:claim event', (t) => {
  return new Promise((done) => {
    const app = {
      workflows: {},
      queueChannel: mockChannel({
        [CLAIM]: () => {
          t.pass();
          done();
          return { runs: [] };
        },
      }),
      execute: () => {},
    };
    cancel = startWorkloop(app as any, logger, 1, 1);
  });
});

test('workloop sends the runs:claim event several times ', (t) => {
  return new Promise((done) => {
    let count = 0;
    const app = {
      workflows: {},
      queueChannel: mockChannel({
        [CLAIM]: () => {
          count++;
          if (count === 5) {
            t.pass();
            done();
          }
          return { runs: [] };
        },
      }),
      execute: () => {},
    };
    cancel = startWorkloop(app as any, logger, 1, 1);
  });
});

test('workloop calls execute if runs:claim returns runs', (t) => {
  return new Promise((done) => {
    const app = {
      workflows: {},
      queueChannel: mockChannel({
        [CLAIM]: () => ({
          runs: [{ id: 'a', token: 'x.y.z' }],
        }),
      }),
      execute: (run: any) => {
        t.deepEqual(run, { id: 'a', token: 'x.y.z' });
        t.pass();
        done();
      },
    };

    cancel = startWorkloop(app as any, logger, 1, 1);
  });
});
