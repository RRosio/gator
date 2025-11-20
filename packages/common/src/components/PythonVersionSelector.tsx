import { HTMLSelect } from '@jupyterlab/ui-components';
import * as React from 'react';
import { Conda } from '../tokens';

export interface IPythonVersionSelectorProps {
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  packageManager: Conda.IPackageManager;
}

export const PythonVersionSelector: React.FC<IPythonVersionSelectorProps> = ({
  selectedVersion,
  onVersionChange,
  packageManager
}) => {
  const [versions, setVersions] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadPythonVersions() {
      try {
        setIsLoading(true);
        // For now, use fallback versions since we don't have an environment context
        // In the future, we could query conda search python to get available versions
        setVersions(['3.12', '3.11', '3.10', '3.9', '3.8']);
      } catch (error) {
        console.error('Error loading Python versions:', error);
        // Fallback to common versions
        setVersions(['3.12', '3.11', '3.10', '3.9', '3.8']);
      } finally {
        setIsLoading(false);
      }
    }

    loadPythonVersions();
  }, [packageManager]);

  return (
    <HTMLSelect
      value={selectedVersion}
      onChange={e => onVersionChange(e.target.value)}
      disabled={isLoading}
      aria-label="Python version"
    >
      {isLoading ? (
        <option>Loading...</option>
      ) : (
        versions.map(v => (
          <option key={v} value={v}>
            Python {v}
          </option>
        ))
      )}
    </HTMLSelect>
  );
};
