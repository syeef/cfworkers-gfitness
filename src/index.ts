/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

import GoogleAuth, { GoogleKey } from "cloudflare-workers-and-google-oauth";

// Add secret using Wrangler or the Cloudflare dash
export interface Env {
  GCP_SERVICE_ACCOUNT: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // https://developers.google.com/identity/protocols/oauth2/scopes
    const scopes: string[] = [
      "https://www.googleapis.com/auth/fitness.sleep.read",
    ];
    const googleAuth: GoogleKey = JSON.parse(env.GCP_SERVICE_ACCOUNT);

    // Initialize the service
    const oauth = new GoogleAuth(googleAuth, scopes);
    const token = await oauth.getGoogleAuthToken();

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayMidnightMilliseconds = todayMidnight.getTime();
    const todayMinusOne = todayMidnightMilliseconds - 86400000;
    const todayMinusTwo = todayMidnightMilliseconds - 86400000 * 2;
    // console.log("today: " + todayMidnightMilliseconds);
    // console.log("todayMinusOne: " + todayMinusOne);
    // console.log("todayMinusTwo: " + todayMinusTwo);

    var getSleepStats = await fetch(
      "https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: "com.google.sleep.segment",
            },
          ],
          //   endTimeMillis: 1673568000000,
          //   startTimeMillis: 1673481600000,
          endTimeMillis: todayMinusOne,
          startTimeMillis: todayMinusTwo,
        }),
      }
    ).then((response) => {
      return response.text();
    });

    var sleep = JSON.parse(getSleepStats);
    const headers: any = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Max-Age": "86400",
      "content-type": "application/json;charset=UTF-8",
    };
    return new Response(JSON.stringify(sleep, null, 2), headers);
  },
};
