import * as crypto from 'crypto'
import fetch from 'node-fetch'
import * as Types from '../declarations'
import Logger from '../services/logging'
import * as HelperUtil from './helper'
import * as MarketData from '../services/market-data'

const { BITTREX_API_KEY, BITTREX_API_SECRET } = process.env

const hmac = (key: string, data: string) => {
    const hash = crypto.createHmac('sha512', key)
    hash.update(data)
    return hash.digest('hex')
}

export const bittrexRequestV3 = async (
    apiRoute: string,
    method = 'GET',
    variables: { [key: string]: string | number } = {},
    requestBody = '',
) => {
    const bittrexHost = 'https://api.bittrex.com'
    const relativeURI = `/v3/${apiRoute}`
    const apiRouteUrl = bittrexHost + relativeURI

    // add vars
    let queryParamString = ''
    const queryParamArray = []
    for (const sKey in variables) {
        if (variables[sKey]) {
            queryParamArray.push(`${sKey}=${variables[sKey]}`)
        }
    }
    if (queryParamArray.length > 0) {
        queryParamString += '?'
        queryParamString += queryParamArray.join('&')
    }
    const signUri = apiRouteUrl + queryParamString

    const SHA512 = (data: string) => {
        const hash = crypto.createHash('sha512')
        hash.update(data)
        return hash.digest('hex')
    }

    const timestamp = new Date().getTime().toString()
    const contentHash = SHA512(requestBody)

    const preSign = [timestamp, signUri, method, contentHash, ''].join('')
    const signature = hmac(BITTREX_API_SECRET, preSign)

    const options = {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Api-Key': BITTREX_API_KEY,
            'Api-Timestamp': timestamp,
            'Api-Content-Hash': contentHash,
            'Api-Signature': signature,
        },
        method,
        url: signUri,
        withCredentials: false,
        body: requestBody ? requestBody : undefined,
    }

    let attemptsMade = 0
    const maxAttempts = 3
    const delayBetweenRetries = 3000 // milliseconds

    while (attemptsMade < maxAttempts) {
        attemptsMade++
        try {
            // log this request attempt
            await HelperUtil.logRequest('Bittrex', apiRouteUrl, queryParamString)

            // attempt to make request
            const httpRequest = await fetch(signUri, options)
            const success = httpRequest.status === 200 || httpRequest.status === 201

            const payload = await httpRequest.json()
            return {
                success,
                ...(success ? { payload } : { error: payload }),
            }
            return payload
        } catch (err) {
            Logger.warn('bittrex request failed', err)
            if (attemptsMade < maxAttempts) {
                // we'll try again, so for now, just log this error
                // todo - log to db as part of logging to db work. bot log instance specific
                // wait a moment before continuing
                Logger.info(`wait ${delayBetweenRetries / 1000} seconds before retrying`)
                await HelperUtil.delay(delayBetweenRetries)
            } else {
                Logger.warn(`failed ${maxAttempts} now, throw an error to get out of here`)
                // we've failed too many times in a row - throw a real error
                throw Error(`bittrex-request-failed-${maxAttempts}-times`)
            }
        }
    }
}

