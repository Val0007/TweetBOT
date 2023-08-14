"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const grammy_1 = require("grammy");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const db_1 = __importDefault(require("./db"));
const schema_1 = require("./schema");
const node_cron_1 = __importDefault(require("node-cron"));
const node_fetch_1 = __importDefault(require("node-fetch"));
dotenv_1.default.config();
const dbb = new db_1.default();
//server will use long polling and constantly hit the telegram server for chats
const { TOKEN, CLIENT_ID, CLIENT_SECRET, SERVER_URL } = process.env;
console.log("Token is", TOKEN);
const bot = new grammy_1.Bot(`${TOKEN}`);
// const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`
// const URI = `/webhook/${TOKEN}`
// const WEBHOOK_URL = SERVER_URL + URI
const app = (0, express_1.default)();
app.use(express_1.default.json()); // parse the JSON request body
app.use((0, express_session_1.default)({
    resave: false,
    saveUninitialized: true,
    secret: 'bla bla bla'
}));
app.use(passport_1.default.session());
//app.use(webhookCallback(bot, "express"));
function pingServer() {
    if (SERVER_URL) {
        const url = SERVER_URL; // Replace with your server URL
        (0, node_fetch_1.default)(url)
            .then(response => {
            if (response.ok) {
                console.log(`Server pinged successfully at ${new Date()}`);
            }
            else {
                console.error(`Failed to ping server at ${new Date()}`);
            }
        })
            .catch(error => {
            console.error(`Error pinging server: ${error}`);
        });
    }
}
if (SERVER_URL) {
    console.log("setup server pinging complete", SERVER_URL);
    node_cron_1.default.schedule('*/10 * * * *', () => {
        pingServer();
    });
}
//LOGIN
bot.command("login", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    //check if already logged in
    try {
        //get chat id
        const chat = yield ctx.getChat();
        const chatid = chat.id;
        const user = yield schema_1.User.findOne({ chatid: chatid });
        if (user) {
            yield bot.api.sendMessage(chatid, "You are already logged in!");
            return;
        }
        else {
            //send link
            yield ctx.api.sendMessage(chatid, `<a href="${SERVER_URL}/login/${chatid}">Sign up now</a> <i>Use your Svce Mail</i>`, { parse_mode: "HTML" });
        }
    }
    catch (e) {
        console.log(e);
    }
}));
//COMMANDS
// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Type /help to get a list of commands"));
bot.command("help", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply("Hi! You must be logged in to send or see tweets.\n1./login to signup using svce mail id \n2./send (tweetText) -> to send your tweet\n3./see -> see a tweet\n4./stats -> to see your points and info about your tweet sent\n5./changeusername (customusername) -> to change your username , ex: /changeusername batman");
    const txtForm1 = `<b>Points:</b> To give points to a tweet press and hold the tweet and click on the reply button , in your reply just type the amount of points and click send`;
    yield ctx.reply(txtForm1, { parse_mode: "HTML" });
    const txtForm = `<b>NOTE:</b> <i>Don't send inappropriate Tweets , if you see any tweets like that type /report (tid) , ex:/report 156 => to report that tweet</i>`;
    yield ctx.reply(txtForm, { parse_mode: "HTML" });
}));
bot.command("send", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const msg = ctx.match;
    msg.trim();
    if (msg == "") {
        yield ctx.reply("no empty tweets!");
        return;
    }
    console.log("tweet id", (_a = ctx.update.message) === null || _a === void 0 ? void 0 : _a.message_id);
    console.log("The msg is ", msg);
    //save tweet to db
    try {
        //get chat id
        const chat = yield ctx.getChat();
        const chatid = chat.id;
        const tid = (_b = ctx.update.message) === null || _b === void 0 ? void 0 : _b.message_id;
        const user = yield schema_1.User.findOne({ chatid: chatid });
        if (user) {
            const tweet = new schema_1.Tweet({
                tweetid: tid,
                text: msg,
                chatid: chatid,
                points: 0,
                seen: []
            });
            yield tweet.save();
            console.log("tweet saved in db");
            //update his most recent tweet
            const recentTweetId = user.recentTweetid;
            if (recentTweetId != null) {
                //delete his old tweet
                yield schema_1.Tweet.findOneAndDelete({ tweetid: recentTweetId });
                user.recentTweetid = tid;
                yield user.save();
                yield bot.api.sendMessage(chatid, "Tweet sent!");
                console.log("tweet saved");
            }
            else {
                user.recentTweetid = tid;
                yield user.save();
                yield bot.api.sendMessage(chatid, "Tweet sent!");
                console.log("tweet saved");
            }
            //update his stats
        }
        else {
            yield bot.api.sendMessage(chatid, "Signup First!");
        }
    }
    catch (e) {
        console.log(e);
    }
}));
bot.command("see", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    //get tweets and accounts
    //thalivar tweet - from akshay | tid:90
    try {
        const chat = yield ctx.getChat();
        const chatid = String(chat.id);
        const currentTimestamp = new Date();
        // Calculate the timestamp 5 minutes ago
        const fiveMinutesAgo = new Date(currentTimestamp.valueOf() - 5 * 60 * 1000);
        const tweets = yield schema_1.Tweet.find({
            //timestamp: { $lt: fiveMinutesAgo },
            seen: { $ne: chatid },
            chatid: { $ne: chatid }
        });
        console.log("the tweets are ", tweets);
        if (tweets.length > 0) {
            // Select a random tweet from those that meet the criteria
            const selectedTweet = tweets[Math.floor(Math.random() * tweets.length)];
            // Mark the tweet as seen by the user
            selectedTweet.seen.push(chatid);
            yield selectedTweet.save();
            const senderID = selectedTweet.chatid || "";
            const sentUser = yield schema_1.User.findOne({ chatid: senderID });
            //send tweet
            if (sentUser) {
                const username = sentUser.userName || "";
                const tid = selectedTweet.tweetid;
                const txt = selectedTweet.text || "emptyTweet";
                const txtForm = `${txt} - from ${username} | tid:${tid}`;
                yield bot.api.sendMessage(chatid, txtForm);
            }
        }
        else {
            console.log("not enough tweets available");
            const tweets = yield schema_1.Tweet.find({
                chatid: { $ne: chatid }
            });
            const selectedTweet = tweets[Math.floor(Math.random() * tweets.length)];
            // Mark the tweet as seen by the user
            //already would've seen it
            //selectedTweet.seen.push(chatid);
            yield selectedTweet.save();
            const senderID = selectedTweet.chatid || "";
            const sentUser = yield schema_1.User.findOne({ chatid: senderID });
            //send tweet
            if (sentUser) {
                const username = sentUser.userName || "";
                const tid = selectedTweet.tweetid;
                const txt = selectedTweet.text || "emptyTweet";
                const txtForm = `<b>${txt}</b> - \nfrom <i>${username} | tid:${tid}</i>`;
                yield bot.api.sendMessage(chatid, txtForm, { parse_mode: "HTML" });
            }
        }
        console.log("tweets sent");
    }
    catch (e) {
        console.log(e);
    }
}));
bot.command("stats", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    //get user acc
    try {
        const chat = yield ctx.getChat();
        const chatid = String(chat.id);
        const user = yield schema_1.User.findOne({ chatid: chatid });
        if (user) {
            if (user.recentTweetid != null) {
                //get recent tweet
                const tweet = yield schema_1.Tweet.findOne({ tweetid: user.recentTweetid });
                if (tweet) {
                    const tweetpoints = tweet.points;
                    const totalpoints = user.points;
                    const usersSeenids = tweet.seen;
                    //populate tweet seen
                    const usersSeen = yield schema_1.User.find({ chatid: { $in: usersSeenids } });
                    let usernames = [];
                    if (usersSeen.length > 0) {
                        usernames = usersSeen.map((user) => {
                            return user.userName || "";
                        });
                    }
                    var usernameStrings = usernames.join("\n");
                    if (usernameStrings == "") {
                        usernameStrings = "none";
                    }
                    const txtForm = `<b>${user.userName}</b> has ${totalpoints} points. \nYour last tweet got ${tweetpoints} points. \nIt was seen by:\n${usernameStrings}`;
                    yield bot.api.sendMessage(chatid, txtForm, { parse_mode: "HTML" });
                }
                else {
                    const totalpoints = user.points;
                    const txtForm = `<b>${user.userName}</b> has ${totalpoints} points.`;
                    yield bot.api.sendMessage(chatid, txtForm, { parse_mode: "HTML" });
                }
            }
        }
    }
    catch (e) {
        console.log(e);
    }
}));
bot.command("changeusername", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    //get acc
    try {
        const chat = yield ctx.getChat();
        const chatid = String(chat.id);
        const user = yield schema_1.User.findOne({ chatid: chatid });
        const oldName = user === null || user === void 0 ? void 0 : user.userName;
        //change username
        if (user) {
            let uName = ctx.match;
            uName.trim();
            uName = uName.toLowerCase();
            console.log("username iss", uName);
            if (uName == "") {
                yield ctx.reply("no empty usernames!");
                return;
            }
            const existingUser = yield schema_1.User.findOne({ userName: uName });
            if (existingUser) {
                yield ctx.reply("Username already taken! Try again with a different One");
                return;
            }
            user.userName = uName;
            let usernamechange = new schema_1.userNameChange({ fromName: oldName, toName: uName, chatid: chatid });
            yield usernamechange.save();
            yield user.save();
            yield ctx.reply("Username has been changed successfully");
        }
        else {
            yield ctx.reply("Signup first");
        }
    }
    catch (e) {
        console.log(e);
    }
}));
bot.command("report", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const tid = ctx.match;
    tid.trim();
    if (tid == "") {
        yield ctx.reply("no empty tweets!");
        return;
    }
    const tweetid = Number(tid) || 0;
    if (tweetid == 0) {
        yield ctx.reply("Enter a valid tid");
        return;
    }
    try {
        //get chat id
        const chat = yield ctx.getChat();
        const chatid = chat.id;
        const tweet = yield schema_1.Tweet.findOne({ tweetid: tweetid });
        if (tweet) {
            yield schema_1.Tweet.deleteOne({ tweetid: tweet.tweetid });
            const reportTweet = new schema_1.ReportedTweet({
                tweetid: tweet.tweetid,
                text: tweet.text,
                chatid: tweet.chatid,
                points: tweet.points,
                seen: tweet.seen,
                timestamp: tweet.timestamp,
                reportedby: String(chatid)
            });
            yield reportTweet.save();
            yield ctx.reply("Tweet has been reported");
        }
        else {
            yield ctx.reply("Cannot find the tweet");
        }
    }
    catch (e) {
        console.log(e);
    }
}));
// // Handle other messages -> accept only points.
bot.on("message", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const repliedMsg = (_c = ctx.update.message.reply_to_message) === null || _c === void 0 ? void 0 : _c.text;
    if (!repliedMsg) {
        //Stop
    }
    else {
        const [username, tid] = getUsernameTweetID(repliedMsg);
        const points = Number(ctx.update.message.text) || 0;
        //check if we can convert it to number
        if (points != 0) {
            //get user
            try {
                const chat = yield ctx.getChat();
                const chatid = String(chat.id);
                const chatuser = yield schema_1.User.findOne({ chatid: chatid });
                if (chatuser) {
                    const tweetMaker = yield schema_1.User.findOne({ userName: username });
                    if (tweetMaker) {
                        //check if user has enough points to give
                        chatuser.points = chatuser.points || 0;
                        tweetMaker.points = tweetMaker.points || 0;
                        const tweet = yield schema_1.Tweet.findOne({ tweetid: tid });
                        if (tweet) {
                            tweet.points = tweet.points || 0;
                            tweet.points = tweet.points + points;
                            yield tweet.save();
                            if (chatuser.points >= points) {
                                chatuser.points -= points;
                                tweetMaker.points += points;
                                yield chatuser.save();
                                yield tweetMaker.save();
                                ctx.reply(`${points} points has been given!`);
                            }
                            else {
                                yield ctx.reply(`You don't have enough points`);
                            }
                        }
                        else {
                            yield ctx.reply(`Points can only be given to a tweet`);
                        }
                    }
                    else {
                        yield ctx.reply(`Points can only be given to a tweet`);
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    }
}));
// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.
// Start the bot.
bot.start();
// const init = async () => {
//     try{
//         const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`)
//         console.log(res.data)    
//     }
//     catch(e){
//         console.log(e)
//     }
// }
// app.post(URI, async (req, res) => {
//     console.log(req.body)
//     const chatId = req.body.message.chat.id
//     const text = req.body.message.text
//     await axios.post(`${TELEGRAM_API}/sendMessage`, {
//         chat_id: chatId,
//         text: text
//     })
//     return res.send()
// })
passport_1.default.serializeUser(function (user, done) {
    done(null, user);
});
passport_1.default.deserializeUser(function (user, done) {
    done(null, user);
});
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: String(CLIENT_ID),
    clientSecret: String(CLIENT_SECRET),
    callbackURL: `${SERVER_URL}/callback`,
    passReqToCallback: true //passes the req object to this callback
}, function (request, accessToken, refreshToken, profile, done) {
    return __awaiter(this, void 0, void 0, function* () {
        if (profile._json.hd == "svce.ac.in") {
            //check if chat id and mailid already exist
            const userChatId = String(request.query.state) || "";
            const email = profile.emails[0].value;
            try {
                const user = yield schema_1.User.findOne({ chatid: userChatId, email: email });
                console.log(user);
                if (user) {
                    yield bot.api.sendMessage(userChatId, "You already have an account!");
                    return done("error");
                }
                else {
                    //add account
                    console.log("logged in");
                    console.log(profile);
                    console.log("chat id is", userChatId);
                    let user = new schema_1.User({
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        userName: profile.name.givenName,
                        email: profile.emails[0].value,
                        chatid: userChatId,
                        points: 1000,
                        recentTweetid: null
                    });
                    yield user.save();
                    yield bot.api.sendMessage(userChatId, '<b>You are verified now! Start seeing or sending tweets. Type /help to know more commands.</b>', { parse_mode: "HTML" });
                    return done(null, { id: profile.id });
                }
            }
            catch (error) {
                console.error('Error checking user existence:', error);
                return done(error); // Return false in case of an error
            }
        }
        else {
            return done("error");
        }
    });
}));
app.get("/", (req, res) => {
    res.send("hi");
});
app.get("/login/:chatid", (req, res, next) => {
    console.log("login request");
    let cid = req.params.chatid;
    passport_1.default.authenticate('google', { scope: ['email', 'profile'], state: cid, session: false }) //calling auth inside our middleware
    (req, res, next); //passing the objects from our middleware as parameters
});
app.get('/callback', passport_1.default.authenticate('google', {
    successRedirect: '/success',
    failureRedirect: '/fail',
}));
app.get("/success", (req, res) => {
    res.send("You are logged in Successfully , return to Telegram");
});
app.get("/fail", (req, res) => {
    res.send("fail");
});
app.listen(process.env.PORT || 3000, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🚀 app running on port', process.env.PORT || 3000);
    // await init()
}));
function getUsernameTweetID(input) {
    const inputString = input;
    // Extracting username using regular expression
    const usernameRegex = /from\s(.+?)\s\|/; //fixed regex
    const usernameMatch = inputString.match(usernameRegex);
    const username = usernameMatch ? usernameMatch[1] : null;
    // Extracting tid using regular expression
    const tidRegex = /tid:(\d+)/;
    const tidMatch = inputString.match(tidRegex);
    const tid = tidMatch ? parseInt(tidMatch[1]) : null;
    console.log("Username:", username);
    console.log("Tid:", tid);
    return [username, tid];
}
