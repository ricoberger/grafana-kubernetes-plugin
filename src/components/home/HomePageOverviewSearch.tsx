import { useVariables } from '@grafana/scenes-react';
import { Input } from '@grafana/ui';
import React, { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';

export function HomePageOverviewSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const variables = useVariables();
  const datasource = variables.find((v) => v.state.name === 'datasource');
  const datasourceValue = datasource?.getValue();

  return (
    <div>
      <Input
        placeholder="Search..."
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setSearchTerm(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            navigate(
              prefixRoute(ROUTES.Search) +
              `?var-datasource=${datasourceValue}&var-searchterm=.*${searchTerm}.*`,
            );
          }
        }}
        value={searchTerm}
        width={25}
      />
    </div>
  );
}
