const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const bcrypt = require("bcrypt");
const crypto=require("crypto")
const path = require("path")
const saltRounds = 10;
const nodemailer=require('nodemailer')

const User = require("./models/user");
const Company = require("./models/company");
const Item = require("./models/item");
const Delivery = require("./models/delivery");
const Worker = require("./models/worker");
const {isLoggedIn,isNotLoggedIn,validationLoggin} = require("./helpers/middleware");


//<------------ AUTENTICATION ROUTES ------------>
router.post("/signup", isNotLoggedIn(), validationLoggin(), async (req, res, next) => {
  const {firstName,surname,email,password,repeatPassword } = req.body;
  try {
    const emailExists = await User.findOne({ email }, "email");
    if (emailExists) {
      res.status(200).json({errorMsg:"This email has already been used. Try to log in or reset your password."})
    } else {
      let accountActivationToken = await createToken()
      let tokenLink =  path.join(process.env.DEPLOY_URL, 'activateAccount', accountActivationToken)

      const salt = bcrypt.genSaltSync(saltRounds);
      const hashPass = bcrypt.hashSync(password, salt);
      const newUser = await User.create({firstName,surname,email,password: hashPass,token:accountActivationToken});
      sendActivationEmail(email,accountActivationToken)
      res.status(200).send();
    }
  } catch (error) {
    console.log(error);
  }
})
router.post("/login", validationLoggin(), async (req, res, next) => {
  const {email,password} = req.body;
  try {
    const user = await User.findOne({email});
    if(!user){
      res.status(200).json({errorMsg:"This email doesn't beloing to any existing user."});
    }else if(user.activated===false){
      res.status(200).json({errorMsg:"We sent you an email to activate the account, click the button below to recieve the activation email again."});
    }else if(bcrypt.compareSync(password,user.password)){
      req.session.currentUser = user;
      res.status(200).json(user);
    }else{
      res.status(200).json({errorMsg:"The email or password is incorrect."});
    }
  } catch (error) {
    next(error);
  }
})
router.post("/logout", (req, res, next) => {
  req.session.destroy()
  res.status(200).send()
})
router.get("/me", isLoggedIn(), (req, res, next) => {
  req.session.currentUser.password = "*"
  res.json(req.session.currentUser)
})
router.post("/sendAccountActivationEmail", isNotLoggedIn(),async (req,res,next)=>{
  const {email} = req.body
  try{
    const emailExists = await User.findOne({ email });
    if (!emailExists){
      res.status(200).json({errorMsg:"This email doesn't belong to any user. Register to create your account."})
    }else{
      sendActivationEmail(email,emailExists.token)
      res.status(200).json(emailExistst)
    }
  }catch(err){
    console.log(err)
  }
})
router.get("/activateAccount/:token",async(req,res,next)=>{
  const {token} = req.params
  try{
    const emailExists = await User.findOneAndUpdate({token:token},{ activated:true, token:"" });
    res.status(200)
  }catch(err){
    console.log(err)
  }
})
router.post("/sendResetPasswordEmail", async (req,res,next)=>{
  const {email} = req.body
  try{
    const emailExists = await User.findOne({email:email});
    if (!emailExists){
      res.status(200).json({errorMsg:"This email doesn't belong to any user. Register to create your account."})
    }else{
      sendResetPasswordEmail(email,emailExists._id)
      res.status(200).json(emailExists)
    }
  }catch(err){
    console.log(err)
  }
})
router.post("/saveNewPassword/:id", async (req,res,next)=>{
  const {password} = req.body
  const {id} = req.params
  try{
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPass = bcrypt.hashSync(password, salt);
    const userUpdated = await User.findByIdAndUpdate(id,{ password:hashPass });
    if (!userUpdated){
      res.status(200).json({errorMsg:"This reset link is not valid. Register to create your account."})
    }else{
      sendPasswordHasBeenChangedEmail(userUpdated.email)
      res.status(200).json(userUpdated)
    }
  }catch(err){
    console.log(err)
  }
})
router.post("/getUserInfo",async(req,res,next)=>{
  const {id} = req.body
  try{
    const user = await User.findById(id);
    res.status(200).json(user)
  }catch(err){
    console.log(err)
  }
})
router.post("/saveNewPasswordFromSettings", async (req,res,next)=>{
  const {id, name, surname, email,password,newPassword} = req.body
  try{
    const user = await User.findById(id);
    if(bcrypt.compareSync(password,user.password)){
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashPass = bcrypt.hashSync(newPassword, salt);
      if (newPassword===""){
        const userUpdated = await User.findByIdAndUpdate(id,{ firstName:name, surname, email})
      } else{
        const userUpdated = await User.findByIdAndUpdate(id,{ firstName:name, surname, email,password:hashPass })
        sendPasswordHasBeenChangedEmail(user.email)
      }
      res.status(200).json();
    }else{
      res.status(200).json({errorMsg:"The password is incorrect."});
    }
  }catch(err){
    console.log(err)
  }
})

//<------------ USER ------------>

//ADD COMPANY WITH CODE
router.post("/add-company/:invitationCode", isLoggedIn(), async (req, res, next) => {
  try{
    //Y si se introduce un codigo incorrecto o que no existe?
    const invitationCode = req.body;
    const user = req.session.currentUser;
    // deberiamos hacer como en el /GET "me" para ocultar la contraseña del usuario?
    const theCompany = await Company.find(invitationCode)
    const updatedUser = await User.findByIdAndUpdate(user._id,{$addToSet:{companies: theCompany}},{new:true}) 
    req.session.currentUser = updatedUser;
    res.status(200).json(updatedUser);
  }catch(error){
    console.log(error)
    // Deberiamos añadir lo siguiente?
    // res.status(500)
  }
});


//<------------ COMPANY ------------>

/* CREATE COMPANY */
router.post("/add-company", async (req, res, next) => {
  const { companyName, /* logoUrl , */ respName, email, invitationCode } = req.body;
  const user = req.session.currentUser;
  try {
    const company = await Company.findOne({ companyName });
    if (company !== null) {
      return next(createError(400));
    }
    const newCompany = await Company.create({
      companyName,
      invitationCode,
      responsible : { respName, email },
    });
    res.status(200).json(newCompany);
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $addToSet: { companies: newCompany } },
      { new: true }
    );
    req.session.currentUser = updatedUser;
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
});

/* COMPANY DETAILS */
router.get("/get-company/:id", isLoggedIn(), (req, res, next) => {
  Company.findById(req.body)
  .then(companyFound => {
      res.status(200).json(companyFound);
  })
  .catch(error => {
      res.json(error)
  })
})

/* USER COMPANIES LIST */
router.get("/usercompanies/:id", isLoggedIn(), (req, res, next) => {
  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      res.status(400).json({message: "Specified id is not valid"});
      return;
  }
  User.findById(req.params.id).populate('companies')
    .then(userFound => {
        res.status(200).json(userFound.companies);
    })
    .catch(error => {
        res.json(error)
    })
})







async function createToken(){
  let token = crypto.randomBytes(20)
  let result = token.toString('hex')
  return result
}
async function sendPasswordHasBeenChangedEmail(emailTo){
  emailParams={
    from:"Password Changed",
    to:emailTo,
    subject:"Password Changed",
    html:"Your password has been changed"
  }
  await sendEmail(emailParams)
}
async function sendResetPasswordEmail(emailTo,token){
  emailParams={
    from:"Password Reset",
    to:emailTo,
    subject:"Change Your Password",
    html:"http://localhost:3000/resetPassword/"+token
  }
  await sendEmail(emailParams)
}
async function sendActivationEmail(emailTo,token){
  emailParams={
    from:"Account Activation",
    to:emailTo,
    subject:"Account Activation",
    html:"http://localhost:3000/activateAccount/"+token
  }
  await sendEmail(emailParams)
}
async function sendEmail(emailParams){
  // console.log("ENTERED EMAIL")
  // console.log(emailParams)
  
  let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure:false,
      auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
  })
  let info=await transporter.sendMail({
      from: '"'+emailParams.from+'"<estevemartinmauri@hotmail.com>',
      to: emailParams.to,
      subject: emailParams.subject,
      html: emailParams.html,
  })
  console.log("EMAIL SENT to " + emailParams.to)
}

module.exports = router;
