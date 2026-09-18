export function variableQuery(query: string) {
  return query.replace(/(?:\r\n|\r|\n)/g, '');
}

/**
 * queries contains all PromQL queries which are used in the plugin.
 *
 * NOTE: Queries should be formatted using the following command:
 * cat metrics | curl -X POST --data-binary @- https://xbin.io/promql-metricsql-prettify > output
 */
export const queries = {
  cluster: {
    cpuCapacity: `sum(
  max(
    kube_node_status_capacity{cluster=~"$cluster",resource=~"cpu"}
  ) by(cluster,node,resource)
)`,
    cpuLimits: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_limit{cluster=~"$cluster",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{cluster=~"$cluster"}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
)`,
    cpuRequests: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster"}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
)`,
    cpuUsage: `sum(
  label_join(
    (
      sum(
        max(
          (
            1
              -
            rate(node_cpu_seconds_total{cluster=~"$cluster",mode=~"idle"}[$__rate_interval])
          )
            >=
          0
        ) by(cluster,instance,cpu,core)
      ) by(cluster,instance)
        or
      sum(
        rate(node_cpu_usage_seconds_total{cluster=~"$cluster"}[$__rate_interval]) >= 0
      ) by(cluster,instance)
    )
      or
    sum(
      label_join(
        label_join(
          k8s_node_cpu_usage{k8s_cluster_name=~"$cluster"},
          "cluster",
          ",",
          "k8s_cluster_name"
        ),
        "instance",
        ",",
        "k8s_node_name"
      )
    ) by(cluster,instance),
    "node",
    ",",
    "instance"
  )
)`,
    memoryCapacity: `sum(
  max(
    kube_node_status_capacity{cluster=~"$cluster",resource=~"memory"}
  ) by(cluster,node,resource)
)`,
    memoryLimits: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_limit{cluster=~"$cluster",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{cluster=~"$cluster"}
        )
      )
    ),
    "resource", "memory", "", ""
  )
)`,
    memoryRequests: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster"}
        )
      )
    ),
    "resource", "memory", "", ""
  )
)`,
    memoryUsage: `sum(
  label_join(
    (
      max(
        node_memory_MemTotal_bytes{cluster=~"$cluster"}
      ) by(cluster,instance)
        - on(cluster,instance) group_left()
      max(node_memory_MemAvailable_bytes{cluster=~"$cluster"}) by(cluster,instance)
    )
      or
    max(node_memory_working_set_bytes{cluster=~"$cluster"}) by(cluster,instance),
    "node",
    ",",
    "instance"
  )
)`,
    costsCPUAllocation: `sum_over_time(
  sum(
    max(
      kube_node_status_capacity{
        cluster=~"$cluster",resource=~"cpu"
      }
    ) by(cluster,node,resource)
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsMemoryAllocation: `sum_over_time(
  sum(
    (
      (
        (
          max(
            kube_node_status_capacity{
              cluster=~"$cluster",resource=~"memory"
            }
          ) by(cluster,node,resource)
            /
          1024
        )
          /
        1024
      )
        /
      1024
    )
      * on(cluster,node) group_left()
    max(
      node_ram_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsCPUIdle: `sum_over_time(
  sum(
    (
      sum by(cluster,node)(
        label_replace(
          sum by(cluster,instance)(
            max by(cluster,instance,cpu,core)(
              rate(
                node_cpu_seconds_total{
                  cluster=~"$cluster",mode=~"idle"
                }[$__rate_interval]
              )
            )
          ),
          "node",
          "$1",
          "instance",
          "([^:]+).*"
        )
      )
        or on(cluster,node)
      (
        max by(cluster,node)(
          kube_node_status_capacity{cluster=~"$cluster",resource="cpu"}
        )
          - on(cluster,node)
        sum by(cluster,node)(
          label_replace(
            (
              sum by(cluster,instance)(
                rate(
                  node_cpu_usage_seconds_total{cluster=~"$cluster"}[$__rate_interval]
                ) >= 0
              )
                or
              sum by(cluster,instance)(
                label_join(
                  label_join(
                    rate(
                      k8s_node_cpu_time_seconds_total{
                        k8s_cluster_name=~"$cluster"
                      }[$__rate_interval]
                    ),
                    "cluster",
                    ",",
                    "k8s_cluster_name"
                  ),
                  "instance",
                  ",",
                  "k8s_node_name"
                )
              )
            ),
            "node",
            "$1",
            "instance",
            "([^:]+).*"
          )
        )
      )
    )
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsMemoryIdle: `sum_over_time(
  sum(
    (
      (
        (
          max(
            label_replace(
              windows_memory_available_bytes{
                cluster=~"$cluster"
              }
                or
              node_memory_MemAvailable_bytes{
                cluster=~"$cluster"
              },
              "node",
              "$1",
              "instance",
              "([^:]+).*"
            )
          ) by(cluster,node)
            /
          1024
        )
          /
        1024
      )
        /
      1024
    )
      * on(cluster,node) group_left()
    max(
      node_ram_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsTotalRate: `sum(
  max(node_total_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
)`,
    costsCPUAllocationRate: `sum(
  max(
    kube_node_status_capacity{
      cluster=~"$cluster",resource=~"cpu"
    }
  ) by(cluster,node,resource)
    * on(cluster,node) group_left()
  max(
    node_cpu_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
    costsMemoryAllocationRate: `sum(
  (
    (
      (
        max(
          kube_node_status_capacity{
            cluster=~"$cluster",resource=~"memory"
          }
        ) by(cluster,node,resource)
          /
        1024
      )
        /
      1024
    )
      /
    1024
  )
    * on(cluster,node) group_left()
  max(
    node_ram_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
    costsCPUIdleRate: `sum(
  (
    sum by(cluster,node)(
      label_replace(
        sum by(cluster,instance)(
          max by(cluster,instance,cpu,core)(
            rate(
              node_cpu_seconds_total{
                cluster=~"$cluster",mode=~"idle"
              }[$__rate_interval]
            )
          )
        ),
        "node",
        "$1",
        "instance",
        "([^:]+).*"
      )
    )
      or on(cluster,node)
    (
      max by(cluster,node)(
        kube_node_status_capacity{cluster=~"$cluster",resource="cpu"}
      )
        - on(cluster,node)
      sum by(cluster,node)(
        label_replace(
          (
            sum by(cluster,instance)(
              rate(
                node_cpu_usage_seconds_total{cluster=~"$cluster"}[$__rate_interval]
              ) >= 0
            )
              or
            sum by(cluster,instance)(
              label_join(
                label_join(
                  rate(
                    k8s_node_cpu_time_seconds_total{
                      k8s_cluster_name=~"$cluster"
                    }[$__rate_interval]
                  ),
                  "cluster",
                  ",",
                  "k8s_cluster_name"
                ),
                "instance",
                ",",
                "k8s_node_name"
              )
            )
          ),
          "node",
          "$1",
          "instance",
          "([^:]+).*"
        )
      )
    )
  )
    * on(cluster,node) group_left()
  max(
    node_cpu_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
    costsMemoryIdleRate: `sum(
  (
    (
      (
        max(
          label_replace(
            windows_memory_available_bytes{
              cluster=~"$cluster"
            }
              or
            node_memory_MemAvailable_bytes{
              cluster=~"$cluster"
            },
            "node",
            "$1",
            "instance",
            "([^:]+).*"
          )
        ) by(cluster,node)
          /
        1024
      )
        /
      1024
    )
      /
    1024
  )
    * on(cluster,node) group_left()
  max(
    node_ram_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
    costsTotalPrior30d: `sum_over_time(
  sum(max(node_total_hourly_cost{cluster=~"$cluster"} offset 30d) by(cluster,node))[30d:5m]
)
  /
12
  or
vector(0)`,
    costsTotalCurrent30d: `sum_over_time(
  sum(max(node_total_hourly_cost{cluster=~"$cluster"}) by(cluster,node))[30d:5m]
)
  /
12
  or
vector(0)`,
    costsPerPodCurrent30d: `(
  sum_over_time(
    sum(max(node_total_hourly_cost{cluster=~"$cluster"}) by(cluster,node))[30d:5m]
  )
    /
  12
    or
  vector(0)
)
  /
(
  avg_over_time(
    sum(max(kubelet_running_pods{cluster=~"$cluster"}) by(cluster,instance))[30d:5m]
  )
    or
  vector(0)
)`,
    costsPotentialSavings: `(
  (
    sum(
      floor(
        max(
          max(
            kube_node_status_capacity{resource=~"cpu",cluster=~"$cluster"}
          ) by(cluster,node,resource)
        ) by(cluster,node)
          - on(cluster,node) group_left()
        sum(
          max(
            node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
              container!="POD",container!="",cluster=~"$cluster"
            }
          ) by(cluster,namespace,node,pod,container,resource)
        ) by(cluster,node)
      )
        * on(cluster,node) group_left()
      max(node_cpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
    )
      or
    vector(0)
  )
    +
  (
    sum(
      (
        (
          (
            (
              max(
                max(
                  kube_node_status_capacity{
                    resource=~"memory",cluster=~"$cluster"
                  }
                ) by(cluster,node,resource)
              ) by(cluster,node)
                - on(cluster,node) group_left()
              sum(
                max(
                  node_namespace_pod_container:container_memory_working_set_bytes{
                    container!="POD",container!="",cluster=~"$cluster"
                  }
                ) by(cluster,namespace,node,pod,container,resource)
              ) by(cluster,node)
            )
              /
            1024
          )
            /
          1024
        )
          /
        1024
      )
        * on(cluster,node) group_left()
      max(node_ram_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
    )
      or
    vector(0)
  )
    +
  (
    sum(
      (
        max(node_gpu_count{cluster=~"$cluster"}) by(cluster,node)
          - on(cluster,node) group_left()
        sum(
          max(
            container_gpu_allocation{cluster=~"$cluster"}
          ) by(cluster,node,namespace,pod,container)
        ) by(cluster,node)
      )
        * on(cluster,node) group_left()
      max(node_gpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
    )
      or
    vector(0)
  )
    +
  (
    sum(
      (
        (
          (
            sum(
              pod_pvc_allocation{cluster=~"$cluster"}
                - on(cluster,namespace,persistentvolumeclaim) group_left()
              max(
                max(
                  kubelet_volume_stats_used_bytes{cluster=~"$cluster"}
                ) without(node,instance)
              ) by(cluster,namespace,persistentvolumeclaim)
            ) by(cluster,namespace,persistentvolume)
              /
            1024
          )
            /
          1024
        )
          /
        1024
      )
        * on(cluster,persistentvolume) group_left()
      max(pv_hourly_cost{cluster=~"$cluster"}) by(cluster,persistentvolume)
    )
      or
    vector(0)
  )
)
  *
24
  *
30`,
    alertsBySeverity: `count(
  ALERTS{
    alertname=~"(Kube.*|CPUThrottlingHigh)",
    alertstate=~"firing",
    cluster=~"$cluster",
    severity!=""
  }
    or
  GRAFANA_ALERTS{
    alertname=~"(Kube.*|CPUThrottlingHigh)",
    alertstate=~"firing",
    cluster=~"$cluster",
    severity!=""

  }
) by(severity)`,
    alertsByNamespace: `count(
  ALERTS{
    alertname=~"(Kube.*|CPUThrottlingHigh)",
    alertstate=~"firing",
    cluster=~"$cluster",
    namespace!=""

  }
    or
  GRAFANA_ALERTS{
    alertname=~"(Kube.*|CPUThrottlingHigh)",
    alertstate=~"firing",
    cluster=~"$cluster",
    namespace!=""

  }
) by(namespace)`,
    alerts: `(
  (
    (
      (
        label_replace(
          label_replace(
            ALERTS{
              daemonset!="",
              alertname=~"(Kube.*|CPUThrottlingHigh)",
              alertstate=~"firing",
              cluster=~"$cluster"
            }
              or
            GRAFANA_ALERTS{
              daemonset!="",
              alertname=~"(Kube.*|CPUThrottlingHigh)",
              alertstate=~"firing",
              cluster=~"$cluster"
            },
            "workload_type",
            "daemonset",
            "",
            ""
          ),
          "workload",
          "$1",
          "daemonset",
          "(.*)"
        )
          or
        label_replace(
          label_replace(
            ALERTS{
              deployment!="",
              alertname=~"(Kube.*|CPUThrottlingHigh)",
              alertstate=~"firing",
              cluster=~"$cluster"
            }
              or
            GRAFANA_ALERTS{
              deployment!="",
              alertname=~"(Kube.*|CPUThrottlingHigh)",
              alertstate=~"firing",
              cluster=~"$cluster"
            },
            "workload_type",
            "deployment",
            "",
            ""
          ),
          "workload",
          "$1",
          "deployment",
          "(.*)"
        )
      )
        or
      label_replace(
        label_replace(
          ALERTS{
            statefulset!="",
            alertname=~"(Kube.*|CPUThrottlingHigh)",
            alertstate=~"firing",
            cluster=~"$cluster"
          }
            or
          GRAFANA_ALERTS{
            statefulset!="",
            alertname=~"(Kube.*|CPUThrottlingHigh)",
            alertstate=~"firing",
            cluster=~"$cluster"
          },
          "workload_type",
          "statefulset",
          "",
          ""
        ),
        "workload",
        "$1",
        "statefulset",
        "(.*)"
      )
    )
      or
    label_replace(
      label_replace(
        ALERTS{
          job_name!="",
          alertname=~"(Kube.*|CPUThrottlingHigh)",
          alertstate=~"firing",
          cluster=~"$cluster"
        }
          or
        GRAFANA_ALERTS{
          job_name!="",
          alertname=~"(Kube.*|CPUThrottlingHigh)",
          alertstate=~"firing",
          cluster=~"$cluster"
        },
        "workload_type",
        "job",
        "",
        ""
      ),
      "workload",
      "$1",
      "job_name",
      "(.*)"
    )
  )
    or
  ALERTS{
    daemonset="",
    deployment="",
    statefulset="",
    job_name="",
    alertname=~"(Kube.*|CPUThrottlingHigh)",
    alertstate=~"firing",
    cluster=~"$cluster"
  }
)
  or
GRAFANA_ALERTS{
  daemonset="",
  deployment="",
  statefulset="",
  job_name="",
  alertname=~"(Kube.*|CPUThrottlingHigh)",
  alertstate=~"firing",
  cluster=~"$cluster"
}`,
  },
  nodes: {
    info: `avg_over_time(
  (max(kube_node_info{cluster=~"$cluster",node=~".+"}) by(cluster,node))[$__range:]
)`,
    count: `count(
  group(
    kube_node_info{cluster=~"$cluster",node!=""}
  ) by(cluster,node)
)`,
    cpuUsageAvgOverTime: `avg_over_time(
  (
    sum(
      label_join(
        (
          sum(
            max(
              (
                1
                  -
                rate(
                  node_cpu_seconds_total{
                    cluster=~"$cluster",instance=~".+",mode=~"idle"
                  }[$__rate_interval]
                )
              )
                >=
              0
            ) by(cluster,instance,cpu,core)
          ) by(cluster,instance)
            or
          sum(
            rate(
              node_cpu_usage_seconds_total{cluster=~"$cluster",instance=~".+"}[$__rate_interval]
            )
              >=
            0
          ) by(cluster,instance)
        )
          or
        sum(
          label_join(
            label_join(
              k8s_node_cpu_usage{k8s_cluster_name=~"$cluster"},
              "cluster",
              ",",
              "k8s_cluster_name"
            ),
            "instance",
            ",",
            "k8s_node_name"
          )
        ) by(cluster,instance),
        "node",
        ",",
        "instance"
      )
    ) by(cluster,node)
  )[$__range:]
)`,
    cpuUsageAvgPercentOverTime: `avg_over_time(
  (
    sum(
      label_join(
        (
          sum(
            max(
              (
                1
                  -
                rate(
                  node_cpu_seconds_total{
                    cluster=~"$cluster",instance=~".+",mode=~"idle"
                  }[$__rate_interval]
                )
              )
                >=
              0
            ) by(cluster,instance,cpu,core)
          ) by(cluster,instance)
            or
          sum(
            rate(
              node_cpu_usage_seconds_total{cluster=~"$cluster",instance=~".+"}[$__rate_interval]
            )
              >=
            0
          ) by(cluster,instance)
        )
          or
        sum(
          label_join(
            label_join(
              k8s_node_cpu_usage{k8s_cluster_name=~"$cluster"},
              "cluster",
              ",",
              "k8s_cluster_name"
            ),
            "instance",
            ",",
            "k8s_node_name"
          )
        ) by(cluster,instance),
        "node",
        ",",
        "instance"
      )
    ) by(cluster,node)
      / on(cluster,node) group_left()
    (
      max(
        kube_node_status_capacity{cluster=~"$cluster",resource=~"cpu",node=~".+"}
      ) by(cluster,node,resource)
        >
      0
    )
  )[$__range:]
)`,
    cpuUsageMaxOverTime: `max_over_time(
  (
    sum(
      label_join(
        (
          sum(
            max(
              (
                1
                  -
                rate(
                  node_cpu_seconds_total{
                    cluster=~"$cluster",instance=~".+",mode=~"idle"
                  }[$__rate_interval]
                )
              )
                >=
              0
            ) by(cluster,instance,cpu,core)
          ) by(cluster,instance)
            or
          sum(
            rate(
              node_cpu_usage_seconds_total{cluster=~"$cluster",instance=~".+"}[$__rate_interval]
            )
              >=
            0
          ) by(cluster,instance)
        )
          or
        sum(
          label_join(
            label_join(
              k8s_node_cpu_usage{k8s_cluster_name=~"$cluster"},
              "cluster",
              ",",
              "k8s_cluster_name"
            ),
            "instance",
            ",",
            "k8s_node_name"
          )
        ) by(cluster,instance),
        "node",
        ",",
        "instance"
      )
    ) by(cluster,node)
  )[$__range:]
)`,
    cpuUsageMaxPercentOverTime: `max_over_time(
  (
    sum(
      label_join(
        (
          sum(
            max(
              (
                1
                  -
                rate(
                  node_cpu_seconds_total{
                    cluster=~"$cluster",instance=~".+",mode=~"idle"
                  }[$__rate_interval]
                )
              )
                >=
              0
            ) by(cluster,instance,cpu,core)
          ) by(cluster,instance)
            or
          sum(
            rate(
              node_cpu_usage_seconds_total{cluster=~"$cluster",instance=~".+"}[$__rate_interval]
            )
              >=
            0
          ) by(cluster,instance)
        )
          or
        sum(
          label_join(
            label_join(
              k8s_node_cpu_usage{k8s_cluster_name=~"$cluster"},
              "cluster",
              ",",
              "k8s_cluster_name"
            ),
            "instance",
            ",",
            "k8s_node_name"
          )
        ) by(cluster,instance),
        "node",
        ",",
        "instance"
      )
    ) by(cluster,node)
      / on(cluster,node) group_left()
    (
      max(
        kube_node_status_capacity{cluster=~"$cluster",resource=~"cpu",node=~".+"}
      ) by(cluster,node,resource)
        >
      0
    )
  )[$__range:]
)`,
    memoryUsageAvgOverTime: `avg_over_time(
  (
    sum(
      label_join(
        (
          max(
            node_memory_MemTotal_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
            - on(cluster,instance) group_left()
          max(
            node_memory_MemAvailable_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
        )
          or
        max(
          node_memory_working_set_bytes{cluster=~"$cluster",instance=~".+"}
        ) by(cluster,instance),
        "node",
        ",",
        "instance"
      )
    ) by(cluster,node)
  )[$__range:]
)`,
    memoryUsageAvgPercentOverTime: `avg_over_time(
  (
    sum(
      label_join(
        (
          max(
            node_memory_MemTotal_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
            - on(cluster,instance) group_left()
          max(
            node_memory_MemAvailable_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
        )
          or
        max(
          node_memory_working_set_bytes{cluster=~"$cluster",instance=~".+"}
        ) by(cluster,instance),
        "node",
        ",",
        "instance"
      )
    ) by(cluster,node)
      / on(cluster,node) group_left()
    (
      max(
        kube_node_status_capacity{cluster=~"$cluster",resource=~"memory",node=~".+"}
      ) by(cluster,node,resource)
        >
      0
    )
  )[$__range:]
)`,
    memoryUsageMaxOverTime: `max_over_time(
  (
    sum(
      label_join(
        (
          max(
            node_memory_MemTotal_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
            - on(cluster,instance) group_left()
          max(
            node_memory_MemAvailable_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
        )
          or
        max(
          node_memory_working_set_bytes{cluster=~"$cluster",instance=~".+"}
        ) by(cluster,instance),
        "node",
        ",",
        "instance"
      )
    ) by(cluster,node)
  )[$__range:]
)`,
    memoryUsageMaxPercentOverTime: `max_over_time(
  (
    sum(
      label_join(
        (
          max(
            node_memory_MemTotal_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
            - on(cluster,instance) group_left()
          max(
            node_memory_MemAvailable_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
        )
          or
        max(
          node_memory_working_set_bytes{cluster=~"$cluster",instance=~".+"}
        ) by(cluster,instance),
        "node",
        ",",
        "instance"
      )
    ) by(cluster,node)
      / on(cluster,node) group_left()
    (
      max(
        kube_node_status_capacity{cluster=~"$cluster",resource=~"memory",node=~".+"}
      ) by(cluster,node,resource)
        >
      0
    )
  )[$__range:]
)`,
    cpuCapacity: `max(
  kube_node_status_capacity{
    cluster=~"$cluster",
    node=~"$node(:[0-9]{2,5})?",
    resource=~"cpu"
  }
) by(cluster,node,resource)`,
    cpuLimits: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_limit{cluster=~"$cluster",node=~"$node(:[0-9]{2,5})?",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{cluster=~"$cluster",node=~"$node(:[0-9]{2,5})?",container!=""}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
)
  or
sum(
  label_join(
    label_join(
      k8s_container_cpu_limit{
        k8s_cluster_name=~"$cluster",
        k8s_node_name=~"$node"
      },
      "cluster",
      ",",
      "k8s_cluster_name"
    ),
    "node",
    ",",
    "k8s_node_name"
  )
)`,
    cpuRequests: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",node=~"$node(:[0-9]{2,5})?",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",node=~"$node(:[0-9]{2,5})?",container!=""}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
)`,
    cpuUsage: `sum(
  label_join(
    (
      sum(
        max(
          (
            1
              -
            rate(
              node_cpu_seconds_total{
                cluster=~"$cluster",
                instance=~"$node(:[0-9]{2,5})?",
                mode=~"idle"
              }[$__rate_interval]
            )
          )
            >=
          0
        ) by(cluster,instance,cpu,core)
      ) by(cluster,instance)
        or
      sum(
        rate(
          node_cpu_usage_seconds_total{
            cluster=~"$cluster",
            instance=~"$node(:[0-9]{2,5})?"
          }[$__rate_interval]
        )
          >=
        0
      ) by(cluster,instance)
    )
      or
    sum(
      label_join(
        label_join(
          k8s_node_cpu_usage{
            k8s_cluster_name=~"$cluster",
            k8s_node_name=~"$node"
          },
          "cluster",
          ",",
          "k8s_cluster_name"
        ),
        "instance",
        ",",
        "k8s_node_name"
      )
    ) by(cluster,instance),
    "node",
    ",",
    "instance"
  )
    or
  label_join(
    (
      sum(
        max(
          (
            1
              -
            rate(
              node_cpu_seconds_total{
                cluster=~"$cluster",
                node=~"$node(:[0-9]{2,5})?",
                mode=~"idle"
              }[$__rate_interval]
            )
          )
            >=
          0
        ) by(cluster,instance,cpu,core)
      ) by(cluster,instance)
        or
      sum(
        rate(
          node_cpu_usage_seconds_total{
            cluster=~"$cluster",
            node=~"$node(:[0-9]{2,5})?"
          }[$__rate_interval]
        )
          >=
        0
      ) by(cluster,instance)
    )
      or
    sum(
      label_join(
        label_join(
          k8s_node_cpu_usage{
            k8s_cluster_name=~"$cluster",
            k8s_node_name=~"$node(:[0-9]{2,5})?"
          },
          "cluster",
          ",",
          "k8s_cluster_name"
        ),
        "instance",
        ",",
        "k8s_node_name"
      )
    ) by(cluster,instance),
    "node",
    ",",
    "instance"
  )
)`,
    memoryCapacity: `max(
  kube_node_status_capacity{
    cluster=~"$cluster",
    node=~"$node(:[0-9]{2,5})?",
    resource=~"memory"
  }
) by(cluster,node,resource)`,
    memoryLimits: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_limit{cluster=~"$cluster",node=~"$node(:[0-9]{2,5})?",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{cluster=~"$cluster",node=~"$node(:[0-9]{2,5})?",container!=""}
        )
      )
    ),
    "resource", "memory", "", ""
  )
)`,
    memoryRequests: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",node=~"$node(:[0-9]{2,5})?",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",node=~"$node(:[0-9]{2,5})?",container!=""}
        )
      )
    ),
    "resource", "memory", "", ""
  )
)`,
    memoryUsage: `label_join(
  (
    max(
      node_memory_MemTotal_bytes{
        cluster=~"$cluster",
        instance=~"$node"
      }
    ) by(cluster,instance)
      - on(cluster,instance) group_left()
    max(
      node_memory_MemAvailable_bytes{
        cluster=~"$cluster",
        instance=~"$node"
      }
    ) by(cluster,instance)
  )
    or
  max(
    node_memory_working_set_bytes{
      cluster=~"$cluster",
      instance=~"$node"
    }
  ) by(cluster,instance),
  "node",
  ",",
  "instance"
)`,
    cpuDistribution: `(
  sum(
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
        cluster=~"$cluster",
        node=~"$node",
        pod=~"$pod"
      }
    ) by(cluster,namespace,pod,container,node)
  ) by(cluster,namespace,pod,node)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
)
  / on(cluster,node) group_left()
sum(
  max(
    kube_node_status_capacity{
      cluster=~"$cluster",
      resource=~"cpu",
      node=~"$node"
    }
  ) by(cluster,node)
) by(cluster,node)`,
    cpuEfficiency: `sum(
  max(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
      cluster=~"$cluster",
      node=~"$node",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,container,node)
) by(cluster,namespace,pod,node)
  /
sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",pod=~"$pod",node=~"$node"}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
) by(cluster,namespace,pod,node)`,
    memoryDistribution: `(
  sum(
    max(
      node_namespace_pod_container:container_memory_working_set_bytes{
        cluster=~"$cluster",
        node=~"$node",
        pod=~"$pod"
      }
    ) by(cluster,namespace,pod,container,node)
  ) by(cluster,namespace,pod,node)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
)
  / on(cluster,node) group_left()
sum(
  max(
    kube_node_status_capacity{
      cluster=~"$cluster",
      resource=~"memory",
      node=~"$node"
    }
  ) by(cluster,node)
) by(cluster,node)`,
    memoryEfficiency: `sum(
  max(
    node_namespace_pod_container:container_memory_working_set_bytes{
      cluster=~"$cluster",
      node=~"$node",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,container,node)
) by(cluster,namespace,pod,node)
  /
sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",pod=~"$pod",node=~"$node"}
        )
      )
    ),
    "resource", "memory", "", ""
  )
) by(cluster,namespace,pod,node)`,
    networkBandwidthRx: `sum(
  max(
    rate(
      windows_net_bytes_received_total{
        cluster=~"$cluster",
        instance=~"$node(:[0-9]{2,5})?"
      }[$__rate_interval]
    )
      or
    rate(
      node_network_receive_bytes_total{
        cluster=~"$cluster",
        instance=~"$node(:[0-9]{2,5})?"
      }[$__rate_interval]
    )
  ) by(cluster,instance,device,nic)
)`,
    networkBandwidthTx: `-sum(
  max(
    rate(
      windows_net_bytes_sent_total{
        cluster=~"$cluster",
        instance=~"$node(:[0-9]{2,5})?"
      }[$__rate_interval]
    )
      or
    rate(
      node_network_transmit_bytes_total{
        cluster=~"$cluster",
        instance=~"$node(:[0-9]{2,5})?"
      }[$__rate_interval]
    )
  ) by(cluster,instance,device,nic)
)`,
    networkSaturationRx: `sum(
  max(
    rate(
      node_network_receive_drop_total{
        cluster=~"$cluster",
        instance=~"$node(:[0-9]{2,5})?"
      }[$__rate_interval]
    )
      or
    sum(
      rate(
        windows_container_network_receive_packets_dropped_total{
          cluster=~"$cluster",
          instance=~"$node"
        }[$__rate_interval]
      )
    ) by(cluster,instance,interface)
  ) by(cluster,instance,device,interface)
)`,
    networkSaturationTx: `-sum(
  max(
    rate(
      node_network_transmit_drop_total{
        cluster=~"$cluster",
        instance=~"$node(:[0-9]{2,5})?"
      }[$__rate_interval]
    )
      or
    sum(
      rate(
        windows_container_network_transmit_packets_dropped_total{
          cluster=~"$cluster",
          instance=~"$node"
        }[$__rate_interval]
      )
    ) by(cluster,instance,interface)
  ) by(cluster,instance,device,interface)
)`,
    networkBandwidthByPodRx: `sum(
  max(
    rate(
      container_network_receive_bytes_total{cluster=~"$cluster",pod=~"$pod"}[$__rate_interval]
    )
      or
    (
      rate(
        windows_container_network_receive_bytes_total{
          cluster=~"$cluster",instance=~"$node"
        }[$__rate_interval]
      )
        * on(container_id) group_left(pod,namespace)
      kube_pod_container_info{cluster=~"$cluster",node=~"$node",pod=~"$pod"}
    )
  ) by(cluster,namespace,pod,interface)
) by(cluster,namespace,pod)`,
    networkBandwidthByPodTx: `-sum(
  max(
    rate(
      container_network_transmit_bytes_total{cluster=~"$cluster",pod=~"$pod"}[$__rate_interval]
    )
      or
    (
      rate(
        windows_container_network_transmit_bytes_total{
          cluster=~"$cluster",instance=~"$node"
        }[$__rate_interval]
      )
        * on(container_id) group_left(pod,namespace)
      kube_pod_container_info{cluster=~"$cluster",node=~"$node",pod=~"$pod"}
    )
  ) by(cluster,namespace,pod,interface)
) by(cluster,namespace,pod)`,
    networkSaturationByPodRx: `sum(
  max(
    rate(
      container_network_receive_packets_dropped_total{
        cluster=~"$cluster",pod=~"$pod"
      }[$__rate_interval]
    )
      or
    (
      rate(
        windows_container_network_receive_packets_dropped_total{
          cluster=~"$cluster",instance=~"$node"
        }[$__rate_interval]
      )
        * on(container_id) group_left(pod,namespace)
      kube_pod_container_info{cluster=~"$cluster",instance=~"$node",pod=~"$pod"}
    )
  ) by(cluster,namespace,pod,interface)
) by(cluster,namespace,pod)`,
    networkSaturationByPodTx: `-sum(
  max(
    rate(
      container_network_transmit_packets_dropped_total{
        cluster=~"$cluster",pod=~"$pod"
      }[$__rate_interval]
    )
      or
    (
      rate(
        windows_container_network_transmit_packets_dropped_total{
          cluster=~"$cluster",instance=~"$node"
        }[$__rate_interval]
      )
        * on(container_id) group_left(pod,namespace)
      kube_pod_container_info{cluster=~"$cluster",instance=~"$node",pod=~"$pod"}
    )
  ) by(cluster,namespace,pod,interface)
) by(cluster,namespace,pod)`,
    throughputRead: `sum(
  rate(
    container_fs_reads_bytes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node"
    }[$__rate_interval]
  )
) by(node)`,
    throughputWrite: `-sum(
  rate(
    container_fs_writes_bytes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node"
    }[$__rate_interval]
  )
) by(node)`,
    iopsRead: `sum(
  rate(
    container_fs_reads_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node"
    }[$__rate_interval]
  )
) by(node)`,
    iopsWrite: `-sum(
  rate(
    container_fs_writes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node"
    }[$__rate_interval]
  )
) by(node)`,
    costsCPUAllocation: `sum_over_time(
  (
    max(
      max(
        kube_node_status_capacity{
          cluster=~"$cluster",
          node=~"$node(:[0-9]{2,5})?",
          resource=~"cpu"
        }
      ) by(cluster,node,resource)
    ) by(cluster,node)
      *
    sum(
      max(
        node_cpu_hourly_cost{
          cluster=~"$cluster",
          node=~"$node(:[0-9]{2,5})?"
        }
      ) by(cluster,node)
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsMemoryAllocation: `sum_over_time(
  (
    (
      (
        (
          max(
            max(
              kube_node_status_capacity{
                cluster=~"$cluster",
                node=~"$node(:[0-9]{2,5})?",
                resource=~"memory"
              }
            ) by(cluster,node,resource)
          ) by(cluster,node)
            /
          1024
        )
          /
        1024
      )
        /
      1024
    )
      *
    sum(
      node_ram_hourly_cost{
        cluster=~"$cluster",
        node=~"$node(:[0-9]{2,5})?"
      }
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsCPUIdle: `sum_over_time(
  sum by(cluster,node)(
    (
      sum by(cluster,node)(
        label_replace(
          sum by(cluster,instance)(
            max by(cluster,instance,cpu,core)(
              rate(
                node_cpu_seconds_total{
                  cluster=~"$cluster",
                  instance=~"$node(:[0-9]{2,5})?",
                  mode=~"idle"
                }[$__rate_interval]
              )
                or
              rate(
                node_cpu_seconds_total{
                  cluster=~"$cluster",
                  node=~"$node(:[0-9]{2,5})?",
                  mode=~"idle"
                }[$__rate_interval]
              )
            )
          ),
          "node",
          "$1",
          "instance",
          "([^:]+).*"
        )
      )
        or on(cluster,node)
      (
        max by(cluster,node)(
          kube_node_status_capacity{
            cluster=~"$cluster",
            node=~"$node(:[0-9]{2,5})?",
            resource="cpu"
          }
        )
          - on(cluster,node)
        sum by(cluster,node)(
          label_replace(
            (
              sum by(cluster,instance)(
                (
                  rate(
                    node_cpu_usage_seconds_total{
                      cluster=~"$cluster",
                      instance=~"$node(:[0-9]{2,5})?"
                    }[$__rate_interval]
                  )
                    or
                  rate(
                    node_cpu_usage_seconds_total{
                      cluster=~"$cluster",
                      node=~"$node(:[0-9]{2,5})?"
                    }[$__rate_interval]
                  )
                ) >= 0
              )
                or
              sum by(cluster,instance)(
                label_join(
                  label_join(
                    rate(
                      k8s_node_cpu_time_seconds_total{
                        k8s_cluster_name=~"$cluster",
                        k8s_node_name=~"$node"
                      }[$__rate_interval]
                    ),
                    "cluster",
                    ",",
                    "k8s_cluster_name"
                  ),
                  "instance",
                  ",",
                  "k8s_node_name"
                )
              )
            ),
            "node",
            "$1",
            "instance",
            "([^:]+).*"
          )
        )
      )
    )
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{
        cluster=~"$cluster",
        node=~"$node(:[0-9]{2,5})?"
      }
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsMemoryIdle: `sum_over_time(
  sum by(cluster,node)(
    (
      (
        (
          max(
            label_replace(
              windows_memory_available_bytes{
                cluster=~"$cluster",
                instance=~"$node(:[0-9]{2,5})?"
              }
                or
              node_memory_MemAvailable_bytes{
                cluster=~"$cluster",
                instance=~"$node(:[0-9]{2,5})?"
              },
              "node",
              "$1",
              "instance",
              "([^:]+).*"
            )
          ) by(cluster,node)
            /
          1024
        )
          /
        1024
      )
        /
      1024
    )
      * on(cluster,node) group_left()
    max(
      node_ram_hourly_cost{
        cluster=~"$cluster",
        node=~"$node(:[0-9]{2,5})?"
      }
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsCPUAllocationRate: `(
  max(
    max(
      kube_node_status_capacity{
        cluster=~"$cluster",
        node=~"$node(:[0-9]{2,5})?",
        resource=~"cpu"
      }
    ) by(cluster,node,resource)
  ) by(cluster,node)
    *
  sum(
    max(
      node_cpu_hourly_cost{
        cluster=~"$cluster",
        node=~"$node(:[0-9]{2,5})?"
      }
    ) by(cluster,node)
  ) by(cluster,node)
)`,
    costsMemoryAllocationRate: `(
  (
    (
      (
        max(
          max(
            kube_node_status_capacity{
              cluster=~"$cluster",
              node=~"$node(:[0-9]{2,5})?",
              resource=~"memory"
            }
          ) by(cluster,node,resource)
        ) by(cluster,node)
          /
        1024
      )
        /
      1024
    )
      /
    1024
  )
    *
  sum(
    node_ram_hourly_cost{
      cluster=~"$cluster",
      node=~"$node(:[0-9]{2,5})?"
    }
  ) by(cluster,node)
)`,
    costsCPUIdleRate: `sum by(cluster,node)(
  (
    sum by(cluster,node)(
      label_replace(
        sum by(cluster,instance)(
          max by(cluster,instance,cpu,core)(
            rate(
              node_cpu_seconds_total{
                cluster=~"$cluster",
                instance=~"$node(:[0-9]{2,5})?",
                mode=~"idle"
              }[$__rate_interval]
            )
              or
            rate(
              node_cpu_seconds_total{
                cluster=~"$cluster",
                node=~"$node(:[0-9]{2,5})?",
                mode=~"idle"
              }[$__rate_interval]
            )
          )
        ),
        "node",
        "$1",
        "instance",
        "([^:]+).*"
      )
    )
      or on(cluster,node)
    (
      max by(cluster,node)(
        kube_node_status_capacity{
          cluster=~"$cluster",
          node=~"$node(:[0-9]{2,5})?",
          resource="cpu"
        }
      )
        - on(cluster,node)
      sum by(cluster,node)(
        label_replace(
          (
            sum by(cluster,instance)(
              (
                rate(
                  node_cpu_usage_seconds_total{
                    cluster=~"$cluster",
                    instance=~"$node(:[0-9]{2,5})?"
                  }[$__rate_interval]
                )
                  or
                rate(
                  node_cpu_usage_seconds_total{
                    cluster=~"$cluster",
                    node=~"$node(:[0-9]{2,5})?"
                  }[$__rate_interval]
                )
              ) >= 0
            )
              or
            sum by(cluster,instance)(
              label_join(
                label_join(
                  rate(
                    k8s_node_cpu_time_seconds_total{
                      k8s_cluster_name=~"$cluster",
                      k8s_node_name=~"$node"
                    }[$__rate_interval]
                  ),
                  "cluster",
                  ",",
                  "k8s_cluster_name"
                ),
                "instance",
                ",",
                "k8s_node_name"
              )
            )
          ),
          "node",
          "$1",
          "instance",
          "([^:]+).*"
        )
      )
    )
  )
    * on(cluster,node) group_left()
  max(
    node_cpu_hourly_cost{
      cluster=~"$cluster",
      node=~"$node(:[0-9]{2,5})?"
    }
  ) by(cluster,node)
)`,
    costsMemoryIdleRate: `sum by(cluster,node)(
  (
    (
      (
        max(
          label_replace(
            windows_memory_available_bytes{
              cluster=~"$cluster",
              instance=~"$node(:[0-9]{2,5})?"
            }
              or
            node_memory_MemAvailable_bytes{
              cluster=~"$cluster",
              instance=~"$node(:[0-9]{2,5})?"
            },
            "node",
            "$1",
            "instance",
            "([^:]+).*"
          )
        ) by(cluster,node)
          /
        1024
      )
        /
      1024
    )
      /
    1024
  )
    * on(cluster,node) group_left()
  max(
    node_ram_hourly_cost{
      cluster=~"$cluster",
      node=~"$node(:[0-9]{2,5})?"
    }
  ) by(cluster,node)
)`,
  },
  namespaces: {
    labelsByCluster: `label_values(kube_namespace_status_phase{cluster=~"$cluster"}, namespace)`,
    count: `count(
  group(
    kube_namespace_status_phase{cluster=~"$cluster",namespace=~"$namespace"}
  ) by(cluster,namespace)
)`,
    info: `sum(
  topk(
    1,
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace"
      }
    ) by(cluster,namespace,workload)
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace)
  or on(cluster,namespace)
(
  last_over_time(
    (
      group(
        kube_namespace_status_phase{
          cluster=~"$cluster",namespace=~"$namespace",phase="Active"
        }
          ==
        1
      ) by(cluster,namespace)
    )[$__range:]
  )
    -
  1
)`,
    cpuUsageAvgOverTime: `avg_over_time(
  (
    sum(
      max(
        node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="POD",
          container!=""
        }
      ) by(cluster,namespace,pod,container)
    ) by(cluster,namespace)
  )[$__range:$__interval]
)`,
    cpuUsageAvgPercentOverTime: `avg_over_time(
  (
    sum(
      max(
        node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="POD",
          container!=""
        }
      ) by(cluster,namespace,pod,container)
    ) by(cluster,namespace)
      / on(cluster,namespace) group_left()
    (
      sum(
        label_replace(
          (
            (max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
              )
              and on(cluster,namespace,pod)
              max by(cluster,namespace,pod)(
                kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
              )
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace"}
              )
            )
          ),
          "resource", "cpu", "", ""
        )
      ) by(cluster,namespace)
        >
      0
    )
  )[$__range:$__interval]
)`,
    cpuUsageMaxOverTime: `max_over_time(
  (
    sum(
      max(
        node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="POD",
          container!=""
        }
      ) by(cluster,namespace,pod,container)
    ) by(cluster,namespace)
  )[$__range:$__interval]
)`,
    cpuUsageMaxPercentOverTime: `max_over_time(
  (
    sum(
      max(
        node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="POD",
          container!=""
        }
      ) by(cluster,namespace,pod,container)
    ) by(cluster,namespace)
      / on(cluster,namespace) group_left()
    (
      sum(
        label_replace(
          (
            (max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
              )
              and on(cluster,namespace,pod)
              max by(cluster,namespace,pod)(
                kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
              )
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace"}
              )
            )
          ),
          "resource", "cpu", "", ""
        )
      ) by(cluster,namespace)
        >
      0
    )
  )[$__range:$__interval]
)`,
    memoryUsageAvgOverTime: `avg_over_time(
  (
    sum(
      max(
        node_namespace_pod_container:container_memory_working_set_bytes{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="POD",
          container!=""
        }
      ) by(cluster,namespace,pod,container)
    ) by(cluster,namespace)
  )[$__range:$__interval]
)`,
    memoryUsageAvgPercentOverTime: `avg_over_time(
  (
    sum(
      max(
        node_namespace_pod_container:container_memory_working_set_bytes{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="POD",
          container!=""
        }
      ) by(cluster,namespace,pod,container)
    ) by(cluster,namespace)
      / on(cluster,namespace) group_left()
    (
      sum(
        label_replace(
          (
            (max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
              )
              and on(cluster,namespace,pod)
              max by(cluster,namespace,pod)(
                kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
              )
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace"}
              )
            )
          ),
          "resource", "memory", "", ""
        )
      ) by(cluster,namespace)
        >
      0
    )
  )[$__range:$__interval]
)`,
    memoryUsageMaxOverTime: `max_over_time(
  (
    sum(
      max(
        node_namespace_pod_container:container_memory_working_set_bytes{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="POD",
          container!=""
        }
      ) by(cluster,namespace,pod,container)
    ) by(cluster,namespace)
  )[$__range:$__interval]
)`,
    memoryUsageMaxPercentOverTime: `max_over_time(
  (
    sum(
      max(
        node_namespace_pod_container:container_memory_working_set_bytes{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="POD",
          container!=""
        }
      ) by(cluster,namespace,pod,container)
    ) by(cluster,namespace)
      / on(cluster,namespace) group_left()
    (
      sum(
        label_replace(
          (
            (max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
              )
              and on(cluster,namespace,pod)
              max by(cluster,namespace,pod)(
                kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
              )
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace"}
              )
            )
          ),
          "resource", "memory", "", ""
        )
      ) by(cluster,namespace)
        >
      0
    )
  )[$__range:$__interval]
)`,
    cpuAllocation: `max(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace="$namespace",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace="$namespace",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace="$namespace"}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
  ) by(cluster,namespace,resource)
    or
  sum(
    max(
      rate(
        container_cpu_usage_seconds_total{
          cluster=~"$cluster",
          namespace="$namespace",
          container!="POD",
          container!=""
        }[$__rate_interval]
      )
    ) by(namespace,pod,container)
  ) by(namespace)
) by(namespace)`,
    cpuLimits: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace"}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
) by(cluster,namespace)
  or
sum(
  label_join(
    label_join(
      k8s_container_cpu_limit{
        k8s_cluster_name=~"$cluster",
        k8s_namespace_name=~"$namespace"
      },
      "cluster",
      ",",
      "k8s_cluster_name"
    ),
    "namespace",
    ",",
    "k8s_namespace_name"
  )
)`,
    cpuRequests: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace"}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
) by(cluster,namespace)`,
    cpuUsage: `sum(
  max(
    rate(
      container_cpu_usage_seconds_total{
        cluster=~"$cluster",
        namespace="$namespace",
        container!="POD",
        container!=""
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,container)
)`,
    memoryAllocation: `max(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace="$namespace",resource="memory",unit="bytes"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace="$namespace",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace="$namespace"}
          )
        )
      ),
      "resource", "memory", "", ""
    )
  ) by(cluster,namespace,resource)
    or
  sum(
    max(
      container_memory_working_set_bytes{
        cluster=~"$cluster",
        namespace="$namespace",
        container!="POD",
        container!=""
      }
    ) by(namespace,pod,container)
  ) by(namespace)
) by(namespace)`,
    memoryLimits: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace"}
        )
      )
    ),
    "resource", "memory", "", ""
  )
) by(cluster,namespace)`,
    memoryRequests: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace"}
        )
      )
    ),
    "resource", "memory", "", ""
  )
) by(cluster,namespace)`,
    memoryUsage: `sum(
  max(
    container_memory_working_set_bytes{
      cluster=~"$cluster",
      namespace="$namespace",
      container!="POD",
      container!=""
    }
  ) by(cluster,namespace,pod,container)
)`,
    podsCount: `count(
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      workload=~"$workload",
      workload_type=~"$workloadtype"
    }
  ) by(cluster,namespace,workload,workload_type,pod)
) by(cluster,namespace,workload,workload_type)`,
    images: `count(
  count(
    kube_pod_container_info{
      cluster=~"$cluster",namespace="$namespace",pod=~"$pod"
    }
  ) by(cluster,namespace,pod,image_spec)
    and on(cluster,namespace,pod)
  namespace_workload_pod:kube_pod_owner:relabel{
    pod=~"$pod",cluster=~"$cluster",namespace="$namespace",workload=~"$workload"
  }
) by(image_spec)`,
    networkBandwidthRx: `sum(
  max(
    rate(
      container_network_receive_bytes_total{
        cluster=~"$cluster",namespace="$namespace"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
)`,
    networkBandwidthTx: `-sum(
  max(
    rate(
      container_network_transmit_bytes_total{
        cluster=~"$cluster",namespace="$namespace"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
)`,
    networkSaturationRx: `sum(
  max(
    rate(
      container_network_receive_packets_dropped_total{
        cluster=~"$cluster",
        namespace="$namespace",
        pod!=""
      }[$__rate_interval]
    )
  ) by(namespace,pod,interface)
)`,
    networkSaturationTx: `-sum(
  max(
    rate(
      container_network_transmit_packets_dropped_total{
        cluster=~"$cluster",
        namespace="$namespace",
        pod!=""
      }[$__rate_interval]
    )
  ) by(namespace,pod,interface)
)`,
    networkBandwidthByWorkloadRx: `sum(
  max(
    rate(
      container_network_receive_bytes_total{
        cluster=~"$cluster",namespace="$namespace"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  topk(
    1,
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace"
      }
    ) by(cluster,namespace,workload,workload_type,pod)
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    networkBandwidthByWorkloadTx: `-sum(
  max(
    rate(
      container_network_transmit_bytes_total{
        cluster=~"$cluster",namespace="$namespace"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  topk(
    1,
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace"
      }
    ) by(cluster,namespace,workload,workload_type,pod)
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    networkSaturationByWorkloadRx: `sum(
  max(
    rate(
      container_network_receive_packets_dropped_total{
        cluster=~"$cluster",namespace="$namespace"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  topk(
    1,
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace"
      }
    ) by(cluster,namespace,workload,workload_type,pod)
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    networkSaturationByWorkloadTx: `-sum(
  max(
    rate(
      container_network_transmit_packets_dropped_total{
        cluster=~"$cluster",namespace="$namespace"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  topk(
    1,
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace"
      }
    ) by(cluster,namespace,workload,workload_type,pod)
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    throughputRead: `sum(
  rate(
    container_fs_reads_bytes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      namespace=~"$namespace"
    }[$__rate_interval]
  )
) by(namespace)`,
    throughputWrite: `-sum(
  rate(
    container_fs_writes_bytes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      namespace=~"$namespace"
    }[$__rate_interval]
  )
) by(namespace)`,
    iopsRead: `sum(
  rate(
    container_fs_reads_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      namespace=~"$namespace"
    }[$__rate_interval]
  )
) by(namespace)`,
    iopsWrite: `-sum(
  rate(
    container_fs_writes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      namespace=~"$namespace"
    }[$__rate_interval]
  )
) by(namespace)`,
    costsCPUAllocation: `sum_over_time(
  sum by (namespace)(
    max(
      sum(
        (label_replace(
            (
              max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
              )
              or on(cluster,namespace,pod,node)
              sum by(cluster,namespace,pod,node)(
                max by(cluster,namespace,pod,node,container)(
                  kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!="",resource="cpu"}
                )
              )
            ),
            "resource", "cpu", "", ""
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
          )
        )
      ) by(cluster,namespace,node,resource)
        or
      sum(
        max(
          rate(
            container_cpu_usage_seconds_total{
              cluster=~"$cluster",
              namespace=~"$namespace",
              node!="",
              container!="POD",
              container!=""
            }[$__rate_interval]
          )
            or
          (
            rate(
              container_cpu_usage_seconds_total{
                cluster=~"$cluster",
                namespace=~"$namespace",
                node="",
                container!="POD",
                container!=""
              }[$__rate_interval]
            )
              * on(cluster,namespace,pod) group_left(node)
            topk by(cluster,namespace,pod)(
              1,
              group by(cluster,namespace,pod,node)(
                kube_pod_info{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  node!=""
                }
              )
            )
          )
        ) by(cluster,namespace,node,pod,container)
      ) by(cluster,namespace,node)
    ) by(cluster,namespace,node)
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsMemoryAllocation: `sum_over_time(
  sum by (namespace)(
    (
      (
        (
          max(
            sum(
              (label_replace(
                  (
                    max by(cluster,namespace,pod,node)(
                      kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
                    )
                    or on(cluster,namespace,pod,node)
                    sum by(cluster,namespace,pod,node)(
                      max by(cluster,namespace,pod,node,container)(
                        kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!="",resource="memory"}
                      )
                    )
                  ),
                  "resource", "memory", "", ""
                )
                and on(cluster,namespace,pod)
                max by(cluster,namespace,pod)(
                  kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
                )
              )
            ) by(cluster,node,namespace,resource)
              or
            sum(
              max(
                container_memory_working_set_bytes{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  node!="",
                  container!="POD",
                  container!=""
                }
                  or
                (
                  container_memory_working_set_bytes{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node="",
                    container!="POD",
                    container!=""
                  }
                    * on(cluster,namespace,pod) group_left(node)
                  topk by(cluster,namespace,pod)(
                    1,
                    group by(cluster,namespace,pod,node)(
                      kube_pod_info{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        node!=""
                      }
                    )
                  )
                )
              ) by(cluster,namespace,node,pod,container)
            ) by(cluster,node,namespace)
          ) by(cluster,node,namespace)
            /
          1024
        )
          /
        1024
      )
        /
      1024
    )
      * on(cluster,node) group_left()
    max(
      node_ram_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsCPUIdle: `sum_over_time(
  sum by (namespace)(
    (
      sum(
        (label_replace(
            (
              max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
              )
              or on(cluster,namespace,pod,node)
              sum by(cluster,namespace,pod,node)(
                max by(cluster,namespace,pod,node,container)(
                  kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!="",resource="cpu"}
                )
              )
            ),
            "resource", "cpu", "", ""
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
          )
        )
      ) by(cluster,namespace,node,resource)
        - on(cluster,namespace,node) group_left()
      sum(
        max(
          rate(
            container_cpu_usage_seconds_total{
              cluster=~"$cluster",
              namespace=~"$namespace",
              node!="",
              container!="POD",
              container!=""
            }[$__rate_interval]
          )
            or
          (
            rate(
              container_cpu_usage_seconds_total{
                cluster=~"$cluster",
                namespace=~"$namespace",
                node="",
                container!="POD",
                container!=""
              }[$__rate_interval]
            )
              * on(cluster,namespace,pod) group_left(node)
            topk by(cluster,namespace,pod)(
              1,
              group by(cluster,namespace,pod,node)(
                kube_pod_info{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  node!=""
                }
              )
            )
          )
        ) by(cluster,namespace,node,pod,container)
      ) by(cluster,namespace,node)
    )
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsMemoryIdle: `sum_over_time(
  sum by (namespace)(
    (
      (
        (
          (
            sum(
              (label_replace(
                  (
                    max by(cluster,namespace,pod,node)(
                      kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
                    )
                    or on(cluster,namespace,pod,node)
                    sum by(cluster,namespace,pod,node)(
                      max by(cluster,namespace,pod,node,container)(
                        kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!="",resource="memory"}
                      )
                    )
                  ),
                  "resource", "memory", "", ""
                )
                and on(cluster,namespace,pod)
                max by(cluster,namespace,pod)(
                  kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
                )
              )
            ) by(cluster,namespace,node)
              - on(cluster,namespace,node) group_left()
            sum(
              max(
                container_memory_working_set_bytes{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  node!="",
                  container!="POD",
                  container!=""
                }
                  or
                (
                  container_memory_working_set_bytes{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node="",
                    container!="POD",
                    container!=""
                  }
                    * on(cluster,namespace,pod) group_left(node)
                  topk by(cluster,namespace,pod)(
                    1,
                    group by(cluster,namespace,pod,node)(
                      kube_pod_info{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        node!=""
                      }
                    )
                  )
                )
              ) by(cluster,namespace,node,pod,container)
            ) by(cluster,namespace,node)
          )
            /
          1024
        )
          /
        1024
      )
        /
      1024
    )
      * on(cluster,node) group_left()
    max(
      node_ram_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsCPUAllocationRate: `sum by (namespace)(
  max(
    sum(
      (label_replace(
          (
            max by(cluster,namespace,pod,node)(
              kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!="",resource="cpu"}
              )
            )
          ),
          "resource", "cpu", "", ""
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
        )
      )
    ) by(cluster,namespace,node,resource)
      or
    sum(
      max(
        rate(
          container_cpu_usage_seconds_total{
            cluster=~"$cluster",
            namespace=~"$namespace",
            node!="",
            container!="POD",
            container!=""
          }[$__rate_interval]
        )
          or
        (
          rate(
            container_cpu_usage_seconds_total{
              cluster=~"$cluster",
              namespace=~"$namespace",
              node="",
              container!="POD",
              container!=""
            }[$__rate_interval]
          )
            * on(cluster,namespace,pod) group_left(node)
          topk by(cluster,namespace,pod)(
            1,
            group by(cluster,namespace,pod,node)(
              kube_pod_info{
                cluster=~"$cluster",
                namespace=~"$namespace",
                node!=""
              }
            )
          )
        )
      ) by(cluster,namespace,node,pod,container)
    ) by(cluster,namespace,node)
  ) by(cluster,namespace,node)
    * on(cluster,node) group_left()
  max(
    node_cpu_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
    costsMemoryAllocationRate: `sum by (namespace)(
  (
    (
      (
        max(
          sum(
            (label_replace(
                (
                  max by(cluster,namespace,pod,node)(
                    kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
                  )
                  or on(cluster,namespace,pod,node)
                  sum by(cluster,namespace,pod,node)(
                    max by(cluster,namespace,pod,node,container)(
                      kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!="",resource="memory"}
                    )
                  )
                ),
                "resource", "memory", "", ""
              )
              and on(cluster,namespace,pod)
              max by(cluster,namespace,pod)(
                kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
              )
            )
          ) by(cluster,node,namespace,resource)
            or
          sum(
            max(
              container_memory_working_set_bytes{
                cluster=~"$cluster",
                namespace=~"$namespace",
                node!="",
                container!="POD",
                container!=""
              }
                or
              (
                container_memory_working_set_bytes{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  node="",
                  container!="POD",
                  container!=""
                }
                  * on(cluster,namespace,pod) group_left(node)
                topk by(cluster,namespace,pod)(
                  1,
                  group by(cluster,namespace,pod,node)(
                    kube_pod_info{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      node!=""
                    }
                  )
                )
              )
            ) by(cluster,namespace,node,pod,container)
          ) by(cluster,node,namespace)
        ) by(cluster,node,namespace)
          /
        1024
      )
        /
      1024
    )
      /
    1024
  )
    * on(cluster,node) group_left()
  max(
    node_ram_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
    costsCPUIdleRate: `sum by (namespace)(
  (
    sum(
      (label_replace(
          (
            max by(cluster,namespace,pod,node)(
              kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!="",resource="cpu"}
              )
            )
          ),
          "resource", "cpu", "", ""
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
        )
      )
    ) by(cluster,namespace,node,resource)
      - on(cluster,namespace,node) group_left()
    sum(
      max(
        rate(
          container_cpu_usage_seconds_total{
            cluster=~"$cluster",
            namespace=~"$namespace",
            node!="",
            container!="POD",
            container!=""
          }[$__rate_interval]
        )
          or
        (
          rate(
            container_cpu_usage_seconds_total{
              cluster=~"$cluster",
              namespace=~"$namespace",
              node="",
              container!="POD",
              container!=""
            }[$__rate_interval]
          )
            * on(cluster,namespace,pod) group_left(node)
          topk by(cluster,namespace,pod)(
            1,
            group by(cluster,namespace,pod,node)(
              kube_pod_info{
                cluster=~"$cluster",
                namespace=~"$namespace",
                node!=""
              }
            )
          )
        )
      ) by(cluster,namespace,node,pod,container)
    ) by(cluster,namespace,node)
  )
    * on(cluster,node) group_left()
  max(
    node_cpu_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
    costsMemoryIdleRate: `sum by (namespace)(
  (
    (
      (
        (
          sum(
            (label_replace(
                (
                  max by(cluster,namespace,pod,node)(
                    kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
                  )
                  or on(cluster,namespace,pod,node)
                  sum by(cluster,namespace,pod,node)(
                    max by(cluster,namespace,pod,node,container)(
                      kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!="",resource="memory"}
                    )
                  )
                ),
                "resource", "memory", "", ""
              )
              and on(cluster,namespace,pod)
              max by(cluster,namespace,pod)(
                kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
              )
            )
          ) by(cluster,namespace,node)
            - on(cluster,namespace,node) group_left()
          sum(
            max(
              container_memory_working_set_bytes{
                cluster=~"$cluster",
                namespace=~"$namespace",
                node!="",
                container!="POD",
                container!=""
              }
                or
              (
                container_memory_working_set_bytes{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  node="",
                  container!="POD",
                  container!=""
                }
                  * on(cluster,namespace,pod) group_left(node)
                topk by(cluster,namespace,pod)(
                  1,
                  group by(cluster,namespace,pod,node)(
                    kube_pod_info{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      node!=""
                    }
                  )
                )
              )
            ) by(cluster,namespace,node,pod,container)
          ) by(cluster,namespace,node)
        )
          /
        1024
      )
        /
      1024
    )
      /
    1024
  )
    * on(cluster,node) group_left()
  max(
    node_ram_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
  },
  workloads: {
    labelsByClusterNamespace: `query_result(
  max(
    (
      (
        (
          (
            (
              max(
                last_over_time(
                  kube_replicaset_spec_replicas{
                    cluster=~"$cluster",namespace=~"$namespace",replicaset=~".+"
                  }[$__range:]
                )
              ) by(cluster,namespace,replicaset)
                * on(cluster,namespace,replicaset) group_left(workload,workload_type)
              label_replace(
                label_replace(
                  max(
                    last_over_time(
                      kube_replicaset_owner{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        replicaset=~".+",
                        owner_kind=""
                      }[$__range:]
                    )
                  ) by(cluster,namespace,replicaset),
                  "workload",
                  "$1",
                  "replicaset",
                  "(.+)"
                ),
                "workload_type",
                "replicaset",
                "",
                ""
              )
            )
              or
            (
              max(
                last_over_time(
                  kube_replicaset_spec_replicas{
                    cluster=~"$cluster",namespace=~"$namespace",replicaset=~".+"
                  }[$__range:]
                )
              ) by(cluster,namespace,replicaset)
                * on(cluster,namespace,replicaset) group_left(workload,workload_type)
              label_replace(
                label_replace(
                  max(
                    last_over_time(
                      kube_replicaset_owner{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        replicaset=~".+",
                        owner_is_controller="true",
                        owner_kind="Deployment",
                        owner_name!=""
                      }[$__range:]
                    )
                  ) by(cluster,namespace,replicaset,owner_name),
                  "workload",
                  "$1",
                  "owner_name",
                  "(.+)"
                ),
                "workload_type",
                "deployment",
                "",
                ""
              )
            )
          )
            or
          label_replace(
            label_replace(
              max(
                last_over_time(
                  kube_deployment_spec_replicas{
                    cluster=~"$cluster",namespace=~"$namespace",deployment=~".+"
                  }[$__range:]
                )
              ) by(cluster,namespace,deployment),
              "workload",
              "$1",
              "deployment",
              "(.+)"
            ),
            "workload_type",
            "deployment",
            "",
            ""
          )
        )
          or
        label_replace(
          label_replace(
            max(
              last_over_time(
                kube_daemonset_status_desired_number_scheduled{
                  cluster=~"$cluster",namespace=~"$namespace",daemonset=~".+"
                }[$__range:]
              )
            ) by(cluster,namespace,daemonset),
            "workload",
            "$1",
            "daemonset",
            "(.+)"
          ),
          "workload_type",
          "daemonset",
          "",
          ""
        )
      )
        or
      label_replace(
        label_replace(
          max(
            last_over_time(
              kube_statefulset_replicas{
                cluster=~"$cluster",namespace=~"$namespace",statefulset=~".+"
              }[$__range:]
            )
          ) by(cluster,namespace,statefulset),
          "workload",
          "$1",
          "statefulset",
          "(.+)"
        ),
        "workload_type",
        "statefulset",
        "",
        ""
      )
    )
      or
    last_over_time(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",
        namespace=~"$namespace",
        workload=~".+",
        workload_type!="replicaset",
        workload_type!="deployment",
        workload_type!="daemonset",
        workload_type!="statefulset"
      }[$__range:]
    )
  ) by(cluster,namespace,workload,workload_type)
)`,
    count: `count(
  max(
    (
      (
        (
          (
            (
              max(
                last_over_time(
                  kube_replicaset_spec_replicas{
                    cluster=~"$cluster",namespace=~"$namespace",replicaset=~".+"
                  }[$__range:]
                )
              ) by(cluster,namespace,replicaset)
                * on(cluster,namespace,replicaset) group_left(workload,workload_type)
              label_replace(
                label_replace(
                  max(
                    last_over_time(
                      kube_replicaset_owner{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        replicaset=~".+",
                        owner_kind=""
                      }[$__range:]
                    )
                  ) by(cluster,namespace,replicaset),
                  "workload",
                  "$1",
                  "replicaset",
                  "(.+)"
                ),
                "workload_type",
                "replicaset",
                "",
                ""
              )
            )
              or
            (
              max(
                last_over_time(
                  kube_replicaset_spec_replicas{
                    cluster=~"$cluster",namespace=~"$namespace",replicaset=~".+"
                  }[$__range:]
                )
              ) by(cluster,namespace,replicaset)
                * on(cluster,namespace,replicaset) group_left(workload,workload_type)
              label_replace(
                label_replace(
                  max(
                    last_over_time(
                      kube_replicaset_owner{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        replicaset=~".+",
                        owner_is_controller="true",
                        owner_kind="Deployment",
                        owner_name!=""
                      }[$__range:]
                    )
                  ) by(cluster,namespace,replicaset,owner_name),
                  "workload",
                  "$1",
                  "owner_name",
                  "(.+)"
                ),
                "workload_type",
                "deployment",
                "",
                ""
              )
            )
          )
            or
          label_replace(
            label_replace(
              max(
                last_over_time(
                  kube_deployment_spec_replicas{
                    cluster=~"$cluster",namespace=~"$namespace",deployment=~".+"
                  }[$__range:]
                )
              ) by(cluster,namespace,deployment),
              "workload",
              "$1",
              "deployment",
              "(.+)"
            ),
            "workload_type",
            "deployment",
            "",
            ""
          )
        )
          or
        label_replace(
          label_replace(
            max(
              last_over_time(
                kube_daemonset_status_desired_number_scheduled{
                  cluster=~"$cluster",namespace=~"$namespace",daemonset=~".+"
                }[$__range:]
              )
            ) by(cluster,namespace,daemonset),
            "workload",
            "$1",
            "daemonset",
            "(.+)"
          ),
          "workload_type",
          "daemonset",
          "",
          ""
        )
      )
        or
      label_replace(
        label_replace(
          max(
            last_over_time(
              kube_statefulset_replicas{
                cluster=~"$cluster",namespace=~"$namespace",statefulset=~".+"
              }[$__range:]
            )
          ) by(cluster,namespace,statefulset),
          "workload",
          "$1",
          "statefulset",
          "(.+)"
        ),
        "workload_type",
        "statefulset",
        "",
        ""
      )
    )
      or
    last_over_time(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",
        namespace=~"$namespace",
        workload=~".+",
        workload_type!="replicaset",
        workload_type!="deployment",
        workload_type!="daemonset",
        workload_type!="statefulset"
      }[$__range:]
    )
  ) by(cluster,namespace,workload,workload_type)
)`,
    desiredPods: `max(
  (
    (
      (
        (
          (
            max(
              last_over_time(
                kube_replicaset_spec_replicas{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  replicaset=~"$workload"
                }[$__range:]
              )
            ) by(cluster,namespace,replicaset)
              * on(cluster,namespace,replicaset) group_left(workload,workload_type)
            label_replace(
              label_replace(
                max(
                  last_over_time(
                    kube_replicaset_owner{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      replicaset=~"$workload",
                      owner_kind=""
                    }[$__range:]
                  )
                ) by(cluster,namespace,replicaset),
                "workload",
                "$1",
                "replicaset",
                "(.+)"
              ),
              "workload_type",
              "replicaset",
              "",
              ""
            )
          )
            or
          (
            max(
              last_over_time(
                kube_replicaset_spec_replicas{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  replicaset=~"$workload"
                }[$__range:]
              )
            ) by(cluster,namespace,replicaset)
              * on(cluster,namespace,replicaset) group_left(workload,workload_type)
            label_replace(
              label_replace(
                max(
                  last_over_time(
                    kube_replicaset_owner{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      replicaset=~"$workload",
                      owner_is_controller="true",
                      owner_kind="Deployment",
                      owner_name!=""
                    }[$__range:]
                  )
                ) by(cluster,namespace,replicaset,owner_name),
                "workload",
                "$1",
                "owner_name",
                "(.+)"
              ),
              "workload_type",
              "deployment",
              "",
              ""
            )
          )
        )
          or
        label_replace(
          label_replace(
            max(
              last_over_time(
                kube_deployment_spec_replicas{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  deployment=~"$workload"
                }[$__range:]
              )
            ) by(cluster,namespace,deployment),
            "workload",
            "$1",
            "deployment",
            "(.+)"
          ),
          "workload_type",
          "deployment",
          "",
          ""
        )
      )
        or
      label_replace(
        label_replace(
          max(
            last_over_time(
              kube_daemonset_status_desired_number_scheduled{
                cluster=~"$cluster",
                namespace=~"$namespace",
                daemonset=~"$workload"
              }[$__range:]
            )
          ) by(cluster,namespace,daemonset),
          "workload",
          "$1",
          "daemonset",
          "(.+)"
        ),
        "workload_type",
        "daemonset",
        "",
        ""
      )
    )
      or
    label_replace(
      label_replace(
        max(
          last_over_time(
            kube_statefulset_replicas{
              cluster=~"$cluster",
              namespace=~"$namespace",
              statefulset=~"$workload"
            }[$__range:]
          )
        ) by(cluster,namespace,statefulset),
        "workload",
        "$1",
        "statefulset",
        "(.+)"
      ),
      "workload_type",
      "statefulset",
      "",
      ""
    )
  )
    or
  count(
    group(
      last_over_time(
        namespace_workload_pod:kube_pod_owner:relabel{
          cluster=~"$cluster",
          namespace=~"$namespace",
          workload=~"$workload",
          workload_type=~"barepod|staticpod|BarePod|StaticPod"
        }[$__range:]
      )
    ) by(cluster,namespace,workload,workload_type,pod)
  ) by(cluster,namespace,workload,workload_type)
    or
  last_over_time(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      workload=~"$workload",
      workload_type!~"barepod|staticpod|BarePod|StaticPod",
      workload_type!="replicaset",
      workload_type!="deployment",
      workload_type!="daemonset",
      workload_type!="statefulset"
    }[$__range:]
  )
) by(cluster,namespace,workload,workload_type)
`,
    // Historical owners retain row identity; NaN prevents missing telemetry or
    // unsupported controllers from becoming zero/ready during table calculations.
    readyPods: `max(
  (
    (
      (
        (
          (
            max(
              kube_replicaset_status_ready_replicas{
                cluster=~"$cluster",
                namespace=~"$namespace",
                replicaset=~"$workload"
              }
            ) by(cluster,namespace,replicaset)
              * on(cluster,namespace,replicaset) group_left(workload,workload_type)
            label_replace(
              label_replace(
                max(
                  kube_replicaset_owner{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    replicaset=~"$workload",
                    owner_kind=~""
                  }
                ) by(cluster,namespace,replicaset),
                "workload",
                "$1",
                "replicaset",
                "(.+)"
              ),
              "workload_type",
              "replicaset",
              "",
              ""
            )
          )
            or
          (
            max(
              kube_replicaset_status_ready_replicas{
                cluster=~"$cluster",
                namespace=~"$namespace",
                replicaset=~"$workload"
              }
            ) by(cluster,namespace,replicaset)
              * on(cluster,namespace,replicaset) group_left(workload,workload_type)
            label_replace(
              label_replace(
                max(
                  kube_replicaset_owner{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    replicaset=~"$workload",
                    owner_is_controller="true",
                    owner_kind="Deployment",
                    owner_name!=""
                  }
                ) by(cluster,namespace,replicaset,owner_name),
                "workload",
                "$1",
                "owner_name",
                "(.+)"
              ),
              "workload_type",
              "deployment",
              "",
              ""
            )
          )
        )
          or
        label_replace(
          label_replace(
            max(
              kube_deployment_status_replicas_available{
                cluster=~"$cluster",
                namespace=~"$namespace",
                deployment=~"$workload"
              }
            ) by(cluster,namespace,deployment),
            "workload",
            "$1",
            "deployment",
            "(.+)"
          ),
          "workload_type",
          "deployment",
          "",
          ""
        )
      )
        or
      label_replace(
        label_replace(
          max(
            kube_daemonset_status_number_ready{
              cluster=~"$cluster",
              namespace=~"$namespace",
              daemonset=~"$workload"
            }
          ) by(cluster,namespace,daemonset),
          "workload",
          "$1",
          "daemonset",
          "(.+)"
        ),
        "workload_type",
        "daemonset",
        "",
        ""
      )
    )
      or
    label_replace(
      label_replace(
        max(
          kube_statefulset_status_replicas_ready{
            cluster=~"$cluster",
            namespace=~"$namespace",
            statefulset=~"$workload"
          }
        ) by(cluster,namespace,statefulset),
        "workload",
        "$1",
        "statefulset",
        "(.+)"
      ),
      "workload_type",
      "statefulset",
      "",
      ""
    )
  )
    or
  sum(
    (
      max(
        kube_pod_status_ready{
          cluster=~"$cluster",
          namespace=~"$namespace",
          condition="true"
        }
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_right()
      group(
        namespace_workload_pod:kube_pod_owner:relabel{
          cluster=~"$cluster",
          namespace=~"$namespace",
          workload=~"$workload",
          workload_type=~"barepod|staticpod|BarePod|StaticPod"
        }
      ) by(cluster,namespace,workload,workload_type,pod)
    )
      or
    (
      group(
        last_over_time(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload",
            workload_type!="replicaset",
            workload_type!="deployment",
            workload_type!="daemonset",
            workload_type!="statefulset"
          }[$__range:]
        )
      ) by(cluster,namespace,workload,workload_type,pod)
        * NaN
    )
  ) by(cluster,namespace,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    cpuUsageAvgOverTime: `avg_over_time(
  (
    sum(
      sum(
        max(
          node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod!="",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,pod,container)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    ) by(cluster,namespace,workload,workload_type)
  )[$__range:$__interval]
)`,
    cpuUsageAvgPercentOverTime: `avg_over_time(
  (
    sum(
      sum(
        max(
          node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod!="",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,pod,container)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    ) by(cluster,namespace,workload,workload_type)
      /
    (
      sum(
        topk(
          1,
          group(
            namespace_workload_pod:kube_pod_owner:relabel{
              cluster=~"$cluster",
              namespace=~"$namespace",
              workload=~"$workload"
            }
          ) by(cluster,namespace,workload,workload_type,pod)
        ) by(cluster,namespace,pod)
          * on(cluster,namespace,pod) group_left()
        sum(
          label_replace(
            (
              max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod!="",resource="cpu",unit="cores"}
              )
              or on(cluster,namespace,pod,node)
              sum by(cluster,namespace,pod,node)(
                max by(cluster,namespace,pod,node,container)(
                  kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod!="",container!="POD",container!="",resource="cpu"}
                )
              )
            ),
            "resource", "cpu", "", ""
          )
        ) by(cluster,namespace,pod)
      ) by(cluster,namespace,workload,workload_type)
        >
      0
    )
  )[$__range:$__interval]
)`,
    cpuUsageMaxOverTime: `max_over_time(
  (
    sum(
      sum(
        max(
          node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod!="",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    ) by(cluster,namespace,workload,workload_type)
  )[$__range:$__interval]
)`,
    cpuUsageMaxPercentOverTime: `max_over_time(
  (
    sum(
      sum(
        max(
          node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod!="",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    ) by(cluster,namespace,workload,workload_type)
      /
    (
      sum(
        topk(
          1,
          group(
            namespace_workload_pod:kube_pod_owner:relabel{
              cluster=~"$cluster",
              namespace=~"$namespace",
              workload=~"$workload"
            }
          ) by(cluster,namespace,workload,workload_type,pod)
        ) by(cluster,namespace,pod)
          * on(cluster,namespace,pod) group_left()
        sum(
          label_replace(
            (
              max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod!="",resource="cpu",unit="cores"}
              )
              or on(cluster,namespace,pod,node)
              sum by(cluster,namespace,pod,node)(
                max by(cluster,namespace,pod,node,container)(
                  kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod!="",container!="POD",container!="",resource="cpu"}
                )
              )
            ),
            "resource", "cpu", "", ""
          )
        ) by(cluster,namespace,pod)
      ) by(cluster,namespace,workload,workload_type)
        >
      0
    )
  )[$__range:$__interval]
)`,
    memoryUsageAvgOverTime: `avg_over_time(
  (
    sum(
      sum(
        max(
          node_namespace_pod_container:container_memory_working_set_bytes{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod!="",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    ) by(cluster,namespace,workload,workload_type)
  )[$__range:$__interval]
)`,
    memoryUsageAvgPercentOverTime: `avg_over_time(
  (
    sum(
      sum(
        max(
          node_namespace_pod_container:container_memory_working_set_bytes{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod!="",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    ) by(cluster,namespace,workload,workload_type)
      /
    (
      sum(
        topk(
          1,
          group(
            namespace_workload_pod:kube_pod_owner:relabel{
              cluster=~"$cluster",
              namespace=~"$namespace",
              workload=~"$workload"
            }
          ) by(cluster,namespace,workload,workload_type,pod)
        ) by(cluster,namespace,pod)
          * on(cluster,namespace,pod) group_left()
        sum(
          label_replace(
            (
              max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod!="",resource="memory",unit="bytes"}
              )
              or on(cluster,namespace,pod,node)
              sum by(cluster,namespace,pod,node)(
                max by(cluster,namespace,pod,node,container)(
                  kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod!="",container!="POD",container!="",resource="memory"}
                )
              )
            ),
            "resource", "memory", "", ""
          )
        ) by(cluster,namespace,pod)
      ) by(cluster,namespace,workload,workload_type)
        >
      0
    )
  )[$__range:$__interval]
)`,
    memoryUsageMaxOverTime: `max_over_time(
  (
    sum(
      sum(
        max(
          node_namespace_pod_container:container_memory_working_set_bytes{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod!="",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    ) by(cluster,namespace,workload,workload_type)
  )[$__range:$__interval]
)`,
    memoryUsageMaxPercentOverTime: `max_over_time(
  (
    sum(
      sum(
        max(
          node_namespace_pod_container:container_memory_working_set_bytes{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod!="",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    ) by(cluster,namespace,workload,workload_type)
      /
    (
      sum(
        topk(
          1,
          group(
            namespace_workload_pod:kube_pod_owner:relabel{
              cluster=~"$cluster",
              namespace=~"$namespace",
              workload=~"$workload"
            }
          ) by(cluster,namespace,workload,workload_type,pod)
        ) by(cluster,namespace,pod)
          * on(cluster,namespace,pod) group_left()
        sum(
          label_replace(
            (
              max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod!="",resource="memory",unit="bytes"}
              )
              or on(cluster,namespace,pod,node)
              sum by(cluster,namespace,pod,node)(
                max by(cluster,namespace,pod,node,container)(
                  kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod!="",container!="POD",container!="",resource="memory"}
                )
              )
            ),
            "resource", "memory", "", ""
          )
        ) by(cluster,namespace,pod)
      ) by(cluster,namespace,workload,workload_type)
        >
      0
    )
  )[$__range:$__interval]
)`,
    cpuAllocation: `max(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
  ) by(resource)
    or
  sum(
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace",
        pod=~"$pod"
      }
    ) by(cluster,namespace,node,pod,container)
  )
)`,
    cpuLimits: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
)`,
    cpuRequests: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
) by(resource)`,
    cpuUsage: `sum(
  max(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,node,pod,container)
)`,
    memoryAllocation: `max(
  sum(
    label_replace(
      (
        max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",namespace="$namespace",pod=~"$pod",resource="memory",unit="bytes"}
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            kube_pod_container_resource_requests{cluster=~"$cluster",namespace="$namespace",pod=~"$pod",container!="POD",container!="",resource="memory"}
          )
        )
      ),
      "resource", "memory", "", ""
    )
  ) by(namespace,resource)
    or
  sum(
    max(
      container_memory_working_set_bytes{
        cluster=~"$cluster",
        namespace="$namespace",
        pod=~"$pod",
        container!="POD",
        container!=""
      }
    ) by(namespace,pod,container)
  ) by(namespace)
) by(namespace)`,
    memoryLimits: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
        )
      )
    ),
    "resource", "memory", "", ""
  )
)`,
    memoryRequests: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
        )
      )
    ),
    "resource", "memory", "", ""
  )
)`,
    memoryUsage: `sum(
  max(
    container_memory_working_set_bytes{
      cluster=~"$cluster",
      namespace="$namespace",
      pod=~"$pod",
      container!="POD",
      container!=""
    }
  ) by(cluster,namespace,pod,container)
)`,
    podsCount: `count(
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      workload=~"$workload",
      workload_type=~"$workloadtype"
    }
  ) by(cluster,namespace,pod)
)`,
    images: `count(
  kube_pod_container_info{
    pod=~"$pod",cluster=~"$cluster",namespace="$namespace"
  }
) by(image_spec)`,
    statefulsetReplicas: `sum(
  kube_statefulset_status_replicas{
    cluster=~"$cluster",namespace=~"$namespace",statefulset=~"$workload"
  }
)`,
    statefulsetAvailable: `sum(
  kube_statefulset_status_replicas_available{
    cluster=~"$cluster",namespace=~"$namespace",statefulset=~"$workload"
  }
)`,
    statefulsetReady: `sum(
  kube_statefulset_status_replicas_ready{
    cluster=~"$cluster",namespace=~"$namespace",statefulset=~"$workload"
  }
)`,
    statefulsetUpdated: `sum(
  kube_statefulset_status_replicas_updated{
    cluster=~"$cluster",namespace=~"$namespace",statefulset=~"$workload"
  }
)`,
    deploymentReplicas: `sum(
  kube_deployment_status_replicas{
    cluster=~"$cluster",namespace=~"$namespace",deployment=~"$workload"
  }
)`,
    deploymentAvailable: `sum(
  kube_deployment_status_replicas_available{
    cluster=~"$cluster",namespace=~"$namespace",deployment=~"$workload"
  }
)`,
    deploymentReady: `sum(
  kube_deployment_status_replicas_ready{
    cluster=~"$cluster",namespace=~"$namespace",deployment=~"$workload"
  }
)`,
    deploymentUpdated: `sum(
  kube_deployment_status_replicas_updated{
    cluster=~"$cluster",namespace=~"$namespace",deployment=~"$workload"
  }
)`,
    deploymentUnavailable: `sum(
  kube_deployment_status_replicas_unavailable{
    cluster=~"$cluster",namespace=~"$namespace",deployment=~"$workload"
  }
)`,
    daemonsetDesired: `sum(
  kube_daemonset_status_desired_number_scheduled{
    cluster=~"$cluster",namespace=~"$namespace",daemonset=~"$workload"
  }
)`,
    daemonsetScheduled: `sum(
  kube_daemonset_status_current_number_scheduled{
    cluster=~"$cluster",namespace=~"$namespace",daemonset=~"$workload"
  }
)`,
    daemonsetAvailable: `sum(
  kube_daemonset_status_number_available{
    cluster=~"$cluster",namespace=~"$namespace",daemonset=~"$workload"
  }
)`,
    daemonsetReady: `sum(
  kube_daemonset_status_number_ready{
    cluster=~"$cluster",namespace=~"$namespace",daemonset=~"$workload"
  }
)`,
    daemonsetUpdated: `sum(
  kube_daemonset_status_updated_number_scheduled{
    cluster=~"$cluster",namespace=~"$namespace",daemonset=~"$workload"
  }
)`,
    daemonsetUnavailable: `sum(
  kube_daemonset_status_number_unavailable{
    cluster=~"$cluster",namespace=~"$namespace",daemonset=~"$workload"
  }
)`,
    daemonsetMisscheduled: `sum(
  kube_daemonset_status_number_misscheduled{
    cluster=~"$cluster",namespace=~"$namespace",daemonset=~"$workload"
  }
)`,
    cronjobActive: `sum(
  kube_cronjob_status_active{
    cluster=~"$cluster",namespace=~"$namespace",cronjob=~"$workload"
  }
)`,
    jobActive: `sum(
  kube_job_status_active{
    cluster=~"$cluster",namespace=~"$namespace",job_name=~"$workload"
  }
)`,
    jobSucceeded: `sum(
  kube_job_status_succeeded{
    cluster=~"$cluster",namespace=~"$namespace",job_name=~"$workload"
  }
)`,
    jobFailed: `sum(
  kube_job_status_failed{
    cluster=~"$cluster",namespace=~"$namespace",job_name=~"$workload"
  }
)`,
    cpuDistribution: `sum(
  sum(
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
        container!="POD",
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace"
      }
    ) by(cluster,namespace,pod,container)
  ) by(cluster,namespace,pod)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    cpuEfficiency: `sum(
  sum(
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
        cluster=~"$cluster",
        namespace=~"$namespace"
      }
    ) by(cluster,namespace,pod,container)
  ) by(cluster,namespace,pod)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)
  / on(cluster,namespace,workload,workload_type) group_left()
sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!=""}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    memoryDistribution: `sum(
  sum(
    max(
      node_namespace_pod_container:container_memory_working_set_bytes{
        container!="POD",
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace"
      }
    ) by(cluster,namespace,pod,container)
  ) by(cluster,namespace,pod)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    memoryEfficiency: `sum(
  sum(
    max(
      node_namespace_pod_container:container_memory_working_set_bytes{
        cluster=~"$cluster",
        namespace=~"$namespace"
      }
    ) by(cluster,namespace,pod,container)
  ) by(cluster,namespace,pod)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)
  / on(cluster,namespace,workload,workload_type) group_left()
sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!=""}
        )
      )
    ),
    "resource", "memory", "", ""
  )
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    cpuPressureWaiting: `sum(
  sum(
    sum(
      rate(
        container_pressure_cpu_waiting_seconds_total{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="",
          container!="POD"
        }[$__rate_interval]
      )
    ) by(cluster,namespace,pod)
      >
    0
  ) by(cluster,namespace,pod)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    cpuPressureStalled: `sum(
  sum(
    sum(
      rate(
        container_pressure_cpu_stalled_seconds_total{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="",
          container!="POD"
        }[$__rate_interval]
      )
    ) by(cluster,namespace,pod)
      >
    0
  ) by(cluster,namespace,pod)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    memoryPressureWaiting: `sum(
  sum(
    sum(
      rate(
        container_pressure_memory_waiting_seconds_total{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="",
          container!="POD"
        }[$__rate_interval]
      )
    ) by(cluster,namespace,pod)
      >
    0
  ) by(cluster,namespace,pod)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    memoryPressureStalled: `sum(
  sum(
    sum(
      rate(
        container_pressure_memory_stalled_seconds_total{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="",
          container!="POD"
        }[$__rate_interval]
      )
    ) by(cluster,namespace,pod)
      >
    0
  ) by(cluster,namespace,pod)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    ioPressureWaiting: `sum(
  sum(
    sum(
      rate(
        container_pressure_io_waiting_seconds_total{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="",
          container!="POD"
        }[$__rate_interval]
      )
    ) by(cluster,namespace,pod)
      >
    0
  ) by(cluster,namespace,pod)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    ioPressureStalled: `sum(
  sum(
    sum(
      rate(
        container_pressure_io_stalled_seconds_total{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="",
          container!="POD"
        }[$__rate_interval]
      )
    ) by(cluster,namespace,pod)
      >
    0
  ) by(cluster,namespace,pod)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
    }
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    infoJoinKey: `label_join(
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      workload=~"$workload"
    }
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    cpuUsageJoinKey: `label_join(
  sum(
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
        container!="POD",
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace"
      }
    ) by(cluster,namespace,pod,container)
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    cpuRequestsJoinKey: `label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!=""}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    cpuRequestsPercentJoinKey: `label_join(
  sum(
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
        container!="POD",
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace"
      }
    ) by(cluster,namespace,pod,container)
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)
  /
label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!=""}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    cpuLimitsJoinKey: `label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!=""}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    cpuLimitsPercentJoinKey: `label_join(
  sum(
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
        container!="POD",
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace"
      }
    ) by(cluster,namespace,pod,container)
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)
  /
label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!=""}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    memoryUsageJoinKey: `label_join(
  sum(
    max(
      node_namespace_pod_container:container_memory_working_set_bytes{
        container!="POD",
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace"
      }
    ) by(cluster,namespace,pod,container)
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    memoryRequestsJoinKey: `label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!=""}
          )
        )
      ),
      "resource", "memory", "", ""
    )
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    memoryRequestsPercentJoinKey: `label_join(
  sum(
    max(
      node_namespace_pod_container:container_memory_working_set_bytes{
        container!="POD",
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace"
      }
    ) by(cluster,namespace,pod,container)
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)
  /
label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!=""}
          )
        )
      ),
      "resource", "memory", "", ""
    )
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    memoryLimitsJoinKey: `label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!=""}
          )
        )
      ),
      "resource", "memory", "", ""
    )
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    memoryLimitsPercentJoinKey: `label_join(
  sum(
    max(
      node_namespace_pod_container:container_memory_working_set_bytes{
        container!="POD",
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace"
      }
    ) by(cluster,namespace,pod,container)
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)
  /
label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",resource="memory",unit="bytes"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",container!="POD",container!=""}
          )
        )
      ),
      "resource", "memory", "", ""
    )
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    group(
      namespace_workload_pod:kube_pod_owner:relabel{
        cluster=~"$cluster",namespace=~"$namespace",workload=~"$workload"
      }
    ) by(cluster,namespace,pod,workload,workload_type)
  ) by(cluster,namespace,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "workload",
  "workload_type"
)`,
    networkBandwidthRx: `sum(
  max(
    rate(
      container_network_receive_bytes_total{
        cluster=~"$cluster",namespace="$namespace",pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
)`,
    networkBandwidthTx: `-sum(
  max(
    rate(
      container_network_transmit_bytes_total{
        cluster=~"$cluster",namespace="$namespace",pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
)`,
    networkSaturationRx: `sum(
  max(
    rate(
      container_network_receive_packets_dropped_total{
        cluster=~"$cluster",
        namespace="$namespace",
        pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
)`,
    networkSaturationTx: `-sum(
  max(
    rate(
      container_network_transmit_packets_dropped_total{
        cluster=~"$cluster",
        namespace="$namespace",
        pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
)`,
    networkBandwidthByPodRx: `sum(
  max(
    rate(
      container_network_receive_bytes_total{
        cluster=~"$cluster",namespace="$namespace",pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
) by(cluster,namespace,pod)`,
    networkBandwidthByPodTx: `-sum(
  max(
    rate(
      container_network_transmit_bytes_total{
        cluster=~"$cluster",namespace="$namespace",pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
) by(cluster,namespace,pod)`,
    networkSaturationByPodRx: `sum(
  max(
    rate(
      container_network_receive_packets_dropped_total{
        cluster=~"$cluster",
        namespace="$namespace",
        pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
) by(cluster,namespace,pod)`,
    networkSaturationByPodTx: `-sum(
  max(
    rate(
      container_network_transmit_packets_dropped_total{
        cluster=~"$cluster",
        namespace="$namespace",
        pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
) by(cluster,namespace,pod)`,
    throughputRead: `sum(
  sum(
    sum(
      rate(
        container_fs_reads_bytes_total{
          container!="POD",
          container!="",
          cluster=~"$cluster",
          namespace=~"$namespace",
          device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+"
        }[$__rate_interval]
      )
    ) by(cluster,namespace,pod)
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    topk(
      1,
      group(
        namespace_workload_pod:kube_pod_owner:relabel{
          cluster=~"$cluster",
          namespace=~"$namespace",
          workload=~"$workload"
        }
      ) by(cluster,namespace,workload,workload_type,pod)
    ) by(cluster,namespace,pod)
  ) by(cluster,namespace,pod,workload,workload_type)
) by(workload,workload_type)`,
    throughputWrite: `-sum(
  sum(
    sum(
      rate(
        container_fs_writes_bytes_total{
          container!="POD",
          container!="",
          cluster=~"$cluster",
          namespace=~"$namespace",
          device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+"
        }[$__rate_interval]
      )
    ) by(cluster,namespace,pod)
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    topk(
      1,
      group(
        namespace_workload_pod:kube_pod_owner:relabel{
          cluster=~"$cluster",
          namespace=~"$namespace",
          workload=~"$workload"
        }
      ) by(cluster,namespace,workload,workload_type,pod)
    ) by(cluster,namespace,pod)
  ) by(cluster,namespace,pod,workload,workload_type)
) by(workload,workload_type)`,
    iopsRead: `sum(
  sum(
    sum(
      rate(
        container_fs_reads_total{
          container!="POD",
          container!="",
          cluster=~"$cluster",
          device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
          namespace=~"$namespace"
        }[$__rate_interval]
      )
    ) by(cluster,namespace,pod)
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    topk(
      1,
      group(
        namespace_workload_pod:kube_pod_owner:relabel{
          cluster=~"$cluster",
          namespace=~"$namespace",
          workload=~"$workload"
        }
      ) by(cluster,namespace,workload,workload_type,pod)
    ) by(cluster,namespace,pod)
  ) by(cluster,namespace,pod,workload,workload_type)
) by(workload,workload_type)`,
    iopsWrite: `-sum(
  sum(
    sum(
      rate(
        container_fs_writes_total{
          container!="POD",
          container!="",
          cluster=~"$cluster",
          device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
          namespace=~"$namespace"
        }[$__rate_interval]
      )
    ) by(cluster,namespace,pod)
      * on(cluster,namespace,pod) group_left(workload,workload_type)
    topk(
      1,
      group(
        namespace_workload_pod:kube_pod_owner:relabel{
          cluster=~"$cluster",
          namespace=~"$namespace",
          workload=~"$workload"
        }
      ) by(cluster,namespace,workload,workload_type,pod)
    ) by(cluster,namespace,pod)
  ) by(cluster,namespace,pod,workload,workload_type)
) by(workload,workload_type)`,
    costsCPUAllocation: `sum(
  sum(
    sum_over_time(
      (
        sum(
          max(
            sum(
              (label_replace(
                  (
                    max by(cluster,namespace,pod,node)(
                      kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",resource="cpu",unit="cores"}
                    )
                    or on(cluster,namespace,pod,node)
                    sum by(cluster,namespace,pod,node)(
                      max by(cluster,namespace,pod,node,container)(
                        kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",container!="POD",container!="",resource="cpu"}
                      )
                    )
                  ),
                  "resource", "cpu", "", ""
                )
                and on(cluster,namespace,pod)
                max by(cluster,namespace,pod)(
                  kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",phase=~"Pending|Running"} == 1
                )
              )
            ) by(cluster,namespace,node,pod,resource)
              or
            sum(
              rate(
                container_cpu_usage_seconds_total{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  node!="",
                  pod=~".+",
                  container!="POD",
                  container!=""
                }[$__rate_interval]
              )
                or
              (
                rate(
                  container_cpu_usage_seconds_total{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node="",
                    pod=~".+",
                    container!="POD",
                    container!=""
                  }[$__rate_interval]
                )
                  * on(cluster,namespace,pod) group_left(node)
                topk by(cluster,namespace,pod)(
                  1,
                  group by(cluster,namespace,pod,node)(
                    kube_pod_info{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      node!="",
                      pod=~".+"
                    }
                  )
                )
              )
            ) by(cluster,namespace,node,pod)
          ) by(cluster,namespace,node,pod)
            * on(cluster,node) group_left()
          max(node_cpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
        ) by(cluster,namespace,pod)
          * on(cluster,namespace,pod) group_left(workload,workload_type)
        topk(
          1,
          group(
            namespace_workload_pod:kube_pod_owner:relabel{
              cluster=~"$cluster",
              namespace=~"$namespace",
              workload=~"$workload",
              workload_type=~"$workloadtype"
            }
          ) by(cluster,namespace,workload,workload_type,pod)
        ) by(cluster,namespace,pod)
      )[$__range:5m]
    )
      /
    12
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    costsMemoryAllocation: `sum(
  sum(
    sum_over_time(
      (
        sum(
          (
            (
              (
                max(
                  sum(
                    (label_replace(
                        (
                          max by(cluster,namespace,pod,node)(
                            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",resource="memory",unit="bytes"}
                          )
                          or on(cluster,namespace,pod,node)
                          sum by(cluster,namespace,pod,node)(
                            max by(cluster,namespace,pod,node,container)(
                              kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",container!="POD",container!="",resource="memory"}
                            )
                          )
                        ),
                        "resource", "memory", "", ""
                      )
                      and on(cluster,namespace,pod)
                      max by(cluster,namespace,pod)(
                        kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",phase=~"Pending|Running"} == 1
                      )
                    )
                  ) by(cluster,namespace,node,pod,resource)
                    or
                  sum(
                    container_memory_working_set_bytes{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      node!="",
                      pod=~".+",
                      container!="POD",
                      container!=""
                    }
                      or
                    (
                      container_memory_working_set_bytes{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        node="",
                        pod=~".+",
                        container!="POD",
                        container!=""
                      }
                        * on(cluster,namespace,pod) group_left(node)
                      topk by(cluster,namespace,pod)(
                        1,
                        group by(cluster,namespace,pod,node)(
                          kube_pod_info{
                            cluster=~"$cluster",
                            namespace=~"$namespace",
                            node!="",
                            pod=~".+"
                          }
                        )
                      )
                    )
                  ) by(cluster,namespace,node,pod)
                ) by(cluster,namespace,node,pod)
                  /
                1024
              )
                /
              1024
            )
              /
            1024
          )
            * on(cluster,node) group_left()
          max(node_ram_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
        ) by(cluster,namespace,pod)
          * on(cluster,namespace,pod) group_left(workload,workload_type)
        topk(
          1,
          group(
            namespace_workload_pod:kube_pod_owner:relabel{
              cluster=~"$cluster",
              namespace=~"$namespace",
              workload=~"$workload",
              workload_type=~"$workloadtype"
            }
          ) by(cluster,namespace,workload,workload_type,pod)
        ) by(cluster,namespace,pod)
      )[$__range:5m]
    )
      /
    12
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    costsCPUIdle: `sum(
  sum(
    sum_over_time(
      (
        sum(
          (
            sum(
              (label_replace(
                  (
                    max by(cluster,namespace,pod,node)(
                      kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",resource="cpu",unit="cores"}
                    )
                    or on(cluster,namespace,pod,node)
                    sum by(cluster,namespace,pod,node)(
                      max by(cluster,namespace,pod,node,container)(
                        kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",container!="POD",container!="",resource="cpu"}
                      )
                    )
                  ),
                  "resource", "cpu", "", ""
                )
                and on(cluster,namespace,pod)
                max by(cluster,namespace,pod)(
                  kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",phase=~"Pending|Running"} == 1
                )
              )
            ) by(cluster,namespace,node,pod)
              - on(cluster,namespace,node,pod) group_left()
            sum(
              rate(
                container_cpu_usage_seconds_total{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  node!="",
                  pod=~".+",
                  container!="POD",
                  container!=""
                }[$__rate_interval]
              )
                or
              (
                rate(
                  container_cpu_usage_seconds_total{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node="",
                    pod=~".+",
                    container!="POD",
                    container!=""
                  }[$__rate_interval]
                )
                  * on(cluster,namespace,pod) group_left(node)
                topk by(cluster,namespace,pod)(
                  1,
                  group by(cluster,namespace,pod,node)(
                    kube_pod_info{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      node!="",
                      pod=~".+"
                    }
                  )
                )
              )
            ) by(cluster,namespace,node,pod)
          )
            * on(cluster,node) group_left()
          max(node_cpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
        ) by(cluster,namespace,pod)
          * on(cluster,namespace,pod) group_left(workload,workload_type)
        topk(
          1,
          group(
            namespace_workload_pod:kube_pod_owner:relabel{
              cluster=~"$cluster",
              namespace=~"$namespace",
              workload=~"$workload",
              workload_type=~"$workloadtype"
            }
          ) by(cluster,namespace,workload,workload_type,pod)
        ) by(cluster,namespace,pod)
      )[$__range:5m]
    )
      /
    12
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    costsMemoryIdle: `sum(
  sum(
    sum_over_time(
      (
        sum(
          (
            (
              (
                (
                  sum(
                    (label_replace(
                        (
                          max by(cluster,namespace,pod,node)(
                            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",resource="memory",unit="bytes"}
                          )
                          or on(cluster,namespace,pod,node)
                          sum by(cluster,namespace,pod,node)(
                            max by(cluster,namespace,pod,node,container)(
                              kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",container!="POD",container!="",resource="memory"}
                            )
                          )
                        ),
                        "resource", "memory", "", ""
                      )
                      and on(cluster,namespace,pod)
                      max by(cluster,namespace,pod)(
                        kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",phase=~"Pending|Running"} == 1
                      )
                    )
                  ) by(cluster,namespace,node,pod)
                    - on(cluster,namespace,node,pod) group_left()
                  sum(
                    container_memory_working_set_bytes{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      node!="",
                      pod=~".+",
                      container!="POD",
                      container!=""
                    }
                      or
                    (
                      container_memory_working_set_bytes{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        node="",
                        pod=~".+",
                        container!="POD",
                        container!=""
                      }
                        * on(cluster,namespace,pod) group_left(node)
                      topk by(cluster,namespace,pod)(
                        1,
                        group by(cluster,namespace,pod,node)(
                          kube_pod_info{
                            cluster=~"$cluster",
                            namespace=~"$namespace",
                            node!="",
                            pod=~".+"
                          }
                        )
                      )
                    )
                  ) by(cluster,namespace,node,pod)
                )
                  /
                1024
              )
                /
              1024
            )
              /
            1024
          )
            * on(cluster,node) group_left()
          max(node_ram_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
        ) by(cluster,namespace,pod)
          * on(cluster,namespace,pod) group_left(workload,workload_type)
        topk(
          1,
          group(
            namespace_workload_pod:kube_pod_owner:relabel{
              cluster=~"$cluster",
              namespace=~"$namespace",
              workload=~"$workload",
              workload_type=~"$workloadtype"
            }
          ) by(cluster,namespace,workload,workload_type,pod)
        ) by(cluster,namespace,pod)
      )[$__range:5m]
    )
      /
    12
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    search: `sum(
  namespace_workload_pod:kube_pod_owner:relabel{
    cluster=~"$cluster",namespace=~".+",workload=~"$searchterm"
  }
) by(namespace,workload,workload_type)`,
    cpuLimitsByContainer: `max(
  cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{
    cluster=~"$cluster",
    namespace=~"$namespace",
    pod=~"$pod",
    container="$container"
  }
) by(container)`,
    cpuRequestsByContainer: `max(
  cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
    cluster=~"$cluster",
    namespace=~"$namespace",
    pod=~"$pod",
    container="$container"
  }
) by(container)`,
    cpuUsageAvgByContainer: `avg(
  node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
    cluster=~"$cluster",
    namespace=~"$namespace",
    pod=~"$pod",
    container="$container"
  }
) by(container)`,
    cpuUsageMaxByContainer: `max(
  node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
    cluster=~"$cluster",
    namespace=~"$namespace",
    pod=~"$pod",
    container="$container"
  }
) by(container)`,
    cpuUsageMinByContainer: `min(
  node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
    cluster=~"$cluster",
    namespace=~"$namespace",
    pod=~"$pod",
    container="$container"
  }
) by(container)`,
    memoryLimitsByContainer: `max(
  cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{
    cluster=~"$cluster",
    namespace=~"$namespace",
    pod=~"$pod",
    container="$container"
  }
) by (container)`,
    memoryRequestsByContainer: `max(
  cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
    cluster=~"$cluster",
    namespace=~"$namespace",
    pod=~"$pod",
    container="$container"
  }
) by(container)`,
    memoryUsageAvgByContainer: `avg(
  container_memory_working_set_bytes{
    cluster=~"$cluster",
    namespace="$namespace",
    pod=~"$pod",
    container="$container"
  }
) by(container)`,
    memoryUsageMaxByContainer: `max(
  container_memory_working_set_bytes{
    cluster=~"$cluster",
    namespace="$namespace",
    pod=~"$pod",
    container="$container"
  }
) by(container)`,
    memoryUsageMinByContainer: `min(
  container_memory_working_set_bytes{
    cluster=~"$cluster",
    namespace="$namespace",
    pod=~"$pod",
    container="$container"
  }
) by(container)`,
    costsCPUAllocationRate: `sum(
  sum(
    (
      sum(
        max(
          sum(
            (label_replace(
                (
                  max by(cluster,namespace,pod,node)(
                    kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",resource="cpu",unit="cores"}
                  )
                  or on(cluster,namespace,pod,node)
                  sum by(cluster,namespace,pod,node)(
                    max by(cluster,namespace,pod,node,container)(
                      kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",container!="POD",container!="",resource="cpu"}
                    )
                  )
                ),
                "resource", "cpu", "", ""
              )
              and on(cluster,namespace,pod)
              max by(cluster,namespace,pod)(
                kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",phase=~"Pending|Running"} == 1
              )
            )
          ) by(cluster,namespace,node,pod,resource)
            or
          sum(
            rate(
              container_cpu_usage_seconds_total{
                cluster=~"$cluster",
                namespace=~"$namespace",
                node!="",
                pod=~".+",
                container!="POD",
                container!=""
              }[$__rate_interval]
            )
              or
            (
              rate(
                container_cpu_usage_seconds_total{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  node="",
                  pod=~".+",
                  container!="POD",
                  container!=""
                }[$__rate_interval]
              )
                * on(cluster,namespace,pod) group_left(node)
              topk by(cluster,namespace,pod)(
                1,
                group by(cluster,namespace,pod,node)(
                  kube_pod_info{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node!="",
                    pod=~".+"
                  }
                )
              )
            )
          ) by(cluster,namespace,node,pod)
        ) by(cluster,namespace,node,pod)
          * on(cluster,node) group_left()
        max(node_cpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload",
            workload_type=~"$workloadtype"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    )
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    costsMemoryAllocationRate: `sum(
  sum(
    (
      sum(
        (
          (
            (
              max(
                sum(
                  (label_replace(
                      (
                        max by(cluster,namespace,pod,node)(
                          kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",resource="memory",unit="bytes"}
                        )
                        or on(cluster,namespace,pod,node)
                        sum by(cluster,namespace,pod,node)(
                          max by(cluster,namespace,pod,node,container)(
                            kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",container!="POD",container!="",resource="memory"}
                          )
                        )
                      ),
                      "resource", "memory", "", ""
                    )
                    and on(cluster,namespace,pod)
                    max by(cluster,namespace,pod)(
                      kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",phase=~"Pending|Running"} == 1
                    )
                  )
                ) by(cluster,namespace,node,pod,resource)
                  or
                sum(
                  container_memory_working_set_bytes{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node!="",
                    pod=~".+",
                    container!="POD",
                    container!=""
                  }
                    or
                  (
                    container_memory_working_set_bytes{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      node="",
                      pod=~".+",
                      container!="POD",
                      container!=""
                    }
                      * on(cluster,namespace,pod) group_left(node)
                    topk by(cluster,namespace,pod)(
                      1,
                      group by(cluster,namespace,pod,node)(
                        kube_pod_info{
                          cluster=~"$cluster",
                          namespace=~"$namespace",
                          node!="",
                          pod=~".+"
                        }
                      )
                    )
                  )
                ) by(cluster,namespace,node,pod)
              ) by(cluster,namespace,node,pod)
                /
              1024
            )
              /
            1024
          )
            /
          1024
        )
          * on(cluster,node) group_left()
        max(node_ram_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload",
            workload_type=~"$workloadtype"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    )
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    costsCPUIdleRate: `sum(
  sum(
    (
      sum(
        (
          sum(
            (label_replace(
                (
                  max by(cluster,namespace,pod,node)(
                    kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",resource="cpu",unit="cores"}
                  )
                  or on(cluster,namespace,pod,node)
                  sum by(cluster,namespace,pod,node)(
                    max by(cluster,namespace,pod,node,container)(
                      kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",container!="POD",container!="",resource="cpu"}
                    )
                  )
                ),
                "resource", "cpu", "", ""
              )
              and on(cluster,namespace,pod)
              max by(cluster,namespace,pod)(
                kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",phase=~"Pending|Running"} == 1
              )
            )
          ) by(cluster,namespace,node,pod)
            - on(cluster,namespace,node,pod) group_left()
          sum(
            rate(
              container_cpu_usage_seconds_total{
                cluster=~"$cluster",
                namespace=~"$namespace",
                node!="",
                pod=~".+",
                container!="POD",
                container!=""
              }[$__rate_interval]
            )
              or
            (
              rate(
                container_cpu_usage_seconds_total{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  node="",
                  pod=~".+",
                  container!="POD",
                  container!=""
                }[$__rate_interval]
              )
                * on(cluster,namespace,pod) group_left(node)
              topk by(cluster,namespace,pod)(
                1,
                group by(cluster,namespace,pod,node)(
                  kube_pod_info{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node!="",
                    pod=~".+"
                  }
                )
              )
            )
          ) by(cluster,namespace,node,pod)
        )
          * on(cluster,node) group_left()
        max(node_cpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload",
            workload_type=~"$workloadtype"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    )
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
    costsMemoryIdleRate: `sum(
  sum(
    (
      sum(
        (
          (
            (
              (
                sum(
                  (label_replace(
                      (
                        max by(cluster,namespace,pod,node)(
                          kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",resource="memory",unit="bytes"}
                        )
                        or on(cluster,namespace,pod,node)
                        sum by(cluster,namespace,pod,node)(
                          max by(cluster,namespace,pod,node,container)(
                            kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",container!="POD",container!="",resource="memory"}
                          )
                        )
                      ),
                      "resource", "memory", "", ""
                    )
                    and on(cluster,namespace,pod)
                    max by(cluster,namespace,pod)(
                      kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~".+",phase=~"Pending|Running"} == 1
                    )
                  )
                ) by(cluster,namespace,node,pod)
                  - on(cluster,namespace,node,pod) group_left()
                sum(
                  container_memory_working_set_bytes{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node!="",
                    pod=~".+",
                    container!="POD",
                    container!=""
                  }
                    or
                  (
                    container_memory_working_set_bytes{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      node="",
                      pod=~".+",
                      container!="POD",
                      container!=""
                    }
                      * on(cluster,namespace,pod) group_left(node)
                    topk by(cluster,namespace,pod)(
                      1,
                      group by(cluster,namespace,pod,node)(
                        kube_pod_info{
                          cluster=~"$cluster",
                          namespace=~"$namespace",
                          node!="",
                          pod=~".+"
                        }
                      )
                    )
                  )
                ) by(cluster,namespace,node,pod)
              )
                /
              1024
            )
              /
            1024
          )
            /
          1024
        )
          * on(cluster,node) group_left()
        max(node_ram_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
      ) by(cluster,namespace,pod)
        * on(cluster,namespace,pod) group_left(workload,workload_type)
      topk(
        1,
        group(
          namespace_workload_pod:kube_pod_owner:relabel{
            cluster=~"$cluster",
            namespace=~"$namespace",
            workload=~"$workload",
            workload_type=~"$workloadtype"
          }
        ) by(cluster,namespace,workload,workload_type,pod)
      ) by(cluster,namespace,pod)
    )
  ) by(cluster,namespace,pod,workload,workload_type)
) by(cluster,namespace,workload,workload_type)`,
  },
  pods: {
    count: `count(
  group(
    kube_pod_info{cluster=~"$cluster",namespace=~"$namespace",pod!=""}
  ) by(cluster,namespace,pod)
)`,
    labelsByClusterNamespace: `label_values(
  namespace_workload_pod:kube_pod_owner:relabel{
    cluster=~"$cluster",namespace=~"$namespace"
  },
  pod
)`,
    labelsByClusterNode: `label_values(
  kube_pod_info{
    cluster=~"$cluster",node=~"$node"
  },
  pod
)`,
    labelsByClusterNamespaceWorkload: `label_values(
  namespace_workload_pod:kube_pod_owner:relabel{
    cluster=~"$cluster",
    namespace=~"$namespace",
    workload=~"$workload"
  },
  pod
)`,
    info: `topk(
  1,
  max(
    last_over_time(
      timestamp(
        kube_pod_info{
          cluster=~"$cluster",
          node=~"$node",
          namespace=~"$namespace",
          pod=~"$pod"
        }
      )[$__range:]
    )
  ) by(cluster,namespace,pod,node,pod_ip,uid)
    * on(cluster,namespace,pod) group_left(phase)
  group(
    topk(
      1,
      last_over_time(
        timestamp(
          kube_pod_status_phase{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~"$pod"
          }
            ==
          1
        )[$__range:]
      )
    ) by(cluster,namespace,pod)
  ) by(cluster,namespace,pod,phase)
) by(cluster,namespace,pod)`,
    cpuUsageAvgOverTime: `avg_over_time(
  (
    sum(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
        cluster=~"$cluster",
        node=~"$node",
        namespace=~"$namespace",
        pod=~"$pod",
        container!="POD",
        container!=""
      }
    ) by(cluster,namespace,pod)
  )[$__range:$__interval]
)`,
    cpuUsageAvgPercentOverTime: `avg_over_time(
  (
    sum(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
        cluster=~"$cluster",
        node=~"$node",
        namespace=~"$namespace",
        pod=~"$pod",
        container!="POD",
        container!=""
      }
    ) by(cluster,namespace,pod)
      /
    (
      sum(
        label_replace(
          (
            max by(cluster,namespace,pod,node)(
              kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container!="POD",container!="",resource="cpu"}
              )
            )
          ),
          "resource", "cpu", "", ""
        )
      ) by(cluster,namespace,pod)
        >
      0
    )
  )[$__range:$__interval]
)`,
    cpuUsageMaxOverTime: `max_over_time(
  (
    sum(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
        cluster=~"$cluster",
        node=~"$node",
        namespace=~"$namespace",
        pod=~"$pod",
        container!="POD",
        container!=""
      }
    ) by(cluster,namespace,pod)
  )[$__range:$__interval]
)`,
    cpuUsageMaxPercentOverTime: `max_over_time(
  (
    sum(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
        cluster=~"$cluster",
        node=~"$node",
        namespace=~"$namespace",
        pod=~"$pod",
        container!="POD",
        container!=""
      }
    ) by(cluster,namespace,pod)
      /
    (
      sum(
        label_replace(
          (
            max by(cluster,namespace,pod,node)(
              kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container!="POD",container!="",resource="cpu"}
              )
            )
          ),
          "resource", "cpu", "", ""
        )
      ) by(cluster,namespace,pod)
        >
      0
    )
  )[$__range:$__interval]
)`,
    memoryUsageAvgOverTime: `avg_over_time(
  (
    sum(
      node_namespace_pod_container:container_memory_working_set_bytes{
        cluster=~"$cluster",
        node=~"$node",
        namespace=~"$namespace",
        pod=~"$pod",
        container!="POD",
        container!=""
      }
    ) by(cluster,namespace,pod)
  )[$__range:$__interval]
)`,
    memoryUsageAvgPercentOverTime: `avg_over_time(
  (
    sum(
      node_namespace_pod_container:container_memory_working_set_bytes{
        cluster=~"$cluster",
        node=~"$node",
        namespace=~"$namespace",
        pod=~"$pod",
        container!="POD",
        container!=""
      }
    ) by(cluster,namespace,pod)
      /
    (
      sum(
        label_replace(
          (
            max by(cluster,namespace,pod,node)(
              kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container!="POD",container!="",resource="memory"}
              )
            )
          ),
          "resource", "memory", "", ""
        )
      ) by(cluster,namespace,pod)
        >
      0
    )
  )[$__range:$__interval]
)`,
    memoryUsageMaxOverTime: `max_over_time(
  (
    sum(
      max(
        node_namespace_pod_container:container_memory_working_set_bytes{
          cluster=~"$cluster",
          node=~"$node",
          namespace=~"$namespace",
          pod=~"$pod",
          container!="POD",
          container!=""
        }
      ) by(cluster,namespace,pod,container)
    ) by(cluster,namespace,pod)
  )[$__range:$__interval]
)`,
    memoryUsageMaxPercentOverTime: `max_over_time(
  (
    sum(
      max(
        node_namespace_pod_container:container_memory_working_set_bytes{
          cluster=~"$cluster",
          node=~"$node",
          namespace=~"$namespace",
          pod=~"$pod",
          container!="POD",
          container!=""
        }
      ) by(cluster,namespace,pod,container)
    ) by(cluster,namespace,pod)
      /
    (
      sum(
        label_replace(
          (
            max by(cluster,namespace,pod,node)(
              kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container!="POD",container!="",resource="memory"}
              )
            )
          ),
          "resource", "memory", "", ""
        )
      ) by(cluster,namespace,pod)
        >
      0
    )
  )[$__range:$__interval]
)`,
    cpuAllocation: `max(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
  ) by(namespace,resource)
    or
  sum(
    max(
      rate(
        container_cpu_usage_seconds_total{
          container!="",
          cluster=~"$cluster",
          namespace=~"$namespace",
          pod=~"$pod"
        }[$__rate_interval]
      )
    ) by(cluster,instance,namespace,pod,container)
  ) by(namespace)
) by(namespace)`,
    cpuLimits: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
) by(pod)`,
    cpuRequests: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="cpu",unit="cores"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
        )
      )
    ),
    "resource", "cpu", "", ""
  )
) by(pod)`,
    cpuUsage: `sum(
  max(
    rate(
      container_cpu_usage_seconds_total{
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace",
        pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,instance,namespace,pod,container)
) by(pod)`,
    memoryAllocation: `max(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="memory",unit="bytes"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
          )
        )
      ),
      "resource", "memory", "", ""
    )
  ) by(namespace,resource)
    or
  sum(
    max(
      node_namespace_pod_container:container_memory_working_set_bytes{
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace",
        pod=~"$pod"
      }
    ) by(cluster,node,namespace,pod,container,image)
  ) by(namespace)
) by(namespace)`,
    memoryLimits: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
        )
      )
    ),
    "resource", "memory", "", ""
  )
) by(pod)`,
    memoryRequests: `sum(
  label_replace(
    (
      (max by(cluster,namespace,pod,node)(
          kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",resource="memory",unit="bytes"}
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
      or on(cluster,namespace,pod,node)
      sum by(cluster,namespace,pod,node)(
        max by(cluster,namespace,pod,node,container)(
          cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container!=""}
        )
      )
    ),
    "resource", "memory", "", ""
  )
) by(pod)`,
    memoryUsage: `sum(
  max(
    node_namespace_pod_container:container_memory_working_set_bytes{
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,node,namespace,pod,container,image)
) by(pod)`,
    cpuPressureWaiting: `sum(
  rate(
    container_pressure_cpu_waiting_seconds_total{
      cluster=~"$cluster",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(pod,namespace,node)
  >
0`,
    cpuPressureStalled: `sum(
  rate(
    container_pressure_cpu_stalled_seconds_total{
      cluster=~"$cluster",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(pod,namespace,node)
  >
0`,
    memoryPressureWaiting: `sum(
  rate(
    container_pressure_memory_waiting_seconds_total{
      cluster=~"$cluster",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(pod,namespace,node)
  >
0`,
    memoryPressureStalled: `sum(
  rate(
    container_pressure_memory_stalled_seconds_total{
      cluster=~"$cluster",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(pod,namespace,node)
  >
0`,
    ioPressureWaiting: `sum(
  rate(
    container_pressure_io_waiting_seconds_total{
      cluster=~"$cluster",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(pod,namespace,node)
  >
0`,
    ioPressureStalled: `sum(
  rate(
    container_pressure_io_stalled_seconds_total{
      cluster=~"$cluster",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(pod,namespace,node)
  >
0`,
    infoJoinKey: `label_join(
  max(
    kube_pod_info{
      cluster=~"$cluster",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node)
    * on(cluster,namespace,pod) group_left(workload,workload_type)
  group(
    namespace_workload_pod:kube_pod_owner:relabel{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,workload,workload_type),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    cpuUsageJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
      cluster=~"$cluster",
      namespace=~"$namespace",
      node=~"$node",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    cpuRequestsJoinKey: `label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node"}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
  ) by(cluster,namespace,pod,node),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    cpuRequestsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
      cluster=~"$cluster",namespace=~"$namespace",node=~"$node",pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node)
    /
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node"}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
  ) by(cluster,namespace,pod,node),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    cpuLimitsJoinKey: `label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node"}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
  ) by(cluster,namespace,pod,node),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    cpuLimitsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
      cluster=~"$cluster",namespace=~"$namespace",node=~"$node",pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node)
    /
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node"}
          )
        )
      ),
      "resource", "cpu", "", ""
    )
  ) by(cluster,namespace,pod,node),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    memoryUsageJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_memory_working_set_bytes{
      cluster=~"$cluster",
      namespace=~"$namespace",
      node=~"$node",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    memoryRequestsJoinKey: `label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node"}
          )
        )
      ),
      "resource", "memory", "", ""
    )
  ) by(cluster,namespace,pod,node),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    memoryRequestsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_memory_working_set_bytes{
      cluster=~"$cluster",namespace=~"$namespace",node=~"$node",pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node)
    /
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node"}
          )
        )
      ),
      "resource", "memory", "", ""
    )
  ) by(cluster,namespace,pod,node),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    memoryLimitsJoinKey: `label_join(
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node"}
          )
        )
      ),
      "resource", "memory", "", ""
    )
  ) by(cluster,namespace,pod,node),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    memoryLimitsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_memory_working_set_bytes{
      cluster=~"$cluster",namespace=~"$namespace",node=~"$node",pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node)
    /
  sum(
    label_replace(
      (
        (max by(cluster,namespace,pod,node)(
            kube_pod_resource_limit{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
        or on(cluster,namespace,pod,node)
        sum by(cluster,namespace,pod,node)(
          max by(cluster,namespace,pod,node,container)(
            cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node"}
          )
        )
      ),
      "resource", "memory", "", ""
    )
  ) by(cluster,namespace,pod,node),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "node"
)`,
    networkBandwidthRx: `sum(
  max(
    rate(
      container_network_receive_bytes_total{
        cluster=~"$cluster",namespace="$namespace",pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
)`,
    networkBandwidthTx: `-sum(
  max(
    rate(
      container_network_transmit_bytes_total{
        cluster=~"$cluster",namespace="$namespace",pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
)`,
    networkSaturationRx: `sum(
  max(
    rate(
      container_network_receive_packets_dropped_total{
        cluster=~"$cluster",
        namespace="$namespace",
        pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
)`,
    networkSaturationTx: `-sum(
  max(
    rate(
      container_network_transmit_packets_dropped_total{
        cluster=~"$cluster",
        namespace="$namespace",
        pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
)`,
    networkBandwidthByInterfaceRx: `sum(
  max(
    rate(
      container_network_receive_bytes_total{
        cluster=~"$cluster",namespace="$namespace",pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
) by(interface)`,
    networkBandwidthByInterfaceTx: `-sum(
  max(
    rate(
      container_network_transmit_bytes_total{
        cluster=~"$cluster",namespace="$namespace",pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
) by(interface)`,
    networkSaturationByInterfaceRx: `sum(
  max(
    rate(
      container_network_receive_packets_dropped_total{
        cluster=~"$cluster",
        namespace="$namespace",
        pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
) by(interface)`,
    networkSaturationByInterfaceTx: `-sum(
  max(
    rate(
      container_network_transmit_packets_dropped_total{
        cluster=~"$cluster",
        namespace="$namespace",
        pod=~"$pod"
      }[$__rate_interval]
    )
  ) by(cluster,namespace,pod,interface)
) by(interface)`,
    throughputRead: `sum(
  rate(
    container_fs_reads_bytes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod"
    }[$__rate_interval]
  )
) by(namespace,pod)`,
    throughputWrite: `-sum(
  rate(
    container_fs_writes_bytes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod"
    }[$__rate_interval]
  )
) by(namespace,pod)`,
    iopsRead: `sum(
  rate(
    container_fs_reads_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod"
    }[$__rate_interval]
  )
) by(namespace,pod)`,
    iopsWrite: `-sum(
  rate(
    container_fs_writes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod"
    }[$__rate_interval]
  )
) by(namespace,pod)`,
    restarts: `sum(
  changes(
    kube_pod_container_status_restarts_total{
      cluster=~"$cluster",namespace="$namespace",pod=~"$pod"
    }[$__interval]
  )
) by(pod)`,
    costsCPUAllocation: `sum_over_time(
  sum by(cluster,namespace,pod)(
    max(
      sum(
        (label_replace(
            (
              max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
              )
              or on(cluster,namespace,pod,node)
              sum by(cluster,namespace,pod,node)(
                max by(cluster,namespace,pod,node,container)(
                  kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container=~".+",resource="cpu"}
                )
              )
            ),
            "resource", "cpu", "", ""
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
      ) by(cluster,node,namespace,pod,resource)
        or
      sum(
        max(
          rate(
            container_cpu_usage_seconds_total{
              cluster=~"$cluster",
              namespace=~"$namespace",
              pod=~"$pod",
              container=~".+",
              node=~"$node",
              node!=""
            }[$__rate_interval]
          )
            or
          (
            rate(
              container_cpu_usage_seconds_total{
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"$pod",
                container=~".+",
                node=""
              }[$__rate_interval]
            )
              * on(cluster,namespace,pod) group_left(node)
            topk by(cluster,namespace,pod)(
              1,
              group by(cluster,namespace,pod,node)(
                kube_pod_info{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  pod=~"$pod",
                  node=~"$node",
                  node!=""
                }
              )
            )
          )
        ) by(cluster,node,namespace,pod,container)
      ) by(cluster,node,namespace,pod)
    ) by(cluster,node,namespace,pod)
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsMemoryAllocation: `sum_over_time(
  sum by(cluster,namespace,pod)(
    (
      (
        (
          max(
            sum(
              (label_replace(
                  (
                    max by(cluster,namespace,pod,node)(
                      kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
                    )
                    or on(cluster,namespace,pod,node)
                    sum by(cluster,namespace,pod,node)(
                      max by(cluster,namespace,pod,node,container)(
                        kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container=~".+",resource="memory"}
                      )
                    )
                  ),
                  "resource", "memory", "", ""
                )
                and on(cluster,namespace,pod)
                max by(cluster,namespace,pod)(
                  kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
                )
              )
            ) by(cluster,node,namespace,pod,resource)
              or
            sum(
              max(
                container_memory_working_set_bytes{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  pod=~"$pod",
                  container=~".+",
                  node=~"$node",
                  node!=""
                }
                  or
                (
                  container_memory_working_set_bytes{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    pod=~"$pod",
                    container=~".+",
                    node=""
                  }
                    * on(cluster,namespace,pod) group_left(node)
                  topk by(cluster,namespace,pod)(
                    1,
                    group by(cluster,namespace,pod,node)(
                      kube_pod_info{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        pod=~"$pod",
                        node=~"$node",
                        node!=""
                      }
                    )
                  )
                )
              ) by(cluster,node,namespace,pod,container)
            ) by(cluster,node,namespace,pod)
          ) by(cluster,node,namespace,pod)
            /
          1024
        )
          /
        1024
      )
        /
      1024
    )
      * on(cluster,node) group_left()
    max(
      node_ram_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsCPUIdle: `sum_over_time(
  sum by(cluster,namespace,pod)(
    (
      sum(
        (label_replace(
            (
              max by(cluster,namespace,pod,node)(
                kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
              )
              or on(cluster,namespace,pod,node)
              sum by(cluster,namespace,pod,node)(
                max by(cluster,namespace,pod,node,container)(
                  kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container=~".+",resource="cpu"}
                )
              )
            ),
            "resource", "cpu", "", ""
          )
          and on(cluster,namespace,pod)
          max by(cluster,namespace,pod)(
            kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
          )
        )
      ) by(cluster,namespace,pod)
        - on(cluster,namespace,pod) group_left(node)
      sum(
        max(
          rate(
            container_cpu_usage_seconds_total{
              cluster=~"$cluster",
              namespace=~"$namespace",
              pod=~"$pod",
              container=~".+",
              node=~"$node",
              node!=""
            }[$__rate_interval]
          )
            or
          (
            rate(
              container_cpu_usage_seconds_total{
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"$pod",
                container=~".+",
                node=""
              }[$__rate_interval]
            )
              * on(cluster,namespace,pod) group_left(node)
            topk by(cluster,namespace,pod)(
              1,
              group by(cluster,namespace,pod,node)(
                kube_pod_info{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  pod=~"$pod",
                  node=~"$node",
                  node!=""
                }
              )
            )
          )
        ) by(cluster,node,namespace,pod,container)
      ) by(cluster,node,namespace,pod)
    )
      * on(cluster,node) group_left()
    max(node_cpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    costsMemoryIdle: `sum_over_time(
  sum by(cluster,namespace,pod)(
    (
      (
        (
          (
            sum(
              (label_replace(
                  (
                    max by(cluster,namespace,pod,node)(
                      kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
                    )
                    or on(cluster,namespace,pod,node)
                    sum by(cluster,namespace,pod,node)(
                      max by(cluster,namespace,pod,node,container)(
                        kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container=~".+",resource="memory"}
                      )
                    )
                  ),
                  "resource", "memory", "", ""
                )
                and on(cluster,namespace,pod)
                max by(cluster,namespace,pod)(
                  kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
                )
              )
            ) by(cluster,namespace,pod)
              - on(cluster,namespace,pod) group_left(node)
            sum(
              max(
                container_memory_working_set_bytes{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  pod=~"$pod",
                  container=~".+",
                  node=~"$node",
                  node!=""
                }
                  or
                (
                  container_memory_working_set_bytes{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    pod=~"$pod",
                    container=~".+",
                    node=""
                  }
                    * on(cluster,namespace,pod) group_left(node)
                  topk by(cluster,namespace,pod)(
                    1,
                    group by(cluster,namespace,pod,node)(
                      kube_pod_info{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        pod=~"$pod",
                        node=~"$node",
                        node!=""
                      }
                    )
                  )
                )
              ) by(cluster,node,namespace,pod,container)
            ) by(cluster,node,namespace,pod)
          )
            /
          1024
        )
          /
        1024
      )
        /
      1024
    )
      * on(cluster,node) group_left()
    max(
      node_ram_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:5m]
)
  /
12`,
    search: `sum(
  namespace_workload_pod:kube_pod_owner:relabel{
    cluster=~"$cluster",namespace=~".+",pod=~"$searchterm"
  }
) by(namespace,pod)`,
    costsCPUAllocationRate: `sum by(cluster,namespace,pod)(
  max(
    sum(
      (label_replace(
          (
            max by(cluster,namespace,pod,node)(
              kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container=~".+",resource="cpu"}
              )
            )
          ),
          "resource", "cpu", "", ""
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
    ) by(cluster,node,namespace,pod,resource)
      or
    sum(
      max(
        rate(
          container_cpu_usage_seconds_total{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~"$pod",
            container=~".+",
            node=~"$node",
            node!=""
          }[$__rate_interval]
        )
          or
        (
          rate(
            container_cpu_usage_seconds_total{
              cluster=~"$cluster",
              namespace=~"$namespace",
              pod=~"$pod",
              container=~".+",
              node=""
            }[$__rate_interval]
          )
            * on(cluster,namespace,pod) group_left(node)
          topk by(cluster,namespace,pod)(
            1,
            group by(cluster,namespace,pod,node)(
              kube_pod_info{
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"$pod",
                node=~"$node",
                node!=""
              }
            )
          )
        )
      ) by(cluster,node,namespace,pod,container)
    ) by(cluster,node,namespace,pod)
  ) by(cluster,node,namespace,pod)
    * on(cluster,node) group_left()
  max(
    node_cpu_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
    costsMemoryAllocationRate: `sum by(cluster,namespace,pod)(
  (
    (
      (
        max(
          sum(
            (label_replace(
                (
                  max by(cluster,namespace,pod,node)(
                    kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
                  )
                  or on(cluster,namespace,pod,node)
                  sum by(cluster,namespace,pod,node)(
                    max by(cluster,namespace,pod,node,container)(
                      kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container=~".+",resource="memory"}
                    )
                  )
                ),
                "resource", "memory", "", ""
              )
              and on(cluster,namespace,pod)
              max by(cluster,namespace,pod)(
                kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
              )
            )
          ) by(cluster,node,namespace,pod,resource)
            or
          sum(
            max(
              container_memory_working_set_bytes{
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"$pod",
                container=~".+",
                node=~"$node",
                node!=""
              }
                or
              (
                container_memory_working_set_bytes{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  pod=~"$pod",
                  container=~".+",
                  node=""
                }
                  * on(cluster,namespace,pod) group_left(node)
                topk by(cluster,namespace,pod)(
                  1,
                  group by(cluster,namespace,pod,node)(
                    kube_pod_info{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      pod=~"$pod",
                      node=~"$node",
                      node!=""
                    }
                  )
                )
              )
            ) by(cluster,node,namespace,pod,container)
          ) by(cluster,node,namespace,pod)
        ) by(cluster,node,namespace,pod)
          /
        1024
      )
        /
      1024
    )
      /
    1024
  )
    * on(cluster,node) group_left()
  max(
    node_ram_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
    costsCPUIdleRate: `sum by(cluster,namespace,pod)(
  (
    sum(
      (label_replace(
          (
            max by(cluster,namespace,pod,node)(
              kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="cpu",unit="cores"}
            )
            or on(cluster,namespace,pod,node)
            sum by(cluster,namespace,pod,node)(
              max by(cluster,namespace,pod,node,container)(
                kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container=~".+",resource="cpu"}
              )
            )
          ),
          "resource", "cpu", "", ""
        )
        and on(cluster,namespace,pod)
        max by(cluster,namespace,pod)(
          kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
        )
      )
    ) by(cluster,namespace,pod)
      - on(cluster,namespace,pod) group_left(node)
    sum(
      max(
        rate(
          container_cpu_usage_seconds_total{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~"$pod",
            container=~".+",
            node=~"$node",
            node!=""
          }[$__rate_interval]
        )
          or
        (
          rate(
            container_cpu_usage_seconds_total{
              cluster=~"$cluster",
              namespace=~"$namespace",
              pod=~"$pod",
              container=~".+",
              node=""
            }[$__rate_interval]
          )
            * on(cluster,namespace,pod) group_left(node)
          topk by(cluster,namespace,pod)(
            1,
            group by(cluster,namespace,pod,node)(
              kube_pod_info{
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"$pod",
                node=~"$node",
                node!=""
              }
            )
          )
        )
      ) by(cluster,node,namespace,pod,container)
    ) by(cluster,node,namespace,pod)
  )
    * on(cluster,node) group_left()
  max(node_cpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
)`,
    costsMemoryIdleRate: `sum by(cluster,namespace,pod)(
  (
    (
      (
        (
          sum(
            (label_replace(
                (
                  max by(cluster,namespace,pod,node)(
                    kube_pod_resource_request{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",resource="memory",unit="bytes"}
                  )
                  or on(cluster,namespace,pod,node)
                  sum by(cluster,namespace,pod,node)(
                    max by(cluster,namespace,pod,node,container)(
                      kube_pod_container_resource_requests{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",node=~"$node",container=~".+",resource="memory"}
                    )
                  )
                ),
                "resource", "memory", "", ""
              )
              and on(cluster,namespace,pod)
              max by(cluster,namespace,pod)(
                kube_pod_status_phase{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",phase=~"Pending|Running"} == 1
              )
            )
          ) by(cluster,namespace,pod)
            - on(cluster,namespace,pod) group_left(node)
          sum(
            max(
              container_memory_working_set_bytes{
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"$pod",
                container=~".+",
                node=~"$node",
                node!=""
              }
                or
              (
                container_memory_working_set_bytes{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  pod=~"$pod",
                  container=~".+",
                  node=""
                }
                  * on(cluster,namespace,pod) group_left(node)
                topk by(cluster,namespace,pod)(
                  1,
                  group by(cluster,namespace,pod,node)(
                    kube_pod_info{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      pod=~"$pod",
                      node=~"$node",
                      node!=""
                    }
                  )
                )
              )
            ) by(cluster,node,namespace,pod,container)
          ) by(cluster,node,namespace,pod)
        )
          /
        1024
      )
        /
      1024
    )
      /
    1024
  )
    * on(cluster,node) group_left()
  max(
    node_ram_hourly_cost{cluster=~"$cluster"}
  ) by(cluster,node)
)`,
  },
  containers: {
    labelsByClusterNamespacePod: `label_values(
  kube_pod_container_info{
    cluster=~"$cluster",
    namespace=~"$namespace",
    pod=~"$pod"
  },
  container
)`,
    info: `last_over_time(
  (
    max(
      kube_pod_container_info{
        pod="$pod",
        cluster=~"$cluster",
        namespace="$namespace"
      }
    ) by(cluster,namespace,pod,container,image_spec)
  )[$__range:]
)`,
    cpuUsageAvgOverTime: `avg_over_time(
  (
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
        cluster=~"$cluster",
        namespace="$namespace",
        pod="$pod",
        container!="POD",
        container!=""
      }
    ) by(container)
  )[$__range:$__interval]
)`,
    cpuUsageAvgPercentOverTime: `avg_over_time(
  (
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
        cluster=~"$cluster",
        namespace="$namespace",
        pod="$pod",
        container!="POD",
        container!=""
      }
    ) by(container)
      /
    (
      sum(
        kube_pod_container_resource_requests{
          cluster=~"$cluster",
          namespace="$namespace",
          pod="$pod",
          container!="POD",
          container!="",
          resource="cpu"
        }
      ) by(container)
        >
      0
    )
  )[$__range:$__interval]
)`,
    cpuUsageMaxOverTime: `max_over_time(
  (
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
        cluster=~"$cluster",
        namespace="$namespace",
        pod="$pod",
        container!="POD",
        container!=""
      }
    ) by(container)
  )[$__range:$__interval]
)`,
    cpuUsageMaxPercentOverTime: `max_over_time(
  (
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
        cluster=~"$cluster",
        namespace="$namespace",
        pod="$pod",
        container!="POD",
        container!=""
      }
    ) by(container)
      /
    (
      sum(
        kube_pod_container_resource_requests{
          cluster=~"$cluster",
          namespace="$namespace",
          pod="$pod",
          container!="POD",
          container!="",
          resource="cpu"
        }
      ) by(container)
        >
      0
    )
  )[$__range:$__interval]
)`,
    memoryUsageAvgOverTime: `avg_over_time(
  (
    avg(
      node_namespace_pod_container:container_memory_working_set_bytes{
        cluster=~"$cluster",
        namespace="$namespace",
        pod="$pod",
        container!="POD",
        container!=""
      }
    ) by(container)
  )[$__range:$__interval]
)`,
    memoryUsageAvgPercentOverTime: `avg_over_time(
  (
    avg(
      node_namespace_pod_container:container_memory_working_set_bytes{
        cluster=~"$cluster",
        namespace="$namespace",
        pod="$pod",
        container!="POD",
        container!=""
      }
    ) by(container)
      /
    (
      sum(
        kube_pod_container_resource_requests{
          cluster=~"$cluster",
          namespace="$namespace",
          pod="$pod",
          container!="POD",
          container!="",
          resource="memory"
        }
      ) by(container)
        >
      0
    )
  )[$__range:$__interval]
)`,
    memoryUsageMaxOverTime: `max_over_time(
  (
    max(
      node_namespace_pod_container:container_memory_working_set_bytes{
        cluster=~"$cluster",
        namespace="$namespace",
        pod="$pod",
        container!="POD",
        container!=""
      }
    ) by(container)
  )[$__range:$__interval]
)`,
    memoryUsageMaxPercentOverTime: `max_over_time(
  (
    max(
      node_namespace_pod_container:container_memory_working_set_bytes{
        cluster=~"$cluster",
        namespace="$namespace",
        pod="$pod",
        container!="POD",
        container!=""
      }
    ) by(container)
      /
    (
      sum(
        kube_pod_container_resource_requests{
          cluster=~"$cluster",
          namespace="$namespace",
          pod="$pod",
          container!="POD",
          container!="",
          resource="memory"
        }
      ) by(container)
        >
      0
    )
  )[$__range:$__interval]
)`,
    cpuDistribution: `sum(
  max(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,container)
) by(cluster,namespace,pod,container)`,
    cpuEfficiency: `sum(
  sum(
    max(
      node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
        cluster=~"$cluster",
        namespace=~"$namespace",
        pod=~"$pod"
      }
    ) by(cluster,namespace,pod,container)
  ) by(cluster,namespace,pod,container)
) by(cluster,namespace,pod,container)
  /
sum(
  max(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,container)
) by(cluster,namespace,pod,container)`,
    memoryDistribution: `sum(
  max(
    node_namespace_pod_container:container_memory_working_set_bytes{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,container)
) by(cluster,namespace,pod,container)`,
    memoryEfficiency: `sum(
  sum(
    max(
      node_namespace_pod_container:container_memory_working_set_bytes{
        cluster=~"$cluster",
        namespace=~"$namespace",
        pod=~"$pod"
      }
    ) by(cluster,namespace,pod,container)
  ) by(cluster,namespace,pod,container)
) by(cluster,namespace,pod,container)
  /
sum(
  max(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,container)
) by(cluster,namespace,pod,container)`,
    cpuPressureWaiting: `sum(
  rate(
    container_pressure_cpu_waiting_seconds_total{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(cluster,namespace,pod,container)
  >
0`,
    cpuPressureStalled: `sum(
  rate(
    container_pressure_cpu_stalled_seconds_total{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(cluster,namespace,pod,container)
  >
0`,
    memoryPressureWaiting: `sum(
  rate(
    container_pressure_memory_waiting_seconds_total{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(cluster,namespace,pod,container)
  >
0`,
    memoryPressureStalled: `sum(
  rate(
    container_pressure_memory_stalled_seconds_total{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(cluster,namespace,pod,container)
  >
0`,
    ioPressureWaiting: `sum(
  rate(
    container_pressure_io_waiting_seconds_total{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(cluster,namespace,pod,container)
  >
0`,
    ioPressureStalled: `sum(
  rate(
    container_pressure_io_stalled_seconds_total{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }[$__rate_interval]
  )
) by(cluster,namespace,pod,container)
  >
0`,
    infoJoinKey: `label_join(
  max(
    kube_pod_container_info{
      cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    cpuUsageJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    cpuRequestsJoinKey: `label_join(
  sum(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    cpuRequestsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container)
    /
  sum(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    cpuLimitsJoinKey: `label_join(
  sum(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    cpuLimitsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container)
    /
  sum(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    memoryUsageJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_memory_working_set_bytes{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    memoryRequestsJoinKey: `label_join(
  sum(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    memoryRequestsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_memory_working_set_bytes{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container)
    /
  sum(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    memoryLimitsJoinKey: `label_join(
  sum(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    memoryLimitsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_memory_working_set_bytes{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container)
    /
  sum(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod",
      container!="",
      container!="POD"
    }
  ) by(cluster,namespace,pod,container),
  "join_key",
  ".",
  "cluster",
  "namespace",
  "pod",
  "container"
)`,
    throughputRead: `sum(
  rate(
    container_fs_reads_bytes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod"
    }[$__rate_interval]
  )
) by(namespace,pod,container)`,
    throughputWrite: `-sum(
  rate(
    container_fs_writes_bytes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod"
    }[$__rate_interval]
  )
) by(namespace,pod,container)`,
    iopsRead: `sum(
  rate(
    container_fs_reads_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod"
    }[$__rate_interval]
  )
) by(namespace,pod,container)`,
    iopsWrite: `-sum(
  rate(
    container_fs_writes_total{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+",
      node=~"$node",
      namespace=~"$namespace",
      pod=~"$pod"
    }[$__rate_interval]
  )
) by(namespace,pod,container)`,
  },
  persistentVolumeClaims: {
    labelsByClusterNamespace: `label_values(kube_persistentvolumeclaim_info{cluster=~"$cluster", namespace=~"$namespace"}, persistentvolumeclaim)`,
    labelsByClusterNamespacePod: `label_values(kube_pod_spec_volumes_persistentvolumeclaims_info{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",volume!=""}, persistentvolumeclaim)`,
    labelsPodsByClusterNamespacePersistentVolumeClaim: `label_values(kube_pod_spec_volumes_persistentvolumeclaims_info{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc",volume!=""}, pod)`,
    count: `count(
  group(
    kube_persistentvolumeclaim_info{
      cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim!=""
    }
  ) by(cluster,namespace,persistentvolumeclaim)
)`,
    aboveWarningThreshold: `count(
  max(
    kubelet_volume_stats_used_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
  ) by(cluster,namespace,persistentvolumeclaim)
    and
  (
    (
      max(
        kubelet_volume_stats_used_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
      ) by(cluster,namespace,persistentvolumeclaim)
        /
      max(
        kubelet_volume_stats_capacity_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
      ) by(cluster,namespace,persistentvolumeclaim)
    )
      >=
    (80 / 100)
  )
)
  or
vector(0)`,
    fullIn5Days: `count(
  min(
    kubelet_volume_stats_available_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
  ) by(cluster,namespace,persistentvolumeclaim)
    and
  (
    predict_linear(
      (min(
        kubelet_volume_stats_available_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
      ) by(cluster,namespace,persistentvolumeclaim))[1d:],
      ((5 * 24) * 60) * 60
    )
      <
    0
  )
)
  or
vector(0)`,
    fullIn2Days: `count(
  min(
    kubelet_volume_stats_available_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
  ) by(cluster,namespace,persistentvolumeclaim)
    and
  (
    predict_linear(
      (min(
        kubelet_volume_stats_available_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
      ) by(cluster,namespace,persistentvolumeclaim))[1d:],
      ((2 * 24) * 60) * 60
    )
      <
    0
  )
)
  or
vector(0)`,
    unused: `count(
  group(
    kube_persistentvolumeclaim_info{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
  ) by(cluster,namespace,persistentvolumeclaim)
    unless on(cluster,namespace,persistentvolumeclaim)
  group(
    kube_pod_spec_volumes_persistentvolumeclaims_info{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
  ) by(cluster,namespace,persistentvolumeclaim)
)
  or
vector(0)`,
    lostState: `count(
  max(
    kube_persistentvolumeclaim_status_phase{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc",phase="Lost"}
  ) by(cluster,namespace,persistentvolumeclaim)
    ==
  1
)
  or
vector(0)`,
    pendingState: `count(
  max(
    kube_persistentvolumeclaim_status_phase{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc",phase="Pending"}
  ) by(cluster,namespace,persistentvolumeclaim)
    ==
  1
)
  or
vector(0)`,
    info: `max(
  kube_persistentvolumeclaim_info{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
) by(cluster,namespace,persistentvolumeclaim,storageclass,volumename)`,
    capacity: `max(
  kubelet_volume_stats_capacity_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(cluster,namespace,persistentvolumeclaim)`,
    requested: `max(
  kube_persistentvolumeclaim_resource_requests_storage_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(cluster,namespace,persistentvolumeclaim)`,
    used: `max(
  kubelet_volume_stats_used_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(cluster,namespace,persistentvolumeclaim)`,
    available: `min(
  kubelet_volume_stats_available_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(cluster,namespace,persistentvolumeclaim)`,
    phase: `max(
  kube_persistentvolumeclaim_status_phase{
    cluster=~"$cluster",namespace=~"$namespace",phase=~"(Pending|Lost)",persistentvolumeclaim=~"$pvc"
  }
) by(cluster,namespace,persistentvolumeclaim)
  +
max(
  kube_persistentvolumeclaim_status_phase{
    cluster=~"$cluster",namespace=~"$namespace",phase=~"(Lost)",persistentvolumeclaim=~"$pvc"
  }
) by(cluster,namespace,persistentvolumeclaim)`,
    usedPercent: `max(
  kubelet_volume_stats_used_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(cluster,namespace,persistentvolumeclaim)
  /
max(
  kubelet_volume_stats_capacity_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(cluster,namespace,persistentvolumeclaim)`,
    inodesCapacity: `max(
  kubelet_volume_stats_inodes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(cluster,namespace,persistentvolumeclaim)`,
    inodesUsed: `max(
  kubelet_volume_stats_inodes_used{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(cluster,namespace,persistentvolumeclaim)`,
    hourlyUsageRage: `deriv(
  (max(
    kubelet_volume_stats_used_bytes{
      cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
    }
  ) by(cluster,namespace,persistentvolumeclaim))[1h:]
)`,
    dailyUsageRage: `deriv(
  (max(
    kubelet_volume_stats_used_bytes{
      cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
    }
  ) by(cluster,namespace,persistentvolumeclaim))[1d:]
)`,
    weeklyUsageRage: `deriv(
  (max(
    kubelet_volume_stats_used_bytes{
      cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
    }
  ) by(cluster,namespace,persistentvolumeclaim))[1w:]
)`,
  },
};
