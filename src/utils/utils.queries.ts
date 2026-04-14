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
  max(
    namespace_cpu:kube_pod_container_resource_limits:sum{cluster=~"$cluster"}
  ) by(cluster,namespace)
)`,
    cpuRequests: `sum(
  max(
    namespace_cpu:kube_pod_container_resource_requests:sum{cluster=~"$cluster"}
  ) by(cluster,namespace)
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
          k8s_node_cpu_usage{k8s_cluster_name=~"$prometheus"},
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
  max(
    namespace_memory:kube_pod_container_resource_limits:sum{cluster=~"$cluster"}
  ) by(cluster,namespace)
)`,
    memoryRequests: `sum(
  max(
    namespace_memory:kube_pod_container_resource_requests:sum{
      cluster=~"$cluster"
    }
  ) by(cluster,namespace)
)`,
    memoryUsage: `sum(
  label_join(
    (
      max(
        node_memory_Active_file_bytes{cluster=~"$cluster"}
      ) by(cluster,instance)
        + on(cluster,instance) group_left()
      max(node_memory_AnonPages_bytes{cluster=~"$cluster"}) by(cluster,instance)
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
  )[$__range:1h]
)`,
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
  )[$__range:1h]
)`,
    costsCPUIdle: `sum_over_time(
  sum(
    label_replace(
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
                      cluster=~"$cluster",mode=~"idle"
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
                  cluster=~"$cluster"
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
          ) by(cluster,instance),
          "node",
          ",",
          "instance"
        )
      ) by(cluster,instance),
      "node",
      "$1",
      "instance",
      "([^:]+).*"
    )
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:1h]
)`,
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
  )[$__range:1h]
)`,
    costsTotalPrior30d: `sum_over_time(
  sum(max(node_total_hourly_cost{cluster=~"$cluster"} offset 30d) by(cluster,node))[30d:1h]
)
  or
vector(0)`,
    costsTotalCurrent30d: `sum_over_time(
  sum(max(node_total_hourly_cost{cluster=~"$cluster"}) by(cluster,node))[30d:1h]
)
  or
vector(0)`,
    costsPerPodCurrent30d: `(
  sum_over_time(
    sum(max(node_total_hourly_cost{cluster=~"$cluster"}) by(cluster,node))[30d:1h]
  )
    or
  vector(0)
)
  /
(
  avg_over_time(
    sum(max(kubelet_running_pods{cluster=~"$cluster"}) by(cluster,instance))[30d:1h]
  )
    or
  vector(0)
)`,
    costsPotentialSavings: `(
  (
    (
      (
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
          (
            vector(0)
              +
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
          )
        )
          or
        (
          vector(0)
            +
          sum(
            max(node_gpu_count{cluster=~"$cluster"}) by(cluster,node)
              - on(cluster,node) group_left()
            (
              sum(
                max(
                  container_gpu_allocation{cluster=~"$cluster"}
                ) by(cluster,node,namespace,pod,container)
              ) by(cluster,node)
                * on(cluster,node) group_left()
              max(node_gpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
            )
          )
        )
      )
        or
      (
        vector(0)
          +
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
      )
    )
      or
    vector(0)
  )
    *
  24
)
  *
30`,
  },
  nodes: {
    info: `avg_over_time(
  (max(kube_node_info{cluster=~"$cluster",node=~".+"}) by(cluster,node))[$__range:]
)`,
    count: `count(kube_node_info{cluster=~"$cluster",node!=""})`,
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
  )[$__range:]
)
  / on(cluster,node) group_left()
max(
  kube_node_status_capacity{cluster=~"$cluster",resource=~"cpu",node=~".+"}
) by(cluster,node,resource)`,
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
  )[$__range:]
)
  / on(cluster,node) group_left()
max(
  kube_node_status_capacity{cluster=~"$cluster",resource=~"cpu",node=~".+"}
) by(cluster,node,resource)`,
    memoryUsageAvgOverTime: `avg_over_time(
  (
    sum(
      label_join(
        (
          max(
            node_memory_Active_file_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
            + on(cluster,instance) group_left()
          max(
            node_memory_AnonPages_bytes{cluster=~"$cluster",instance=~".+"}
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
            node_memory_Active_file_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
            + on(cluster,instance) group_left()
          max(
            node_memory_AnonPages_bytes{cluster=~"$cluster",instance=~".+"}
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
)
  / on(cluster,node) group_left()
max(
  kube_node_status_capacity{cluster=~"$cluster",resource=~"memory",node=~".+"}
) by(cluster,node,resource)`,
    memoryUsageMaxOverTime: `max_over_time(
  (
    sum(
      label_join(
        (
          max(
            node_memory_Active_file_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
            + on(cluster,instance) group_left()
          max(
            node_memory_AnonPages_bytes{cluster=~"$cluster",instance=~".+"}
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
            node_memory_Active_file_bytes{cluster=~"$cluster",instance=~".+"}
          ) by(cluster,instance)
            + on(cluster,instance) group_left()
          max(
            node_memory_AnonPages_bytes{cluster=~"$cluster",instance=~".+"}
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
)
  / on(cluster,node) group_left()
max(
  kube_node_status_capacity{cluster=~"$cluster",resource=~"memory",node=~".+"}
) by(cluster,node,resource)`,
    alertsCount: `count(
  ALERTS{node!="",alertname=~"(Kube.*|CPUThrottlingHigh)",alertstate=~"firing"}
    or
  (
    max(
      ALERTS{
        node="",
        pod!="",
        alertname=~"(Kube.*|CPUThrottlingHigh)",
        alertstate=~"firing"
      }
    ) by(cluster,namespace,pod)
      * on(cluster,namespace,pod) group_left(node)
    max(kube_pod_info{node!="",node!=""}) by(cluster,namespace,pod,node)
  )
) by(cluster,node)`,
    cpuCapacity: `max(
  kube_node_status_capacity{
    cluster=~"$cluster",
    node=~"$node(:[0-9]{2,5})?",
    resource=~"cpu"
  }
) by(cluster,node,resource)`,
    cpuLimits: `sum(
  max(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{
      container!="",
      cluster=~"$cluster",
      node=~"$node(:[0-9]{2,5})?"
    }
  ) by(cluster,namespace,node,pod,container)
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
  max(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
      container!="",
      cluster=~"$cluster",
      node=~"$node(:[0-9]{2,5})?"
    }
  ) by(cluster,namespace,node,pod,container,resource)
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
  max(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{
      container!="",
      cluster=~"$cluster",
      node=~"$node(:[0-9]{2,5})?"
    }
  ) by(cluster,namespace,node,pod,container)
)`,
    memoryRequests: `sum(
  max(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
      container!="",
      cluster=~"$cluster",
      node=~"$node(:[0-9]{2,5})?"
    }
  ) by(cluster,namespace,node,pod,container,resource)
)`,
    memoryUsage: `label_join(
  (
    max(
      node_memory_Active_file_bytes{
        cluster=~"$cluster",
        instance=~"$node"
      }
    ) by(cluster,instance)
      + on(cluster,instance) group_left()
    max(
      node_memory_AnonPages_bytes{
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
  max(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
      cluster=~"$cluster",
      node=~"$node",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,container,node)
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
  max(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
      cluster=~"$cluster",
      node=~"$node",
      pod=~"$pod"
    }
  ) by(cluster,namespace,pod,container,node)
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
  ) by(cluster,instance,device)
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
  ) by(cluster,instance,device)
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
  )[$__range:1h]
)`,
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
  )[$__range:1h]
)`,
    costsCPUIdle: `sum_over_time(
  sum by(cluster,node)(
    label_replace(
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
                rate(
                  k8s_node_cpu_time_seconds_total{
                    k8s_cluster_name=~"$cluster",
                    k8s_node_name=~"$node(:[0-9]{2,5})?"
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
          ) by(cluster,instance),
          "node",
          ",",
          "instance"
        )
      ) by(cluster,node,instance),
      "node",
      "$1",
      "instance",
      "([^:]+).*"
    )
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{
        cluster=~"$cluster",
        node=~"$node(:[0-9]{2,5})?"
      }
    ) by(cluster,node)
  )[$__range:1h]
)`,
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
  )[$__range:1h]
)`,
  },
  namespaces: {
    labelsByCluster: `label_values(kube_namespace_status_phase{cluster=~"$cluster"}, namespace)`,
    count: `count(
  group(
    kube_namespace_status_phase{cluster=~"$cluster",namespace=~"$namespace"}
  ) by(namespace)
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
  )[$__range:$__interval]
)
  / on(cluster,namespace) group_left()
sum(
  namespace_cpu:kube_pod_container_resource_requests:sum{
    namespace=~"$namespace",cluster=~"$cluster"
  }
) by(cluster,namespace)`,
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
  )[$__range:$__interval]
)
  / on(cluster,namespace) group_left()
sum(
  namespace_cpu:kube_pod_container_resource_requests:sum{
    cluster=~"$cluster",namespace=~"$namespace"
  }
) by(cluster,namespace)`,
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
  )[$__range:$__interval]
)
  / on(cluster,namespace) group_left()
sum(
  namespace_memory:kube_pod_container_resource_requests:sum{
    cluster=~"$cluster",namespace=~"$namespace"
  }
) by(cluster,namespace)`,
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
  )[$__range:$__interval]
)
  / on(cluster,namespace) group_left()
sum(
  namespace_memory:kube_pod_container_resource_requests:sum{
    cluster=~"$cluster",namespace=~"$namespace"
  }
) by(cluster,namespace)`,
    alertsCount: `count(
  ALERTS{
    alertname=~"(Kube.*|CPUThrottlingHigh)",
    alertstate=~"firing",
    cluster=~"$cluster",
    namespace=~"$namespace"
  }
) by(cluster,namespace)`,
    cpuAllocation: `max(
  namespace_cpu:kube_pod_container_resource_requests:sum{
    cluster=~"$cluster",namespace="$namespace"
  }
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
    cpuLimits: `max(
  namespace_cpu:kube_pod_container_resource_limits:sum{
    cluster=~"$cluster",namespace=~"$namespace"
  }
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
    cpuRequests: `max(
  namespace_cpu:kube_pod_container_resource_requests:sum{
    cluster=~"$cluster",namespace=~"$namespace"
  }
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
  namespace_memory:kube_pod_container_resource_requests:sum{
    cluster=~"$cluster",namespace="$namespace"
  }
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
    memoryLimits: `max(
  namespace_memory:kube_pod_container_resource_limits:sum{
    cluster=~"$cluster",namespace=~"$namespace"
  }
) by(cluster,namespace)`,
    memoryRequests: `max(
  namespace_memory:kube_pod_container_resource_requests:sum{
    cluster=~"$cluster",namespace=~"$namespace"
  }
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
        kube_pod_container_resource_requests{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="POD",
          container!="",
          resource="cpu"
        }
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
          label_replace(
            rate(
              container_cpu_usage_seconds_total{
                cluster=~"$cluster",
                namespace=~"$namespace",
                node="",
                container!="POD",
                container!=""
              }[$__rate_interval]
            ),
            "node",
            "$1",
            "instance",
            "([^:]+).*"
          )
        ) by(cluster,namespace,node,pod,container)
      ) by(cluster,namespace,node)
    ) by(cluster,namespace,node)
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:1h]
)`,
    costsMemoryAllocation: `sum_over_time(
  sum by (namespace)(
    (
      (
        (
          max(
            sum(
              kube_pod_container_resource_requests{
                cluster=~"$cluster",
                namespace=~"$namespace",
                container!="POD",
                container!="",
                resource="memory"
              }
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
                label_replace(
                  container_memory_working_set_bytes{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node="",
                    container!="POD",
                    container!=""
                  },
                  "node",
                  "$1",
                  "instance",
                  "([^:]+).*"
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
  )[$__range:1h]
)`,
    costsCPUIdle: `sum_over_time(
  sum(
    (
      sum(
        kube_pod_container_resource_requests{
          cluster=~"$cluster",
          namespace=~"$namespace",
          container!="POD",
          container!="",
          resource="cpu"
        }
      ) by(cluster,node,resource)
        - on(cluster,node) group_left()
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
          label_replace(
            rate(
              container_cpu_usage_seconds_total{
                cluster=~"$cluster",
                namespace=~"$namespace",
                node="",
                container!="POD",
                container!=""
              }[$__rate_interval]
            ),
            "node",
            "$1",
            "instance",
            "([^:]+).*"
          )
        ) by(cluster,namespace,node,pod,container)
      ) by(cluster,node)
    )
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:1h]
)`,
    costsMemoryIdle: `sum_over_time(
  sum(
    (
      (
        (
          (
            sum(
              kube_pod_container_resource_requests{
                cluster=~"$cluster",
                namespace=~"$namespace",
                container!="POD",
                container!="",
                resource="memory"
              }
            ) by(cluster,node)
              - on(cluster,node) group_left()
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
                label_replace(
                  container_memory_working_set_bytes{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node="",
                    container!="POD",
                    container!=""
                  },
                  "node",
                  "$1",
                  "instance",
                  "([^:]+).*"
                )
              ) by(cluster,namespace,node,pod,container)
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
    max(
      node_ram_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:1h]
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
) by(cluster,namespace,workload,workload_type)
`,
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
  namespace_workload_pod:kube_pod_owner:relabel{
    cluster=~"$cluster",
    namespace=~"$namespace",
    workload=~"$workload",
    workload_type!="replicaset",
    workload_type!="deployment",
    workload_type!="daemonset",
    workload_type!="statefulset"
  }
) by(cluster,namespace,workload,workload_type)`,
    cpuUsageAvgOverTime: `sum(
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
  avg_over_time(
    (
      sum(
        max(
          node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~".+-.+",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,pod,container)
      ) by(cluster,namespace,pod)
    )[$__range:$__interval]
  )
) by(cluster,namespace,workload,workload_type)`,
    cpuUsageAvgPercentOverTime: `sum(
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
  avg_over_time(
    (
      sum(
        max(
          node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~".+-.+",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,pod,container)
      ) by(cluster,namespace,pod)
    )[$__range:$__interval]
  )
) by(cluster,namespace,workload,workload_type)
  /
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
    kube_pod_container_resource_requests{
      cluster=~"$cluster",
      namespace=~"$namespace",
      container!="POD",
      container!="",
      pod=~".+-.+",
      resource="cpu"
    }
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    cpuUsageMaxOverTime: `sum(
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
  max_over_time(
    (
      sum(
        max(
          node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~".+-.+",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
    )[$__range:$__interval]
  )
) by(cluster,namespace,workload,workload_type)`,
    cpuUsageMaxPercentOverTime: `sum(
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
  max_over_time(
    (
      sum(
        max(
          node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~".+-.+",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
    )[$__range:$__interval]
  )
) by(cluster,namespace,workload,workload_type)
  /
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
    kube_pod_container_resource_requests{
      cluster=~"$cluster",
      namespace=~"$namespace",
      container!="POD",
      container!="",
      pod=~".+-.+",
      resource="cpu"
    }
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    memoryUsageAvgOverTime: `sum(
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
  avg_over_time(
    (
      sum(
        max(
          node_namespace_pod_container:container_memory_working_set_bytes{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~".+-.+",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
    )[$__range:$__interval]
  )
) by(cluster,namespace,workload,workload_type)`,
    memoryUsageAvgPercentOverTime: `sum(
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
  avg_over_time(
    (
      sum(
        max(
          node_namespace_pod_container:container_memory_working_set_bytes{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~".+-.+",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
    )[$__range:$__interval]
  )
) by(cluster,namespace,workload,workload_type)
  /
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
    kube_pod_container_resource_requests{
      cluster=~"$cluster",
      namespace=~"$namespace",
      container!="POD",
      container!="",
      pod=~".+-.+",
      resource="memory"
    }
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    memoryUsageMaxOverTime: `sum(
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
  max_over_time(
    (
      sum(
        max(
          node_namespace_pod_container:container_memory_working_set_bytes{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~".+-.+",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
    )[$__range:$__interval]
  )
) by(cluster,namespace,workload,workload_type)`,
    memoryUsageMaxPercentOverTime: `sum(
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
  max_over_time(
    (
      sum(
        max(
          node_namespace_pod_container:container_memory_working_set_bytes{
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~".+-.+",
            container!="POD",
            container!=""
          }
        ) by(cluster,namespace,pod,container)
      ) by(cluster,namespace,pod)
    )[$__range:$__interval]
  )
) by(cluster,namespace,workload,workload_type)
  /
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
    kube_pod_container_resource_requests{
      cluster=~"$cluster",
      namespace=~"$namespace",
      container!="POD",
      container!="",
      pod=~".+-.+",
      resource="memory"
    }
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    alertsCount: `sum(
  (
    (
      (
        (
          (
            group(
              ALERTS{
                alertname=~"(Kube.*|CPUThrottlingHigh)",
                alertstate=~"firing",
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~".+-.+"
              }
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
          )
            or
          label_replace(
            label_replace(
              ALERTS{
                alertname=~"(Kube.*|CPUThrottlingHigh)",
                alertstate=~"firing",
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"",
                replicaset=~"$workload"
              },
              "workload_type",
              "",
              "replicaset",
              ""
            ),
            "workload",
            "$1",
            "replicaset",
            "(.*)"
          )
        )
          or
        label_replace(
          label_replace(
            ALERTS{
              alertname=~"(Kube.*|CPUThrottlingHigh)",
              alertstate=~"firing",
              cluster=~"$cluster",
              namespace=~"$namespace",
              pod=~"",
              daemonset=~"$workload"
            },
            "workload_type",
            "",
            "daemonset",
            ""
          ),
          "workload",
          "$1",
          "daemonset",
          "(.*)"
        )
      )
        or
      label_replace(
        label_replace(
          ALERTS{
            alertname=~"(Kube.*|CPUThrottlingHigh)",
            alertstate=~"firing",
            cluster=~"$cluster",
            namespace=~"$namespace",
            pod=~"",
            deployment=~"$workload"
          },
          "workload_type",
          "",
          "deployment",
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
          alertname=~"(Kube.*|CPUThrottlingHigh)",
          alertstate=~"firing",
          cluster=~"$cluster",
          namespace=~"$namespace",
          pod=~"",
          statefulset=~"$workload"
        },
        "workload_type",
        "",
        "statefulset",
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
        alertname=~"(Kube.*|CPUThrottlingHigh)",
        alertstate=~"firing",
        cluster=~"$cluster",
        namespace=~"$namespace",
        pod=~"",
        job_name=~"$workload"
      },
      "workload_type",
      "",
      "job",
      ""
    ),
    "workload",
    "$1",
    "job_name",
    "(.*)"
  )
) by(cluster,namespace,workload,workload_type)`,
    cpuAllocation: `max(
  sum(
    max(
      cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace",
        pod=~"$pod"
      }
    ) by(cluster,namespace,node,pod,container,resource)
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
  max(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,node,pod,container)
)`,
    cpuRequests: `sum(
  max(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,node,pod,container,resource)
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
    kube_pod_container_resource_requests{
      cluster=~"$cluster",
      namespace="$namespace",
      pod=~"$pod",
      container!="POD",
      container!="",
      resource="memory"
    }
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
  max(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,node,pod,container)
)`,
    memoryRequests: `sum(
  max(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,node,pod,container,resource)
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
  namespace_workload_pod:kube_pod_owner:relabel{
    cluster=~"$cluster",
    namespace=~"$namespace",
    workload=~"$workload",
    workload_type=~"$workloadtype"
  }
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
  max(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace"
    }
  ) by(cluster,namespace,pod,container)
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
  max(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
      container!="POD",
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace"
    }
  ) by(cluster,namespace,pod,container)
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
    max(
      cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
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
    max(
      cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
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
    cpuLimitsJoinKey: `label_join(
  sum(
    max(
      cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{
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
    max(
      cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{
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
    max(
      cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
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
    max(
      cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
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
    memoryLimitsJoinKey: `label_join(
  sum(
    max(
      cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{
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
    max(
      cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{
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
    * on(cluster,namespace,pod) group_left()
  sum(
    sum_over_time(
      (
        sum(
          max(
            sum(
              kube_pod_container_resource_requests{
                cluster=~"$cluster",
                namespace=~"$namespace",
                container!="POD",
                container!="",
                pod=~".+",
                resource="cpu"
              }
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
              label_replace(
                rate(
                  container_cpu_usage_seconds_total{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node="",
                    pod=~".+",
                    container!="POD",
                    container!=""
                  }[$__rate_interval]
                ),
                "node",
                "$1",
                "instance",
                "([^:]+).*"
              )
            ) by(cluster,namespace,node,pod)
          ) by(cluster,namespace,node,pod)
            * on(cluster,node) group_left()
          max(node_cpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
        ) by(cluster,namespace,pod)
      )[$__range:1h]
    )
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    costsMemoryAllocation: `sum(
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
    * on(cluster,namespace,pod) group_left()
  sum(
    sum_over_time(
      (
        sum(
          (
            (
              (
                max(
                  sum(
                    kube_pod_container_resource_requests{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      pod=~".+",
                      container!="POD",
                      container!="",
                      resource="memory"
                    }
                  ) by(cluster,node,pod,resource)
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
                    label_replace(
                      container_memory_working_set_bytes{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        node="",
                        pod=~".+",
                        container!="POD",
                        container!=""
                      },
                      "node",
                      "$1",
                      "instance",
                      "([^:]+).*"
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
      )[$__range:1h]
    )
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    costsCPUIdle: `sum(
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
    * on(cluster,namespace,pod) group_left()
  sum(
    sum_over_time(
      (
        sum(
          (
            sum(
              kube_pod_container_resource_requests{
                cluster=~"$cluster",
                namespace=~"$namespace",
                container!="POD",
                container!="",
                pod=~".+",
                resource="cpu"
              }
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
              label_replace(
                rate(
                  container_cpu_usage_seconds_total{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    node="",
                    pod=~".+",
                    container!="POD",
                    container!=""
                  }[$__rate_interval]
                ),
                "node",
                "$1",
                "instance",
                "([^:]+).*"
              )
            ) by(cluster,namespace,node,pod)
          )
            * on(cluster,node) group_left()
          max(node_cpu_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
        ) by(cluster,namespace,pod)
      )[$__range:1h]
    )
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    costsMemoryIdle: `sum(
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
    * on(cluster,namespace,pod) group_left()
  sum(
    sum_over_time(
      (
        sum(
          (
            (
              (
                (
                  sum(
                    kube_pod_container_resource_requests{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      container!="POD",
                      container!="",
                      pod=~".+",
                      resource="memory"
                    }
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
                    label_replace(
                      container_memory_working_set_bytes{
                        cluster=~"$cluster",
                        namespace=~"$namespace",
                        node="",
                        pod=~".+",
                        container!="POD",
                        container!=""
                      },
                      "node",
                      "$1",
                      "instance",
                      "([^:]+).*"
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
      )[$__range:1h]
    )
  ) by(cluster,namespace,pod)
) by(cluster,namespace,workload,workload_type)`,
    search: `sum(
  namespace_workload_pod:kube_pod_owner:relabel{
    cluster=~"$cluster",namespace=~".+",workload=~"$searchterm"
  }
) by(namespace,workload,workload_type)`,
  },
  pods: {
    count: `count(kube_pod_info{cluster=~"$cluster", namespace=~"$namespace", pod!=""})`,
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
  )[$__range:$__interval]
)
  /
sum(
  kube_pod_container_resource_requests{
    cluster=~"$cluster",
    node=~"$node",
    namespace=~"$namespace",
    pod=~"$pod",
    container!="POD",
    container!="",
    resource="cpu"
  }
) by(cluster,namespace,pod)`,
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
  )[$__range:$__interval]
)
  /
sum(
  kube_pod_container_resource_requests{
    cluster=~"$cluster",
    node=~"$node",
    namespace=~"$namespace",
    pod=~"$pod",
    container!="POD",
    container!="",
    resource="cpu"
  }
) by(cluster,namespace,pod)`,
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
  )[$__range:$__interval]
)
  /
sum(
  kube_pod_container_resource_requests{
    cluster=~"$cluster",
    node=~"$node",
    namespace=~"$namespace",
    pod=~"$pod",
    container!="POD",
    container!="",
    resource="memory"
  }
) by(cluster,namespace,pod)`,
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
  )[$__range:$__interval]
)
  /
sum(
  kube_pod_container_resource_requests{
    cluster=~"$cluster",
    node=~"$node",
    namespace=~"$namespace",
    pod=~"$pod",
    container!="POD",
    container!="",
    resource="memory"
  }
) by(cluster,namespace,pod)`,
    alertsCount: `ALERTS{
  pod=~"$pod",
  alertname=~"(Kube.*|CPUThrottlingHigh)",
  alertstate=~"firing",
  cluster=~"$cluster",
  namespace=~"$namespace"
}`,
    cpuAllocation: `max(
  sum(
    max(
      cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace",
        pod=~"$pod"
      }
    ) by(cluster,namespace,node,pod,container,resource)
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
  max(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,node,pod,container)
) by(pod)`,
    cpuRequests: `sum(
  max(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,node,pod,container,resource)
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
    max(
      cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
        container!="",
        cluster=~"$cluster",
        namespace=~"$namespace",
        pod=~"$pod"
      }
    ) by(cluster,namespace,node,pod,container,resource)
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
  max(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,node,pod,container)
) by(pod)`,
    memoryRequests: `sum(
  max(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
      container!="",
      cluster=~"$cluster",
      namespace=~"$namespace",
      pod=~"$pod"
    }
  ) by(cluster,namespace,node,pod,container,resource)
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
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
      cluster=~"$cluster",
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
    cpuRequestsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
      cluster=~"$cluster",node=~"$node",pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node)
    /
  sum(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests{
      cluster=~"$cluster",node=~"$node",pod=~"$pod"
    }
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
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{
      cluster=~"$cluster",
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
    cpuLimitsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m{
      cluster=~"$cluster",node=~"$node",pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node)
    /
  sum(
    cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits{
      cluster=~"$cluster",node=~"$node",pod=~"$pod"
    }
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
    cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
      cluster=~"$cluster",
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
    memoryRequestsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_memory_working_set_bytes{
      cluster=~"$cluster",node=~"$node",pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node)
    /
  sum(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_requests{
      cluster=~"$cluster",node=~"$node",pod=~"$pod"
    }
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
    cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{
      cluster=~"$cluster",
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
    memoryLimitsPercentJoinKey: `label_join(
  sum(
    node_namespace_pod_container:container_memory_working_set_bytes{
      cluster=~"$cluster",node=~"$node",pod=~"$pod"
    }
  ) by(cluster,namespace,pod,node)
    /
  sum(
    cluster:namespace:pod_memory:active:kube_pod_container_resource_limits{
      cluster=~"$cluster",node=~"$node",pod=~"$pod"
    }
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
        kube_pod_container_resource_requests{
          cluster=~"$cluster",
          namespace=~"$namespace",
          pod=~"$pod",
          container=~".+",
          node=~"$node",
          resource="cpu"
        }
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
            }[$__rate_interval]
          )
            or
          label_replace(
            rate(
              container_cpu_usage_seconds_total{
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"$pod",
                container=~".+",
                node=~"$node"
              }[$__rate_interval]
            ),
            "node",
            "$1",
            "instance",
            "([^:]+).*"
          )
        ) by(cluster,node,namespace,pod,container)
      ) by(cluster,node,namespace,pod)
    ) by(cluster,node,namespace,pod)
      * on(cluster,node) group_left()
    max(
      node_cpu_hourly_cost{cluster=~"$cluster"}
    ) by(cluster,node)
  )[$__range:1h]
)`,
    costsMemoryAllocation: `sum_over_time(
  sum by(cluster,namespace,pod)(
    (
      (
        (
          max(
            sum(
              kube_pod_container_resource_requests{
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"$pod",
                container=~".+",
                node=~"$node",
                resource="memory"
              }
            ) by(cluster,node,namespace,pod,resource)
              or
            sum(
              max(
                container_memory_working_set_bytes{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  pod=~"$pod",
                  container=~".+",
                  node=~"$node"
                }
                  or
                label_replace(
                  container_memory_working_set_bytes{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    pod=~"$pod",
                    container=~".+",
                    node=~"$node"
                  },
                  "node",
                  "$1",
                  "instance",
                  "([^:]+).*"
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
  )[$__range:1h]
)`,
    costsCPUIdle: `sum_over_time(
  sum by(cluster,namespace,pod)(
    (
      (
        (
          (
            sum(
              kube_pod_container_resource_requests{
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"$pod",
                container=~".+",
                node=~"$node",
                resource="memory"
              }
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
                    node=~"$node"
                  }[$__rate_interval]
                )
                  or
                label_replace(
                  rate(
                    container_cpu_usage_seconds_total{
                      cluster=~"$cluster",
                      namespace=~"$namespace",
                      pod=~"$pod",
                      container=~".+",
                      node=~"$node"
                    }[$__rate_interval]
                  ),
                  "node",
                  "$1",
                  "instance",
                  "([^:]+).*"
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
    max(node_ram_hourly_cost{cluster=~"$cluster"}) by(cluster,node)
  )[$__range:1h]
)`,
    costsMemoryIdle: `sum_over_time(
  sum by(cluster,namespace,pod)(
    (
      (
        (
          (
            sum(
              kube_pod_container_resource_requests{
                cluster=~"$cluster",
                namespace=~"$namespace",
                pod=~"$pod",
                container=~".+",
                node=~"$node",
                resource="memory"
              }
            ) by(cluster,namespace,pod)
              - on(cluster,namespace,pod) group_left(node)
            sum(
              max(
                container_memory_working_set_bytes{
                  cluster=~"$cluster",
                  namespace=~"$namespace",
                  pod=~"$pod",
                  container=~".+",
                  node=~"$node"
                }
                  or
                label_replace(
                  container_memory_working_set_bytes{
                    cluster=~"$cluster",
                    namespace=~"$namespace",
                    pod=~"$pod",
                    container=~".+",
                    node=~"$node"
                  },
                  "node",
                  "$1",
                  "instance",
                  "([^:]+).*"
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
  )[$__range:1h]
)`,
    search: `sum(
  namespace_workload_pod:kube_pod_owner:relabel{
    cluster=~"$cluster",namespace=~".+",pod=~"$searchterm"
  }
) by(namespace,pod)`,
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
  )[$__range:$__interval]
)
  /
sum(
  kube_pod_container_resource_requests{
    cluster=~"$cluster",
    namespace="$namespace",
    pod="$pod",
    container!="POD",
    container!="",
    resource="cpu"
  }
) by(container)`,
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
  )[$__range:$__interval]
)
  /
sum(
  kube_pod_container_resource_requests{
    cluster=~"$cluster",
    namespace="$namespace",
    pod="$pod",
    container!="POD",
    container!="",
    resource="cpu"
  }
) by(container)`,
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
  )[$__range:$__interval]
)
  /
sum(
  kube_pod_container_resource_requests{
    cluster=~"$cluster",
    namespace="$namespace",
    pod="$pod",
    container!="POD",
    container!="",
    resource="memory"
  }
) by(container)`,
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
  )[$__range:$__interval]
)
  /
sum(
  kube_pod_container_resource_requests{
    cluster=~"$cluster",
    namespace="$namespace",
    pod="$pod",
    container!="POD",
    container!="",
    resource="memory"
  }
) by(container)`,
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
  kube_persistentvolumeclaim_info{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim!=""
  }
)`,
    aboveWarningThreshold: `count(
  max(
    kubelet_volume_stats_used_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
  ) by(persistentvolumeclaim,namespace)
    and
  (
    (
      max(
        kubelet_volume_stats_used_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
      ) by(persistentvolumeclaim,namespace)
        /
      max(
        kubelet_volume_stats_capacity_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
      ) by(persistentvolumeclaim,namespace)
    )
      >=
    (80 / 100)
  )
)
  or
vector(0)`,
    fullIn5Days: `count(
  kubelet_volume_stats_available_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
    and
  (
    predict_linear(
      kubelet_volume_stats_available_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}[1d],
      ((5 * 24) * 60) * 60
    )
      <
    0
  )
)
  or
vector(0)`,
    fullIn2Days: `count(
  kubelet_volume_stats_available_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
    and
  (
    predict_linear(
      kubelet_volume_stats_available_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}[1d],
      ((2 * 24) * 60) * 60
    )
      <
    0
  )
)
  or
vector(0)`,
    unused: `sum(
  count(
    kube_persistentvolumeclaim_info{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
  ) by(persistentvolumeclaim,namespace)
    unless
  count(
    kubelet_volume_stats_available_bytes{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
  ) by(persistentvolumeclaim,namespace)
)
  or
vector(0)`,
    lostState: `count(
  kube_persistentvolumeclaim_status_phase{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc",phase="Lost"}
    ==
  1
)
  or
vector(0)`,
    pendingState: `count(
  kube_persistentvolumeclaim_status_phase{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc",phase="Pending"}
    ==
  1
)
  or
vector(0)`,
    info: `sum(
  kube_persistentvolumeclaim_info{cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"}
) by(persistentvolumeclaim,namespace,storageclass,volumename)`,
    capacity: `sum(
  kubelet_volume_stats_capacity_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(persistentvolumeclaim,namespace)`,
    requested: `sum(
  kube_persistentvolumeclaim_resource_requests_storage_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(persistentvolumeclaim,namespace)`,
    used: `sum(
  kubelet_volume_stats_used_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(persistentvolumeclaim,namespace)`,
    available: `sum(
  kubelet_volume_stats_available_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(persistentvolumeclaim,namespace)`,
    phase: `sum(
  kube_persistentvolumeclaim_status_phase{
    cluster=~"$cluster",namespace=~"$namespace",phase=~"(Pending|Lost)",persistentvolumeclaim=~"$pvc"
  }
) by(persistentvolumeclaim,namespace)
  +
sum(
  kube_persistentvolumeclaim_status_phase{
    cluster=~"$cluster",namespace=~"$namespace",phase=~"(Lost)",persistentvolumeclaim=~"$pvc"
  }
) by(persistentvolumeclaim,namespace)`,
    usedPercent: `sum(
  kubelet_volume_stats_used_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
    /
  kubelet_volume_stats_capacity_bytes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(persistentvolumeclaim,namespace)`,
    inodesCapacity: `sum(
  kubelet_volume_stats_inodes{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(persistentvolumeclaim,namespace)`,
    inodesUsed: `sum(
  kubelet_volume_stats_inodes_used{
    cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
  }
) by(persistentvolumeclaim,namespace)`,
    hourlyUsageRage: `sum(
  rate(
    kubelet_volume_stats_used_bytes{
      cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
    }[1h]
  )
) by(namespace,persistentvolumeclaim)`,
    dailyUsageRage: `sum(
  rate(
    kubelet_volume_stats_used_bytes{
      cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
    }[1d]
  )
) by(namespace,persistentvolumeclaim)`,
    weeklyUsageRage: `sum(
  rate(
    kubelet_volume_stats_used_bytes{
      cluster=~"$cluster",namespace=~"$namespace",persistentvolumeclaim=~"$pvc"
    }[1w]
  )
) by(namespace,persistentvolumeclaim)`,
  },
};
