// Model mapping system
const getModelByUserType = (userType) => {
  switch (userType.toLowerCase()) {
    case "admin":
      return Admin;
    case "college":
      return College;
    case "ngo":
      return Ngo;
    default:
      throw new ApiError(400, "Invalid user type");
  }
};

export default getModelByUserType;
