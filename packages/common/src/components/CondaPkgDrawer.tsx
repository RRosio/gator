import * as React from 'react';
import { CommandRegistry } from '@lumino/commands';
import { Conda } from '../tokens';
import { CondaPkgList } from './CondaPkgList';

export interface ICondaPkgDrawerProps {
  /**
   * Is the drawer open?
   */
  isOpen: boolean;
  /**
   * All packages (for filtering uninstalled packages)
   */
  packages: Conda.IPackage[];
  /**
   * Command registry for menu actions
   */
  commands: CommandRegistry;
  /**
   * Environment name
   */
  envName: string;
  /**
   * Drawer close handler
   */
  onClose: () => void;
  /**
   * Package selection handler
   */
  onPkgClick: (pkg: Conda.IPackage) => void;
  /**
   * Package version selection handler
   */
  onPkgChange: (pkg: Conda.IPackage, version: string) => void;
  /**
   * Install selected packages handler
   */
  onInstall: (packages: Conda.IPackage[]) => void;
}

export const CondaPkgDrawer: React.FunctionComponent<ICondaPkgDrawerProps> = (
  props: ICondaPkgDrawerProps
) => {
  const {
    isOpen,
    packages,
    commands,
    envName,
    onClose,
    onPkgClick,
    onPkgChange,
    onInstall
  } = props;

  // Add search state
  const [searchTerm, setSearchTerm] = React.useState('');

  // Track package modifications to prevent re-initialization
  const [packageModifications, setPackageModifications] = React.useState<
    Map<string, string>
  >(new Map());

  // Filter to show only uninstalled packages and preserve modifications
  const uninstalledPackages = React.useMemo(() => {
    return packages
      .filter(pkg => pkg && !pkg.version_installed)
      .map(pkg => ({
        ...pkg,
        version_selected:
          packageModifications.get(pkg.name) || pkg.version_selected || 'none'
      }));
  }, [packages, packageModifications]);

  // Apply search filter and limit initial results
  const filteredPackages = React.useMemo(() => {
    let filtered = uninstalledPackages;

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = uninstalledPackages.filter(pkg => {
        if (!pkg || !pkg.name) {
          return false;
        }
        return pkg.name.toLowerCase().includes(lowerSearch);
      });
    }

    // Limit to 1000 packages initially to prevent performance issues
    // User can search to find specific packages
    if (!searchTerm.trim() && filtered.length > 1000) {
      return filtered.slice(0, 1000);
    }

    console.log('CondaPkgDrawer - filteredPackages:', {
      total: uninstalledPackages.length,
      filtered: filtered.length,
      searchTerm,
      firstFew: filtered.slice(0, 3).map(p => p.name)
    });

    return filtered;
  }, [uninstalledPackages, searchTerm]);

  // Get selected packages (those with version_selected !== 'none')
  const selectedPackages = filteredPackages.filter(
    pkg => pkg.version_selected && pkg.version_selected !== 'none'
  );

  // Wrapper functions to update local state
  const handlePkgClick = (pkg: Conda.IPackage) => {
    // Determine the new version based on current state
    const newVersion =
      pkg.version_selected && pkg.version_selected !== 'none' ? 'none' : '';

    // Update local state first
    setPackageModifications(prev => {
      const newMap = new Map(prev);
      newMap.set(pkg.name, newVersion);
      return newMap;
    });

    // Update the package object directly for immediate feedback
    pkg.version_selected = newVersion;

    // Then call the parent handler
    onPkgClick(pkg);
  };

  const handlePkgChange = (pkg: Conda.IPackage, version: string) => {
    // Update local state first
    setPackageModifications(prev => {
      const newMap = new Map(prev);
      newMap.set(pkg.name, version);
      return newMap;
    });

    // Update the package object directly for immediate feedback
    pkg.version_selected = version;

    // Then call the parent handler
    onPkgChange(pkg, version);
  };

  const handleInstall = () => {
    onInstall(selectedPackages);
  };

  if (!isOpen) {
    return null;
  }
  return (
    <div style={Style.Overlay}>
      <div style={Style.Drawer}>
        <div style={Style.Header}>
          <h3>Add Packages</h3>
          <button
            style={Style.CloseButton}
            onClick={onClose}
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        <div style={Style.SearchContainer}>
          <input
            type="text"
            placeholder="Search packages..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={Style.SearchInput}
          />
          <div style={Style.SearchInfo}>
            {!searchTerm.trim() && uninstalledPackages.length > 1000 ? (
              <>
                Showing first 1000 of {uninstalledPackages.length} packages. Use
                search to find specific packages.
              </>
            ) : (
              `Showing ${filteredPackages.length} of ${uninstalledPackages.length} packages`
            )}
          </div>
        </div>

        <div style={Style.Content}>
          <CondaPkgList
            height={400} // Fixed height for drawer
            hasDescription={true} // Show descriptions in drawer
            packages={filteredPackages}
            onPkgClick={handlePkgClick}
            onPkgChange={handlePkgChange}
            onPkgGraph={() => {}} // Disable graph in drawer
            commands={commands}
            envName={envName}
            isDrawer={true}
          />
        </div>

        <div style={Style.Footer}>
          <div style={Style.SelectionInfo}>
            {selectedPackages.length} package(s) selected
          </div>
          <div style={Style.Actions}>
            <button style={Style.CancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              style={Style.InstallButton}
              onClick={handleInstall}
              disabled={selectedPackages.length === 0}
            >
              Install Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

namespace Style {
  export const Overlay = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  export const Drawer = {
    backgroundColor: 'var(--jp-layout-color1)',
    border: '1px solid var(--jp-border-color1)',
    borderRadius: '4px',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
  };

  export const Header = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid var(--jp-border-color1)'
  };

  export const CloseButton = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: 'var(--jp-ui-font-color1)',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  export const SearchContainer = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--jp-border-color1)',
    backgroundColor: 'var(--jp-layout-color2)'
  };

  export const SearchInput = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--jp-border-color1)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--jp-layout-color1)',
    color: 'var(--jp-ui-font-color1)',
    outline: 'none',
    boxSizing: 'border-box' as const
  };

  export const SearchInfo = {
    marginTop: '8px',
    fontSize: '12px',
    color: 'var(--jp-ui-font-color2)'
  };

  export const Content = {
    flex: 1,
    overflow: 'hidden',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column' as const
  };

  export const Footer = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderTop: '1px solid var(--jp-border-color1)',
    backgroundColor: 'var(--jp-layout-color2)'
  };

  export const SelectionInfo = {
    color: 'var(--jp-ui-font-color2)',
    fontSize: '14px'
  };

  export const Actions = {
    display: 'flex',
    gap: '8px'
  };

  export const CancelButton = {
    padding: '8px 16px',
    border: '1px solid var(--jp-border-color1)',
    backgroundColor: 'var(--jp-layout-color1)',
    color: 'var(--jp-ui-font-color1)',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  export const InstallButton = {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'var(--jp-brand-color1)',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer'
  };
}
