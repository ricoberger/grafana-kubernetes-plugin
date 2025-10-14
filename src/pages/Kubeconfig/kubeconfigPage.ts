import { SceneAppPage } from '@grafana/scenes';

import { kubeconfigScene } from './kubeconfigScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import kubernetesImg from '../../img/logo.svg';

export const kubeconfigPage = new SceneAppPage({
  title: 'Kubeconfig',
  url: prefixRoute(ROUTES.Kubeconfig),
  routePath: ROUTES.Kubeconfig,
  titleImg: kubernetesImg,
  getScene: () => kubeconfigScene(),
});
