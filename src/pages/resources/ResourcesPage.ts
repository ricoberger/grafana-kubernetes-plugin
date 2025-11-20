import { SceneAppPage } from '@grafana/scenes';

import { ResourcesScene } from './ResourcesScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import resourcesImg from '../../img/logo.svg';

export const ResourcesPage = new SceneAppPage({
  title: 'Resources',
  url: prefixRoute(ROUTES.Resources),
  routePath: ROUTES.Resources,
  titleImg: resourcesImg,
  getScene: () => ResourcesScene(),
});
