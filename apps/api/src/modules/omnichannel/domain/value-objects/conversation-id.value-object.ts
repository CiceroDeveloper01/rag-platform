export class ConversationId {
  constructor(private readonly value: string) {
    if (!value.trim()) {
      throw new Error('ConversationId cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }
}
