import * as React from "react";
import * as moment from "moment";
import { Helmet } from "react-helmet";
import {
  ApplicationTree,
  Event,
  GroupBy,
  Node,
  ResourceName,
  ResourceStats,
  ResourceStatus,
  ResourceUsageStats,
  SortType,
  TreeStats,
} from "./types";

const countNodesInTree = (tree: ApplicationTree): number => {
  return (tree.nodes || []).length + (tree.orphanedNodes || []).length;
};

const processResourceStats = (resources: ResourceStatus[]): ResourceStats => {
  let outOfSync = 0;
  for (const resource of resources) {
    if (resource.status === "OutOfSync") {
      outOfSync++;
    }
  }
  return { outOfSync };
};

const processTreeStats = (tree: ApplicationTree): TreeStats => {
  const pods = (tree.nodes || []).reduce((acc, node) => {
    if (node.kind === "Pod") {
      return acc + 1;
    }
    return acc;
  }, 0);

  return { pods };
};

const averageResourceUsage = (nodes: Node[]) => {
  const memory = {
    requested: 0,
    capacity: 0,
  };
  const cpu = {
    requested: 0,
    capacity: 0,
  };
  for (const node of nodes || []) {
    for (const info of node.resourcesInfo || []) {
      if (info.resourceName === ResourceName.ResourceCPU) {
        cpu.requested += info.requestedByApp;
        cpu.capacity += info.capacity;
      }
      if (info.resourceName === ResourceName.ResourceMemory) {
        memory.requested += info.requestedByApp;
        memory.capacity += info.capacity;
      }
    }
  }

  const percent = (num: number) => Math.round(num * 10000) / 100;
  return {
    memory: percent(memory.requested / memory.capacity),
    cpu: percent(cpu.requested / cpu.capacity),
  };
};

const colorForPressure = (percent: number) => {
  if (percent < 50) {
    return "#1aab85";
  }
  if (percent < 75) {
    return "#d28f20";
  }
  return "#b80118";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TimelineView = (props: {
  tree: any;
  application: any;
  events: Event[];
}) => {
  const [sortBy, setSortBy] = React.useState<SortType>(SortType.New);
  const [groupBy, setGroupBy] = React.useState<GroupBy>(GroupBy.OneMin);

  const [resourceStats, setResourceStats] = React.useState<ResourceStats>({
    outOfSync: 0,
  });
  const [treeStats, setTreeStats] = React.useState<TreeStats>({} as TreeStats);
  const [resourceUsage, setResourceUsage] = React.useState<ResourceUsageStats>(
    {} as ResourceUsageStats
  );

  const [warningsOnlyFilter, setWarningsOnlyFilter] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    const stats = processResourceStats(
      props.application?.status?.resources || []
    );
    setResourceStats(stats);
  }, [props.application?.status?.resources]);

  React.useEffect(() => {
    const stats = processTreeStats(props.tree);
    setTreeStats(stats);
  }, [props.tree]);

  React.useEffect(() => {
    const usage = averageResourceUsage(props.tree.hosts || []);
    setResourceUsage(usage);
  }, [props.tree.hosts]);

  return (
    <div style={{ fontFamily: "Poppins", width: "95%" }}>
      <Helmet>
        <style>
          @import
          url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        </style>
      </Helmet>

      <div
        style={{
          display: "flex",
          marginBottom: "1em",
          alignItems: "center",
          width: "100%",
          paddingRight: "2em",
        }}
      >
        <MetricItem
          label="TOTAL RESOURCES"
          value={countNodesInTree(props.tree)}
          icon="project-diagram"
        />
        <MetricItem label="TOTAL PODS" value={treeStats.pods} icon="th" />
        <MetricItem
          label="OUT OF SYNC"
          value={resourceStats.outOfSync}
          icon="arrow-circle-up"
        />
        <MetricItem
          label="NODES"
          value={(props.tree.hosts || []).length}
          icon="server"
        />
        <MetricItem
          label="MEMORY PRESSURE"
          value={resourceUsage.memory}
          percent={true}
          background={colorForPressure(resourceUsage.memory)}
          dark={true}
          icon="memory"
        />
        <MetricItem
          label="CPU PRESSURE"
          value={resourceUsage.cpu}
          percent={true}
          background={colorForPressure(resourceUsage.cpu)}
          dark={true}
          icon="microchip"
        />
        {new Array(5).fill(0).map(() => (
          <MetricItem />
        ))}
      </div>

      <div style={{ display: "flex", marginBottom: "1em" }}>
        <div>
          {" "}
          <Label>SORT BY</Label>
          <div
            style={{
              display: "flex",
              alignSelf: "self-start",
              marginRight: "1em",
            }}
          >
            <Button
              onClick={() => setSortBy(SortType.New)}
              selected={sortBy === SortType.New}
              icon="baby"
            >
              NEW
            </Button>
            <Button
              onClick={() => setSortBy(SortType.Old)}
              selected={sortBy === SortType.Old}
              icon="history"
            >
              OLD
            </Button>
          </div>
        </div>

        <div>
          <Label>GROUP INTERVAL</Label>
          <select
            value={groupBy}
            onChange={(e) => {
              setGroupBy(GroupBy[e.target.value]);
            }}
            style={{
              outline: "none",
              appearance: "none",
              border: "none",
              padding: "0.5em",
            }}
          >
            <option value={GroupBy.TenSec}>10 sec</option>
            <option value={GroupBy.OneMin}>1 min</option>
            <option value={GroupBy.FiveMin}>5 min</option>
            <option value={GroupBy.TwentyMin}>20 min</option>
          </select>
        </div>

        <Button
          style={{ marginLeft: "2em" }}
          onClick={() => {
            alert(
              "Hello Kubecon! 🎉 We weren't supposed to press this... now our application is running amock!"
            );
            setResourceUsage({
              memory: 99,
              cpu: 74,
            });
          }}
          background="#b80118"
          icon="radiation"
        >
          UH OH
        </Button>

        <Button
          style={{ marginLeft: "1em" }}
          onClick={() => setWarningsOnlyFilter(!warningsOnlyFilter)}
          icon="exclamation-triangle"
          background="#d28f20"
          selected={warningsOnlyFilter}
        >
          WARNINGS ONLY
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          overflowX: "auto",
          height: "400px",
          width: "100%",
        }}
      >
        {(props.events || []).length === 0 && <div>No events!</div>}
        {(props.events || [])
          .filter((e) => {
            if (warningsOnlyFilter) {
              return e.type === "Warning";
            } else {
              return true;
            }
          })
          .sort((a: Event, b: Event) => {
            const mult = sortBy === SortType.New ? -1 : 1;

            return (
              mult *
              (new Date(a.firstTimestamp).getTime() -
                new Date(b.firstTimestamp).getTime())
            );
          })
          .map((e) => {
            return (
              <div
                key={e?.metadata?.uid || ""}
                style={{
                  marginRight: "1em",
                  width: "320px",
                  flexShrink: 0,
                  height: "320px",
                  border: "1px solid #b8c3c8",
                  backgroundColor: "white",
                  boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ padding: "1em", marginBottom: "auto" }}>
                  <Label>MESSAGE</Label>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      marginBottom: "1em",
                      width: "100%",
                      wordWrap: "break-word",
                      color: "black",
                      backgroundColor: "#f5f5f5",
                      padding: "0.5em",
                      borderRadius: "5px",
                      fontFamily: "monospace",
                      height: "130px",
                      overflowY: "auto",
                    }}
                  >
                    {e.message}
                  </div>
                  <div style={{ marginBottom: "1em" }}>
                    <div style={{ fontWeight: "600" }}>
                      <i
                        className="fa fa-clock"
                        style={{ marginRight: "3px" }}
                      />
                      {moment(e.firstTimestamp).fromNow()}
                    </div>
                    <div style={{ fontFamily: "monospace" }}>
                      {e.firstTimestamp}
                    </div>
                  </div>
                  <div>{e.reason}</div>
                </div>
                <div
                  style={{
                    width: "100%",
                    padding: "0.5em",
                    backgroundColor:
                      e.type === "Warning" ? "#d28f20" : "#1aab85",
                    color: "white",
                    fontWeight: 500,
                  }}
                >
                  <i
                    className={`fa fa-${
                      e.type === "Warning"
                        ? "exclamation-triangle"
                        : "thumbs-up"
                    }`}
                    style={{ marginRight: "5px" }}
                  />
                  {e.type}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

const Label = (props: { children: React.ReactNode }) => (
  <div style={{ fontSize: "12px", fontWeight: 600 }}>{props.children}</div>
);

const Button = (props: {
  onClick: () => void;
  children: React.ReactNode;
  selected?: boolean;
  background?: string;
  icon?: string;
  style?: any;
}) => (
  <div
    onClick={props.onClick}
    style={{
      alignSelf: "center",
      marginRight: "5px",
      padding: "0.5em",
      background: props.background
        ? props.background
        : props.selected
        ? "#0f2633"
        : "#6c7980",
      color: "white",
      cursor: "pointer",
      display: "flex",
      fontWeight: "600",
      alignItems: "center",
      boxShadow:
        props.selected && props.background
          ? "inset 0 0 0 3px rgba(0,0,0, 0.2)"
          : "",
      ...props.style,
    }}
  >
    {props.icon && (
      <i className={`fa fa-${props.icon}`} style={{ marginRight: "5px" }} />
    )}
    {props.children}
  </div>
);

const MetricItem = (props: {
  label?: string;
  value?: number;
  percent?: boolean;
  background?: string;
  dark?: boolean;
  icon?: string;
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: props.background ? props.background : "#f5f5f5",
        width: "120px",
        height: "120px",
        flexShrink: 0,
        marginRight: "0.25em",
        color: props.dark ? "white" : "black",
        opacity: props.label && props.value ? 1 : 0.3,
      }}
    >
      <div
        style={{
          fontSize: "32px",
          fontWeight: 600,
          marginTop: "auto",
          color: props.dark ? "white" : "black",
          marginBottom: props.icon ? "3px" : "auto",
        }}
      >
        {props.value} {props.percent ? "%" : ""}
      </div>
      {props.icon && (
        <i
          className={`fa fa-${props.icon}`}
          style={{ fontSize: "16px", marginBottom: "auto", opacity: "0.8" }}
        />
      )}
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          marginBottom: "0.5em",
        }}
      >
        {props.label}
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(async (window: any) => {
  const component = (props: { application: any; tree: any; events: any }) => {
    return <TimelineView {...props} />;
  };
  window.extensionsAPI.registerAppViewExtension(
    component,
    "Timeline View",
    "fa-timeline"
  );
})(window);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(async (window: any) => {
  const component = () => {
    const [imageURL, setImageURL] = React.useState<any>();

    React.useEffect(() => {
      const load = async () => {
        const res = await fetch("https://api.thecatapi.com/v1/images/search");
        const data = await res.json();
        setImageURL(data[0].url);
      };
      load();
    }, []);
    return (
      <div style={{ padding: "2em" }}>
        <img src={imageURL} />
      </div>
    );
  };
  window.extensionsAPI.registerSystemLevelExtension(
    component,
    "Cats!",
    "/cats",
    "fa-cat"
  );
})(window);
