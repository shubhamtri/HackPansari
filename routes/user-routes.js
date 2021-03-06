const router=require('express').Router();
const app=require('express')();
const bcrypt=require('bcrypt');
const User=require('../models/user');
const passport=require('passport');
const auth=require('../config/auth');
const Shop=require('../models/Shop');
const Order=require('../models/Order');

router.get('/login',auth.User.revauthCheck,(req,res)=>{
  res.render('login-customer');
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/user/dashboard', 
    failureRedirect: '/user/login',
    failureFlash :true
  })(req, res, next);
});



router.get('/profile-update',auth.User.authCheck,(req,res)=>{
  res.render('profileUpdate-user',{user:req.user});
});



router.get('/profile',auth.User.authCheck,(req,res)=>{
  res.render('user-profile',{user : req.user});
})


router.get('/history',auth.User.authCheck,(req,res)=>{
  Order.find({from:req.user.id})
  .then((data)=>{
    res.render('history-user',{
      data,
      user : req.user
    });
  })
})


router.post('/profile-update',(req,res)=>{
  const err=[];
  const {password,username,area,city,state,image} = req.body;
  if(!password || !username || !area || !state || !city){
    err.push('All fields are required');
  }
  if(password.length <6){
    err.push('Password Should be 6 character long');
  }  
  User.findOne({username})
    .then((user)=>{
      if(user){
        err.push('Username is not Available');
      }

      if(err.length>0){
        res.render('profileUpdate-user',{
          password,
          username,
          city,
          state,
          image,
          area,
          err
        });
      }else{
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(password, salt, function(err, hash) { 
              User.findOneAndUpdate({email : req.user.email},{$set:{pass: hash,username : username,Area : area,City : city,State:state,image,Updated : true}},{upsert:true,new:true}).then((err,data)=>{
                 console.log('data update :::' + data);
                 res.redirect('/user/dashboard');
              }) 
          });
      });
      }
    })
})


router.get('/dashboard/:id',auth.User.authCheck,(req,res)=>{
  res.render('place-order',{
    shop_id:req.params.id,
    cust_id:req.user.id,
    cust_email:req.user.email,
    cust_name:req.user.name,
    cust_location:req.user.City
  });
})

router.post('/',(req,res)=>{
  res.redirect('/user/dashboard-user');
})


router.get('/dashboard',auth.User.authCheck,(req,res)=>{
  if(req.user.Updated){
    Shop.find({}).then((data)=>{
      res.render('dashboard-user',{
        user : req.user,
        shopData : data
      });
    })
    return;
  }
  res.redirect('/user/profile-update');
})

router.get('/logout',(req,res)=>{
  req.logOut();
  req.flash('success_msg','You are now successfully logout');
  res.redirect('/user/login');
});

router.get('/signup',auth.User.revauthCheck,(req,res)=>{
  res.render('signup-customer');
});

router.post('/signup',(req,res)=>{
  const {name,email,pass,re_pass} = req.body;
  const err=[];
  if(!pass || !name || !email || !re_pass){
    err.push('Please fill all the fields');
  }
  if(pass!==re_pass){
    err.push('Password Doesn\'t Match');
  }
  if(pass.length <6){
    err.push('Password Should be 6 character long');
  }
 
  if(err.length>0){
    res.render('signup-customer',{
      name,
      email,
      pass,
      re_pass,
      err
    });
  }else{
    User.findOne({email : email}).then((user)=>{
      if(user){
        err.push('Email already registered');
        res.render('signup-customer',{
          name,
          email,
          pass,
          re_pass,
          err
        });
      }else{
        const user=new User({
          name : name,
          email : email,
          pass :pass,
        });
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(pass, salt, function(err, hash) { 
              user.pass=hash;
              user.save().then((newUser)=>{
                req.flash('success_msg','You are succesfully registered');
                res.redirect('/user/login');
              }).catch(err=>{
                console.log(err);
              }); 
          });
      });
           
      }
    });
  } 
});

module.exports = router;