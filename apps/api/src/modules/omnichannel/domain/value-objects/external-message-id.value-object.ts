export class ExternalMessageId {
  constructor(private readonly value: string) {
    if (!value.trim()) {
      throw new Error('ExternalMessageId cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }
}
