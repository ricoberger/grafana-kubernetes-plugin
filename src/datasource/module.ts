import { DataSourcePlugin } from '@grafana/data';

import { DataSource } from './datasource';
import { ConfigEditor } from './components/configeditor/ConfigEditor';
import { QueryEditor } from './components/queryeditor/QueryEditor';
import { Query } from './types/query';
import { DataSourceOptions } from './types/settings';

export const plugin = new DataSourcePlugin<
  DataSource,
  Query,
  DataSourceOptions
>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
