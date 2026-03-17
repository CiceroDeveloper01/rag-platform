export interface FileStorage {
  upload(
    file: Buffer,
    key: string,
    metadata?: Record<string, string>,
  ): Promise<string>;

  download(key: string): Promise<Buffer>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;
}
