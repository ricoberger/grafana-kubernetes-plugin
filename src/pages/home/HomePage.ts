import { SceneAppPage } from '@grafana/scenes';

import { HomeScene } from './HomeScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import homeImg from '../../img/logo.svg';

export const HomePage = new SceneAppPage({
  title: 'Kubernetes',
  url: prefixRoute(ROUTES.Home),
  routePath: ROUTES.Home,
  titleImg: homeImg,
  getScene: HomeScene,
});
