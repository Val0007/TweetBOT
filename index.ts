import dotenv from 'dotenv';
import express from 'express'
import axios from 'axios'
import bodyParser from 'body-parser'
import { Bot,webhookCallback } from "grammy";
import { InputFile } from "grammy";
import {Strategy} from 'passport-google-oauth20'
import passport, { use } from 'passport'
import session from 'express-session'
import db from './db'
import {User,Tweet,ReportedTweet} from './schema'
import { getTsBuildInfoEmitOutputFilePath } from 'typescript';


dotenv.config();
const dbb = new db()

//server will use long polling and constantly hit the telegram server for chats


const { TOKEN,CLIENT_ID,CLIENT_SECRET } = process.env
// const bot = new Bot(`${TOKEN}`);
// const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`
// const URI = `/webhook/${TOKEN}`
// const WEBHOOK_URL = SERVER_URL + URI


const app = express()
app.use(express.json()); // parse the JSON request body
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'bla bla bla' 
  }));
app.use(passport.session());
//app.use(webhookCallback(bot, "express"));




//LOGIN
bot.command("login",async (ctx) => {



    //check if already logged in
    try{

            //get chat id
        const chat = await ctx.getChat()
        const chatid = chat.id

        const user = await User.findOne({chatid:chatid})
        if(user){
            await bot.api.sendMessage(chatid,"You are already logged in!")
            return
        }
        else{
            //send link
            await ctx.api.sendMessage(
                chatid,
                `<a href="https://6cac-115-97-93-28.ngrok-free.app/login/${chatid}">Sign up now</a> <i>Use your Svce Mail</i>`,
                { parse_mode: "HTML" },
              );
        }


    }
    catch(e){
        console.log(e)
    }


})


//COMMANDS

// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Type /help to get a list of commands"));

bot.command("help",async (ctx) => {
    await ctx.reply("Hi! You must be logged in to send or see tweets.\n1./login to signup using svce mail id \n2./send (tweetText) -> to send your tweet\n3./see -> see a tweet\n4./stats -> to see your points and info about your tweet sent\n5./changeusername (customusername) -> to change your username , ex: /changeusername batman")
    const txtForm1 = `<b>Points:</b> To give points to a tweet press and hold the tweet and click on the reply button , in your reply just type the amount of points and click send`
    await ctx.reply(txtForm1,  { parse_mode: "HTML" })  
    const txtForm = `<b>NOTE:</b> <i>Don't send inappropriate Tweets , if you see any tweets like that type /report (tid) , ex:/report 156 => to report that tweet</i>`
    await ctx.reply(txtForm,  { parse_mode: "HTML" })  

})


bot.command("send",async(ctx)=>{
    const msg = ctx.match
    msg.trim()
    if(msg == ""){
        await ctx.reply("no empty tweets!")
        return
    }
    console.log("tweet id",ctx.update.message?.message_id)
    console.log("The msg is ",msg)
    //save tweet to db
    try{
            //get chat id
            const chat = await ctx.getChat()
            const chatid = chat.id
            const tid = ctx.update.message?.message_id
            const user = await User.findOne({chatid:chatid})
            if(user){
                const tweet = new Tweet({
                    tweetid:tid,
                    text:msg,
                    chatid:chatid,
                    points:0,
                    seen:[]
                })
                await tweet.save()
                console.log("tweet saved in db")
                //update his most recent tweet
                const recentTweetId = user.recentTweetid
                if(recentTweetId != null){
                    //delete his old tweet
                    await Tweet.findOneAndDelete({tweetid:recentTweetId})
                    user.recentTweetid = tid;
                    await user.save()
                    await bot.api.sendMessage(chatid,"Tweet sent!")
                    console.log("tweet saved")
    
                }
                else{
                    user.recentTweetid = tid;
                    await user.save()
                    await bot.api.sendMessage(chatid,"Tweet sent!")
                    console.log("tweet saved")
    
                }

                //update his stats
            }
            else{
                await bot.api.sendMessage(chatid,"Signup First!")
            }

    }
    catch(e){
        console.log(e)
    }




})

bot.command("see",async (ctx)=>{

    //get tweets and accounts
    //thalivar tweet - from akshay | tid:90
    try{
        const chat = await ctx.getChat()
        const chatid = String(chat.id)
        const currentTimestamp = new Date();
        // Calculate the timestamp 5 minutes ago
        const fiveMinutesAgo:Date = new Date(currentTimestamp.valueOf() - 5 * 60 * 1000);
        const tweets = await Tweet.find({ 
            //timestamp: { $lt: fiveMinutesAgo },
            seen: { $ne: chatid } , //not in array
            chatid: { $ne: chatid }
          });
          console.log("the tweets are ",tweets)
        if (tweets.length > 0) {
            // Select a random tweet from those that meet the criteria
            const selectedTweet = tweets[Math.floor(Math.random() * tweets.length)];
            
            // Mark the tweet as seen by the user
            selectedTweet.seen.push(chatid);
            await selectedTweet.save();
            const senderID = selectedTweet.chatid || ""
            const sentUser = await User.findOne({chatid:senderID})
            
                          //send tweet
            if(sentUser){
                const username = sentUser.userName || ""
                const tid = selectedTweet.tweetid
                const txt = selectedTweet.text || "emptyTweet"
                const txtForm = `${txt} - from ${username} | tid:${tid}`
                await bot.api.sendMessage(chatid,txtForm)  
            }

        } 
        else{
            console.log("not enough tweets available")
            const tweets = await Tweet.find({ 
                chatid: { $ne: chatid }
              });
              const selectedTweet = tweets[Math.floor(Math.random() * tweets.length)];
            
              // Mark the tweet as seen by the user
              //already would've seen it
              //selectedTweet.seen.push(chatid);
              await selectedTweet.save();
              const senderID = selectedTweet.chatid || ""
              const sentUser = await User.findOne({chatid:senderID})

              //send tweet
              if(sentUser){
                const username = sentUser.userName || ""
                const tid = selectedTweet.tweetid
                const txt = selectedTweet.text || "emptyTweet"
                const txtForm = `<b>${txt}</b> - \nfrom <i>${username} | tid:${tid}</i>`
                await bot.api.sendMessage(chatid,txtForm,  { parse_mode: "HTML" })  
              }
        }
        console.log("tweets sent")
    }
    catch(e){
        console.log(e)
    }

})



bot.command("stats",async(ctx)=>{

    //get user acc
    try{
        const chat = await ctx.getChat()
        const chatid = String(chat.id)
        const user = await User.findOne({chatid:chatid})
        if(user){
            if(user.recentTweetid != null){
                    //get recent tweet
                const tweet = await Tweet.findOne({tweetid:user.recentTweetid})
                if(tweet){
                    const tweetpoints = tweet.points
                    const totalpoints = user.points     
                    const usersSeenids = tweet.seen
                        //populate tweet seen
                    const usersSeen =  await User.find({ chatid: { $in: usersSeenids } });

                    let usernames:String[] = []
                    if(usersSeen.length > 0){
                         usernames = usersSeen.map((user):String => {
                            return user.userName || ""
                        })
                    }
                    var usernameStrings = usernames.join("\n")
                    if(usernameStrings == ""){
                        usernameStrings = "none"
                    }
                    const txtForm = `<b>${user.userName}</b> has ${totalpoints} points. \nYour last tweet got ${tweetpoints} points. \nIt was seen by:\n${usernameStrings}`
                    await bot.api.sendMessage(chatid,txtForm,  { parse_mode: "HTML" })  
    
                }
                else{
                    const totalpoints = user.points     
                    const txtForm = `<b>${user.userName}</b> has ${totalpoints} points.`
                    await bot.api.sendMessage(chatid,txtForm,  { parse_mode: "HTML" })  
                }

            }
        }
    }
    catch(e){
        console.log(e)
    }


})


bot.command("changeusername",async(ctx)=>{

    //get acc
    try{
        const chat = await ctx.getChat()
        const chatid = String(chat.id)
        const user = await User.findOne({chatid:chatid})


        //change username
        if(user){
            let uName = ctx.match
            uName.trim()
            uName = uName.toLowerCase()
            console.log("username iss",uName)
            if(uName == ""){
                await ctx.reply("no empty usernames!")
                return
            }
            const existingUser  = await User.findOne({userName:uName})
            if(existingUser){
                await ctx.reply("Username already taken! Try again with a different One")
                return
            }
            user.userName = uName
            user.save()
            await ctx.reply("Username has been changed successfully")
        }
        else{
            await ctx.reply("Signup first")
        }    
    }
    catch(e){
        console.log(e)
    }




})

bot.command("report",async (ctx) => {
    const tid = ctx.match
    tid.trim()
    if(tid == ""){
        await ctx.reply("no empty tweets!")
        return
    }
    const tweetid  = Number(tid) || 0
    if(tweetid == 0){
        await ctx.reply("Enter a valid tid")
        return
    }
    try{
            //get chat id
            const chat = await ctx.getChat()
            const chatid = chat.id
            const tweet = await Tweet.findOne({tweetid:tweetid})
            if(tweet){
                await Tweet.deleteOne({tweetid:tweet.tweetid})
                const reportTweet = new ReportedTweet({
                    tweetid:tweet.tweetid,
                    text:tweet.text,
                    chatid:tweet.chatid,
                    points:tweet.points,
                    seen: tweet.seen ,
                    timestamp: tweet.timestamp,
                    reportedby:String(chatid)
                })
                await reportTweet.save()
                await ctx.reply("Tweet has been reported")
            }
            else{
                await ctx.reply("Cannot find the tweet")
            }
    }
    catch(e){
        console.log(e)
    }
})   


// // Handle other messages -> accept only points.
bot.on("message",async (ctx) => {
    const repliedMsg = ctx.update.message.reply_to_message?.text
    if(!repliedMsg){
    //Stop
    }
    else{
        const [username,tid] = getUsernameTweetID(repliedMsg)
        const points  = Number(ctx.update.message.text) || 0
        //check if we can convert it to number
        if(points != 0){
        
        //get user
        try{

        const chat = await ctx.getChat()
        const chatid = String(chat.id)
        const chatuser = await User.findOne({chatid:chatid})
        if(chatuser){
            const tweetMaker = await User.findOne({userName:username})
            if(tweetMaker){
                //check if user has enough points to give
                chatuser.points = chatuser.points || 0
                tweetMaker.points = tweetMaker.points || 0
                const tweet = await Tweet.findOne({tweetid:tid})
                if(tweet){
                    tweet.points = tweet.points || 0
                    tweet.points = tweet.points + points   
                    await tweet.save() 
                    if(chatuser.points >= points){
                        chatuser.points -= points
                        tweetMaker.points += points
    
                        await chatuser.save()
                        await tweetMaker.save()
                        ctx.reply(`${points} points has been given!`)
                    }
                    else{
                        await ctx.reply(`You don't have enough points`)
                    }
                }
                else{
                    await ctx.reply(`Points can only be given to a tweet`)
                }

            }
            else{
                await ctx.reply(`Points can only be given to a tweet`)
            }
        }

        
        
        }
        catch(e){
            console.log(e)
        }
      }

    }
    

    
    
    }
    );

 

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

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user:any, done) {
        done(null, user);
});

passport.use(new Strategy({
    clientID: String(CLIENT_ID),
    clientSecret: String(CLIENT_SECRET),
    callbackURL: "https://6cac-115-97-93-28.ngrok-free.app/callback",
    passReqToCallback:true //passes the req object to this callback
  },
  async function(request,accessToken:String, refreshToken:String, profile:any,done:any) {
    if(profile._json.hd == "svce.ac.in"){
        //check if chat id and mailid already exist
        const userChatId = String(request.query.state) || ""
        const email = profile.emails[0].value
        
        try {
            const user = await User.findOne({ chatid:userChatId, email:email });
            console.log(user)
            if(user){
                await bot.api.sendMessage(userChatId,"You already have an account!")
                return done("error")
            }
            else{
                    //add account
                    console.log("logged in")
                    console.log(profile)
                    console.log("chat id is",userChatId)
                    let user  = new User({
                     firstName:profile.name.givenName,
                      lastName:profile.name.familyName,
                    userName:profile.name.givenName,
                    email:profile.emails[0].value,
                    chatid:userChatId,
                    points:1000,
                    recentTweetid:null
                })

                await user.save()

                await bot.api.sendMessage(
                 userChatId,
                '<b>You are verified now! Start seeing or sending snaps.</b>',
                { parse_mode: "HTML" },
                );
                return done(null, {id:profile.id}); 
             }
        } catch (error) {
            console.error('Error checking user existence:', error);
            return done(error); // Return false in case of an error
        }

         
    }
    else{
        return done("error")
    }
  }
));



app.get("/",(req,res)=>{
    res.send("hi")
})



app.get("/login/:chatid",  (req:any, res, next) => {  //adding a middleware
    console.log("login request")
    let cid = req.params.chatid;
    passport.authenticate('google',{ scope:[ 'email', 'profile' ],state:cid,session:false}) //calling auth inside our middleware
    (req,res,next); //passing the objects from our middleware as parameters
  }
)

app.get('/callback',
    passport.authenticate( 'google', {
        successRedirect: '/success',
        failureRedirect: '/fail',
}
));

app.get("/success",(req,res)=>{
    res.send("You are logged in Successfully , return to Telegram")
})

app.get("/fail",(req,res)=>{
    res.send("fail")
})

app.listen(process.env.PORT || 3000, async () => {
    console.log('🚀 app running on port', process.env.PORT || 3000)
    // await init()
})


function getUsernameTweetID(input:string){
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
return [username,tid]
}


