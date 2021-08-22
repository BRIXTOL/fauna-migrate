import { query } from 'faunadb';
import { IMigration, IFunction } from './types';

export function migrate (fn: (q: typeof query) => IMigration | IFunction[]) {

  return fn(query);

}

export function seed (fn: (q: typeof query) => any[]) {

  return fn(query);

}
