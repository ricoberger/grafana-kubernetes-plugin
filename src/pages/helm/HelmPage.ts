import { SceneAppPage } from '@grafana/scenes';

import { HelmScene } from './HelmScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import helmImg from '../../img/helm.svg';

export const HelmPage = new SceneAppPage({
  title: 'Helm',
  url: prefixRoute(ROUTES.Helm),
  routePath: ROUTES.Helm,
  titleImg: helmImg,
  getScene: () => HelmScene(),
});
