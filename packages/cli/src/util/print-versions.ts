import { readFileSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { getNameAndVersion } from '@openfn/runtime';
import { Logger } from './logger';
import { mainSymbols } from 'figures';
import { Opts } from '../options';

const NODE = 'node.js';
const CLI = 'cli';
const RUNTIME = 'runtime';
const COMPILER = 'compiler';

const { triangleRightSmall: t } = mainSymbols;

const loadVersionFromPath = (adaptorPath: string) => {
  try {
    const pkg = JSON.parse(
      readFileSync(path.resolve(adaptorPath, 'package.json'), 'utf8')
    );
    return pkg.version;
  } catch (e) {
    return 'unknown';
  }
};

const printVersions = async (
  logger: Logger,
  options: Partial<Pick<Opts, 'adaptors' | 'logJson' | 'monorepoPath'>> = {},
  includeComponents = false
) => {
  const { adaptors, logJson } = options;
  let adaptor = '';
  if (adaptors && adaptors.length) {
    adaptor = adaptors[0];
  }

  let adaptorVersion;
  let adaptorName = '';
  if (adaptor) {
    if (adaptor.match('=')) {
      const [namePart, pathPart] = adaptor.split('=');
      adaptorVersion = loadVersionFromPath(pathPart);
      adaptorName = getNameAndVersion(namePart).name;
    } else if (options.monorepoPath) {
      adaptorName = getNameAndVersion(adaptor).name;
      adaptorVersion = 'monorepo';
    } else {
      const { name, version } = getNameAndVersion(adaptor);
      adaptorName = name;
      adaptorVersion = version || 'latest';
    }
  }

  // Work out the longest label
  const longest = Math.max(
    ...[NODE, CLI, RUNTIME, COMPILER, adaptorName].map((s) => s.length)
  );

  // Prefix and pad version numbers
  const prefix = (str: string) =>
    `         ${t} ${str.padEnd(longest + 4, ' ')}`;

  const dirname = path.dirname(url.fileURLToPath(import.meta.url));
  // Note that this path is the same and src and build, even though this file will be
  // built into process/runner.js

  const pkg = JSON.parse(readFileSync(`${dirname}/../../package.json`, 'utf8'));
  const { version, dependencies } = pkg;

  const compilerVersion = dependencies['@openfn/compiler'];
  const runtimeVersion = dependencies['@openfn/runtime'];

  let output: any;
  if (logJson) {
    output = {
      versions: {
        'node.js': process.version.substring(1),
        cli: version,
      },
    };
    if (includeComponents) {
      output.versions.runtime = runtimeVersion;
      output.versions.compiler = compilerVersion;
    }
    if (adaptorName) {
      output.versions[adaptorName] = adaptorVersion;
    }
  } else {
    output = `Versions:
${prefix(NODE)}${process.version.substring(1)}
${prefix(CLI)}${version}`;

    if (includeComponents) {
      output += `\n${prefix(RUNTIME)}${runtimeVersion}
${prefix(COMPILER)}${compilerVersion}`;
    }

    if (adaptorName) {
      output += `\n${prefix(adaptorName)}${adaptorVersion}`;
    }
  }
  logger.always(output);
};

export default printVersions;
