/** What identifies this installation to a provider: created by whoever installs the app. */
export interface OauthClient {
  clientId: string;
  clientSecret: string;
}
