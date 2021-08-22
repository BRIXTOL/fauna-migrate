import { migrate } from '../../../package/index';

export default migrate(
  q => ({
    Collection: {
      name: 'example'
    },
    Indexes: [
      {
        name: 'all_settings',
        source: q.Collection('settings'),
        permissions: {
          write: 'admin'
        }
      }
    ]
  })
);
