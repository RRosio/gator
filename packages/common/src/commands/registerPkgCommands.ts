import { CommandRegistry } from '@lumino/commands';

import { IEnvironmentManager } from '../tokens';
import {
  primePackages,
  updatePackagesUnified,
  confirmAndUpdateAll,
  refreshAvailable,
  applyPackageModification,
  removePackages
} from '../packageActions';

type NamesArg = string[] | '*' | undefined;
const normalize = (arg: NamesArg, env: string, getSelected: () => string[]) =>
  arg === '*'
    ? { mode: 'all' as const, names: [] as string[] }
    : { mode: 'selected' as const, names: arg ?? getSelected(), env };

export function registerPkgCommands({
  commands,
  getSelectedNames,
  getActiveEnvName,
  model
}: {
  commands: CommandRegistry;
  getSelectedNames: () => string[];
  getActiveEnvName: () => string | undefined;
  model: IEnvironmentManager;
}) {
  commands.addCommand('gator-lab:pkg-prime', {
    label: 'Refresh Packages',
    isEnabled: () => !!getActiveEnvName(),
    execute: async args => {
      console.log('primePackages called');
      const env = getActiveEnvName() ? getActiveEnvName() : args?.env;
      console.log('env', env);
      if (!env) {
        console.log('gator-lab:pkg-prime env is false');
      } else {
        console.log('gator-lab:pkg-prime env is true');
      }
      await primePackages(model, env as string);
    }
  });

  commands.addCommand('gator-lab:pkg-apply-modifications', {
    label: 'Apply Modifications',
    isEnabled: args => {
      const env = getActiveEnvName() ? getActiveEnvName() : args?.env;
      console.log(' gator-lab:pkg-apply-modifications env', env);
      if (!env) {
        console.log(' gator-lab:pkg-apply-modificationsenv is false');
        return false;
      }
      console.log(' gator-lab:pkg-apply-modifications env is true');
      return true;
    },
    execute: async args => {
      const env = getActiveEnvName() ? getActiveEnvName() : args?.env;
      console.log('env', env);
      await applyPackageModification(model, env as string, {
        mode: 'all',
        names: []
      });
    }
  });

  commands.addCommand('gator-lab:pkg-update', {
    label: args => {
      const env = getActiveEnvName()!;
      const { mode, names } = normalize(
        args?.names as NamesArg,
        env,
        getSelectedNames
      );
      console.log(' gator-lab:pkg-update mode', mode);
      console.log('names', names);
      console.log('args', args);
      // might need the latest version number or just the version selected in dropdown?
      console.log('gator-lab:pkg-update env', env);
      return mode === 'all'
        ? 'Update All Packages'
        : names.length > 1
        ? 'Update Selected Packages'
        : 'Update Package';
    },
    isEnabled: args => {
      const env = getActiveEnvName() ? getActiveEnvName() : args?.env;
      console.log('gator-lab:pkg-update env', env);
      if (!env) {
        console.log('gator-lab:pkg-update env is false');
        return false;
      }
      console.log('gator-lab:pkg-update env is true');
      const { mode, names } = normalize(
        args?.names as NamesArg,
        env as string,
        getSelectedNames
      );
      console.log('gator-lab:pkg-update mode', mode);
      console.log('gator-lab:pkg-update names', names);
      console.log('gator-lab:pkg-update args', args);
      return mode === 'all' ? true : names.length > 0;
    },
    execute: async args => {
      const env = getActiveEnvName() ? getActiveEnvName() : args?.env;
      if (!env) {
        console.log('gator-lab:pkg-update env is false');
        return false;
      }
      const { mode, names } = normalize(
        args?.names as NamesArg,
        env as string,
        getSelectedNames
      );
      const versions = args?.versions as string[] | undefined;

      console.log('gator-lab:pkg-update args', args);
      console.log('gator-lab:pkg-update versions', versions);
      console.log(
        `calling updatePackagesUnified with mode: ${mode}, names: ${names}, versions: ${versions} and env: ${env}`
      );
      await updatePackagesUnified(model, env as string, {
        mode,
        names,
        version: versions
      });
    }
  });

  commands.addCommand('gator-lab:pkg-update-all-confirm', {
    label: 'Update All Packages…',
    isEnabled: () => !!getActiveEnvName(),
    execute: async () => {
      const env = getActiveEnvName()!;
      console.log('gator-lab:pkg-update-all-confirm env', env);
      await confirmAndUpdateAll(model, env);
    }
  });

  commands.addCommand('gator-lab:pkg-refresh-available', {
    label: 'Refresh Available Packages',
    isEnabled: () => !!getActiveEnvName(),
    execute: async () => {
      const env = getActiveEnvName()!;
      console.log('gator-lab:pkg-refresh-available env', env);
      await refreshAvailable(model, env);
    }
  });

  commands.addCommand('gator-lab:pkg-remove', {
    label: 'Remove Package',
    isEnabled: args => {
      console.log('ADDING COMMAND   gator-lab:pkg-remove args', args);
      let env = getActiveEnvName();
      if (!env) {
        env = args?.env as string;
      }
      if (!env) {
        console.log('DISABLEDgator-lab:pkg-remove env is false');
        return false;
      }
      console.log('gator-lab:pkg-remove env', env);
      console.log('ENABLEDgator-lab:pkg-remove env is true');
      return true;
    },
    execute: async args => {
      console.log('gator-lab:pkg-remove args', args);
      let env = getActiveEnvName()!;
      if (!env) {
        env = args?.env as string;
      }
      if (!env) {
        console.log('gator-lab:pkg-remove env is false');
        return false;
      }
      console.log('gator-lab:pkg-remove env', env);

      const names = args?.names as string[];
      console.log('gator-lab:pkg-remove names', names);
      // remove a single package
      await removePackages(model, env, names);
    }
  });
}
