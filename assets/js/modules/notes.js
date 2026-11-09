const storageKey = "flora-personal-notes";
const form = document.querySelector("#note-form");
const list = document.querySelector("#note-list");
const filter = document.querySelector("#note-filter");
const emptyState = document.querySelector("#note-empty");
const count = document.querySelector("#note-count");
const message = document.querySelector("#note-message");

if (form && list && filter && emptyState && count && message) {
  let notes;

  try {
    const storedNotes = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(storedNotes)) {
      throw new Error("O arquivo guardado não tem um formato válido.");
    }
    notes = storedNotes.filter((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.content === "string" &&
      ["note", "reminder", "task"].includes(item.type)
    );
  } catch (error) {
    notes = [];
    message.textContent = `Não foi possível ler o arquivo: ${error.message}`;
  }

  const typeNames = { note: "Nota", reminder: "Lembrete", task: "Tarefa" };

  function saveNotes() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
      message.textContent = "";
      return true;
    } catch (error) {
      message.textContent = `Não foi possível guardar as alterações: ${error.message}`;
      return false;
    }
  }

  function renderNotes() {
    list.replaceChildren();
    const visibleNotes = notes
      .filter((item) => filter.value === "all" || item.type === filter.value)
      .sort((first, second) => second.createdAt - first.createdAt);

    count.textContent = `${notes.length} ${notes.length === 1 ? "item guardado" : "itens guardados"}`;
    emptyState.hidden = visibleNotes.length > 0;
    emptyState.textContent = notes.length
      ? "Não há itens deste tipo no arquivo."
      : "Ainda não guardaste nada. Usa o formulário acima para começar.";

    visibleNotes.forEach((item) => {
      const card = document.createElement("article");
      card.className = "glass-card rounded-2xl p-4 soft-shadow";

      const topRow = document.createElement("div");
      topRow.className = "flex items-center justify-between gap-3 mb-2";
      const badge = document.createElement("span");
      badge.className = "inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800";
      badge.textContent = typeNames[item.type];
      const date = document.createElement("time");
      date.className = "text-xs text-slate-500";
      if (item.date) {
        date.dateTime = item.date;
        const [year, month, day] = item.date.split("-");
        date.textContent = `${day}/${month}/${year}`;
      } else {
        date.textContent = new Intl.DateTimeFormat("pt-PT", { dateStyle: "short" }).format(item.createdAt);
      }
      topRow.append(badge, date);

      const content = document.createElement("p");
      content.className = "text-sm text-slate-700 whitespace-pre-wrap break-words";
      content.textContent = item.content;

      const actions = document.createElement("div");
      actions.className = "mt-3 flex justify-end gap-2";

      if (item.type === "task") {
        const doneButton = document.createElement("button");
        doneButton.type = "button";
        doneButton.className = "rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100";
        doneButton.textContent = item.done ? "Reabrir tarefa" : "Concluir tarefa";
        doneButton.setAttribute("aria-pressed", String(Boolean(item.done)));
        doneButton.addEventListener("click", () => {
          item.done = !item.done;
          if (saveNotes()) {
            renderNotes();
          } else {
            item.done = !item.done;
          }
        });
        if (item.done) {
          content.classList.add("line-through", "text-slate-400");
        }
        actions.append(doneButton);
      }

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "rounded-lg px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100";
      deleteButton.textContent = "Eliminar";
      deleteButton.setAttribute("aria-label", `Eliminar ${typeNames[item.type].toLowerCase()}`);
      deleteButton.addEventListener("click", () => {
        const previousNotes = notes;
        notes = notes.filter((note) => note.id !== item.id);
        if (saveNotes()) {
          renderNotes();
        } else {
          notes = previousNotes;
        }
      });
      actions.append(deleteButton);

      card.append(topRow, content, actions);
      list.append(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = form.elements.content.value.trim();
    if (!content) {
      message.textContent = "Escreve uma nota, lembrete ou tarefa antes de guardar.";
      return;
    }

    const newNote = {
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()),
      type: form.elements.type.value,
      content,
      date: form.elements.date.value,
      createdAt: Date.now(),
      done: false,
    };
    notes.push(newNote);
    if (saveNotes()) {
      form.reset();
      filter.value = "all";
      renderNotes();
    } else {
      notes.pop();
    }
  });

  filter.addEventListener("change", renderNotes);
  renderNotes();
}
