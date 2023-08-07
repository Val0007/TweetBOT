import mongoose from 'mongoose'

const server = 'mongodb+srv://ValliyappaDB:Jenson%40brawn09@snapbot.q9bx9td.mongodb.net/'; // REPLACE WITH YOUR DB SERVER
const database = 'snapbot'; // REPLACE WITH YOUR DB NAME

class Database {
  constructor() {
    console.log("yes")
    this._connect();
  }

  _connect() {
    mongoose
      .connect(`${server}${database}`)
      .then(() => {
        console.log('Database connection successful');
      })
      .catch((err:any) => {
        console.log(err)
        console.error('Database connection error');
      });
  }
}

export default Database;
