import axios from "axios"
import { ConfigService } from "@nestjs/config";
import { AuthRedisService } from "apps/transaction-service/src/api/payments/redis.service";

export async function generateTokenAccess(configService: ConfigService, redisService: AuthRedisService) : Promise<string>{
    const response = await axios({
        url: configService.get('PAYPAL_BASE_URL')+ '/v1/oauth2/token',
        method: 'post',
        data: 'grant_type=client_credentials',
        auth: {
            username: configService.get('PAYPAL_CLIENT_ID'),
            password: configService.get('PAYPAL_CLIENT_SECRET')
        }
    });

    await redisService.setValue('access_token', response.data.access_token, response.data.expires_in);

    return response.data.access_token;
}