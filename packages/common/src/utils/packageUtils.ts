import { Conda } from '../tokens';

/**
 * Filter packages by search term
 */
export function filterPackagesBySearch(
  packages: Conda.IPackage[],
  searchTerm: string,
  hasDescription: boolean = false
): Conda.IPackage[] {
  if (!searchTerm || searchTerm === '') {
    return packages;
  }

  const lowerSearch = searchTerm.toLowerCase();

  return packages.filter(pkg => {
    return (
      pkg.name.toLowerCase().includes(lowerSearch) ||
      (hasDescription &&
        (pkg.summary?.indexOf(searchTerm) >= 0 ||
          pkg.keywords?.indexOf(lowerSearch) >= 0 ||
          pkg.tags?.indexOf(lowerSearch) >= 0))
    );
  });
}

/**
 * Filter packages by installation status
 */
export function filterPackagesByStatus(
  packages: Conda.IPackage[],
  status: 'all' | 'installed' | 'available' | 'updatable'
): Conda.IPackage[] {
  if (status === 'all') {
    return packages;
  } else if (status === 'installed') {
    return packages.filter(pkg => pkg.version_installed);
  } else if (status === 'available') {
    return packages.filter(pkg => !pkg.version_installed);
  } else if (status === 'updatable') {
    return packages.filter(pkg => pkg.updatable);
  }
  return packages;
}

/**
 * Sort packages by name
 */
export function sortPackagesByName(
  packages: Conda.IPackage[]
): Conda.IPackage[] {
  return [...packages].sort((a, b) => a.name.localeCompare(b.name));
}