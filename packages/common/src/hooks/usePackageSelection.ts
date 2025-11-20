import * as React from 'react';
import { Conda } from '../tokens';

export interface IUsePackageSelectionReturn {
  selectedPackages: Map<string, string>;
  togglePackage: (pkg: Conda.IPackage, version?: string) => void;
  isSelected: (pkgName: string) => boolean;
  clearSelection: () => void;
  getPackageList: () => string[];
  getPackageCount: () => number;
}

/**
 * Hook for managing package selection state (checkbox)
 */
export function usePackageSelection(): IUsePackageSelectionReturn {
  const [selectedPackages, setSelectedPackages] = React.useState<
    Map<string, string>
  >(new Map());

  const togglePackage = React.useCallback(
    (pkg: Conda.IPackage, version?: string) => {
      setSelectedPackages(prev => {
        const next = new Map(prev);
        if (next.has(pkg.name)) {
          next.delete(pkg.name);
        } else {
          const selectedVersion = version || pkg.version[pkg.version.length - 1];
          next.set(pkg.name, selectedVersion);
        }
        return next;
      });
    },
    []
  );

  const isSelected = React.useCallback(
    (pkgName: string) => selectedPackages.has(pkgName),
    [selectedPackages]
  );

  const clearSelection = React.useCallback(() => {
    setSelectedPackages(new Map());
  }, []);

  const getPackageList = React.useCallback(() => {
    return Array.from(selectedPackages.entries()).map(
      ([name, version]) => `${name}=${version}`
    );
  }, [selectedPackages]);

  const getPackageCount = React.useCallback(() => {
    return selectedPackages.size;
  }, [selectedPackages]);

  return {
    selectedPackages,
    togglePackage,
    isSelected,
    clearSelection,
    getPackageList,
    getPackageCount
  };
}
