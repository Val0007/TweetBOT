import mongoose, { Schema } from 'mongoose'

let userSchema = new Schema({
    firstName:String,
    lastName:String,
    userName:String,
    email:String,
    chatid:String,
    points:Number,
    recentTweetid:Number
})

let tweetSchema = new Schema({
    tweetid:Number,
    text:String,
    chatid:String,
    points:Number,
    seen: [String] ,
    timestamp: { type: Date, default: Date.now }
})

let ReportedtweetSchema = new Schema({
    tweetid:Number,
    text:String,
    chatid:String,
    points:Number,
    seen: [String] ,
    timestamp: { type: Date, default: Date.now },
    reportedby:String //chatid
})

const User = mongoose.model('User', userSchema);
const Tweet = mongoose.model('Tweet', tweetSchema);
const ReportedTweet = mongoose.model('ReportedTweet', ReportedtweetSchema);

export { User, Tweet,ReportedTweet };