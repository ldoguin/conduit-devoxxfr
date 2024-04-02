const { connect } = require('ottoman');

const connectDB = async () => {
    try {
        await connect(process.env.DATABASE_URI || "couchbase://localhost/default@Administrator:Administrator");
        console.log("connected");
    } catch (err) {
        console.log(err);
    }
}

module.exports = connectDB;