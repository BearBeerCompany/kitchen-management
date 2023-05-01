export interface Page<T> {
    elements: T[];
    page: number;
    size: number;
    totalPage: number;
    totalSize: number;
}