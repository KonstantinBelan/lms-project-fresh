export interface IRolesGuard {
  canActivate(context: any): boolean | Promise<boolean>;
}
