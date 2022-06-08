/// <reference types="node" />
import { EventEmitter } from 'events'
import { Stream } from 'stream'

type Encoding = BufferEncoding | 'buffer' | null

interface Writable extends EventEmitter {
  end(): any
  write(chunk: any, ...args: any[]): any
}

interface Readable extends EventEmitter {
  pause(): any
  resume(): any
  pipe(): any
}

interface Pipe<R, W> {
  src: Minipass<R, W>
  dest: Writable
  opts: Minipass.PipeOptions
}

type DualIterable<T> = Iterable<T> & AsyncIterable<T>

type ContiguousData = Buffer | ArrayBufferLike | ArrayBufferView | string

type BufferOrString = Buffer | string

declare class Minipass<
    RType extends any = Buffer,
    WType extends any = RType extends BufferOrString ? ContiguousData : RType
  >
  extends Stream
  implements DualIterable<RType>
{
  static isStream(stream: any): stream is Readable | Writable

  readonly bufferLength: number
  readonly flowing: boolean
  readonly writable: boolean
  readonly readable: boolean
  readonly paused: boolean
  readonly emittedEnd: boolean
  readonly destroyed: boolean

  /**
   * Not technically private or readonly, but not safe to mutate.
   */
  private readonly buffer: RType[]
  private readonly pipes: Pipe<RType, WType>[]

  /**
   * Technically writable, but mutating it can change the type,
   * so is not safe to do in TypeScript.
   */
  readonly objectMode: boolean
  async: boolean

  /**
   * Note: encoding is not actually read-only, and setEncoding(enc)
   * exists. However, this type definition will insist that TypeScript
   * programs declare the type of a Minipass stream up front, and if
   * that type is string, then an encoding MUST be set in the ctor. If
   * the type is Buffer, then the encoding must be missing, or set to
   * 'buffer' or null. If the type is anything else, then objectMode
   * must be set in the constructor options.  So there is effectively
   * no allowed way that a TS program can set the encoding after
   * construction, as doing so will destroy any hope of type safety.
   * TypeScript does not provide many options for changing the type of
   * an object at run-time, which is what changing the encoding does.
   */
  readonly encoding: Encoding
  // setEncoding(encoding: Encoding): void

  // Options required if not reading buffers
  constructor(
    ...args: RType extends Buffer
      ? [options?: Minipass.Options<RType>]
      : [options: Minipass.Options<RType>]
  )

  write(chunk: WType, cb?: () => void): boolean
  write(chunk: WType, encoding?: Encoding, cb?: () => void): boolean
  read(size?: number): RType
  end(cb?: () => void): this
  end(chunk: any, cb?: () => void): this
  end(chunk: any, encoding?: Encoding, cb?: () => void): this
  pause(): void
  resume(): void
  promise(): Promise<void>
  collect(): Promise<RType[]>

  concat(): RType extends BufferOrString ? Promise<RType> : never
  destroy(er?: any): void
  pipe<W extends Writable>(dest: W, opts?: Minipass.PipeOptions): W
  unpipe<W extends Writable>(dest: W)

  /**
   * alias for on()
   */
  addEventHandler(event: string, listener: (...args: any[]) => any): this

  on(event: string, listener: (...args: any[]) => any): this
  on(event: 'data', listener: (chunk: RType) => any): this
  on(event: 'error', listener: (error: any) => any): this
  on(
    event:
      | 'readable'
      | 'drain'
      | 'resume'
      | 'end'
      | 'prefinish'
      | 'finish'
      | 'close',
    listener: () => any
  ): this

  [Symbol.iterator](): Iterator<RType>
  [Symbol.asyncIterator](): AsyncIterator<RType>
}

interface StringOptions {
  encoding: BufferEncoding
  objectMode?: boolean
  async?: boolean
}

interface BufferOptions {
  encoding?: null | 'buffer'
  objectMode?: boolean
  async?: boolean
}

interface ObjectModeOptions {
  objectMode: true
  async?: boolean
}

declare namespace Minipass {
  interface PipeOptions {
    end?: boolean
    proxyErrors?: boolean
  }

  type Options<T> = T extends string
    ? StringOptions
    : T extends Buffer
    ? BufferOptions
    : ObjectModeOptions
}
