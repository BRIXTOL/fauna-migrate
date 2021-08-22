import { query as q } from 'faunadb';

export default [
  {
    name: 'get_product_by_channel',
    role: 'admin',
    body: q.Query(
      q.Lambda(
        'channel'
        , q.Match(
          q.Index('products_by_channel')
          , q.Var('channel')
        )
      )
    )
  }
];
