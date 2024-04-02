require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path')
const PORT = process.env.PORT || 4000;
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions = require('../config/corsOptions');
const {model, registerGlobalPlugin, getDefaultInstance, Ottoman } = require('ottoman');
const {userSchema} = require('../models/User');
const {articleSchema} = require('../models/Article');
const {commentSchema} = require('../models/Comment');
const main = async () => {

  let ottoman = getDefaultInstance();
  if (!ottoman) {
    // if not exist default one, then create
    ottoman = new Ottoman();
  };

const endpoint = process.env.DB_ENDPOINT || "couchbase://localhost";
const username = process.env.DB_USERNAME || "Administrator";
const password = process.env.DB_PASSWORD || "Administrator";
const bucket = process.env.DB_BUCKET || "default";
const scope = process.env.DB_SCOPE || "_default";

console.log(endpoint, username, bucket, scope);

try {
  await ottoman.connect({
    connectionString: endpoint,
    username: username,
    password: password,
    bucketName: bucket,
  });
} catch (e) {
  throw(e);
}
  await registerGlobalPlugin((schema) => {
    schema.pre('save', function (doc) {
      console.log(doc);
      console.log(schema);
    });
  });

  model('User', userSchema, { scopeName: scope });
  model('Comment', commentSchema, { scopeName: scope });
  model('Article', articleSchema, { scopeName: scope });
  await ottoman.start();  
  console.log('Connected to Couchbase');
  

  app.use(cors(corsOptions));
  app.use(express.json()); // middleware to parse json
  app.use(cookieParser());

  // static route
  app.use('/', express.static( 'public'));
  // app.use('/', express.static(path.join(__dirname, '/public')));
  // app.use('/', require('../routes/root'));
  // user routes - for testing
  app.use('/test', require('../routes/testRoutes'));

  // user routes - for /api/users and /api/user
  app.use('/api', require('../routes/userRoutes'));

  // user routes - for profiles
  app.use('/api/profiles', require('../routes/profileRoutes'));

  // article routes
  app.use('/api/articles', require('../routes/articleRoutes'));

  // tag route
  app.use('/api/tags', require('../routes/tagRoutes'));

  // comment routes
  app.use('/api/articles', require('../routes/commentRoutes'));




  app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
  });
};




  
main();
module.exports = app;
