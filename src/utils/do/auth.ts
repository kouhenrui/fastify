interface LoginRequestBody {
  username: string;
  password: string;
}

interface RegisterRequestBody {
  username: string;
  password: string;
  email: string;
}

export type { LoginRequestBody, RegisterRequestBody };
