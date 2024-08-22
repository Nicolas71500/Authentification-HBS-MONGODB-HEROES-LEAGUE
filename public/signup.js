document.addEventListener("DOMContentLoaded", function () {
  const nameInput = document.querySelector('input[name="name"]');
  const passwordInput = document.querySelector('input[name="password"]');

  function validateName() {
    const name = nameInput.value;
    if (name.length >= 3 && name.length <= 20) {
      nameInput.style.borderColor = "green"; // Bordure verte si valide
    } else {
      nameInput.style.borderColor = "red"; // Bordure rouge si invalide
    }
  }

  function validatePassword() {
    const password = passwordInput.value;
    const passwordConditions = [
      password.length >= 8, // Longueur minimale de 8 caractères
    ];

    if (passwordConditions.every((condition) => condition)) {
      passwordInput.style.borderColor = "green"; // Bordure verte si valide
    } else {
      passwordInput.style.borderColor = "red"; // Bordure rouge si invalide
    }
  }

  nameInput.addEventListener("input", validateName);
  passwordInput.addEventListener("input", validatePassword);
});
