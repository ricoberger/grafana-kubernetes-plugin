# Changelog

## [v0.6.0](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.6.0) (2026-07-12)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.5.1...v0.6.0)

- Artifact attestations for kubectl-grafana [\#203](https://github.com/ricoberger/grafana-kubernetes-plugin/issues/203)

- feat\(workloads\): add containers section to overview page [\#205](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/205) ([ricoberger](https://github.com/ricoberger))
- ci\(kubectl-grafana\): generate artifact attestation [\#204](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/204) ([ricoberger](https://github.com/ricoberger))
- feat\(grafana\): make service account role configurable [\#196](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/196) ([ricoberger](https://github.com/ricoberger))
- chore: bump @grafana/create-plugin configuration to 7.7.0 [\#193](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/193) ([ricoberger](https://github.com/ricoberger))
- feat\(tabs\): persist active tab in url [\#192](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/192) ([ricoberger](https://github.com/ricoberger))
- feat\(page\): add options to share and screenshot page [\#190](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/190) ([ricoberger](https://github.com/ricoberger))
- fix\(logs\): always shwo logs tab for resources [\#187](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/187) ([ricoberger](https://github.com/ricoberger))
- fix\(kubernetes-resources\): fix height of table displaying a single resource for grafana 12.4.x [\#184](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/184) ([ricoberger](https://github.com/ricoberger))
- feat\(namespace\): add pods and images graphs to overview tab [\#183](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/183) ([ricoberger](https://github.com/ricoberger))
- refactor\(workload-overview\): change color of images graph [\#182](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/182) ([ricoberger](https://github.com/ricoberger))
- feat\(alerts\): add alerts tab to home page [\#181](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/181) ([ricoberger](https://github.com/ricoberger))
- fix\(panels\): explore links for VictoriaLogs [\#179](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/179) ([ricoberger](https://github.com/ricoberger))
- feat: add search [\#177](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/177) ([ricoberger](https://github.com/ricoberger))
- refactor\(frontend\): adjust variable handling in components [\#176](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/176) ([ricoberger](https://github.com/ricoberger))
- refactor\(frontend\): adjust page navigation and component organization [\#175](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/175) ([ricoberger](https://github.com/ricoberger))
- test\(e2e\): remove e2e tests [\#173](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/173) ([ricoberger](https://github.com/ricoberger))
- refactor\(frontend\): unify code style [\#170](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/170) ([ricoberger](https://github.com/ricoberger))
- feat\(helm\): show manifests in helm details page [\#166](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/166) ([ricoberger](https://github.com/ricoberger))
- Use Custom Variable for Namespaces on Home and Metrics Page [\#163](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/163) ([ricoberger](https://github.com/ricoberger))
- Fix Workload Links in Cost Table [\#162](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/162) ([ricoberger](https://github.com/ricoberger))
- Extend Cost Integration [\#161](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/161) ([ricoberger](https://github.com/ricoberger))
- Add Tabs to Metrics Page [\#159](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/159) ([ricoberger](https://github.com/ricoberger))
- Add Cost Metrics [\#158](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/158) ([ricoberger](https://github.com/ricoberger))
- Adjust Legend for Network and Storage Graphs [\#157](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/157) ([ricoberger](https://github.com/ricoberger))
- Fix Inventory Entries in Kustomizations [\#156](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/156) ([ricoberger](https://github.com/ricoberger))
- Fix Explore Links for Kubernetes Data Source [\#155](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/155) ([ricoberger](https://github.com/ricoberger))
- Add Restarts Annotation to Workload and Pod Pages [\#154](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/154) ([ricoberger](https://github.com/ricoberger))
- Do Not Show the PVC Section in Storage Metrics [\#153](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/153) ([ricoberger](https://github.com/ricoberger))
- Use Actions from Integrations in Resources Table [\#152](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/152) ([ricoberger](https://github.com/ricoberger))
- Add Link to Metrics in Resources Table [\#151](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/151) ([ricoberger](https://github.com/ricoberger))
- Fix Missing `Name` Column for Resources [\#150](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/150) ([ricoberger](https://github.com/ricoberger))
- Add Logs to Metrics Pages [\#149](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/149) ([ricoberger](https://github.com/ricoberger))
- Add PersistentVolumeClaims Metrics [\#148](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/148) ([ricoberger](https://github.com/ricoberger))
- Add Page Navigation [\#147](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/147) ([ricoberger](https://github.com/ricoberger))
- Add Cluster Metrics to Metrics Page [\#146](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/146) ([ricoberger](https://github.com/ricoberger))
- Add Storage Details Metrics [\#145](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/145) ([ricoberger](https://github.com/ricoberger))
- Add Network Details Metrics [\#144](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/144) ([ricoberger](https://github.com/ricoberger))
- Add CPU and Memory Details Metrics [\#143](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/143) ([ricoberger](https://github.com/ricoberger))
- Add Refresh Option to Query Variables [\#142](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/142) ([ricoberger](https://github.com/ricoberger))
- Adjust Field Name for Linked Traces [\#140](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/140) ([ricoberger](https://github.com/ricoberger))
- Add Build Script for Docker Image [\#139](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/139) ([ricoberger](https://github.com/ricoberger))
- Add Docker Image for Testing [\#135](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/135) ([ricoberger](https://github.com/ricoberger))
- Add Metrics Integration [\#134](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/134) ([ricoberger](https://github.com/ricoberger))
- Remove Existing Metrics Integration [\#132](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/132) ([ricoberger](https://github.com/ricoberger))
- Use `@grafana/scenes-react` [\#130](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/130) ([ricoberger](https://github.com/ricoberger))

## [v0.5.1](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.5.1) (2026-03-03)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.5.0...v0.5.1)

- Revert all NPM Updates [\#128](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/128) ([ricoberger](https://github.com/ricoberger))
- Revert Dependabot Updates [\#126](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/126) ([ricoberger](https://github.com/ricoberger))

## [v0.5.0](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.5.0) (2026-03-01)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.4.3...v0.5.0)

- Update Initialization of Plugin Translation [\#125](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/125) ([ricoberger](https://github.com/ricoberger))
- Add `AGENTS.md` File and Skills [\#110](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/110) ([ricoberger](https://github.com/ricoberger))
- Add Dependabot Configuration for npm [\#109](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/109) ([ricoberger](https://github.com/ricoberger))
- chore: bump @grafana/create-plugin configuration to 7.0.0 [\#108](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/108) ([ricoberger](https://github.com/ricoberger))
- Fix Panic when Invalid JSONPath is Provided [\#107](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/107) ([ricoberger](https://github.com/ricoberger))
- Show Jobs in CronJob Details [\#106](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/106) ([ricoberger](https://github.com/ricoberger))
- Add Regular Expression Filter [\#105](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/105) ([ricoberger](https://github.com/ricoberger))
- Extend Options for kubernetes Resources in Variable Query Editor [\#104](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/104) ([ricoberger](https://github.com/ricoberger))
- Add Details View for Flux Resources [\#99](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/99) ([ricoberger](https://github.com/ricoberger))
- Remove K3s and Jaeger from Docker Compose Setup [\#96](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/96) ([ricoberger](https://github.com/ricoberger))
- cert-manager: Show Related Resources in Details [\#95](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/95) ([ricoberger](https://github.com/ricoberger))
- Improve JSONPath Support [\#94](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/94) ([ricoberger](https://github.com/ricoberger))
- Add cert-manager Integration [\#93](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/93) ([ricoberger](https://github.com/ricoberger))
- Add Timeout for `kubectl-grafana` Plugin [\#92](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/92) ([ricoberger](https://github.com/ricoberger))

## [v0.4.3](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.4.3) (2026-02-04)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.4.2...v0.4.3)

- Fix Type in JSONPath Filter [\#90](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/90) ([ricoberger](https://github.com/ricoberger))
- Fix Duplicated Kubernetes Resources in Data Frame [\#89](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/89) ([ricoberger](https://github.com/ricoberger))

## [v0.4.2](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.4.2) (2026-02-04)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.4.1...v0.4.2)

- Add Basic JSONPath Support for Filtering Resources [\#88](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/88) ([ricoberger](https://github.com/ricoberger))
- Improve Naming of Data Frames [\#87](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/87) ([ricoberger](https://github.com/ricoberger))
- Add `||` Label Selector [\#86](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/86) ([ricoberger](https://github.com/ricoberger))
- Fix Condition to Disable Selector Value Input [\#85](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/85) ([ricoberger](https://github.com/ricoberger))
- chore: bump @grafana/create-plugin configuration to 6.8.3 [\#82](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/82) ([ricoberger](https://github.com/ricoberger))
- chore: bump @grafana/create-plugin configuration to 6.6.0 [\#76](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/76) ([ricoberger](https://github.com/ricoberger))
- handle missing trailing slash in grafana url [\#74](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/74) ([jkraml-staffbase](https://github.com/jkraml-staffbase))
- Update GitHub Actions [\#73](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/73) ([ricoberger](https://github.com/ricoberger))

## [v0.4.1](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.4.1) (2025-12-02)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.4.0...v0.4.1)

- Update Go Version to 1.25.4 [\#71](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/71) ([ricoberger](https://github.com/ricoberger))
- Update Release of `kubectl-grafana` [\#69](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/69) ([ricoberger](https://github.com/ricoberger))
- chore: bump @grafana/create-plugin configuration to 6.4.2 [\#66](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/66) ([ricoberger](https://github.com/ricoberger))

## [v0.4.0](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.4.0) (2025-11-30)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.3.1...v0.4.0)

- Fix Variable Query Editor for Containers [\#65](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/65) ([ricoberger](https://github.com/ricoberger))
- Improve Labels for Resources [\#64](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/64) ([ricoberger](https://github.com/ricoberger))
- Add Streaming Support for Kubernetes Logs [\#63](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/63) ([ricoberger](https://github.com/ricoberger))
- Add Previous Option for Kubernetes Logs Queries [\#61](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/61) ([ricoberger](https://github.com/ricoberger))
- Add Tail Option for Kubernetes Logs Query [\#60](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/60) ([ricoberger](https://github.com/ricoberger))
- Improve List Style of Datasources [\#59](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/59) ([ricoberger](https://github.com/ricoberger))
- Use Frontend for Redirect in `kubectl-grafana` [\#58](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/58) ([ricoberger](https://github.com/ricoberger))
- Add Sleep to `kubectl` Commands [\#57](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/57) ([ricoberger](https://github.com/ricoberger))

## [v0.3.1](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.3.1) (2025-11-23)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.3.0...v0.3.1)

- Change Cursor Style for Clickable Badges [\#56](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/56) ([ricoberger](https://github.com/ricoberger))
- Fix UI for Grafana 12.3.0 [\#54](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/54) ([ricoberger](https://github.com/ricoberger))

## [v0.3.0](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.3.0) (2025-11-23)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.2.2...v0.3.0)

- Add `kubectl-grafana` Plugin [\#53](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/53) ([ricoberger](https://github.com/ricoberger))
- Replace Explore Links with Drawer [\#52](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/52) ([ricoberger](https://github.com/ricoberger))
- Fix: Rework Frontend [\#51](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/51) ([ricoberger](https://github.com/ricoberger))
- Rework Frontend [\#49](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/49) ([ricoberger](https://github.com/ricoberger))
- Improve Resource Handling [\#46](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/46) ([ricoberger](https://github.com/ricoberger))
- Add Action to Cordon and Uncordon Nodes [\#45](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/45) ([ricoberger](https://github.com/ricoberger))
- Add Action to Evict Pods [\#44](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/44) ([ricoberger](https://github.com/ricoberger))
- Format Metrics in Resources View [\#43](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/43) ([ricoberger](https://github.com/ricoberger))
- Add Action to Approve and Deny CSR [\#42](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/42) ([ricoberger](https://github.com/ricoberger))
- Do Not Publish E2E Report [\#41](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/41) ([ricoberger](https://github.com/ricoberger))
- Add Action to Suspend and Resume CronJobs [\#40](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/40) ([ricoberger](https://github.com/ricoberger))
- Change Generated Kubeconfig [\#39](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/39) ([ricoberger](https://github.com/ricoberger))
- Add Label to Kubernetes Resources Queries [\#38](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/38) ([ricoberger](https://github.com/ricoberger))
- Use DiscoveryClient to Get Resources [\#37](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/37) ([ricoberger](https://github.com/ricoberger))
- Use Default Queries in Pages [\#36](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/36) ([ricoberger](https://github.com/ricoberger))
- Add AI Action for Helm and Flux Integration [\#35](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/35) ([ricoberger](https://github.com/ricoberger))
- Fix Datasource Configuration [\#34](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/34) ([ricoberger](https://github.com/ricoberger))
- Remove Tracing Options [\#33](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/33) ([ricoberger](https://github.com/ricoberger))
- Add Support for Grafana LLM Plugin [\#29](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/29) ([ricoberger](https://github.com/ricoberger))
- chore: bump @grafana/create-plugin configuration to 6.1.5 [\#26](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/26) ([github-actions[bot]](https://github.com/apps/github-actions))

## [v0.2.2](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.2.2) (2025-10-29)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.2.1...v0.2.2)

- Fix Namespace used for Pod Top Query [\#25](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/25) ([ricoberger](https://github.com/ricoberger))
- Improve Tracing for Grafana Client [\#24](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/24) ([ricoberger](https://github.com/ricoberger))
- Improve Tracing for Helm Client [\#23](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/23) ([ricoberger](https://github.com/ricoberger))
- Improve Tracing for Kubernetes Client [\#22](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/22) ([ricoberger](https://github.com/ricoberger))
- Add Tests for Impersonation Handling [\#21](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/21) ([ricoberger](https://github.com/ricoberger))
- Fix Initialization of Slices [\#20](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/20) ([ricoberger](https://github.com/ricoberger))

## [v0.2.1](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.2.1) (2025-10-27)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.2.0...v0.2.1)

- Add Kubeconfig Name as Prefix for User in Kubeconfig [\#19](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/19) ([ricoberger](https://github.com/ricoberger))

## [v0.2.0](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.2.0) (2025-10-24)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/v0.1.0...v0.2.0)

- Improve Logs and Error Handling [\#18](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/18) ([ricoberger](https://github.com/ricoberger))
- Improve Installation Instructions [\#17](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/17) ([ricoberger](https://github.com/ricoberger))
- Add Metrics to Kubernetes Resources [\#16](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/16) ([ricoberger](https://github.com/ricoberger))
- Replace Link with Query in Traces Integration [\#15](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/15) ([ricoberger](https://github.com/ricoberger))
- Add Support for Metrics [\#14](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/14) ([ricoberger](https://github.com/ricoberger))
- Add Support to Link Traces [\#12](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/12) ([ricoberger](https://github.com/ricoberger))
- Improve Typings [\#11](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/11) ([ricoberger](https://github.com/ricoberger))
- Apply Template Variables to All Fields [\#10](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/10) ([ricoberger](https://github.com/ricoberger))
- Add Dashboard [\#9](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/9) ([ricoberger](https://github.com/ricoberger))
- Improve Query Editor [\#8](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/8) ([ricoberger](https://github.com/ricoberger))
- Add More Variable Types [\#7](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/7) ([ricoberger](https://github.com/ricoberger))

## [v0.1.0](https://github.com/ricoberger/grafana-kubernetes-plugin/tree/v0.1.0) (2025-10-16)

[Full Changelog](https://github.com/ricoberger/grafana-kubernetes-plugin/compare/04df6a3abc81a487afe3c147c56cc929e31f3032...v0.1.0)

- Add Default Query for Each Query Type [\#6](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/6) ([ricoberger](https://github.com/ricoberger))
- Create Plugin Update [\#5](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/5) ([ricoberger](https://github.com/ricoberger))
- Bump the gomod group with 4 updates [\#2](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/2) ([dependabot[bot]](https://github.com/apps/dependabot))
- Bump the github-actions group with 4 updates [\#1](https://github.com/ricoberger/grafana-kubernetes-plugin/pull/1) ([dependabot[bot]](https://github.com/apps/dependabot))



\* *This Changelog was automatically generated by [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator)*
