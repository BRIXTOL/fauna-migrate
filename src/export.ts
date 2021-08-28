import faunadb from 'faunadb';
import { IMigration, IFunction } from './types';

export function migrate (fn: (q: typeof faunadb.query) => IMigration | IFunction[]) {

  return fn(faunadb.query);

}

export function seed (fn: (q: typeof faunadb.query) => any[]) {

  return fn(faunadb.query);

}
