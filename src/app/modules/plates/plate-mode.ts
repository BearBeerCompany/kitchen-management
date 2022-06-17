export enum PlateMode {
  Skeleton = "skeleton",
  On = "on",
  Off = "off",
  Form = "form"
}

export function mode(): typeof PlateMode {
  return PlateMode;
}
