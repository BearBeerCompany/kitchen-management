export {};

declare global {
  namespace fs {
    function fileAdd(): Promise<any>;
  }
}
