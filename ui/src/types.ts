export enum SortType {
  "New",
  "Old",
}

export enum GroupBy {
  TenSec = "TenSec",
  OneMin = "OneMin",
  FiveMin = "FiveMin",
  TwentyMin = "TwentyMin",
}

export interface ResourceStats {
  outOfSync: number;
}

export interface TreeStats {
  pods: number;
}

export interface ResourceUsageStats {
  cpu: number;
  memory: number;
}

// The following type definitions are copied from Argo CD's source code

export interface ResourceNode {
  parentRefs: any[];
  info: any[];
  networkingInfo?: any;
  images?: string[];
  resourceVersion: string;
  createdAt?: any;
  // Kind is not included in the upstream definition
  kind: string;
}

export interface ApplicationTree {
  nodes: ResourceNode[];
  orphanedNodes: ResourceNode[];
  hosts: Node[];
}

export interface ObjectReference {
  kind: string;
  namespace: string;
  name: string;
  uid: string;
  apiVersion: string;
  resourceVersion: string;
  fieldPath: string;
}

export interface Event {
  apiVersion?: string;
  kind?: string;
  metadata: any;
  involvedObject: ObjectReference;
  reason: string;
  message: string;
  source: EventSource;
  firstTimestamp: string;
  lastTimestamp: string;
  count: number;
  type: string;
  eventTime: string;
  action: string;
  reportingController: string;
  reportingInstance: string;
}

export interface ResourceStatus {
  group: string;
  version: string;
  kind: string;
  namespace: string;
  name: string;
  status: any;
  health: any;
  createdAt?: any;
  hook?: boolean;
  requiresPruning?: boolean;
  syncWave?: number;
  orphaned?: boolean;
}

export interface Node {
  name: string;
  systemInfo: NodeSystemInfo;
  resourcesInfo: HostResourceInfo[];
}

export interface NodeSystemInfo {
  architecture: string;
  operatingSystem: string;
  kernelVersion: string;
}

export interface HostResourceInfo {
  resourceName: ResourceName;
  requestedByApp: number;
  requestedByNeighbors: number;
  capacity: number;
}

export enum ResourceName {
  ResourceCPU = "cpu",
  ResourceMemory = "memory",
  ResourceStorage = "storage",
}
