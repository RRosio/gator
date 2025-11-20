import { HTMLSelect } from '@jupyterlab/ui-components';
import * as React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { style } from 'typestyle';
import { Conda } from '../tokens';

export interface IPackageSelectionListProps {
  packages: Conda.IPackage[];
  selectedPackages: Map<string, string>;
  onTogglePackage: (pkg: Conda.IPackage) => void;
  onVersionChange: (pkg: Conda.IPackage, version: string) => void;
  isLoading?: boolean;
}

export const PackageSelectionList: React.FC<IPackageSelectionListProps> = ({
  packages,
  selectedPackages,
  onTogglePackage,
  onVersionChange,
  isLoading = false
}) => {
  const renderRow = ({ index, style: rowStyle }: ListChildComponentProps) => {
    const pkg = packages[index];
    const isSelected = selectedPackages.has(pkg.name);
    const selectedVersion =
      selectedPackages.get(pkg.name) || pkg.version[pkg.version.length - 1];

    return (
      <div className={Style.Row} style={rowStyle}>
        <div className={Style.CheckboxCell}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onTogglePackage(pkg)}
            aria-label={`Select ${pkg.name}`}
          />
        </div>
        <div className={Style.NameCell} onClick={() => onTogglePackage(pkg)}>
          {pkg.name}
          {pkg.summary && <div className={Style.Summary}>{pkg.summary}</div>}
        </div>
        <div className={Style.VersionCell}>
          <HTMLSelect
            value={selectedVersion}
            onChange={e => onVersionChange(pkg, e.target.value)}
            disabled={!isSelected}
            aria-label={`Version for ${pkg.name}`}
            onClick={e => e.stopPropagation()}
          >
            {pkg.version.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </HTMLSelect>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className={Style.Loading}>Loading packages...</div>;
  }

  if (packages.length === 0) {
    return <div className={Style.Empty}>No packages found</div>;
  }

  return (
    <div className={Style.Container}>
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <FixedSizeList
            height={height}
            itemCount={packages.length}
            itemSize={60}
            width={width}
          >
            {renderRow}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
};

namespace Style {
  export const Container = style({
    flex: '1 1 auto',
    minHeight: 0,
    overflow: 'hidden'
  });

  export const Row = style({
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    borderBottom: '1px solid var(--jp-border-color2)',
    cursor: 'pointer',
    $nest: {
      '&:hover': {
        backgroundColor: 'var(--jp-layout-color2)'
      }
    }
  });

  export const CheckboxCell = style({
    width: '40px',
    flexShrink: 0
  });

  export const NameCell = style({
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden'
  });

  export const Summary = style({
    fontSize: '0.85em',
    color: 'var(--jp-ui-font-color2)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  });

  export const VersionCell = style({
    width: '150px',
    flexShrink: 0
  });

  export const Loading = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--jp-ui-font-color2)'
  });

  export const Empty = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--jp-ui-font-color2)'
  });
}
