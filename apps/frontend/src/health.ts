export type HealthStatus = "checking" | "online" | "offline";

export interface HealthResponse {
  status: "ok";
  services: {
    database: "up";
  };
  timestamp: string;
}
