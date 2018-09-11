const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
var stripe = require("stripe")(process.env.stripe_key);

const Product = require('../models/product');
const Order = require('../models/order');
const Shop = require('../models/shop')
const Cart = require('./../JS/cart');

var middleware = require('./../JS/middleware.js');
var geocode = require('./../JS/geocode');
var functions = require('./../JS/functions');


/* GET home page. */
router.get('/', async(req, res, next)=>{
  let pizzas = await Product.find({type: 'pizza'});
  let pizzaspc = await Product.find({type: 'pizzaSpc'});
  let grill = await Product.find({type: 'grill'});
  let drink = await Product.find({type: 'drink'});
  let forretter = await Product.find({type: 'forretter'});
  let varmeretter = await Product.find({type: 'varmeRetter'});
  let indbagt = await Product.find({type: 'indbagt'});
  let pitadurum = await Product.find({type: 'pitaDurum'});
  let børne = await Product.find({type: 'børne'});
  res.render('shop/index', {
    pizzas,
    pizzaspc,
    grill,
    drink,
    indbagt,
    varmeretter,
    forretter,
    pitadurum,
    børne
  })
});//end home page

//find os
router.get('/find',(req, res)=>{
  res.render('shop/find');
});

// get shoppingcart
router.get('/shoppingCart', middleware.indexIsLoggedIn, async(req, res) => {
  if(!req.session.cart){
    return res.render('shop/shoppingCart', {products: null});
  }
  let toppings = await Product.find({type: 'Topping'});
  var cart = new Cart(req.session.cart);
  if(cart.delType == 'LEVERING'){
    delType = 'Levering 30 kr'
  }
  else if(cart.delType == 'AFHENTNING'){
    delType = 'Afhentning'
  }
  else{
    delType = 'Vælg venligst'
  }
  res.render('shop/shoppingCart',{
    messages: req.flash('errors'),
    delType,
    toppings: toppings,
    products: cart.generateArray(),
    totalPrice: cart.totalPrice
  })
});

// add item to cart
router.get('/add-to-cart/:id', function(req, res, next){
  // get the added product id
  var productId = req.params.id;
  //we create a new cart everytime the add button is pressed, and the old cart is inserted to the new cart. the old cart is already stored in the session req.session.cart ? if it does exist, if it doesnt we add an empty js object {}.
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  req.session.shopping = true;

  Product.findById(productId, function(err, product){
    if(err){
      return res.redirect('/');
    }
    //add the item to the cart
    cart.add(product, product.id);
    //store the cart in the session.cart, the express.session saves the cart to DB automatic everytime we save something to session.
    req.session.cart = cart;
    //for dev purpose only
    console.log(req.session.cart);
    //redirect to product page
    res.redirect('/')
  });// end Product.find
});//end add-to-cart

// add topping to item in cart
router.get('/add-topping/:cartId/:toppingId', function(req, res, next){
  // get the cart id of the item to be added topping on, and the topping id to be added
  var cartId = req.params.cartId;
  var toppingId = req.params.toppingId
  //find the topping.
  Product.findById(toppingId, function(err, topping){
    if(err){
      return res.redirect('/');
    }
    //we create a new cart everytime the add button is pressed, and the old cart is inserted to the new cart. the old cart is already stored in the session req.session.cart ? if it does exist, if it doesnt we add an empty js object {}.
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    //add the item to the cart
    cart.addTopping(cartId,topping);
    //store the cart in the session.cart, the express.session saves the cart to DB automatic everytime we save something to session.
    req.session.cart = cart;
    //redirect to shoppingCart page
    res.redirect('/shoppingCart/');
  }); // end Product.find
}); // end add-topping

// remove item from cart
router.get('/remove/:cartId', function (req, res){
  var cartId = req.params.cartId;
  //we create a new cart everytime the add buttonis pressed, and the old cart is inserted to the new cart. the old cart is already stored in the session req.session.cart ? if it does exist, if it doesnt we add an empty js object {}.
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  //add the item to the cart
  cart.remove(cartId);
  //store the cart in the session.cart, the express.session saves the cart to DB automatic everytime we save something to session.
  req.session.cart = cart;
  //redirect to shoppingCart page
  res.redirect('/shoppingCart/');
});

// remove topping from item
router.get('/remove/:cartId/:toppingId', function (req, res){
  var cartId = req.params.cartId;
  var toppingId = req.params.toppingId;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  cart.removeTopping(cartId, toppingId);
  req.session.cart = cart;
  res.redirect('/shoppingCart/');
})

//change delType
router.get('/delType/:type', async (req, res)=>{
  let delType = req.params.type;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  console.log(cart.delType+' '+delType)
  if(delType == 'LEVERING' && cart.delType != 'LEVERING'){
    cart.delType = delType;
    cart.totalPrice += 30
  }else if(delType == 'AFHENTNING' && cart.delType == 'LEVERING'){
    cart.delType = delType;
    cart.totalPrice -= 30
  }
  req.session.cart = cart;
  res.redirect('/shoppingCart');
})

//bestilling
//add middleware.hasCartSession
router.get('/bestilling',middleware.indexIsLoggedIn, async (req, res)=>{
  var cart = new Cart(req.session.cart);
  if(cart.delType == 'choose'){
    req.flash('errors', 'Vælg venligst leveringsform');
    res.redirect('/shoppingCart');
    return
  }
  var user = req.user;
  let totalPrice = cart.totalPrice;
  let stripePrice = totalPrice * 100;
  let shopTime = await Shop.findOne({timeId: 1});
  res.render('shop/bestilling',{
    messages: req.flash('errors'),
    email: user.email,
    name: user.name,
    address: user.address,
    city: user.city,
    zip: user.zip,
    phone: user.phone,
    totalPrice,
    stripePrice,
    products: cart.generateArray(),
    delTime: shopTime.deliveryTime,
    pickTime: shopTime.pickupTime
  });
});

//send bestilling til shoppen
//add middleware.hasCartSession
router.post('/sendBestilling',middleware.indexIsLoggedIn, middleware.checkBestillingBody, async (req, res, next)=>{
  var cart = new Cart(req.session.cart);
  let totalPrice = cart.totalPrice;
  let stripePrice = totalPrice*100;
  //customer & shoptime details stored in var
  let customerDetails = {
    name:req.body.inputName,
    address: req.body.inputAddress,
    zip: req.body.inputZip,
    city: req.body.inputCity,
    phone: req.body.inputPhone
  }
  let address = req.body.inputAddress + req.body.inputZip + req.body.inputCity;
  let shopTime = await Shop.find({timeId: 1});
  let shopPickupTime = shopTime[0].pickupTime;
  let shopDelTime = shopTime[0].delTime;
  let d = Date.now();
  let pickupTime = d+shopPickupTime
  let delTime = d+shopDelTime
  let orderPickupTime = functions.getTime(pickupTime);
  let orderPickupDate = functions.getDate(pickupTime);
  let tempOrderDelTime = functions.getTime(delTime);
  let orderDelDate = functions.getDate(delTime);

  if(req.body.inputStateTid == 'vælg selv tid' && req.body.inputStateTidspunkt != 'Butikken har desværre lukket for selvvalgt tid for idag.'){
    orderDelTime = req.body.inputStateTidspunkt;
  }
  else{
    orderDelTime = tempOrderDelTime;
  }

  //if cash payment && asap && pickup
  if(req.body.inputStateBetaling==='Ved levering/afhentning (kontant eller mobilepay)'){
    //get del/pickup time
    console.log('cash fired')
    let route = await geocode.getLocation(address)
    if(route === 'NOT FOUND'){ //if errormessage from geocodeAddress
      req.flash('errors', 'kunne ikke finde den adresse');
      res.redirect('/bestilling');
    }else{
      //save order to variable
      var order = new Order({
      user: req.user, //from passport
      cart,
      paymentType: req.body.inputStateBetaling,
      deliveryType: req.body.pickupDelivery,
      dateTime: d,
      delDateTime: pickupTime,
      delTime: orderPickupTime,
      delDate: orderPickupDate,
      route,
      processed: false,
      status: 'pending',
      customerDetails,
      delType: cart.delType
      });
      order.save((err, result)=>{
        if(err){
          console.log(err);
          res.redirect('some-thing-went-wrong',{
            errorMSG: 'Noget gik galt, prøv venligst igen, eller kontakt restaurenten'
          })//end res.redirect
        }//end if
        var id = order._id;
        //socket io stuff here send to OMS
        res.io.emit('newOrder', {
          id,
          totalPrice: order.cart.totalPrice,
          order,
          user: req.user,
          route,
          d,
          delTime: orderPickupTime,
          delDate: orderPickupDate,
          customerDetails,
          delType: cart.delType
        });//end res.io.emit
        res.redirect(`processing?id=${id}`);
      })//end order.save
    }//end else
  } //end if cash payment && asap && pickup

  else if(req.body.inputStateBetaling==='Online med kort'){
    console.log('online fired')
    // Token is created using Checkout or Elements!
    // Get the payment token ID submitted by the form:
    const token = req.body.stripeToken; // Using Express
    //get del/pickup time
    let route = await geocode.getLocation(address)
    if(route === 'NOT FOUND'){ //if errormessage from geocodeAddress
      req.flash('errors', 'kunne ikke finde den adresse');
      res.redirect('/bestilling');
    }else{
      stripe.charges.create({
        amount: stripePrice,
        currency: "dkk",
        description: "fra node sorring shop",
        source: req.body.stripeToken,
      },(err, charge)=>{
        if(err){
          req.flash('errors', err.message);
          return res.redirect('shoppingCart');
        }
        //save order to variable
        var order = new Order({
          user: req.user, //from passport
          cart,
          paymentType: req.body.inputStateBetaling,
          deliveryType: req.body.pickupDelivery,
          dateTime: d,
          delDateTime: pickupTime,
          delTime: orderPickupTime,
          delDate: orderPickupDate,
          route,
          processed: false,
          status: 'pending',
          customerDetails,
          delType: cart.delType
          });
          order.save((err, result)=>{
            if(err){
              console.log(err);
              res.redirect('some-thing-went-wrong',{
                errorMSG: 'Noget gik galt, prøv venligst igen, eller kontakt restaurenten'
              })//end res.redirect
            }//end if
            var id = order._id;
            //socket io stuff here send to OMS
            res.io.emit('newOrder', {
              id,
              totalPrice: order.cart.totalPrice,
              order,
              user: req.user,
              route,
              d,
              delTime: orderPickupTime,
              delDate: orderPickupDate,
              customerDetails,
              delType: cart.delType
            });//end res.io.emit
            res.redirect(`processing?id=${id}`);
          })//end order.save
      })//end charge callback
    }//end else
  }// end if online payment && asap && pickup


  else{
    res.render('shop/sendBestilling',{
      okay: 'Okay',
      tid: 1
    });
  }

  // remove comment when done testing req.session.cart={}
});

//add middleware.hasCartSession
router.get('/processing', middleware.indexIsLoggedIn, (req, res)=>{
    //remove comment when done testing delete req.session.cart;
    var order = req.query.id;
    res.render('shop/processing',{
      order
    })//end render shop/processing
});//end get processing

router.get('/accepted', middleware.indexIsLoggedIn, async(req, res)=>{
  var id = req.query.id;
  let order = await Order.findById(id);
  res.render('shop/accepted',{
    id,
    time: order.delTime,
    date: order.delDate
  })
})//end accepted

router.get('/declined', middleware.indexIsLoggedIn, async (req, res)=>{
  var id = req.query.id;
  order = await Order.findOne({_id:id})
  orderId = order._id
  console.log(orderId)
  res.render('shop/declined',{
    order: orderId
  })
})//end declined

module.exports = router;
