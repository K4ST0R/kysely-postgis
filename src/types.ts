type Tail<T extends any[]> = T extends [infer A, ...infer R] ? R : never;

export type STParams<F extends (...args: any) => any> = Tail<Parameters<F>>;

export type SRID = number;
