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

let userNameChangeSchema = new Schema({
    fromName:String,
    toName:String,
    chatid:String
})

const User = mongoose.model('User', userSchema);
const Tweet = mongoose.model('Tweet', tweetSchema);
const ReportedTweet = mongoose.model('ReportedTweet', ReportedtweetSchema);
const userNameChange = mongoose.model('UserNameChange', userNameChangeSchema)

export { User, Tweet,ReportedTweet,userNameChange };