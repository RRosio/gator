import { Dialog, Notification, showDialog } from '@jupyterlab/apputils';
import semver from 'semver';
import { IEnvironmentManager, Conda } from './tokens';

function normalizePackages(pkgs: Conda.IPackage[]): Conda.IPackage[] {
  if (!Array.isArray(pkgs)) {
    console.warn('normalizePackages: pkgs is not an array', pkgs);
    return [];
  }

  // Normalizing packages to include package info: name, version, build_number, build_string, summary, keywords, tags, version_installed, version_selected, updatable
  // Other information available from the package info???
  return pkgs
    .map(p => {
      if (!p) {
        console.warn('normalizePackages: package is null/undefined', p);
        return null;
      }
      console.log('normalizePackages: p is', p);
      return {
        ...p,
        // arrays you rely on in the UI
        version: Array.isArray(p.version)
          ? p.version
          : [String(p.version ?? '')],
        build_number: Array.isArray((p as any).build_number)
          ? (p as any).build_number
          : [Number((p as any).build_number ?? 0)],
        build_string: Array.isArray((p as any).build_string)
          ? (p as any).build_string
          : [String((p as any).build_string ?? '')],
        // text fields used by search—force strings
        summary: p.summary ?? '',
        home: p.home ?? 'https://repo.anaconda.com/pkgs/main/',
        keywords: String(p.keywords ?? '').toLowerCase(),
        tags: String(p.tags ?? '').toLowerCase(),
        // selection flags—always present
        version_installed: p.version_installed ?? '',
        version_selected:
          p.version_selected ??
          (p.version_installed ? p.version_installed : 'none'),
        updatable: !!p.updatable
      };
    })
    .filter(p => p !== null) as Conda.IPackage[];
}

// Marking packages as updatable if the version is greater than the version_installed
function markUpdatable(pkgs: Conda.IPackage[]) {
  let hasUpdate = false;
  const list = pkgs.map(p => {
    const copy = { ...p };
    try {
      if (copy.version_installed) {
        const latest = copy.version[copy.version.length - 1];
        if (
          semver.gt(
            semver.coerce(latest)!,
            semver.coerce(copy.version_installed)!
          )
        ) {
          copy.updatable = true;
          hasUpdate = true;
        }
      }
    } catch {
      /* ignore semver quirks */
    }
    return copy;
  });
  return { list, hasUpdate };
}

function isPackageManager(x: unknown): x is Conda.IPackageManager {
  return (
    !!x &&
    typeof (x as Conda.IPackageManager).refresh === 'function' &&
    !!(x as Conda.IPackageManager).stateUpdateSignal
  );
}

/**
 * Prime/refresh the packages view (installed + available) and emit via signal.
 * Use this from commands and also from the panel on mount/env switch.
 */
export async function primePackages(
  modelOrPm: IEnvironmentManager | Conda.IPackageManager,
  envName: string
): Promise<void> {
  console.log('primePackages called: ', modelOrPm, envName);
  const pm = isPackageManager(modelOrPm)
    ? modelOrPm
    : modelOrPm.getPackageManager(envName);

  if (!envName) {
    console.warn('primePackages: envName is undefined');
    return;
  }

  if (!pm || !pm.emitState) {
    console.error('primePackages: package manager is invalid', pm);
    return;
  }

  pm.emitState({
    environment: envName,
    isLoading: true,
    phase: 'starting'
  });

  try {
    // installed, isAvailable is false
    const installed = await pm.refresh(false, envName);
    console.log('primePackages: installed length is', installed.length);
    console.log('primePackages: installed is', installed);
    // available, isAvailable is true
    const available = await pm.refresh(true, envName);
    console.log('primePackages: available length is', available.length);

    // no available packages error logic
    if (!Array.isArray(available) || available.length === 0) {
      console.warn(
        'primePackages: available is empty or not an array',
        available
      );
      pm.emitState({
        environment: envName,
        isLoading: false,
        phase: 'success',
        packages: [],
        hasUpdate: false,
        hasDescription: pm.hasDescription?.() ?? false
      });
      return;
    }

    // Include specific package information for the UI
    const normalized = normalizePackages(available);
    // Compare the package versions avialable to the installed version to determine if the package is updatable
    const { list, hasUpdate } = markUpdatable(normalized);
    console.log('primePackages: hasUpdate is', hasUpdate);
    console.log('primePackages: list is', list);
    // Emit the state, list of packages, hasUpdate, hasDescription... to the UI
    pm.emitState({
      environment: envName,
      isLoading: false,
      phase: 'success',
      packages: list,
      hasUpdate,
      hasDescription: pm.hasDescription?.() ?? false
    });
  } catch (error) {
    console.error('primePackages error:', error);
    pm.emitState({
      environment: envName,
      isLoading: false,
      phase: 'error',
      message: String(error)
    });
    throw error;
  }
}

// Apply package modifications, to mode: 'all' or 'selected', packages provided in a string array
export async function applyPackageModification(
  model: IEnvironmentManager,
  envName: string,
  opts: { mode: 'all' | 'selected'; names: string[] }
): Promise<void> {
  console.log('applyPackageModification called: ', model, envName, opts);
  const { mode, names } = opts;

  Notification.emit(
    mode === 'all'
      ? `Applying modifications to all packages in ${envName}`
      : `Modifying ${names.length} package(s) in ${envName}`,
    'in-progress'
  );

  names.forEach(pkg => {
    console.log('pkg', pkg);
  });
}

/**
 * Pass names=[] to mean ALL; or call model.update(['--all'], env).
 */
export async function updatePackagesUnified(
  model: IEnvironmentManager,
  envName: string,
  opts: {
    mode: 'all' | 'selected';
    names: string[];
    version: string[] | undefined;
  }
): Promise<void> {
  const pm = model.getPackageManager(envName);
  const { mode, names, version } = opts;

  console.log('updatePackagesUnified: envName is', envName);
  console.log('updatePackagesUnified: mode is', mode);
  console.log('updatePackagesUnified: names is', names);

  // Emit the state, isLoading: true, phase: 'starting', as well as the 'mode'
  pm.emitState({
    environment: envName,
    isLoading: true,
    phase: 'starting',
    mode
  });
  console.log('updatePackagesUnified: state emitted');

  const toastId = Notification.emit(
    mode === 'all'
      ? `Updating all packages in ${envName}`
      : `Updating ${names.length} package(s) in ${envName}`,
    'in-progress'
  );
  console.log('updatePackagesUnified: toast emitted');

  try {
    if (mode === 'all') {
      console.log('updatePackagesUnified: mode is all');
      await model.getPackageManager(envName).update(['--all'], envName);
    } else {
      console.log('updatePackagesUnified: mode is selected');

      // Format package names with version if a version is selected
      const packagesToUpdate = names.map((name, index) => {
        if (version && version[index] && version[index] !== 'none') {
          return `${name}=${version[index]}`;
        }
        return name;
      });

      console.log(
        'updatePackagesUnified: packagesToUpdate is',
        packagesToUpdate
      );
      await model.getPackageManager(envName).update(packagesToUpdate, envName);
    }

    pm.emitState({
      environment: envName,
      isLoading: false,
      phase: 'success',
      mode
    });

    Notification.update({
      id: toastId,
      message: 'Packages updated successfully.',
      type: 'success',
      autoClose: 5000
    });

    await primePackages(model, envName);
  } catch (error) {
    pm.emitState({
      environment: envName,
      isLoading: false,
      phase: 'error',
      mode,
      message: String(error)
    });
    Notification.update({
      id: toastId,
      message: `Error updating packages in ${envName}: ${error}`,
      type: 'error',
      autoClose: 0
    });
    throw error;
  }
}

export async function confirmAndUpdateAll(
  model: IEnvironmentManager,
  envName: string
): Promise<void> {
  if (!envName) {
    return;
  }

  const response = await showDialog({
    title: 'Update all',
    body: 'Please confirm you want to update all packages. Conda enforces environment consistency, so only a subset of updates may be applied.',
    buttons: [Dialog.cancelButton(), Dialog.okButton({ caption: 'Update' })]
  });
  if (!response.button.accept) {
    return;
  }

  await updatePackagesUnified(model, envName, {
    mode: 'all',
    names: [],
    version: []
  });
}

export async function refreshAvailable(
  model: IEnvironmentManager,
  envName: string
) {
  const pm = model.getPackageManager(envName);
  pm.emitState({
    environment: envName,
    isLoading: true,
    phase: 'starting'
  });
  try {
    await pm.refreshAvailablePackages?.();
    pm.emitState({
      environment: envName,
      isLoading: false,
      phase: 'success'
    });
    await primePackages(model, envName);
  } catch (e) {
    pm.emitState({
      environment: envName,
      isLoading: false,
      phase: 'error',
      message: String(e)
    });
    throw e;
  }
}

export async function removePackages(
  model: IEnvironmentManager,
  envName: string,
  packages: string[]
): Promise<void> {
  const pm = model.getPackageManager(envName);
  pm.emitState({
    environment: envName,
    isLoading: true,
    phase: 'starting'
  });
  try {
    await pm.remove(packages, envName);
    pm.emitState({
      environment: envName,
      isLoading: false,
      phase: 'success'
    });
  } catch (e) {
    pm.emitState({
      environment: envName,
      isLoading: false,
      phase: 'error',
      message: String(e)
    });
    throw e;
  }
}
