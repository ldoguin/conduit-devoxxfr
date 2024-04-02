const couchbase = require('couchbase')

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  var  cluster;
  const endpoint = process.env.DB_ENDPOINT || "couchbase://localhost";
  const username = process.env.DB_USERNAME || "Administrator";
  const password = process.env.DB_PASSWORD || "Administrator";
  const bucket = process.env.DB_BUCKET || "default";
  const scope = process.env.DB_SCOPE || "_default";

  // tasks for code coverage
  require('@cypress/code-coverage/task')(on, config)


  on('before:run', (details) => {
    couchbase.connect(endpoint, {
        username: username,
        password: password,
        configProfile: 'wanDevelopment',
      }
      )
        .then(res => {
          cluster = res;
          return createPrimaryIndexes(cluster);
        }).catch(err => {
          console.log("Cant login to cluster");
          console.log(err);
          return err;
        });

      function indexQuery(collection) {
        return `CREATE PRIMARY INDEX ON \`${bucket}\`.\`${scope}\`.\`${collection}\``;
      }
      function createPrimaryIndexes(cluster) {
        return Promise.all(
          [cluster.query(indexQuery("Article"), {scanConsistency :"request_plus" }),
          cluster.query(indexQuery("User"), {scanConsistency :"request_plus" }),
          cluster.query(indexQuery("Comment"), {scanConsistency :"request_plus" })]
        )
          .then((values) => {
            return values
          }).catch(err => {
            console.log("Cant create indexes");
            console.log(err);
          })
      }
  })

  // tasks for resetting database during tests
  on('task', {
    cleanDatabase() {
      return deleteCollections(cluster);

      function deleteQuery(collection) {
        return `DELETE FROM \`${bucket}\`.\`${scope}\`.\`${collection}\``;
      }
      function deleteCollections(cluster) {
        return Promise.all(
          [cluster.query(deleteQuery("Article"), {scanConsistency :"request_plus" }),
          cluster.query(deleteQuery("User"), {scanConsistency :"request_plus" }),
          cluster.query(deleteQuery("Comment"), {scanConsistency :"request_plus" })]
        )
          .then((values) => {
            return values
          }).catch(err => {
            console.log("Cant Delete collections content");
            console.log(err);
            return err;
          })
      }
    },
  })

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
