import bcrypt from "bcrypt";

const hashPasswordHook = function (next) {
  if (this.isModified("password")) {
    bcrypt.hash(this.password, 8, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  } else {
    next();
  }
};

export default hashPasswordHook;
