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
    ["Sobre", `${pagePrefix}sobre.html`, "info"],
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

  const screenLogoutButton = document.createElement("button");
  screenLogoutButton.className = "flora-screen-logout";
  screenLogoutButton.type = "button";
  screenLogoutButton.innerHTML = '<i data-lucide="log-out" aria-hidden="true"></i><span>Terminar sessão</span>';
  screenMenu.append(screenLogoutButton);

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

  const endSession = () => {
    localStorage.removeItem("flora-session");
    window.location.replace(`${pagePrefix}login.html`);
  };
  screenLogoutButton.addEventListener("click", endSession);

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
      const recoveryWord = normalizeRecoveryWord(registerForm.elements.recoveryWord.value);
      const recoveryWordConfirmation = normalizeRecoveryWord(
        registerForm.elements.recoveryWordConfirmation.value
      );
      const photoFile = registerForm.elements.photo.files[0];
      let photo = "";

      if (password.length < 8) {
        registerMessage.textContent = "A palavra-passe deve ter pelo menos 8 caracteres.";
        return;
      }

      if (recoveryWord.length < 8) {
        registerMessage.textContent = "A palavra/frase de recuperação deve ter pelo menos 8 caracteres.";
        return;
      }

      if (recoveryWord !== recoveryWordConfirmation) {
        registerMessage.textContent = "As palavras/frases de recuperação não coincidem.";
        return;
      }

      const emailKey = email.toLowerCase();
      if (readStoredAccount(emailKey)) {
        registerMessage.textContent = "Já existe uma conta com este email neste dispositivo.";
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
        const recoveryCredentials = await createPasswordCredentials(recoveryWord);
        const accountData = {
          email: emailKey,
          ...credentials,
          recoverySalt: recoveryCredentials.salt,
          recoveryHash: recoveryCredentials.passwordHash,
        };
        const accounts = readStoredAccounts();
        const profiles = readStoredProfiles();
        accounts.push(accountData);
        profiles[emailKey] = { name, email, photo };
        localStorage.setItem(
          "flora-profile",
          JSON.stringify({ name, email, photo })
        );
        localStorage.setItem("flora-accounts", JSON.stringify(accounts));
        localStorage.setItem("flora-profiles", JSON.stringify(profiles));
        localStorage.setItem("flora-account", JSON.stringify(accountData));
        localStorage.setItem("flora-session", JSON.stringify({ email: emailKey }));
      } catch {
        registerMessage.textContent = "Não foi possível criar a conta neste dispositivo.";
        return;
      }

      window.location.href = "../index.html";
    });
  }

  const recoveryToggle = document.querySelector("#show-recovery-form");
  const recoveryForm = document.querySelector("#recovery-form");
  const recoveryMessage = document.querySelector("#recovery-message");

  if (recoveryToggle && recoveryForm && recoveryMessage) {
    recoveryToggle.addEventListener("click", () => {
      recoveryForm.hidden = !recoveryForm.hidden;
      recoveryToggle.setAttribute("aria-expanded", String(!recoveryForm.hidden));
      if (!recoveryForm.hidden) {
        recoveryForm.elements.recoveryWord.focus();
      }
    });

    recoveryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      recoveryMessage.textContent = "";

      const account = readStoredAccount();
      const email = recoveryForm.elements.email.value.trim().toLowerCase();
      const recoveryWord = normalizeRecoveryWord(recoveryForm.elements.recoveryWord.value);
      const newPassword = recoveryForm.elements.newPassword.value;
      const newPasswordConfirmation = recoveryForm.elements.newPasswordConfirmation.value;

      const recoveryAccount = readStoredAccount(email);
      if (!recoveryAccount) {
        recoveryMessage.textContent = "Não encontrámos uma conta com este email neste dispositivo.";
        return;
      }

      if (!recoveryAccount.recoverySalt || !recoveryAccount.recoveryHash) {
        recoveryMessage.textContent =
          "Esta conta foi criada sem palavra de recuperação. Não é possível recuperar a palavra-passe.";
        return;
      }

      if (newPassword.length < 8) {
        recoveryMessage.textContent = "A nova palavra-passe deve ter pelo menos 8 caracteres.";
        return;
      }

      if (newPassword !== newPasswordConfirmation) {
        recoveryMessage.textContent = "As novas palavras-passe não coincidem.";
        return;
      }

      try {
        const recoveryMatches = await verifyPassword(recoveryWord, {
          salt: recoveryAccount.recoverySalt,
          passwordHash: recoveryAccount.recoveryHash,
        });
        if (!recoveryMatches) {
          recoveryMessage.textContent = "A palavra/frase de recuperação está incorreta.";
          return;
        }

        const credentials = await createPasswordCredentials(newPassword);
        const updatedAccount = {
          ...recoveryAccount,
          ...credentials,
        };
        const accounts = readStoredAccounts().map((storedAccount) =>
          storedAccount.email === email ? updatedAccount : storedAccount
        );
        localStorage.setItem("flora-accounts", JSON.stringify(accounts));
        if (account?.email === email) {
          localStorage.setItem("flora-account", JSON.stringify(updatedAccount));
        }
        localStorage.removeItem("flora-session");
        recoveryForm.reset();
        recoveryMessage.textContent = "Palavra-passe atualizada. Já podes iniciar sessão.";
      } catch {
        recoveryMessage.textContent = "Não foi possível recuperar a conta neste dispositivo.";
      }
    });
  }

  const loginForm = document.querySelector("#login-form");
  const loginMessage = document.querySelector("#login-message");

  if (loginForm && loginMessage) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = loginForm.elements.email.value.trim().toLowerCase();
      const password = loginForm.elements.password.value;
      const account = readStoredAccount(email);

      if (!account) {
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
        localStorage.setItem("flora-account", JSON.stringify(account));
        const profile = readStoredProfiles()[email] || { name: "", email, photo: "" };
        localStorage.setItem("flora-profile", JSON.stringify(profile));
        localStorage.setItem("flora-session", JSON.stringify({ email }));
      } catch {
        loginMessage.textContent = "Não foi possível validar a conta neste dispositivo.";
        return;
      }

      window.location.href = "../index.html";
    });
  }

  const logoutButton = document.querySelector("[data-logout]");
  logoutButton?.addEventListener("click", endSession);
}

const catalogPlantPreviewList = [
  {
    catalogId: "limoeiro",
    name: "Limoeiro",
    species: "Citrus limon",
    description: "Uma árvore cítrica mediterrânica muito aromática, ideal para luz direta e para quem gosta de ter um toque de frescura na casa ou varanda.",
    wateringDays: 7,
    light: "Sol direto",
    care: "Precisa de bastante luz e de um vaso com boa drenagem. Mantém o solo levemente húmido, sem encharcar.",
    photo: "https://i.pinimg.com/originals/6d/04/f7/6d04f724c9864acedd241e44835b1838.jpg",
  },
  {
    catalogId: "alfazema",
    name: "Lavanda",
    species: "Lavandula angustifolia",
    description: "A lavanda é conhecida pelo seu aroma intenso e pelas flores suaves, sendo uma escolha muito elegante para zonas ensolaradas.",
    wateringDays: 7,
    light: "Sol direto",
    care: "Gosta de sol direto e de solo bem drenado; evita encharcar a terra e aumenta a sua perfumaria em locais iluminados.",
    photo: "https://i.pinimg.com/1200x/03/c2/c9/03c2c97c3aea986e636f983a4f3f42ff.jpg",
  },
  {
    catalogId: "hortela",
    name: "Hortelã",
    species: "Mentha spicata",
    description: "A hortelã cresce rápido e dá um aroma muito fresco. É perfeita para cozinhas e janelas bem iluminadas, mas exige rega regular.",
    wateringDays: 3,
    light: "Luz indireta",
    care: "Mantém a terra ligeiramente húmida e poda regularmente para estimular o crescimento. Gosta de um ambiente luminoso.",
    photo: "https://i.pinimg.com/originals/63/60/68/6360684ee640d6b90998765d10058806.jpg",
  },
  {
    catalogId: "manjericao",
    name: "Manjericão",
    species: "Ocimum basilicum",
    description: "Uma erva aromática popular na cozinha, que cresce melhor num local quente e luminoso.",
    wateringDays: 2,
    light: "Sol direto",
    care: "Mantém a terra ligeiramente húmida e colhe as pontas regularmente para estimular o crescimento.",
    photo: "https://i.pinimg.com/1200x/61/c4/2c/61c42c38f2c614fb5458404f03cb3d71.jpg",
  },
  {
    catalogId: "girassol",
    name: "Girassol",
    species: "Helianthus annuus",
    description: "Uma planta anual de flores grandes e vistosas, que precisa de bastante luz solar.",
    wateringDays: 3,
    light: "Sol direto",
    care: "Precisa de sol direto e de regas regulares, sobretudo durante o crescimento e em períodos quentes.",
    photo: "https://i.pinimg.com/1200x/61/c4/2c/61c42c38f2c614fb5458404f03cb3d71.jpg",
  },
  {
    catalogId: "margaridas",
    name: "Margaridas",
    species: "Bellis perennis",
    description: "Flores delicadas que apreciam um local luminoso e solo fértil com boa drenagem.",
    wateringDays: 3,
    light: "Sol direto",
    care: "Rega quando a superfície da terra começar a secar e remove as flores murchas.",
    photo: "https://i.pinimg.com/736x/9b/91/7d/9b917d9349570fb63ef3577bd9007658.jpg",
  },
  {
    catalogId: "aloe-vera",
    name: "Aloe Vera",
    species: "Aloe vera",
    description: "Uma planta suculenta resistente, adaptada a ambientes luminosos e a períodos de seca.",
    wateringDays: 14,
    light: "Sol direto",
    care: "Deixa o substrato secar completamente entre regas. Evita água acumulada no prato e excesso de humidade.",
    photo: "https://i.pinimg.com/1200x/40/d8/d6/40d8d694298ab3587b5e3ad37f461142.jpg",
  },
  {
    catalogId: "tulipas",
    name: "Tulipas",
    species: "Tulipa spp.",
    description: "Flores bulbosas de primavera que preferem temperaturas amenas e boa drenagem.",
    wateringDays: 5,
    light: "Luz indireta",
    care: "Mantém a terra húmida, mas não encharcada, durante o crescimento e a floração. Deixa a folhagem amarelecer antes de a remover.",
    photo: "https://i.pinimg.com/736x/2f/53/0e/2f530e8935f4da3efedd1006080f7c3d.jpg",
  },
  {
    catalogId: "morangos",
    name: "Morangos",
    species: "Fragaria x ananassa",
    description: "Planta de fruto que cresce bem num local soalheiro e em solo fértil com boa drenagem.",
    wateringDays: 3,
    light: "Sol direto",
    care: "Mantém a terra húmida, mas não encharcada, e evita molhar as folhas e os frutos ao regar.",
    photo: "https://i.pinimg.com/1200x/01/00/29/01002929cc591638313ac6d10b2762df.jpg",
  },
  {
    catalogId: "oliveira",
    name: "Oliveira",
    species: "Olea europaea",
    description: "Árvore mediterrânica de folha persistente, adaptada a locais soalheiros e a solos bem drenados.",
    wateringDays: 7,
    light: "Sol direto",
    care: "Prefere sol direto e solo bem drenado. Rega moderadamente e evita deixar as raízes em solo encharcado.",
    photo: "https://i.pinimg.com/736x/19/71/95/197195187cbdbf7ce4f8b24e5cc42b9e.jpg",
  },
];

function readCatalogPlantPreview(plantId) {
  if (!plantId || !plantId.startsWith("catalog:")) {
    return null;
  }

  const catalogId = plantId.replace(/^catalog:/, "");
  return catalogPlantPreviewList.find((plant) => plant.catalogId === catalogId) || null;
}

function resolvePlantDetail(plantId) {
  const savedPlants = readStoredPlants();
  const exactMatch = savedPlants.find((storedPlant) => storedPlant.id === plantId);
  const catalogPreview = readCatalogPlantPreview(plantId);

  if (exactMatch) {
    const enrichedMatch = catalogPreview
      ? {
          ...catalogPreview,
          ...exactMatch,
          photo: exactMatch.photo || catalogPreview.photo,
          description: exactMatch.description || catalogPreview.description,
          care: exactMatch.care || catalogPreview.care,
          light: exactMatch.light || catalogPreview.light,
          species: exactMatch.species || catalogPreview.species,
          wateringDays: exactMatch.wateringDays || catalogPreview.wateringDays,
        }
      : exactMatch;
    return { ...enrichedMatch, isSaved: true };
  }

  if (catalogPreview) {
    const savedCatalogMatch = savedPlants.find((storedPlant) => storedPlant.catalogId === catalogPreview.catalogId);
    if (savedCatalogMatch) {
      return {
        ...catalogPreview,
        ...savedCatalogMatch,
        photo: savedCatalogMatch.photo || catalogPreview.photo,
        description: savedCatalogMatch.description || catalogPreview.description,
        care: savedCatalogMatch.care || catalogPreview.care,
        light: savedCatalogMatch.light || catalogPreview.light,
        species: savedCatalogMatch.species || catalogPreview.species,
        wateringDays: savedCatalogMatch.wateringDays || catalogPreview.wateringDays,
        isSaved: true,
      };
    }

    return { ...catalogPreview, id: plantId, catalogId: catalogPreview.catalogId, isSaved: false };
  }

  const catalogIdMatch = savedPlants.find((storedPlant) => storedPlant.catalogId === plantId);
  if (catalogIdMatch) {
    const fallbackPreview = readCatalogPlantPreview(`catalog:${catalogIdMatch.catalogId}`);
    return {
      ...fallbackPreview,
      ...catalogIdMatch,
      photo: catalogIdMatch.photo || fallbackPreview?.photo,
      description: catalogIdMatch.description || fallbackPreview?.description,
      care: catalogIdMatch.care || fallbackPreview?.care,
      light: catalogIdMatch.light || fallbackPreview?.light,
      species: catalogIdMatch.species || fallbackPreview?.species,
      wateringDays: catalogIdMatch.wateringDays || fallbackPreview?.wateringDays,
      isSaved: true,
    };
  }

  return null;
}

function renderPlantDetails() {
  const details = document.querySelector("[data-plant-details]");
  if (!details) {
    return;
  }

  const plantId = new URLSearchParams(window.location.search).get("id");
  const plant = resolvePlantDetail(plantId);
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
  details.querySelector("[data-plant-description]").textContent = plant.description || "Esta planta ainda não tem uma descrição disponível.";
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

  const waterButton = details.querySelector("[data-water-plant]");
  const waterMessage = details.querySelector("[data-water-message]");
  if (!plant.isSaved) {
    waterButton.disabled = true;
    waterButton.setAttribute("aria-disabled", "true");
    waterButton.classList.add("opacity-60", "cursor-not-allowed");
    waterButton.innerHTML = '<i data-lucide="bookmark-plus" class="w-4 h-4"></i> Guardar para regar';
    if (window.lucide) {
      window.lucide.createIcons();
    }
    waterMessage.textContent = "Guarda esta planta na tua coleção para poderes acompanhar a rega e os cuidados.";
    return;
  }

  updateWateringDetails(plant.lastWateredAt);
  waterButton.disabled = false;
  waterButton.classList.remove("opacity-60", "cursor-not-allowed");
  waterButton.innerHTML = '<i data-lucide="droplet" class="w-4 h-4"></i> Regar Agora';
  if (window.lucide) {
    window.lucide.createIcons();
  }
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

function readStoredAccount(email = "") {
  const accounts = readStoredAccounts();
  const requestedEmail = email.toLowerCase();
  if (requestedEmail) {
    return accounts.find((account) => account.email === requestedEmail) || null;
  }

  const session = readStoredSession();
  if (session) {
    return accounts.find((account) => account.email === session.email) || null;
  }

  try {
    const account = JSON.parse(localStorage.getItem("flora-account") || "null");
    return isStoredAccount(account) ? account : accounts[0] || null;
  } catch {
    return accounts[0] || null;
  }
}

function readStoredAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem("flora-accounts") || "null");
    if (Array.isArray(accounts)) {
      return accounts.filter(isStoredAccount);
    }
  } catch (error) {
    console.error("Não foi possível ler a lista de contas guardadas:", error);
  }

  try {
    const account = JSON.parse(localStorage.getItem("flora-account") || "null");
    return isStoredAccount(account) ? [account] : [];
  } catch {
    return [];
  }
}

function readStoredProfiles() {
  try {
    const profiles = JSON.parse(localStorage.getItem("flora-profiles") || "null");
    if (profiles && typeof profiles === "object" && !Array.isArray(profiles)) {
      return profiles;
    }
  } catch {
    return {};
  }

  try {
    const profile = JSON.parse(localStorage.getItem("flora-profile") || "null");
    if (profile?.email) {
      return { [profile.email.toLowerCase()]: profile };
    }
  } catch {
    return {};
  }
  return {};
}

function isStoredAccount(account) {
  return Boolean(account?.email && account?.salt && account?.passwordHash);
}

function readStoredSession() {
  try {
    const session = JSON.parse(localStorage.getItem("flora-session") || "null");
    return session?.email ? session : null;
  } catch {
    return null;
  }
}

function normalizeRecoveryWord(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
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
