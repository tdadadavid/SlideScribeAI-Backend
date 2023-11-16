import { JwtPayload } from "jsonwebtoken";
import { Context, HttpStatus, UnAuthorizedError, config } from "../../core";
import { UserRepository, Users } from "../../users";
import { BlackListRepository } from "../model";
import { LogoutPayload } from "../types";
import { TokenService } from "../helpers";
import { AppMessages } from "../../common";

export class Logout {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
    private readonly blackListRepository: BlackListRepository,
  ) {}

  /**
   * @description Destroys user session
   * @param {Context<LogoutPayload>} payload
   * @returns { code: string, message: string } response
   */
  async handle({ user, headers }: Context<LogoutPayload>) {
    // get the auth token
    const tokenHeader = headers.authorization!;
    if (!tokenHeader) return;

    // then blacklist the token to prevent
    // another user using it to perform 
    // authenticated actions.
    await this.tokenService
      .extractTokenDetails(tokenHeader, config.auth.refreshTokenSecret)
      .then(this._blackListToken);

    // remove the refresh token from the user records.
    this._destroySession(user.id);

    return {
      code: HttpStatus.OK,
      message: AppMessages.SUCCESS.LOGOUT,
    };
  }

  private async _blackListToken({
    token,
    expiration,
  }: {
    token: string;
    expiration: Date;
  }): Promise<void> {
    await this.blackListRepository.create({
      token,
      expiryDate: expiration,
    });
    //TODO: can add cron job later to remove stale tokens.
  }

  private async _destroySession(userId: string): Promise<void> {
    await this.userRepository.updateOne(
      {
        user_id: userId,
      },
      {
        $set: {
          refreshToken: "",
        },
      },
    );
  }
}
