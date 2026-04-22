function createAuthState() {
  let token = $state<string | null>(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null
  );
  let isAuthenticated = $state(false);

  function login(newToken: string) {
    localStorage.setItem('auth_token', newToken);
    token = newToken;
    isAuthenticated = true;
  }

  function logout() {
    localStorage.removeItem('auth_token');
    token = null;
    isAuthenticated = false;
  }

  return {
    get token() {
      return token;
    },
    get isAuthenticated() {
      return isAuthenticated;
    },
    login,
    logout,
  };
}

export const authState = createAuthState();
