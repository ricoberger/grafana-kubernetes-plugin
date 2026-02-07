import { SceneAppPage } from '@grafana/scenes';

import { CertManagerScene } from './CertManagerScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import certmanagerImg from '../../img/cert-manager.svg';

export const CertManagerPage = new SceneAppPage({
  title: 'cert-manager',
  url: prefixRoute(ROUTES.CertManager),
  routePath: ROUTES.CertManager,
  titleImg: certmanagerImg,
  getScene: () => CertManagerScene(),
});
