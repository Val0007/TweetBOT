"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const server = 'mongodb+srv://ValliyappaDB:Jenson%40brawn09@snapbot.q9bx9td.mongodb.net/'; // REPLACE WITH YOUR DB SERVER
const database = 'snapbot'; // REPLACE WITH YOUR DB NAME
class Database {
    constructor() {
        console.log("yes");
        this._connect();
    }
    _connect() {
        mongoose_1.default
            .connect(`${server}${database}`)
            .then(() => {
            console.log('Database connection successful');
        })
            .catch((err) => {
            console.log(err);
            console.error('Database connection error');
        });
    }
}
exports.default = Database;
