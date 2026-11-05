export function initializeUI() {
  const isInPages = window.location.pathname.includes("/pages/");
  const pageName = window.location.pathname.split("/").pop().toLowerCase();
  const isAuthPage = pageName === "login.html" || pageName === "register.html";
  const account = readStoredAccount();
  const session = readStoredSession();
  const isAuthenticated = Boolean(account && session?.email === account.email);

  if (isAuthPage && isAuthenticated) {
    window.location.replace(isInPages ? "../index.html" : "index.html");
    return;
  }
  if (!isAuthPage && !isAuthenticated) {
    window.location.replace(isInPages ? "login.html" : "pages/login.html");
    return;
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }

  const oldSwitcher = document.querySelector("#screen-switcher");
  const switcher = document.createElement("div");
  switcher.className = "flora-screen-switcher";
  switcher.innerHTML = `
    <button class="flora-screen-trigger" type="button" aria-label="Mudar de ecrã" aria-expanded="false" aria-controls="flora-screen-menu" title="Mudar de ecrã">
      <i data-lucide="layout-grid" aria-hidden="true"></i>
    </button>
    <nav class="flora-screen-menu" id="flora-screen-menu" aria-label="Navegação entre ecrãs" hidden></nav>
  `;

  const pagePrefix = isInPages ? "" : "pages/";
  const homePath = isInPages ? "../index.html" : "index.html";
  const screens = [
    ["Catálogo", homePath, "house"],
    ["As Minhas Plantas", `${pagePrefix}plants.html`, "sprout"],
    ["Detalhes da planta", `${pagePrefix}plant.html`, "leaf"],
    ["Adicionar planta", `${pagePrefix}addPlant.html`, "circle-plus"],
    ["Editar planta", `${pagePrefix}editPlant.html`, "pencil"],
    ["Tarefas", `${pagePrefix}tasks.html`, "list-checks"],
    ["Notas e lembretes", `${pagePrefix}notes.html`, "notebook-pen"],
    ["Perfil", `${pagePrefix}profile.html`, "user-round"],
    ["Iniciar sessão", `${pagePrefix}login.html`, "log-in"],
    ["Criar conta", `${pagePrefix}register.html`, "user-round-plus"],
    ["Sobre", `${pagePrefix}sobre.html`, "info"],
    ["Sem ligação", `${pagePrefix}offline.html`, "wifi-off"],
  ];
  const screenMenu = switcher.querySelector(".flora-screen-menu");
  const currentPath = window.location.pathname.toLowerCase();

  screens.forEach(([label, path, icon]) => {
    const link = document.createElement("a");
    link.href = path;
    link.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i><span>${label}</span>`;
    const destination = new URL(path, window.location.href).pathname.toLowerCase();
    if (destination === currentPath) {
      link.setAttribute("aria-current", "page");
    }
    screenMenu.append(link);
  });

  oldSwitcher?.replaceWith(switcher);
  if (!oldSwitcher) {
    document.body.append(switcher);
  }

  const switcherButton = switcher.querySelector("button");
  switcherButton.addEventListener("click", () => {
    const isExpanded = switcherButton.getAttribute("aria-expanded") === "true";
    switcherButton.setAttribute("aria-expanded", String(!isExpanded));
    screenMenu.hidden = isExpanded;
  });

  document.addEventListener("click", (event) => {
    if (!switcher.contains(event.target)) {
      switcherButton.setAttribute("aria-expanded", "false");
      screenMenu.hidden = true;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      switcherButton.setAttribute("aria-expanded", "false");
      screenMenu.hidden = true;
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  const plantGrid = document.querySelector("#plant-grid");
  if (plantGrid) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "col-span-2 py-8 text-center text-sm text-slate-500";
    emptyMessage.textContent = "Não foram encontradas plantas com essa pesquisa.";
    emptyMessage.hidden = true;
    plantGrid.after(emptyMessage);

    const savedPlants = plantGrid.hasAttribute("data-my-plants")
      ? readStoredPlants().filter((plant) => plant.name)
      : [];
    savedPlants.forEach((plant) => {
      const card = document.createElement("a");
      card.href = `${isInPages ? "" : "pages/"}plant.html?id=${encodeURIComponent(plant.id)}`;
      card.className = "glass-card rounded-2xl overflow-hidden soft-shadow group";
      card.dataset.plantName = "";

      const image = document.createElement("img");
      image.src = plant.photo || "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=85";
      image.alt = `Fotografia de ${plant.name}`;
      image.loading = "lazy";
      image.className = "h-32 w-full object-cover";

      const details = document.createElement("div");
      details.className = "p-3";
      const name = document.createElement("h4");
      name.className = "truncate text-xs font-bold text-slate-800";
      name.textContent = plant.name;
      const species = document.createElement("p");
      species.className = "text-[10px] italic text-slate-400";
      species.textContent = plant.species || "Espécie não indicada";
      details.append(name, species);
      card.append(image, details);
      plantGrid.append(card);
    });

    const searchInput = document.querySelector("#plant-search");
    const filterPlants = () => {
      const query = normalizeText(searchInput?.value.trim() || "");
      const cards = [...plantGrid.querySelectorAll("[data-plant-name]")];
      let visibleCount = 0;

      cards.forEach((card) => {
        const matches = normalizeText(card.textContent).includes(query);
        card.hidden = !matches;
        visibleCount += Number(matches);
      });

      emptyMessage.textContent = !plantGrid.hasAttribute("data-my-plants")
        ? "Não foram encontradas plantas com essa pesquisa."
        : savedPlants.length
          ? "Não foram encontradas plantas com essa pesquisa."
          : "Ainda não adicionaste plantas. Usa o botão + para adicionar a tua primeira planta.";
      emptyMessage.hidden = visibleCount > 0;
    };
    if (plantGrid.hasAttribute("data-my-plants")) {
      filterPlants();
    }
    searchInput?.addEventListener("input", filterPlants);
    initializeCatalogSaveButtons(plantGrid);
  }

  renderPlantDetails();
  renderWateringTasks();

  const completedTasks = new Set(readCompletedTasks());
  document.querySelectorAll("[data-task-complete]").forEach((button) => {
    const task = button.closest("[data-task-id]");
    if (!task) {
      return;
    }

    const taskId = task.dataset.taskId;
    const updateTask = (isComplete) => {
      button.setAttribute("aria-pressed", String(isComplete));
      button.setAttribute("aria-label", isComplete ? "Reabrir tarefa" : "Concluir tarefa");
      task.classList.toggle("is-complete", isComplete);
    };

    updateTask(completedTasks.has(taskId));
    button.addEventListener("click", () => {
      if (completedTasks.has(taskId)) {
        completedTasks.delete(taskId);
      } else {
        completedTasks.add(taskId);
      }
      updateTask(completedTasks.has(taskId));
      localStorage.setItem("flora-completed-tasks", JSON.stringify([...completedTasks]));
    });
  });

  const plantForm = document.querySelector("#plant-form");
  const plantMessage = document.querySelector("#plant-message");
  if (plantForm && plantMessage) {
    const photoInput = plantForm.elements.photo;
    const photoButton = document.querySelector("#open-plant-photo");
    const photoPreview = document.querySelector("[data-photo-preview]");
    const photoTitle = document.querySelector("[data-photo-title]");
    const photoHint = document.querySelector("[data-photo-hint]");
    let previewUrl = "";

    photoButton?.addEventListener("click", () => photoInput.click());
    photoInput.addEventListener("change", () => {
      const photoFile = photoInput.files[0];
      plantMessage.textContent = "";
      if (!photoFile) {
        return;
      }
      if (!photoFile.type.startsWith("image/")) {
        plantMessage.textContent = "Seleciona um ficheiro de imagem válido.";
        photoInput.value = "";
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      previewUrl = URL.createObjectURL(photoFile);
      photoPreview.src = previewUrl;
      photoPreview.hidden = false;
      photoTitle.textContent = photoFile.name;
      photoHint.textContent = "Fotografia selecionada. Toca aqui para alterar.";
    });

    plantForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const photoFile = photoInput.files[0];
      let photo = "";

      if (photoFile && !photoFile.type.startsWith("image/")) {
        plantMessage.textContent = "Seleciona um ficheiro de imagem válido.";
        return;
      }
      if (photoFile) {
        try {
          photo = await readImage(await compressPlantPhoto(photoFile));
        } catch {
          plantMessage.textContent = "Não foi possível processar a fotografia. Tenta escolher outra imagem.";
          return;
        }
      }

      const plant = {
        id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()),
        name: plantForm.elements.name.value.trim(),
        species: plantForm.elements.species.value.trim(),
        wateringDays: Number(plantForm.elements.wateringDays.value) || 7,
        light: plantForm.elements.light.value,
        care: plantForm.elements.care.value.trim(),
        photo,
        lastWateredAt: Date.now(),
      };

      try {
        const plants = readStoredPlants();
        plants.push(plant);
        localStorage.setItem("flora-plants", JSON.stringify(plants));
      } catch {
        plantMessage.textContent = "Não foi possível guardar a planta neste dispositivo.";
        return;
      }

      window.location.href = "plants.html";
    });
  }

  const profilePhotoFallback = isInPages
    ? "../assets/images/logo.svg"
    : "assets/images/logo.svg";
  let profile = {};

  try {
    profile = JSON.parse(localStorage.getItem("flora-profile") || "{}");
  } catch {
    profile = {};
  }

  document.querySelectorAll("[data-profile-name]").forEach((element) => {
    element.textContent = profile.name || "";
  });

  document.querySelectorAll("[data-greeting-separator]").forEach((element) => {
    element.hidden = !profile.name;
  });

  document.querySelectorAll("[data-profile-photo]").forEach((image) => {
    image.src = profile.photo || profilePhotoFallback;
    image.alt = profile.name ? `Fotografia de ${profile.name}` : "Logótipo Flora";
  });

  const registerForm = document.querySelector("#register-form");
  const registerMessage = document.querySelector("#register-message");

  if (registerForm && registerMessage) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = registerForm.elements.name.value.trim();
      const email = registerForm.elements.email.value.trim();
      const password = registerForm.elements.password.value;
      const photoFile = registerForm.elements.photo.files[0];
      let photo = "";

      if (password.length < 8) {
        registerMessage.textContent = "A palavra-passe deve ter pelo menos 8 caracteres.";
        return;
      }

      if (readStoredAccount()) {
        registerMessage.textContent = "Já existe uma conta neste dispositivo. Inicia sessão para continuar.";
        return;
      }

      if (photoFile && !photoFile.type.startsWith("image/")) {
        registerMessage.textContent = "Seleciona um ficheiro de imagem válido.";
        return;
      }

      if (photoFile && photoFile.size > 1024 * 1024) {
        registerMessage.textContent = "A fotografia deve ter no máximo 1 MB.";
        return;
      }

      if (photoFile) {
        try {
          photo = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(photoFile);
          });
        } catch {
          registerMessage.textContent = "Não foi possível carregar a fotografia.";
          return;
        }
      }

      try {
        const credentials = await createPasswordCredentials(password);
        localStorage.setItem(
          "flora-profile",
          JSON.stringify({ name, email, photo })
        );
        localStorage.setItem("flora-account", JSON.stringify({ email: email.toLowerCase(), ...credentials }));
        localStorage.setItem("flora-session", JSON.stringify({ email: email.toLowerCase() }));
      } catch {
        registerMessage.textContent = "Não foi possível criar a conta neste dispositivo.";
        return;
      }

      window.location.href = "../index.html";
    });
  }

  const loginForm = document.querySelector("#login-form");
  const loginMessage = document.querySelector("#login-message");

  if (loginForm && loginMessage) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = loginForm.elements.email.value.trim().toLowerCase();
      const password = loginForm.elements.password.value;
      const account = readStoredAccount();

      if (!account || account.email !== email) {
        loginMessage.textContent =
          "Não encontrámos uma conta com este email neste dispositivo. Cria uma conta para continuar.";
        return;
      }

      try {
        const passwordMatches = await verifyPassword(password, account);
        if (!passwordMatches) {
          loginMessage.textContent = "A palavra-passe está incorreta.";
          return;
        }
        localStorage.setItem("flora-session", JSON.stringify({ email }));
      } catch {
        loginMessage.textContent = "Não foi possível validar a conta neste dispositivo.";
        return;
      }

      window.location.href = "../index.html";
    });
  }

  const logoutButton = document.querySelector("[data-logout]");
  logoutButton?.addEventListener("click", () => {
    localStorage.removeItem("flora-session");
    window.location.replace("../pages/login.html");
  });
}

function renderPlantDetails() {
  const details = document.querySelector("[data-plant-details]");
  if (!details) {
    return;
  }

  const plantId = new URLSearchParams(window.location.search).get("id");
  const plant = readStoredPlants().find((storedPlant) => storedPlant.id === plantId);
  const emptyState = document.querySelector("[data-plant-not-found]");
  if (!plant) {
    emptyState.hidden = false;
    return;
  }

  details.hidden = false;
  emptyState.hidden = true;

  const image = details.querySelector("[data-plant-photo]");
  image.src = plant.photo || "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=85";
  image.alt = `Fotografia de ${plant.name}`;
  details.querySelector("[data-plant-name]").textContent = plant.name;
  details.querySelector("[data-plant-species]").textContent = plant.species || "Espécie não indicada";
  details.querySelector("[data-plant-watering-frequency]").textContent = wateringFrequency(plant.wateringDays);
  details.querySelector("[data-plant-light]").textContent = plant.light || "Não indicada";
  const careContainer = details.querySelector("[data-plant-care-container]");
  careContainer.hidden = !plant.care;
  details.querySelector("[data-plant-care]").textContent = plant.care || "";

  const wateringStatus = details.querySelector("[data-plant-watering-status]");
  const nextWatering = details.querySelector("[data-plant-next-watering]");
  const updateWateringDetails = (lastWateredAt) => {
    const interval = Math.max(1, Number(plant.wateringDays) || 7);
    const dueAt = (Number(lastWateredAt) || Date.now()) + interval * 24 * 60 * 60 * 1000;
    const daysUntilDue = Math.ceil((dueAt - Date.now()) / (24 * 60 * 60 * 1000));
    const message = daysUntilDue < 0
      ? `Atrasada há ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? "dia" : "dias"}`
      : daysUntilDue === 0
        ? "Precisa de rega hoje"
        : daysUntilDue === 1
          ? "Próxima rega: amanhã"
          : `Próxima rega: daqui a ${daysUntilDue} dias`;

    wateringStatus.textContent = message;
    nextWatering.textContent = message;
  };
  updateWateringDetails(plant.lastWateredAt);

  const waterButton = details.querySelector("[data-water-plant]");
  const waterMessage = details.querySelector("[data-water-message]");
  waterButton.addEventListener("click", () => {
    try {
      const lastWateredAt = Date.now();
      const updatedPlants = readStoredPlants().map((storedPlant) =>
        storedPlant.id === plant.id ? { ...storedPlant, lastWateredAt } : storedPlant
      );
      localStorage.setItem("flora-plants", JSON.stringify(updatedPlants));
      updateWateringDetails(lastWateredAt);
      waterMessage.textContent = `${plant.name} foi marcada como regada.`;
      showWateringConfetti(waterButton);
      renderWateringTasks();
    } catch {
      waterMessage.textContent = "Não foi possível guardar a rega neste dispositivo.";
    }
  });
}

function wateringFrequency(days) {
  const interval = Math.max(1, Number(days) || 7);
  return interval === 1 ? "Todos os dias" : `A cada ${interval} dias`;
}

function readStoredPlants() {
  try {
    const plants = JSON.parse(localStorage.getItem("flora-plants") || "[]");
    return Array.isArray(plants) ? plants : [];
  } catch {
    return [];
  }
}

function readStoredAccount() {
  try {
    const account = JSON.parse(localStorage.getItem("flora-account") || "null");
    return account?.email && account?.salt && account?.passwordHash ? account : null;
  } catch {
    return null;
  }
}

function readStoredSession() {
  try {
    const session = JSON.parse(localStorage.getItem("flora-session") || "null");
    return session?.email ? session : null;
  } catch {
    return null;
  }
}

async function createPasswordCredentials(password) {
  if (!crypto.subtle) {
    throw new Error("A encriptação de palavras-passe não está disponível neste endereço.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await derivePasswordHash(password, salt);
  return {
    salt: bytesToHex(salt),
    passwordHash,
  };
}

async function verifyPassword(password, account) {
  if (!crypto.subtle) {
    throw new Error("A encriptação de palavras-passe não está disponível neste endereço.");
  }

  const salt = hexToBytes(account.salt);
  return (await derivePasswordHash(password, salt)) === account.passwordHash;
}

async function derivePasswordHash(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) {
    throw new Error("Os dados da conta são inválidos.");
  }

  return Uint8Array.from(hex.match(/.{2}/g), (byte) => Number.parseInt(byte, 16));
}

function initializeCatalogSaveButtons(plantGrid) {
  const updateButton = (button, isSaved) => {
    button.disabled = isSaved;
    button.textContent = isSaved ? "Guardada" : "Guardar";
    button.setAttribute("aria-label", isSaved
      ? `${button.closest("[data-catalog-plant]").querySelector("h4").textContent} já está guardada`
      : `Guardar ${button.closest("[data-catalog-plant]").querySelector("h4").textContent}`);
  };

  plantGrid.querySelectorAll("[data-save-catalog-plant]").forEach((button) => {
    const card = button.closest("[data-catalog-plant]");
    const catalogId = card.dataset.catalogId;
    const isSaved = readStoredPlants().some((plant) => plant.catalogId === catalogId);
    updateButton(button, isSaved);

    button.addEventListener("click", () => {
      const message = card.querySelector("[data-save-message]");
      const plants = readStoredPlants();
      if (plants.some((plant) => plant.catalogId === catalogId)) {
        updateButton(button, true);
        return;
      }

      const plant = {
        id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${catalogId}`,
        catalogId,
        name: card.querySelector("h4").textContent.trim(),
        species: card.querySelector("p").textContent.trim(),
        wateringDays: Number(card.dataset.wateringDays) || 7,
        light: card.dataset.light || "Não indicada",
        care: card.dataset.care || "",
        photo: card.querySelector("img").src,
        lastWateredAt: Date.now(),
      };

      try {
        plants.push(plant);
        localStorage.setItem("flora-plants", JSON.stringify(plants));
        updateButton(button, true);
        message.textContent = "Adicionada às plantas guardadas.";
      } catch {
        message.textContent = "Não foi possível guardar a planta neste dispositivo.";
      }
    });
  });
}

function readCompletedTasks() {
  try {
    const tasks = JSON.parse(localStorage.getItem("flora-completed-tasks") || "[]");
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    return [];
  }
}

function renderWateringTasks() {
  const list = document.querySelector("[data-watering-list]");
  const emptyState = document.querySelector("[data-watering-empty]");
  const countTargets = document.querySelectorAll("[data-watering-count]");
  if (!list && !countTargets.length) {
    return;
  }

  const now = Date.now();
  const dayInMilliseconds = 24 * 60 * 60 * 1000;
  const plants = readStoredPlants()
    .filter((plant) => plant.name)
    .map((plant) => {
      const interval = Math.max(1, Number(plant.wateringDays) || 7);
      const lastWateredAt = Number(plant.lastWateredAt) || now;
      return { ...plant, dueAt: lastWateredAt + interval * dayInMilliseconds };
    })
    .sort((first, second) => first.dueAt - second.dueAt);
  const dueCount = plants.filter((plant) => plant.dueAt <= now).length;

  countTargets.forEach((target) => {
    target.textContent = String(dueCount);
    target.hidden = dueCount === 0;
    target.parentElement?.setAttribute(
      "aria-label",
      dueCount === 1
        ? "Notificações: uma planta precisa de rega"
        : `Notificações: ${dueCount} plantas precisam de rega`
    );
  });

  document.querySelectorAll("[data-watering-summary]").forEach((target) => {
    target.textContent = dueCount === 1
      ? "Tens 1 planta que precisa de rega hoje."
      : dueCount > 1
        ? `Tens ${dueCount} plantas que precisam de rega hoje.`
        : "Não tens plantas para regar hoje.";
  });

  if (!list) {
    return;
  }

  list.replaceChildren();
  plants.forEach((plant) => {
    const daysUntilDue = Math.ceil((plant.dueAt - now) / dayInMilliseconds);
    const message = daysUntilDue < 0
      ? `Atrasada há ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? "dia" : "dias"}`
      : daysUntilDue === 0
        ? "Precisa de rega hoje"
        : daysUntilDue === 1
          ? "Próxima rega: amanhã"
          : `Próxima rega: daqui a ${daysUntilDue} dias`;
    const task = document.createElement("article");
    task.className = "glass-card flex items-center justify-between gap-3 rounded-2xl p-3 soft-shadow";

    const plantDetails = document.createElement("div");
    plantDetails.className = "flex min-w-0 items-center gap-3";
    const image = document.createElement("img");
    image.src = plant.photo || "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=160&q=80";
    image.alt = "";
    image.loading = "lazy";
    image.className = "h-10 w-10 shrink-0 rounded-xl object-cover";
    const detailText = document.createElement("div");
    const name = document.createElement("h3");
    name.className = "truncate text-xs font-bold text-slate-800";
    name.textContent = `Regar ${plant.name}`;
    const dueDate = document.createElement("p");
    dueDate.className = `text-[10px] ${daysUntilDue <= 0 ? "text-amber-700" : "text-slate-500"}`;
    dueDate.textContent = message;
    detailText.append(name, dueDate);
    plantDetails.append(image, detailText);

    const waterButton = document.createElement("button");
    waterButton.type = "button";
    waterButton.className = "shrink-0 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-900 hover:bg-emerald-100";
    waterButton.textContent = "Regada";
    waterButton.setAttribute("aria-label", `Marcar ${plant.name} como regada`);
    waterButton.addEventListener("click", () => {
      const updatedPlants = readStoredPlants().map((storedPlant) =>
        storedPlant.id === plant.id
          ? { ...storedPlant, lastWateredAt: Date.now() }
          : storedPlant
      );
      localStorage.setItem("flora-plants", JSON.stringify(updatedPlants));
      showWateringConfetti(waterButton);
      renderWateringTasks();
    });

    task.append(plantDetails, waterButton);
    list.append(task);
  });

  if (emptyState) {
    emptyState.hidden = plants.length > 0;
  }
}

function showWateringConfetti(source) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const bounds = source.getBoundingClientRect();
  const burst = document.createElement("div");
  burst.className = "watering-confetti";
  burst.setAttribute("aria-hidden", "true");
  burst.style.left = `${bounds.left + bounds.width / 2}px`;
  burst.style.top = `${bounds.top + bounds.height / 2}px`;

  const colors = ["#2d6a4f", "#74c69d", "#95d5b2", "#f4a261", "#ffd166", "#52b788"];
  for (let index = 0; index < 32; index += 1) {
    const piece = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 45 + Math.random() * 110;
    piece.className = "watering-confetti__piece";
    piece.style.setProperty("--confetti-x", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--confetti-y", `${Math.sin(angle) * distance - 55}px`);
    piece.style.setProperty("--confetti-rotate", `${Math.random() * 720 - 360}deg`);
    piece.style.setProperty("--confetti-delay", `${Math.random() * 100}ms`);
    piece.style.setProperty("--confetti-color", colors[index % colors.length]);
    burst.append(piece);
  }

  document.body.append(burst);
  window.setTimeout(() => burst.remove(), 1400);
}

function normalizeText(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function compressPlantPhoto(file) {
  let image;
  let objectUrl = "";

  if ("createImageBitmap" in window) {
    image = await createImageBitmap(file);
  } else {
    objectUrl = URL.createObjectURL(file);
    image = await new Promise((resolve, reject) => {
      const photo = new Image();
      photo.onload = () => resolve(photo);
      photo.onerror = () => reject(new Error("A imagem não pode ser aberta."));
      photo.src = objectUrl;
    });
  }

  try {
    const largestSide = Math.max(image.width || image.naturalWidth, image.height || image.naturalHeight);
    const initialScale = Math.min(1, 1400 / largestSide);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Não foi possível preparar a imagem.");
    }

    for (let attempt = 0; attempt < 9; attempt += 1) {
      const scale = initialScale * 0.8 ** Math.floor(attempt / 3);
      canvas.width = Math.max(1, Math.round((image.width || image.naturalWidth) * scale));
      canvas.height = Math.max(1, Math.round((image.height || image.naturalHeight) * scale));
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const quality = [0.82, 0.72, 0.62][attempt % 3];
      const compressed = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Não foi possível comprimir a imagem."));
          }
        }, "image/jpeg", quality);
      });

      if (compressed.size <= 500 * 1024) {
        return compressed;
      }
    }

    throw new Error("A fotografia continua demasiado grande após compressão.");
  } finally {
    image.close?.();
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}
