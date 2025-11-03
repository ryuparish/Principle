export interface PositionUpdateMessage {
  nodeId: string;
  position: {
    x: number;
    y: number;
  };
  timestamp: number;
}

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}
