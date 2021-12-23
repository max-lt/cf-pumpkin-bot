export class StorableSet<T> extends Set<T> {
  private _key!: string;

  private constructor(key: string, values?: readonly T[] | null) {
    super(values);
    this._key = key;
  }

  static async restore(key: string) {
    const value = await kv.get(key);
    return new this(key, value?.split(','));
  }

  async save() {
    await kv.put(this._key, String([...this.values()]));
  }
}
