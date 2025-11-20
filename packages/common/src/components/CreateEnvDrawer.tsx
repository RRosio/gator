import { Notification } from '@jupyterlab/apputils';
import { InputGroup } from '@jupyterlab/ui-components';
import * as React from 'react';
import { style } from 'typestyle';
import { usePackageSelection } from '../hooks/usePackageSelection';
import { Conda, IEnvironmentManager } from '../tokens';
import { filterPackagesBySearch } from '../utils/packageUtils';
import { PackageSearchBar } from './PackageSearchBar';
import { PackageSelectionList } from './PackageSelectionList';
import { PythonVersionSelector } from './PythonVersionSelector';
import { SelectedPackagesPanel } from './SelectedPackagesPanel';

export interface ICreateEnvDrawerProps {
  model: IEnvironmentManager;
  onClose: () => void;
  onEnvironmentCreated?: (envName: string) => void;
}

export const CreateEnvDrawer: React.FC<ICreateEnvDrawerProps> = ({
  model,
  onClose,
  onEnvironmentCreated
}) => {
  // State
  const [envName, setEnvName] = React.useState('');
  const [pythonVersion, setPythonVersion] = React.useState('3.11');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [packages, setPackages] = React.useState<Conda.IPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [envLocation, setEnvLocation] = React.useState('');

  // Use the package selection hook
  const {
    selectedPackages,
    togglePackage,
    isSelected,
    clearSelection,
    getPackageList,
    getPackageCount
  } = usePackageSelection();

  console.log('clearSelection', clearSelection);
  console.log('getPackageList', getPackageList);
  console.log('getPackageCount', getPackageCount);
  console.log('isSelected', isSelected);
  console.log('selectedPackages', selectedPackages);
  console.log('togglePackage', togglePackage);
  console.log('onClose', onClose);
  console.log('onEnvironmentCreated', onEnvironmentCreated);
  console.log('model', model);

  // Get package manager (we'll use it to search for available packages)
  const packageManager = React.useMemo(
    () => model.getPackageManager(),
    [model]
  );

  // Load available packages on mount
  React.useEffect(() => {
    async function loadPackages() {
      setIsLoadingPackages(true);
      try {
        // Get the first available environment to query packages from
        const environments = await model.environments;
        if (environments.length === 0) {
          throw new Error('No environments available to query packages');
        }

        // Use the first environment (usually base) to get available packages
        const baseEnv = environments[0].name;
        const tempPackageManager = model.getPackageManager(baseEnv);
        const availablePackages = await tempPackageManager.refresh(true);
        setPackages(availablePackages);
      } catch (error) {
        console.error('Error loading packages:', error);
        Notification.error('Failed to load available packages');
        setPackages([]); // Set empty array on error
      } finally {
        setIsLoadingPackages(false);
      }
    }

    loadPackages();
  }, [model]);

  // Compute environment location based on name
  React.useEffect(() => {
    if (envName) {
      // This is a simplified location - in reality, you might want to fetch this from the model
      setEnvLocation(`/path/to/envs/${envName}`);
    } else {
      setEnvLocation('');
    }
  }, [envName]);

  // Handle search
  const handleSearch = React.useCallback((event: React.FormEvent) => {
    setSearchTerm((event.target as HTMLInputElement).value);
  }, []);

  // Handle package toggle
  const handleTogglePackage = React.useCallback(
    (pkg: Conda.IPackage) => {
      togglePackage(pkg);
    },
    [togglePackage]
  );

  // Handle version change for a package
  const handleVersionChange = React.useCallback(
    (pkg: Conda.IPackage, version: string) => {
      // Update the selected package with new version
      if (isSelected(pkg.name)) {
        togglePackage(pkg, version);
      }
    },
    [isSelected, togglePackage]
  );

  // Handle remove package from selection
  const handleRemovePackage = React.useCallback(
    (pkgName: string) => {
      const pkg = packages.find(p => p.name === pkgName);
      if (pkg) {
        togglePackage(pkg);
      }
    },
    [packages, togglePackage]
  );

  // Handle create environment
  const handleCreate = React.useCallback(async () => {
    if (!envName.trim()) {
      Notification.error('Environment name is required');
      return;
    }

    setIsCreating(true);
    let toastId = '';

    try {
      // Build package list: python version + ipykernel + selected packages
      const packageList = [
        `python=${pythonVersion}`,
        'ipykernel', // Always include for Jupyter compatibility
        ...getPackageList()
      ];

      toastId = Notification.emit(
        `Creating environment ${envName}...`,
        'in-progress'
      );

      // Create the environment with the package list
      await model.create(envName, packageList.join(' '));

      Notification.update({
        id: toastId,
        message: `Environment ${envName} has been created successfully.`,
        type: 'success',
        autoClose: 5000
      });

      // Call callback if provided
      if (onEnvironmentCreated) {
        onEnvironmentCreated(envName);
      }

      // Close the drawer
      onClose();
    } catch (error) {
      console.error('Error creating environment:', error);
      if (toastId) {
        Notification.update({
          id: toastId,
          message: `Failed to create environment: ${(error as any).message}`,
          type: 'error',
          autoClose: 0
        });
      } else {
        Notification.error(
          `Failed to create environment: ${(error as any).message}`
        );
      }
    } finally {
      setIsCreating(false);
    }
  }, [
    envName,
    pythonVersion,
    getPackageList,
    model,
    onEnvironmentCreated,
    onClose
  ]);

  // Filter packages by search term
  const filteredPackages = React.useMemo(() => {
    return filterPackagesBySearch(packages, searchTerm, false);
  }, [packages, searchTerm]);

  return (
    <div className={Style.Drawer}>
      {/* HEADER */}
      <div className={Style.Header}>
        <h2 className={Style.Title}>Create Environment: Manual</h2>
        <button
          className={Style.CloseButton}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* BODY */}
      <div className={Style.Body}>
        {/* LEFT PANEL - Package Selection */}
        <div className={Style.LeftPanel}>
          {/* Form Section */}
          <div className={Style.FormSection}>
            <div className={Style.FormRow}>
              <label className={Style.Label}>
                Name
                <InputGroup
                  type="text"
                  value={envName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEnvName(e.target.value)
                  }
                  placeholder="my-environment"
                  className={Style.NameInput}
                />
              </label>
            </div>

            <div className={Style.FormRow}>
              <label className={Style.Label}>
                Python Version
                <PythonVersionSelector
                  selectedVersion={pythonVersion}
                  onVersionChange={setPythonVersion}
                  packageManager={packageManager}
                />
              </label>
            </div>

            {envLocation && (
              <div className={Style.LocationInfo}>
                <span className={Style.LocationLabel}>Location:</span>
                <span className={Style.LocationPath}>{envLocation}</span>
              </div>
            )}
          </div>

          {/* Package Selection Section */}
          <div className={Style.PackageSection}>
            <h3 className={Style.SectionTitle}>Select packages:</h3>

            <div className={Style.SearchSection}>
              <PackageSearchBar
                searchTerm={searchTerm}
                onSearch={handleSearch}
                placeholder="Search packages"
              />
            </div>

            <div className={Style.PackageListContainer}>
              <PackageSelectionList
                packages={filteredPackages}
                selectedPackages={selectedPackages}
                onTogglePackage={handleTogglePackage}
                onVersionChange={handleVersionChange}
                isLoading={isLoadingPackages}
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Selected Packages */}
        <div className={Style.RightPanel}>
          <SelectedPackagesPanel
            selectedPackages={selectedPackages}
            onRemovePackage={handleRemovePackage}
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className={Style.Footer}>
        <button className={Style.BackButton} onClick={onClose}>
          ← Back
        </button>
        <div className={Style.FooterRight}>
          <button className={Style.CancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={Style.CreateButton}
            onClick={handleCreate}
            disabled={!envName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

namespace Style {
  export const Drawer = style({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    minHeight: '600px',
    minWidth: '800px',
    backgroundColor: 'var(--jp-layout-color0)',
    overflow: 'auto'
  });

  export const Header = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid var(--jp-border-color2)',
    backgroundColor: 'var(--jp-layout-color1)'
  });

  export const Title = style({
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--jp-ui-font-color1)'
  });

  export const CloseButton = style({
    width: '32px',
    height: '32px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '24px',
    color: 'var(--jp-ui-font-color2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    $nest: {
      '&:hover': {
        backgroundColor: 'var(--jp-layout-color2)'
      }
    }
  });

  export const Body = style({
    display: 'flex',
    flex: '1 1 auto',
    minHeight: 0,
    overflow: 'hidden'
  });

  export const LeftPanel = style({
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden'
  });

  export const RightPanel = style({
    width: '300px',
    flexShrink: 0
  });

  export const FormSection = style({
    padding: '16px 24px',
    borderBottom: '1px solid var(--jp-border-color2)',
    backgroundColor: 'var(--jp-layout-color1)'
  });

  export const FormRow = style({
    marginBottom: '12px',
    $nest: {
      '&:last-child': {
        marginBottom: 0
      }
    }
  });

  export const Label = style({
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--jp-ui-font-color1)',
    marginBottom: '4px'
  });

  export const NameInput = style({
    marginTop: '4px'
  });

  export const LocationInfo = style({
    marginTop: '12px',
    padding: '8px',
    backgroundColor: 'var(--jp-layout-color2)',
    borderRadius: '4px',
    fontSize: '12px'
  });

  export const LocationLabel = style({
    fontWeight: 500,
    marginRight: '4px',
    color: 'var(--jp-ui-font-color2)'
  });

  export const LocationPath = style({
    color: 'var(--jp-ui-font-color1)',
    fontFamily: 'monospace'
  });

  export const PackageSection = style({
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden'
  });

  export const SectionTitle = style({
    margin: '16px 24px 8px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--jp-ui-font-color1)'
  });

  export const SearchSection = style({
    padding: '0 24px 8px'
  });

  export const PackageListContainer = style({
    flex: '1 1 auto',
    minHeight: 0,
    overflow: 'hidden'
  });

  export const Footer = style({
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderTop: '1px solid var(--jp-border-color2)',
    backgroundColor: 'var(--jp-layout-color1)'
  });

  export const BackButton = style({
    padding: '8px 16px',
    border: '1px solid var(--jp-border-color2)',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: 'var(--jp-ui-font-color1)',
    cursor: 'pointer',
    fontSize: '13px',
    $nest: {
      '&:hover': {
        backgroundColor: 'var(--jp-layout-color2)'
      }
    }
  });

  export const FooterRight = style({
    display: 'flex',
    gap: '8px'
  });

  export const CancelButton = style({
    padding: '8px 16px',
    border: '1px solid var(--jp-border-color2)',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: 'var(--jp-ui-font-color1)',
    cursor: 'pointer',
    fontSize: '13px',
    $nest: {
      '&:hover': {
        backgroundColor: 'var(--jp-layout-color2)'
      }
    }
  });

  export const CreateButton = style({
    padding: '8px 24px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'var(--jp-brand-color1)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    $nest: {
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--jp-brand-color0)'
      },
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    }
  });
}
