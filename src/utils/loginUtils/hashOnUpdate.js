import bcrypt from "bcrypt"

export const hashPasswordOnUpdate = async function (next) {
  const update = this.getUpdate();

  // Check if password is being updated (handle both $set and direct update)
  const passwordToHash = update.$set?.password || update.password;

  if (passwordToHash) {
    try {
      const hashedPassword = await bcrypt.hash(passwordToHash, 8);

      // Set the hashed password in the correct location
      if (update.$set) {
        update.$set.password = hashedPassword;
      } else {
        update.password = hashedPassword;
      }

      console.log("🔐 Password hashed during update operation");
    } catch (error) {
      console.error("❌ Error hashing password during update:", error);
      return next(error);
    }
  }

  next();
};
