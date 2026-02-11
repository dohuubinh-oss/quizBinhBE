
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';

// Cấu hình Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Tìm người dùng đã tồn tại bằng googleId
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return done(null, user); // Đã có người dùng, trả về
      } else {
        // Nếu chưa có, tìm bằng email
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // Cập nhật googleId cho người dùng đã có email
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        } else {
          // Tạo người dùng mới
          const newUser = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value
          });
          await newUser.save();
          return done(null, newUser);
        }
      }
    } catch (err) {
      return done(err, false);
    }
  }
));

// Serialize và Deserialize User
// Lưu ID người dùng vào session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Lấy thông tin người dùng từ ID trong session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, false);
    }
});
