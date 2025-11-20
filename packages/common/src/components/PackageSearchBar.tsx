import { InputGroup } from '@jupyterlab/ui-components';
import * as React from 'react';
import { style } from 'typestyle';

export interface IPackageSearchBarProps {
  searchTerm: string;
  onSearch: (event: React.FormEvent) => void;
  placeholder?: string;
}

export const PackageSearchBar: React.FC<IPackageSearchBarProps> = ({
  searchTerm,
  onSearch,
  placeholder = 'Search Packages'
}) => {
  return (
    <div className={Style.SearchWrapper}>
      <InputGroup
        className={Style.SearchInput}
        type="text"
        placeholder={placeholder}
        onChange={onSearch}
        value={searchTerm}
        rightIcon="search"
      />
    </div>
  );
};

namespace Style {
  export const SearchWrapper = style({
    padding: '4px',
    width: '100%'
  });

  export const SearchInput = style({
    lineHeight: 'normal'
  });
}
