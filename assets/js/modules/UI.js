export function initializeUI() {
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

  const isInPages = window.location.pathname.includes("/pages/");
  const pagePrefix = isInPages ? "" : "pages/";
  const homePath = isInPages ? "../index.html" : "index.html";
  const screens = [
    ["Início", homePath, "house"],
    ["Plantas", `${pagePrefix}plants.html`, "sprout"],
    ["Detalhes da planta", `${pagePrefix}plant.html`, "leaf"],
    ["Adicionar planta", `${pagePrefix}addPlant.html`, "circle-plus"],
    ["Editar planta", `${pagePrefix}editPlant.html`, "pencil"],
    ["Tarefas", `${pagePrefix}tasks.html`, "list-checks"],
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
    const savedPlants = readStoredPlants();
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "col-span-2 py-8 text-center text-sm text-slate-500";
    emptyMessage.textContent = "Não foram encontradas plantas com essa pesquisa.";
    emptyMessage.hidden = true;
    plantGrid.after(emptyMessage);

    savedPlants.forEach((plant) => {
      const card = document.createElement("article");
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
    searchInput?.addEventListener("input", () => {
      const query = normalizeText(searchInput.value.trim());
      const cards = [...plantGrid.querySelectorAll("[data-plant-name]")];
      let visibleCount = 0;

      cards.forEach((card) => {
        const matches = normalizeText(card.textContent).includes(query);
        card.hidden = !matches;
        visibleCount += Number(matches);
      });

      emptyMessage.hidden = visibleCount > 0;
    });
  }

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
    plantForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const photoFile = plantForm.elements.photo.files[0];
      let photo = "";

      if (photoFile && !photoFile.type.startsWith("image/")) {
        plantMessage.textContent = "Seleciona um ficheiro de imagem válido.";
        return;
      }
      if (photoFile && photoFile.size > 1024 * 1024) {
        plantMessage.textContent = "A fotografia deve ter no máximo 1 MB.";
        return;
      }
      if (photoFile) {
        try {
          photo = await readImage(photoFile);
        } catch {
          plantMessage.textContent = "Não foi possível carregar a fotografia.";
          return;
        }
      }

      const plant = {
        id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()),
        name: plantForm.elements.name.value.trim(),
        species: plantForm.elements.species.value.trim(),
        wateringDays: Number(plantForm.elements.wateringDays.value) || 7,
        light: plantForm.elements.light.value,
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
      const photoFile = registerForm.elements.photo.files[0];
      let photo = "";

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
        localStorage.setItem(
          "flora-profile",
          JSON.stringify({ name, email, photo })
        );
      } catch {
        registerMessage.textContent = "Não foi possível guardar os dados do perfil.";
        return;
      }

      window.location.href = "../index.html";
    });
  }

  const loginForm = document.querySelector("#login-form");
  const loginMessage = document.querySelector("#login-message");

  if (loginForm && loginMessage) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = loginForm.elements.email.value.trim().toLowerCase();
      let profile = {};

      try {
        profile = JSON.parse(localStorage.getItem("flora-profile") || "{}");
      } catch {
        profile = {};
      }

      if (profile.email?.toLowerCase() !== email || !profile.name) {
        loginMessage.textContent =
          "Não encontrámos uma conta com este email neste dispositivo. Cria uma conta para continuar.";
        return;
      }

      window.location.href = "../index.html";
    });
  }
}

function readStoredPlants() {
  try {
    const plants = JSON.parse(localStorage.getItem("flora-plants") || "[]");
    return Array.isArray(plants) ? plants : [];
  } catch {
    return [];
  }
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
      renderWateringTasks();
    });

    task.append(plantDetails, waterButton);
    list.append(task);
  });

  if (emptyState) {
    emptyState.hidden = plants.length > 0;
  }
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
