"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userNameChange = exports.ReportedTweet = exports.Tweet = exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
let userSchema = new mongoose_1.Schema({
    firstName: String,
    lastName: String,
    userName: String,
    email: String,
    chatid: String,
    points: Number,
    recentTweetid: Number
});
let tweetSchema = new mongoose_1.Schema({
    tweetid: Number,
    text: String,
    chatid: String,
    points: Number,
    seen: [String],
    timestamp: { type: Date, default: Date.now }
});
let ReportedtweetSchema = new mongoose_1.Schema({
    tweetid: Number,
    text: String,
    chatid: String,
    points: Number,
    seen: [String],
    timestamp: { type: Date, default: Date.now },
    reportedby: String //chatid
});
let userNameChangeSchema = new mongoose_1.Schema({
    fromName: String,
    toName: String,
    chatid: String
});
const User = mongoose_1.default.model('User', userSchema);
exports.User = User;
const Tweet = mongoose_1.default.model('Tweet', tweetSchema);
exports.Tweet = Tweet;
const ReportedTweet = mongoose_1.default.model('ReportedTweet', ReportedtweetSchema);
exports.ReportedTweet = ReportedTweet;
const userNameChange = mongoose_1.default.model('UserNameChange', userNameChangeSchema);
exports.userNameChange = userNameChange;
