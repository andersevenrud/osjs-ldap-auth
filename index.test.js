const adapter = require('./index.js');

//
// This test expects you to use the docker image with the following user:
// "Foo Foo" and password "secret"
//

describe('LDAP Auth Adapter', () => {
  let instance;

  beforeAll(() => {
    instance = adapter({
      config: (k, d) => d
    });
  });

  test('Should log in', () => {
    return expect(instance.login({
      body: {
        username: 'Foo Foo',
        password: 'secret'
      }
    }))
      .resolves
      .toEqual({
        dn: 'cn=Foo Foo,dc=example,dc=org',
        groups: [],
        id: 'ffoo',
        name: 'Foo',
        username: 'Foo Foo'
      });
  });
});
