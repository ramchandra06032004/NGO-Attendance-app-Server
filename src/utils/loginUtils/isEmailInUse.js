const isThisEmailInUse = async function (email) {
  if (!email) throw new Error("Invalid Email");

  try {
    const user = await this.findOne({ email });
    if (user) return false;
    return true;
  } catch (error) {
    console.log("Error inside isThisEmailInUse method", error.message);
    return false;
  }
};

export default isThisEmailInUse;
