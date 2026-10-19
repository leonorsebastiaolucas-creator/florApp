export function initializeUI() {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const registerForm = document.querySelector("#register-form");
  const registerMessage = document.querySelector("#register-message");

  if (registerForm && registerMessage) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      registerMessage.textContent =
        "O formulário foi validado. Ligue-o a um serviço de autenticação para criar a conta.";
    });
  }

  const loginForm = document.querySelector("#login-form");
  const loginMessage = document.querySelector("#login-message");

  if (loginForm && loginMessage) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      loginMessage.textContent =
        "A autenticação ainda não está ligada a um serviço.";
    });
  }
}
