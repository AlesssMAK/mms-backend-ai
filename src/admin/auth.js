import { User } from '../models/user.js';
import bcrypt from 'bcrypt';

// AdminJS calls authenticate(email, password) — the form fields are
// labelled "Email"/"Password". The previous implementation looked up
// users by `phone`, a field that does not exist on the User schema
// (email/fullName/personalCode/password), so every admin login
// silently returned null with "User not found". Fixed to query by
// email and return the actual schema fields (fullName, not name).
export const authenticate = async (email, password) => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log('Admin login: user not found', email);
      return null;
    }
    if (user.role !== 'admin') {
      console.log('Admin login: not an admin', email);
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Admin login: password mismatch', email);
      return null;
    }
    console.log('Admin authenticated:', user.email);

    return {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};
