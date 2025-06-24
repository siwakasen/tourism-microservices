import { HttpException, HttpStatus } from "@nestjs/common";
import axios from "axios";

export async function convertUSDToIDR(usdAmount: number): Promise<number> {
    try {
        const response = await axios.get(process.env.EXCHANGE_RATE_API);
        const rate = response.data.rates.IDR;
        return Math.round(usdAmount * rate);
    } catch (error) {
        console.error('Currency conversion error:', error.response?.data || error.message);
        throw new HttpException('Failed to convert currency', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}