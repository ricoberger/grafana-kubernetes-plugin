import { SceneAppPage } from '@grafana/scenes';

import { KubeconfigScene } from './KubeconfigScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import kubernetesImg from '../../img/logo.svg';

export const KubeconfigPage = new SceneAppPage({
  title: 'Kubeconfig',
  url: prefixRoute(ROUTES.Kubeconfig),
  routePath: ROUTES.Kubeconfig,
  titleImg: kubernetesImg,
  getScene: () => KubeconfigScene(),
});
