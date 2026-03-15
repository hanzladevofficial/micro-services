declare module "http" {
  interface ServerResponse {
    locals: {
      errorMessage?: string;
    };
  }
}
