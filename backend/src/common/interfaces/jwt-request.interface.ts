export interface JwtRequest {
  // user?: { sub: string; [key: string]: any };
  user?: { sub?: string; _id?: string; [key: string]: any };
}
