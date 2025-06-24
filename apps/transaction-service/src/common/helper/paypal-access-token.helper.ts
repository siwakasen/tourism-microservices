import axios from "axios"
import { ConfigService } from "@nestjs/config";

export async function generateTokenAccess(configService: ConfigService) : Promise<string>{
    const response = await axios({
        url: configService.get('PAYPAL_BASE_URL')+ '/v1/oauth2/token',
        method: 'post',
        data: 'grant_type=client_credentials',
        auth: {
            username: configService.get('PAYPAL_CLIENT_ID'),
            password: configService.get('PAYPAL_CLIENT_SECRET')
        }
    });

    return response.data.access_token;
}