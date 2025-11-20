import { SceneAppPage } from '@grafana/scenes';

import { FluxScene } from './FluxScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import fluxImg from '../../img/flux.svg';

export const FluxPage = new SceneAppPage({
  title: 'Flux',
  url: prefixRoute(ROUTES.Flux),
  routePath: ROUTES.Flux,
  titleImg: fluxImg,
  getScene: () => FluxScene(),
});
