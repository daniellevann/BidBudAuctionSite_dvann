
// Creates User Collection in Firestore and something with pubsub -Danielle
require('dotenv').config();
const sgMail = require('@sendgrid/mail');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twText = require('twilio')(accountSid,authToken);

exports.recordUsers = async(event,context)=>{
    
    const {Firestore} = require("@google-cloud/firestore");
    const firestore = new Firestore();
    const incomingMessage = Buffer.from(event.data, 'base64').toString('utf-8')
    const parsedMessage = JSON.parse(incomingMessage);

    // This is where the information from the form and pubsub is put into firestore
   
    var collectionRef = firestore.collection('users').doc(parsedMessage.email_address)
    await collectionRef.set({"email_address":parsedMessage.email_address,"phone_number":parsedMessage.phone_number});    
    console.log(`Document created ${collectionRef.id}`);

    //adds user subcollection
    await collectionRef.collection('bids').doc().set({"bid_amount":parsedMessage.current_bid,"auction_item":parsedMessage.auction_item});

    // Updates current_bid field in auction_items
    await firestore.collection('auction_items').doc(parsedMessage.auction_item).update({"current_bid":parsedMessage.current_bid})
    
  //Adds subcollection to auction-items
    await firestore.collection('auction_items').doc(parsedMessage.auction_item).collection('bids').doc().set({"bid_amount":parsedMessage.current_bid,"email_address":parsedMessage.email_address,"phone_number":parsedMessage.phone_number})


    var headline = "Thank You For Bidding with Bid Bud Auction";
    var email_body = ` Thank you for your bid of $${parsedMessage.current_bid} for the auction item: ${parsedMessage.auction_item}`;
    
    sendEmail(parsedMessage.email_address, headline, email_body);
    sendText(parsedMessage.phone_number, email_body)
   };


   function sendEmail(toAddress,headline, email_body){
    console.log(`Sending email to ${toAddress}`);
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg ={
        to: toAddress,
        from: process.env.SENDGRID_SENDER,
        subject:headline,
        text:email_body
    };
    console.log(JSON.stringify(msg));
    sgMail
    .send(msg)
    .then(()=>{console.log(`Sending email sent to ${toAddress}`)}, error=>{
        console.error(error)
    });
}

// sends text
function sendText(toNumber,email_body){
    console.log(`Sending text to ${toNumber}`);
    twText.messages
    .create({
        body: email_body,
        from:'+19378263752',
        to: toNumber
    })
    .then(message=> console.log(message.sid))
}