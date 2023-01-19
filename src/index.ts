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
    const scopes: string[] = [
      "https://www.googleapis.com/auth/fitness.sleep.read",
    ];
    const googleAuth: GoogleKey = JSON.parse(env.GCP_SERVICE_ACCOUNT);

    // Initialize the service
    const oauth = new GoogleAuth(googleAuth, scopes);
    const token = await oauth.getGoogleAuthToken();

    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    const currentTime = Date.now();
    
    const startTimeMillis = new Date(currentTime - oneDayInMilliseconds).setUTCHours(0, 0, 0, 0);
    const endTimeMillis = new Date(currentTime - oneDayInMilliseconds).setUTCHours(23, 59, 59, 999);
    
    console.log("Previous day start:", startTimeMillis);
    console.log("Previous day end:", endTimeMillis);

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
          endTimeMillis,
          startTimeMillis,
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
