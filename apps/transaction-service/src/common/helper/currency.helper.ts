import { HttpException, HttpStatus } from "@nestjs/common";
import axios from "axios";

export async function convertUSDToIDR(usdAmount: number): Promise<number> {
    try {
        const response = await axios.get(process.env.EXCHANGE_RATE_API);
        const rate = response.data.rates.IDR;
        return Math.round(usdAmount * rate);
    } catch (error) {
        console.error('Currency conversion error:', error.response?.data || error.message);
        throw new HttpException(error.message || 'Failed to convert currency', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export async function getExchangeRate() {
    try {
        const response = await axios.get(process.env.EXCHANGE_RATE_API);
        return response.data.rates.IDR;
    } catch (error) {
        console.error('Exchange rate error:', error.response?.data || error.message);
        throw new HttpException(error.message || 'Failed to get exchange rate', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
}