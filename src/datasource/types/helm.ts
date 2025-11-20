export interface Release {
  name?: string;
  info?: Info;
  chart?: Chart;
  config?: { [key: string]: any };
  manifest?: string;
  hooks?: Hook[];
  version?: number;
  namespace?: string;
}

export interface Info {
  first_deployed?: string;
  last_deployed?: string;
  deleted: string;
  description?: string;
  status?: string;
  notes?: string;
  resources?: { [key: string]: string[] };
}

export interface Chart {
  metadata?: Metadata;
  lock?: Lock;
  templates?: File[];
  values: { [key: string]: any };
  schema: string;
  files?: File[];
}

export interface File {
  name: string;
  data: string;
}

export interface Metadata {
  name?: string;
  home?: string;
  sources?: string[];
  version?: string;
  description?: string;
  keywords?: string[];
  maintainers?: Maintainer[];
  icon?: string;
  apiVersion?: string;
  condition?: string;
  tags?: string;
  appVersion?: string;
  deprecated?: boolean;
  annotations?: { [key: string]: string };
  kubeVersion?: string;
  dependencies?: Dependency[];
  type?: string;
}

export interface Maintainer {
  name?: string;
  email?: string;
  url?: string;
}

export interface Dependency {
  name: string;
  version?: string;
  repository: string;
  condition?: string;
  tags?: string[];
  enabled?: boolean;
  'import-values'?: any[];
  alias?: string;
}

export interface Lock {
  generated: string;
  digest: string;
  dependencies?: Dependency[];
}

export interface Hook {
  name?: string;
  kind?: string;
  path?: string;
  manifest?: string;
  events?: string[];
  last_run?: HookExecution;
  weight?: number;
  delete_policies?: string[];
}

export interface HookExecution {
  started_at?: string;
  completed_at?: string;
  phase: string;
}

export interface RollbackOptions {
  version: number;
  cleanupOnFail: boolean;
  dryRun: boolean;
  force: boolean;
  maxHistory: number;
  disableHooks: boolean;
  recreate: boolean;
  timeout: string;
  wait: boolean;
  waitForJobs: boolean;
}

export interface UninstallOptions {
  cascade: string;
  dryRun: boolean;
  keepHistory: boolean;
  disableHooks: boolean;
  timeout: string;
  wait: boolean;
}
