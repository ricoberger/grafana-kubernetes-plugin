import { SceneAppPage } from '@grafana/scenes';

import { homeScene } from './homeScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import homeImg from '../../img/logo.svg';

export const homePage = new SceneAppPage({
  title: 'Kubernetes',
  url: prefixRoute(ROUTES.Home),
  routePath: ROUTES.Home,
  titleImg: homeImg,
  getScene: homeScene,
});
