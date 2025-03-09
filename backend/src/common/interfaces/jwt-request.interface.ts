export interface JwtRequest {
  user?: { sub: string; [key: string]: any };
}
