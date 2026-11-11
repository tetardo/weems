import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Tables of Better Auth (accounts, sessions) and of its jwt and oauth-provider plugins, version 1.7.
 * Property names are the library's field names; it reads and writes them through the Drizzle adapter.
 * After a library upgrade, compare with the fields it expects (`getAuthTables`) before migrating.
 */

const utc = (name: string) => timestamp(name, { withTimezone: true, precision: 3, mode: "date" });
const id = () => uuid("id").primaryKey();
const userRef = (name: string) => uuid(name).references(() => users.id, { onDelete: "cascade" });

/** A pilot. `name` is the public pseudonym; the e-mail is never shown to other pilots. */
export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: utc("created_at").notNull().defaultNow(),
  updatedAt: utc("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    expiresAt: utc("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: utc("created_at").notNull().defaultNow(),
    updatedAt: utc("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: userRef("user_id").notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

/** Login methods of a pilot; the password hash lives here (provider "credential"). */
export const accounts = pgTable(
  "accounts",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: userRef("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: utc("access_token_expires_at"),
    refreshTokenExpiresAt: utc("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: utc("created_at").notNull().defaultNow(),
    updatedAt: utc("updated_at").notNull(),
  },
  (table) => [index("accounts_user_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: utc("expires_at").notNull(),
    createdAt: utc("created_at").notNull().defaultNow(),
    updatedAt: utc("updated_at").notNull().defaultNow(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

/** Signing keys of the access tokens (private keys encrypted with WEEMS_AUTH_SECRET). */
export const jwks = pgTable("jwks", {
  id: id(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: utc("created_at").notNull(),
  expiresAt: utc("expires_at"),
  alg: text("alg"),
  crv: text("crv"),
});

export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: id(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"),
    clientDiscoveryId: text("client_discovery_id"),
    disabled: boolean("disabled").default(false),
    skipConsent: boolean("skip_consent"),
    enableEndSession: boolean("enable_end_session"),
    subjectType: text("subject_type"),
    scopes: text("scopes").array(),
    clientCredentialsScopes: text("client_credentials_scopes").array(),
    userId: uuid("user_id").references(() => users.id),
    createdAt: utc("created_at"),
    updatedAt: utc("updated_at"),
    name: text("name"),
    uri: text("uri"),
    icon: text("icon"),
    contacts: text("contacts").array(),
    tos: text("tos"),
    policy: text("policy"),
    softwareId: text("software_id"),
    softwareVersion: text("software_version"),
    softwareStatement: text("software_statement"),
    redirectUris: text("redirect_uris").array().notNull(),
    postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
    backchannelLogoutUri: text("backchannel_logout_uri"),
    backchannelLogoutSessionRequired: boolean("backchannel_logout_session_required"),
    tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
    applicationType: text("application_type"),
    jwks: text("jwks"),
    jwksUri: text("jwks_uri"),
    grantTypes: text("grant_types").array(),
    responseTypes: text("response_types").array(),
    requirePKCE: boolean("require_pkce"),
    dpopBoundAccessTokens: boolean("dpop_bound_access_tokens").default(false),
    referenceId: text("reference_id"),
    metadata: jsonb("metadata"),
  },
  (table) => [index("oauth_clients_user_idx").on(table.userId)],
);

export const oauthResources = pgTable("oauth_resources", {
  id: id(),
  identifier: text("identifier").notNull().unique(),
  name: text("name").notNull(),
  accessTokenTtl: integer("access_token_ttl"),
  refreshTokenTtl: integer("refresh_token_ttl"),
  signingAlgorithm: text("signing_algorithm"),
  signingKeyId: text("signing_key_id"),
  allowedScopes: text("allowed_scopes").array(),
  customClaims: jsonb("custom_claims"),
  dpopBoundAccessTokensRequired: boolean("dpop_bound_access_tokens_required").default(false),
  disabled: boolean("disabled").default(false),
  createdAt: utc("created_at"),
  updatedAt: utc("updated_at"),
  policyVersion: integer("policy_version").default(1),
  metadata: jsonb("metadata"),
});

export const oauthClientResources = pgTable(
  "oauth_client_resources",
  {
    id: id(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.clientId, { onDelete: "cascade" }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => oauthResources.identifier, { onDelete: "cascade" }),
    metadata: jsonb("metadata"),
    createdAt: utc("created_at"),
  },
  (table) => [
    index("oauth_client_resources_client_idx").on(table.clientId),
    index("oauth_client_resources_resource_idx").on(table.resourceId),
  ],
);

/** Columns shared by the access and refresh tokens. */
const tokenColumns = () => ({
  id: id(),
  token: text("token").notNull().unique(),
  clientId: text("client_id")
    .notNull()
    .references(() => oauthClients.clientId),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
  referenceId: text("reference_id"),
  authorizationCodeId: text("authorization_code_id"),
  resources: text("resources").array(),
  requestedUserInfoClaims: text("requested_user_info_claims").array(),
  expiresAt: utc("expires_at").notNull(),
  createdAt: utc("created_at").notNull(),
  revoked: utc("revoked"),
  confirmation: jsonb("confirmation"),
  scopes: text("scopes").array().notNull(),
});

export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    ...tokenColumns(),
    userId: userRef("user_id").notNull(),
    rotatedAt: utc("rotated_at"),
    rotationReplayResponse: text("rotation_replay_response"),
    rotationReplayExpiresAt: utc("rotation_replay_expires_at"),
    authTime: utc("auth_time"),
  },
  (table) => [
    index("oauth_refresh_tokens_client_idx").on(table.clientId),
    index("oauth_refresh_tokens_session_idx").on(table.sessionId),
    index("oauth_refresh_tokens_user_idx").on(table.userId),
    index("oauth_refresh_tokens_code_idx").on(table.authorizationCodeId),
  ],
);

export const oauthAccessTokens = pgTable(
  "oauth_access_tokens",
  {
    ...tokenColumns(),
    userId: userRef("user_id"),
    refreshId: uuid("refresh_id").references(() => oauthRefreshTokens.id),
  },
  (table) => [
    index("oauth_access_tokens_client_idx").on(table.clientId),
    index("oauth_access_tokens_session_idx").on(table.sessionId),
    index("oauth_access_tokens_user_idx").on(table.userId),
    index("oauth_access_tokens_code_idx").on(table.authorizationCodeId),
    index("oauth_access_tokens_refresh_idx").on(table.refreshId),
  ],
);

export const oauthConsents = pgTable(
  "oauth_consents",
  {
    id: id(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.clientId),
    userId: userRef("user_id"),
    referenceId: text("reference_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    scopes: text("scopes").array().notNull(),
    createdAt: utc("created_at").notNull(),
    updatedAt: utc("updated_at").notNull(),
  },
  (table) => [
    index("oauth_consents_client_idx").on(table.clientId),
    index("oauth_consents_user_idx").on(table.userId),
  ],
);

export const oauthClientAssertions = pgTable("oauth_client_assertions", {
  id: id(),
  expiresAt: utc("expires_at").notNull(),
});

/** Closed alpha: an account is created only with an invitation code made for that e-mail. */
export const invitations = pgTable("invitations", {
  code: text("code").primaryKey(),
  email: text("email").notNull(),
  createdAt: utc("created_at").notNull().defaultNow(),
  usedAt: utc("used_at"),
});

/** The library's model names → our tables (Better Auth Drizzle adapter). */
export const authTables = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
  jwks,
  oauthClient: oauthClients,
  oauthResource: oauthResources,
  oauthClientResource: oauthClientResources,
  oauthRefreshToken: oauthRefreshTokens,
  oauthAccessToken: oauthAccessTokens,
  oauthConsent: oauthConsents,
  oauthClientAssertion: oauthClientAssertions,
};
