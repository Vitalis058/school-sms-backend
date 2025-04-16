import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { prisma } from "../utils/Prisma";

export default passport.use(
  new Strategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (jwt_payload, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: {
            id: jwt_payload.userId,
          },
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);
