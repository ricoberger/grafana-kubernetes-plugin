export interface KubeConfig {
  kind?: string;
  apiVersion?: string;
  clusters: NamedCluster[];
  users: NamedAuthInfo[];
  contexts: NamedContext[];
  'current-context': string;
}

export interface Cluster {
  server: string;
  'tls-server-name'?: string;
  'insecure-skip-tls-verify'?: boolean;
  'certificate-authority'?: string;
  'certificate-authority-data'?: string;
  'proxy-url'?: string;
  'disable-compression'?: boolean;
}

export interface AuthInfo {
  'client-certificate'?: string;
  'client-certificate-data'?: string;
  'client-key'?: string;
  'client-key-data'?: string;
  token?: string;
  tokenFile?: string;
  as?: string;
  'as-uid'?: string;
  'as-groups'?: string[];
  'as-user-extra'?: { [key: string]: string[] };
  username?: string;
  password?: string;
  exec?: ExecConfig;
}

export interface Context {
  cluster: string;
  user: string;
  namespace?: string;
}

export interface NamedCluster {
  name: string;
  cluster: Cluster;
}

export interface NamedContext {
  name: string;
  context: Context;
}

export interface NamedAuthInfo {
  name: string;
  user: AuthInfo;
}

export interface ExecConfig {
  command: string;
  args: string[];
  env: ExecEnvVar[];
  apiVersion?: string;
  installHint?: string;
  provideClusterInfo: boolean;
}

export interface ExecEnvVar {
  name: string;
  value: string;
}
