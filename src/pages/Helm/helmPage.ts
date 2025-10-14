import { SceneAppPage } from '@grafana/scenes';

import { helmScene } from './helmScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import helmImg from '../../img/helm.svg';

export const helmPage = new SceneAppPage({
  title: 'Helm',
  url: prefixRoute(ROUTES.Helm),
  routePath: ROUTES.Helm,
  titleImg: helmImg,
  getScene: () => helmScene(),
});
