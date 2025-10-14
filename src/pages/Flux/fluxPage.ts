import { SceneAppPage } from '@grafana/scenes';

import { fluxScene } from './fluxScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import fluxImg from '../../img/flux.svg';

export const fluxPage = new SceneAppPage({
  title: 'Flux',
  url: prefixRoute(ROUTES.Flux),
  routePath: ROUTES.Flux,
  titleImg: fluxImg,
  getScene: () => fluxScene(),
});
