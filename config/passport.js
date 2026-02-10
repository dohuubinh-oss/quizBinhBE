
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
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

// Cấu hình Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Tìm người dùng đã tồn tại bằng facebookId
      let user = await User.findOne({ facebookId: profile.id });

      if (user) {
        return done(null, user);
      } else {
        // Facebook có thể không trả về email, cần xử lý trường hợp này
        const email = profile.emails ? profile.emails[0].value : null;
        if (email) {
            user = await User.findOne({ email });
            if (user) {
                user.facebookId = profile.id;
                await user.save();
                return done(null, user);
            }
        }
        
        // Tạo người dùng mới nếu không tìm thấy
        const newUser = new User({
            facebookId: profile.id,
            username: profile.displayName,
            // Đảm bảo có email trước khi gán
            email: email || `fb_${profile.id}@example.com`, // Email tạm thời nếu không có
            avatar: profile.photos[0].value
        });
        await newUser.save();
        return done(null, newUser);
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
