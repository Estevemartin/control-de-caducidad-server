

const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const User = require("./models/user");
const Company = require("./models/company");

/* AUTENTICATION ROUTES */

const {
  isLoggedIn,
  isNotLoggedIn,
  validationLoggin,
} = require("./helpers/middleware");

// SIGN UP

router.post(
  "/signup", isNotLoggedIn(), validationLoggin(), async (req, res, next) => {
    const { firstName, surname, email, password, repeatPassword } = req.body;

    try {

      //TODO: Función de validaciones
      const emailExists = await User.findOne({ email }, "email");
      if (emailExists) {
        return next(createError(400));
      } else {
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashPass = bcrypt.hashSync(password, salt);
        const newUser = await User.create({
          firstName,
          surname,
          email,
          password: hashPass,
        });
        req.session.currentUser = newUser;
        res.status(200).json(newUser);
      }
    } catch (error) {
      next(error);
    }
  }
);

//'/login'

router.post("/login", isNotLoggedIn(), validationLoggin(), async (req, res, next) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ errorMessage: "email not valid" });
        next(createError(404, "email not valid"));
      } else if (bcrypt.compareSync(password, user.password)) {
        req.session.currentUser = user;
        res.status(200).json(user);
        return;
      } else {
        res.status(401).json({ errorMessage: "password not valid" });
        next(createError(401, "password not valid"));
      }
    } catch (error) {
      next(error);
    }
  }
);

//log out
router.post("/logout", isLoggedIn(), (req, res, next) => {
  req.session.destroy();
  res.status(204).send().json({ message: " User is logged out" });
  return;
});

// GET '/me'

router.get("/me", isLoggedIn(), (req, res, next) => {
  req.session.currentUser.password = "*";
  res.json(req.session.currentUser);
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
  } catch (error) {
    next(error);
  }
});


//<------------ USER ------------>

router.get("/profile/:id/my-exercises", isLoggedIn(), (req, res, next) => {
  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      res.status(400).json({message: "Specified id is not valid"});
      return;
  }
  User.findById(req.params.id)
    .then(userFound => {
        res.status(200).json(userFound.exerciseCreated);
    })
    .catch(error => {
        res.json(error)
    })
})

module.exports = router;
