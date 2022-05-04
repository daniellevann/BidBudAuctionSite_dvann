const express = require('express');
const path = require('path');
// Start App
const app = express();
const bodyParser = require('body-parser')
const {Firestore}=require('@google-cloud/firestore');
const {PubSub} = require('@google-cloud/pubsub');
const hbs = require('hbs');

const port = 8080;
const firestore = new Firestore();
const items = firestore.collection('auction_items')
const users = firestore.collection('users')

//SET THE PUBSUB TOPIC NAME
const pubsub_topic = 'make_bid';

// CREATE AN INSTANCE OF PUBSUB
const pubSubClient = new PubSub();

//View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//Middleware
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());



// ROUTES

// Routes Home Page and returns list of auction items
app.get('/', async(req, res) => {

    var itemList = [];
    var total_bid = 0;
    // This function is getting all informaation from firestore for all auction_items and pushing it into an empty array that i can now access in the hbs file - Danielle
    await items.orderBy('current_bid', 'asc').get().then((querySnapshot)=>{
        querySnapshot.forEach((doc)=>{ 
            console.log(doc.data().title); 
            itemList.push(doc.data());
            total_bid += doc.data().current_bid

        })
    });

    // Render index hbs(html) file
res.render('./index', {title:'Bid Bud', items: itemList,total:total_bid});
});


app.get('/users', async(req, res) => {
    var userList = []
    const doc  = await firestore.collection('users').get()
    .then((querySnapshot)=>{
        querySnapshot.forEach((doc)=>{
            userList.push(doc.data())
            data = doc.data(); 
            console.log(doc.data())
    }); 
})

    // Render index hbs(html) file
res.render('users/index',{title:'Users',userList:userList});
});

app.get('/users/:userID', async(req, res) => {
    const userID = req.params.userID
    const bids = []
    await firestore.collection('users').doc(userID).collection('bids').get()
    .then((querySnapshot)=>{
        querySnapshot.forEach((doc)=>{
            bids.push(doc.data())
            console.log(doc.data())
    }); 
})

    // Render index hbs(html) file
res.render('users/view-user',{title:userID,bids:bids});
});


// Routes each item page
app.get('/:item', async(req, res) => {
    const item_id = req.params.item.toString();
    console.log(`item:${item_id}`)
    
    //var filteredItem = items.where("title","==",req.params.item1);
    const doc = await firestore.collection('auction_items').doc(item_id).get();
    if(!doc.exists){
        
       console.log(`Item Not Found`)
            
          
        }
        else{
             console.log(doc.data());
            artist = doc.data().artist
             description = doc.data(item_id).description
             id = doc.data().id
             image =  doc.data().image  
             medium =  doc.data().medium 
             size =  doc.data().size
             title = doc.data().title 
             about_artist =  doc.data().about_artist
             bid = doc.data().current_bid + 10
             res.render('items/index', {id:item_id,title:title,desc:description,img:image,med:medium,size:size,about_artist:about_artist,artist:artist,bid:bid}); 
        }
                                   
// Render items page hbs
// req.params.item is reading the url for the parnameter(auction item id) and then sending the page - Danielle
 
})



// Connects bid form to pubsub
app.post('/bid', async(req,res)=>{
    const email = req.body.email_address;
    const bid = parseInt(req.body.bid_amount);
    const auctionItem = req.body.auction_item;
    const phone = req.body.phone_number

    const message_data = JSON.stringify({
        email_address: email,
        current_bid: bid,
        auction_item: auctionItem,
        phone_number: phone
    });
    console.log(message_data)
    // Create data buffer that allows us to stream message
    const dataBuffer = Buffer.from(message_data);
    //Publish Message
    const messageID = await pubSubClient.topic(pubsub_topic).publish(dataBuffer);
    res.status(200).send(`Thank for making a bid <br/> Message ID: ${messageID}`)
})


app.listen(port, () => {
  console.log(`BidBud Web App listening on port ${port}`);
});
