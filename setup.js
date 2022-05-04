require('./arrays');
const {Firestore} = require('@google-cloud/firestore');
const firestore = new Firestore();
const {Storage} = require('@google-cloud/storage')
const storage = new Storage();
const imageBucket = storage.bucket('auctionitemimages');


async function setupDatabase(){
    itemsArray.forEach(async item=>{
        itemObject = getItem(item);
//change back to auction_items
        await firestore.collection('auction_items').doc(String(item.id)).set(itemObject)
    })
}

const getItem = (item) => {
    // Create a JSON object that is ONLY the teacher's name
    itemData = {};
    itemData.id = item.id
    itemData.artist = item.artist
    itemData.title = item.title
    itemData.medium = item.medium
    itemData.size = item.size
    itemData.description = item.description
    itemData.about_artist = item.about_artist
    itemData.image = `https://storage.googleapis.com/auction_item_images/${item.id}.jpeg`    
    itemData.current_bid = 0.0
    
    return itemData;    
  }


setupDatabase();