import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import User from "../models/user.model.js";

passport.use(
  new GoogleStrategy.Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        
        if (!email) {
          return done(new Error("Email not provided by Google"), null);
        }

        let user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            if (profile.photos?.[0]?.value) {
              user.profilePicture = profile.photos[0].value;
            }
            await user.save();
          }
          return done(null, user);
        }

        // Create new user
        user = new User({
          username: profile.displayName || email.split("@")[0],
          email,
          googleId: profile.id,
          profilePicture: profile.photos?.[0]?.value,
          isVerified: true
        });

        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
