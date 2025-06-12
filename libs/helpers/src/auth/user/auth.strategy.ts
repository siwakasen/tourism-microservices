import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Employee } from 'libs/entities';
import { Customer } from 'libs/entities/customer/customer.entity';
import { AuthHelper } from './auth.helper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'user') {
  @Inject(AuthHelper)
  private readonly helper: AuthHelper;

  constructor(@Inject(ConfigService) config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_KEY'),
      ignoreExpiration: false,
    });
  }

  public async validate(payload: any): Promise<Employee | Customer> {
    const user = await this.helper.validateUser(payload);
    if (user) {
      return user;
    }
    
    // If not found as Admin, try to find as Customer
    const customer = await this.helper.validateCustomer(payload);
    if (customer) {
      return customer;
    }

    return null;
  }
}
