import * as React from 'react';
import { style } from 'typestyle';

export interface ISelectedPackagesPanelProps {
  selectedPackages: Map<string, string>;
  onRemovePackage: (pkgName: string) => void;
}

export const SelectedPackagesPanel: React.FC<ISelectedPackagesPanelProps> = ({
  selectedPackages,
  onRemovePackage
}) => {
  if (selectedPackages.size === 0) {
    return (
      <div className={Style.Container}>
        <h3 className={Style.Title}>Selected Packages</h3>
        <div className={Style.Empty}>
          <div className={Style.EmptyIcon}>📦</div>
          <div>No packages yet</div>
          <div className={Style.EmptyHint}>Select packages on the left</div>
        </div>
      </div>
    );
  }

  return (
    <div className={Style.Container}>
      <h3 className={Style.Title}>
        Selected Packages ({selectedPackages.size})
      </h3>
      <div className={Style.List}>
        {Array.from(selectedPackages.entries()).map(([name, version]) => (
          <div key={name} className={Style.PackageItem}>
            <div className={Style.PackageInfo}>
              <div className={Style.PackageName}>{name}</div>
              <div className={Style.PackageVersion}>{version}</div>
            </div>
            <button
              className={Style.RemoveButton}
              onClick={() => onRemovePackage(name)}
              aria-label={`Remove ${name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

namespace Style {
  export const Container = style({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '16px',
    backgroundColor: 'var(--jp-layout-color1)',
    borderLeft: '1px solid var(--jp-border-color2)'
  });

  export const Title = style({
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--jp-ui-font-color1)'
  });

  export const List = style({
    flex: '1 1 auto',
    overflow: 'auto',
    minHeight: 0
  });

  export const PackageItem = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px',
    marginBottom: '4px',
    backgroundColor: 'var(--jp-layout-color2)',
    borderRadius: '4px',
    border: '1px solid var(--jp-border-color2)'
  });

  export const PackageInfo = style({
    flex: '1 1 auto',
    minWidth: 0
  });

  export const PackageName = style({
    fontWeight: 500,
    fontSize: '13px',
    color: 'var(--jp-ui-font-color1)'
  });

  export const PackageVersion = style({
    fontSize: '11px',
    color: 'var(--jp-ui-font-color2)'
  });

  export const RemoveButton = style({
    width: '24px',
    height: '24px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '20px',
    color: 'var(--jp-ui-font-color2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    $nest: {
      '&:hover': {
        backgroundColor: 'var(--jp-layout-color3)',
        color: 'var(--jp-error-color1)'
      }
    }
  });

  export const Empty = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--jp-ui-font-color2)'
  });

  export const EmptyIcon = style({
    fontSize: '48px',
    marginBottom: '8px',
    opacity: 0.3
  });

  export const EmptyHint = style({
    fontSize: '12px',
    marginTop: '4px',
    opacity: 0.7
  });
}
