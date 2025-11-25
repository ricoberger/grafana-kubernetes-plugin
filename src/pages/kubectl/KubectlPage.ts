import { SceneAppPage } from '@grafana/scenes';

import { KubectlScene } from './KubectlScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import kubernetesImg from '../../img/logo.svg';

export const KubectlPage = new SceneAppPage({
  title: 'kubectl',
  url: prefixRoute(ROUTES.Kubectl),
  routePath: ROUTES.Kubectl,
  titleImg: kubernetesImg,
  getScene: () => KubectlScene(),
});
