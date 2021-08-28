/* eslint-disable no-unused-vars */

export interface IArgv {
  _: string[],
  c?: string,
  d?: string,
  f?: string,
  h?: boolean,
  r?: string,
  dir?: string,
  config?: string
  input?: string
  force?: boolean
  help?: boolean,
  call?: string,
  run?: string
}

export const enum Run {
  All = 1,
  Migrations = 2,
  Functions = 3
}

export interface IConfig {
  secret: string,
  force: boolean,
  config: boolean | string,
  run: Run
  migrations?: string[],
  functions: string[],
  seeds?: string[]
}

export interface IConfigFile {
  migrations: string[],
  functions: string[],
  seeds: string[]
}

export interface ICollection {

  /**
   * The name of the collection.
   *
   * Cannot be `events`, `sets`, `self`, `documents`, or `_`.
   * Cannot contain the `%` character.
   */
  name: string,

  /**
   * This is user-defined metadata for the collection.
   * It is provided for the developer to store information
   * at the collection level.
   */
  data?: object,

  /**
   * The number of days that document history is retained
   * for in this collection. The default is `30` days.
   *
   * Setting history_days to `null` retains this collection’s history forever.
   * Setting history_days to `0` retains only the current version of each
   * document in this collection; no history is retained.
   */
  history_days?: number,

  /**
   * The number of days documents are retained for this collection.
   * Documents which have not been updated within the configured
   * TTL duration are removed. Setting ttl_days to `null` retains
   * documents forever. The default is `null`.
   */
  ttl_days?: number,

  /**
   * Provides the ability to enable permissions at the collection level.
   */
  permissions?: {

    /**
     * Permits creating a document in the collection.
     */
    create?: any,

    /**
     * Permits reading documents in the collection.
     */
    read?: any,

    /**
     * Permits writing to documents in the collection.
     */
     write?: any
  }
}
export interface IIndexes {

  /**
   * The logical name of the index.
   *
   * Cannot be `events`, `sets`, `self`, `documents`, or `_`.
   * Cannot contain the `%` character.
   */
  name: string

  /**
   * A Collection reference, or an array of one or more
   * source objects describing source collections and (optional)
   * binding fields.
   */
  source: any,

  /**
   * If `true`, maintains a unique constraint on combined terms and values.
   * The default is `false`.
   */
   unique?: boolean

   /**
    * If `true`, writes to this index are serialized with concurrent
    * reads and writes. The default is `true`.
    */
   serialized?: boolean

   /**
    * Indicates who is allowed to read the index.
    * The default is everyone can read the index.
    */
   permissions?: object

   /**
    * This is user-defined metadata for the index. It is provided
    * for the developer to store information at the index level.
    * The default is an empty object having no data.
    */
   data?: object

  /**
   * An array of Term objects describing the fields that
   * should be searchable. Indexed terms can be used to search
   * for field values, via the Match function.
   *
   * The default is an empty Array.
   */
  terms?: Array<{

    /**
     * The field name path (the list of field names required to access
     * a specific field nested within the document structure)
     * or field name within the document to be indexed.
     */
    field: string[] | string,

    /**
     * The name of a binding from a Source objects.
     */
    binding?: string,

    /**
     * Whether this field’s value should sort reversed.
     *
     * Defaults to `false`.
     */
    reverse?: boolean
  }>

  /**
   * An array of Value objects describing the fields that should be
   * reported in search results. The default is an empty Array.
   * When no values fields are defined, search results report the
   * indexed document’s Reference.
   */
   values?: Array<{

    /**
     * The field name path (the list of field names required to access
     * a specific field nested within the document structure)
     * or field name within the document to be indexed.
     */
    field: string[] | string,

    /**
     * The name of a binding from a Source objects.
     */
    binding?: string,

    /**
     * Whether this field’s value should sort reversed.
     *
     * Defaults to `false`.
     */
    reverse?: boolean
  }>
}

export interface IFunction {

  /**
   * The name of the function.
   *
   * Cannot be `events`, `sets`, `self`, `documents`, or `_`.
   * Cannot contain the `%` character.
   */
  name: string,

  /**
   * The Fauna Query Language instructions to be executed.
   */
  body: object

  /**
   * This is user-defined metadata for the user-defined function.
   * It is provided for the developer to store information at the function level.
   */
  data?: object

  /**
   * Specifies the role that should be used when the user-defined
   * function is called, which would typically be used to provide
   * privilege escalation when current privileges would otherwise be
   * too restrictive.
   *
   * To use a built-in role, specify one of the strings `admin`,
   * `server`, `server-readonly` or `client`. To use a `user-defined` role,
   * specify a `Role` reference, e.g. `Role("admin")`.
   *
   * `role` can only be set by users with a privileged role,
   * such as `admin`, `server`, or a `user-defined` role that grants
   * `write` privilege for functions.
   *
   * **IMPORTANT**
   *
   * Use `role` carefully! Setting role to `admin`, `server`, or any other
   * privileged role gives your function permission to create/modify/remove
   * any documents when invoked by any caller. Users that can write
   * functions can adjust role to change the function’s privileges.
   */
  role?: any
}

export interface IMigration {

  /**
   * Object value expressed here will be passed
   * to the `CreateCollection` function and is used to
   * create a collection that groups a document.
   */
  Collection: ICollection,

  /**
   * Objects expressed in this array will be passed
   * to the `CreateIndex` function which adds a new index
   * to the database with the specified parameters.
   */
  Indexes?: Array<IIndexes>,

  /**
   * Objects expressed in this array will be passed
   * to the `CreateFunction` operation which adds a
   * new user-defined function with the specified parameters.
   *
   * ---
   *
   * **PLEASE NOTE**
   *
   * This is an optional migration field, you can isolate function
   * migrations into single files by containing them within a
   * `functions` directory relative to the `/db` directory you store
   * your fauna migrations.
   */
  Functions?: IFunction[]
}
