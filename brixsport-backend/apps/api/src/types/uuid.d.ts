// Type definitions for uuid module
// This is a fallback declaration file to ensure TypeScript compilation works
// even if @types/uuid is not properly resolved in the build environment

declare module 'uuid' {
  // v1
  export function v1(options?: v1.Options): string;
  export function v1(options?: v1.Options | null, buffer?: number[] | Buffer, offset?: number): string | number[] | Buffer;
  namespace v1 {
    interface Options {
      node?: number[];
      clockseq?: number;
      msecs?: number | Date;
      nsecs?: number;
    }
  }

  // v3
  export function v3(name: string | number[] | Buffer, namespace: string | number[] | Buffer): string;
  export namespace v3 {
    const DNS: string;
    const URL: string;
  }

  // v4
  export function v4(options?: v4.Options): string;
  export function v4(options?: v4.Options | null, buffer?: number[] | Buffer, offset?: number): string | number[] | Buffer;
  namespace v4 {
    interface Options {
      random?: number[];
      rng?: () => number[];
    }
  }

  // v5
  export function v5(name: string | number[] | Buffer, namespace: string | number[] | Buffer): string;
  export namespace v5 {
    const DNS: string;
    const URL: string;
  }

  // General functions
  export function parse(uuid: string, buffer?: number[] | Buffer, offset?: number): number[] | Buffer;
  export function stringify(buffer: number[] | Buffer, offset?: number): string;
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;
}