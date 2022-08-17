export interface Error {
  timestamp: string;
  errorCode?: number;
  httpCode: number;
  message: string;
  cause: string;
  causeId?: string;
}
