import { SceneAppPage } from '@grafana/scenes';

import { resourcesScene } from './resourcesScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import resourcesImg from '../../img/logo.svg';

export const resourcesPage = new SceneAppPage({
  title: 'Resources',
  url: prefixRoute(ROUTES.Resources),
  routePath: ROUTES.Resources,
  titleImg: resourcesImg,
  getScene: () => resourcesScene(),
});
