import {Status} from "../../plate-menu-items/plate-menu-item";

export interface StatsChart {
  labels: string[];
  datasets: DataSet[];
}

export interface Stats {
  id: string
  count: number;
  statusCount: StatusCount;
  createdDate: Date;
}

type StatusCount = {
  [key in Status]: number;
};

type DataSet = {
  data: string[] | number[];
  backgroundColor: string[]
}
