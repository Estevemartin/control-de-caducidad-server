const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const User = require("../models/user");
const Company = require("../models/company");
const Item = require("../models/item");
const Delivery = require("../models/delivery");
const Worker = require("../models/worker");
const {isLoggedIn,isNotLoggedIn,validationLoggin} = require("../helpers/middlewares");

// AUTHENTICATION
router.post("/signup", isNotLoggedIn(), validationLoggin(), async (req, res, next) => {
  const {name,surname,email,password,confirmPassword} = req.body;
  // console.log("INSIDE SIGNUP POST")
  // console.log(name,surname,email,password,confirmPassword)
  try {
    errorMsg = signupFormValidations(name,surname,email,password,confirmPassword)
    if (errorMsg!==""){
      res.status(400).json({error:errorMsg})
    } else{
      let accountActivationToken = await createToken()
      let tokenLink =  path.join(env.process.DEPLOY_URL, 'activateAccount', accountActivationToken)

      const salt = bcrypt.genSaltSync(saltRounds);
      const hashPass = bcrypt.hashSync(password, salt);
      const newUser = await User.create({name:name, surname:surname, password:hashPass, email:email})
      req.session.currentUser = newUser;
      // console.log(newUser)
      res.status(200).json(newUser);
    }
  } catch (error) {
      next(error);
  }
});




function signupFormValidations(name,surname,email,password,confirmPassword){

  const userExists = await User.find({email:email})

  // Checking Empty Fields
  let emptyFields = []
  if (!name){emptyFields.push("Name")}
  if (!surname){emptyFields.push("Surname")}
  if (!email){emptyFields.push("Email")}
  if (!password){emptyFields.push("Password")}
  if (!confirmPassword){emptyFields.push("Password Confirmation")}


  if (emptyFields.length!=0){
    if (emptyFields.length===1) {
      errorMsg = "You forgot to fill your " + emptyFields[1] + "."
    } else {
      errorMsgStart = "You forgot to fill your"
      errorMsgEnd = "."
      errorMsgFields=""
      emptyFields.forEach((element,index)=>{
        if (index===emptyFields.length-1){
          errorMsgFields = errorMsgFields + element 
        } else if (index===emptyFields.length-2){
          errorMsgFields = errorMsgFields + element + " and "
        } else {
          errorMsgFields = errorMsgFields + element + ", "
        }
      })
      errorMsg = errorMsgStart + errorMsgFields + errorMsgEnd
    }
    return errorMsg
  } else if (password!==confirmPassword) {
     return "The passwords doesn't match."
  } else if(password.length<6) {
    return "The password must have at least 6 characters."
  } else if (userExists.length!==0){
    return "This email has already been used."
  } else {
    return ""
  }
}

async function createToken(){
  let token = crypto.randomBytes(20)
  let result = token.toString('hex')
  return result
}