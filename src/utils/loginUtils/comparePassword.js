import bcrypt from "bcrypt";

const comparePassword = async function (password) {
  if (!password) throw new Error("Password is missing, cannot compare!");

  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error) {
    return false;
  }
};

export default comparePassword;
