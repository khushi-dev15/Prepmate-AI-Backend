import User from "../models/user.model.js";

export async function createUser(data) {
  const created = await User.create(data);
  return created;
}

export async function findOneUser(query) {
  return await User.findOne(query).select("+password");
}
