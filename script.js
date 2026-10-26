(() => {
  // Configuración inicial
  const CANTIDAD_LETRAS = 26;
  const LETRAS = Array.from({ length: CANTIDAD_LETRAS }, (_, i) => String.fromCharCode(65 + i));
  const TIEMPO_INICIAL = 150; // 2 minutos y medio

  // Referencias centralizadas del DOM
  const dom = {
    raiz: document.documentElement.style,
    roscoWrap: document.querySelector(".rosco-wrap"),
    roscoContenedor: document.querySelector(".rosco"),
    zonaCirculo: document.querySelector(".zona-circulo"),
    tiempoValor: document.querySelector(".tiempo-valor"),
    btnTiempo: document.querySelector(".btn-tiempo"),
    letraActual: document.querySelector(".letra-actual"),
    estado: document.querySelector(".estado"),
    overlay: document.getElementById("overlay"),
    nCorrecta: document.querySelector(".n-correcta"),
    nIncorrecta: document.querySelector(".n-incorrecta"),
    nRestantes: document.querySelector(".n-restantes"),
    finalCorrecta: document.getElementById("final-correcta"),
    finalIncorrecta: document.getElementById("final-incorrecta"),
    finalTitulo: document.getElementById("final-titulo"),
    btnCorrecta: document.querySelector('[data-accion="correcta"]'),
    btnIncorrecta: document.querySelector('[data-accion="incorrecta"]'),
    btnPasapalabra: document.querySelector('[data-accion="pasapalabra"]'),
  };

  // Estado global de la partida
  const state = {
    estadoLetras: [], // 'pendiente' | 'correcta' | 'incorrecta' | 'pasapalabra'
    cola: [],         // índices de letras pendientes de respuesta
    elementosLetras: [],
    segundosRestantes: TIEMPO_INICIAL,
    timerEstado: "no-iniciado", // 'no-iniciado' | 'corriendo' | 'pausado' | 'terminado'
    intervaloId: null,
  };

  // --- Dimensionamiento Responsivo ---
  const ajustarTamano = () => {
    const rect = dom.zonaCirculo.getBoundingClientRect();
    const disponible = Math.min(rect.width, rect.height) - 12;
    const size = Math.max(220, Math.min(disponible, 560));

    dom.raiz.setProperty("--rosco-size", `${size}px`);
    dom.raiz.setProperty("--letra", `${Math.round(size * 0.10)}px`);
    dom.raiz.setProperty("--buffer", `${Math.round(size * 0.03)}px`);
  };

  dom.roscoWrap.style.setProperty("--n", LETRAS.length);
  window.addEventListener("resize", ajustarTamano);
  window.addEventListener("orientationchange", ajustarTamano);

  // --- Temporizador ---
  const formatearTiempo = (s) => {
    const m = Math.floor(s / 60);
    const seg = String(s % 60).padStart(2, "0");
    return `${m}:${seg}`;
  };

  const actualizarTimerUI = () => {
    const { segundosRestantes, timerEstado } = state;

    dom.tiempoValor.textContent = formatearTiempo(segundosRestantes);
    dom.tiempoValor.classList.toggle("urgente", segundosRestantes > 0 && segundosRestantes <= 10);
    dom.btnTiempo.disabled = timerEstado === "terminado";

    const textosBoton = {
      "no-iniciado": "Iniciar juego",
      "corriendo": "Pausar",
      "pausado": "Reanudar",
      "terminado": "Tiempo"
    };
    dom.btnTiempo.textContent = textosBoton[timerEstado] ?? "Tiempo";
  };

  const detenerIntervalo = () => {
    if (state.intervaloId) {
      clearInterval(state.intervaloId);
      state.intervaloId = null;
    }
  };

  const tickTimer = () => {
    state.segundosRestantes--;
    if (state.segundosRestantes <= 0) {
      state.segundosRestantes = 0;
      detenerIntervalo();
      state.timerEstado = "terminado";
    }
    actualizarTimerUI();
    render();
  };

  const iniciarTimer = () => {
    detenerIntervalo();
    state.timerEstado = "corriendo";
    state.intervaloId = setInterval(tickTimer, 1000);
    actualizarTimerUI();
    render();
  };

  const pausarTimer = () => {
    if (state.timerEstado !== "corriendo") return;
    detenerIntervalo();
    state.timerEstado = "pausado";
    actualizarTimerUI();
    render();
  };

  const alternarTimer = () => {
    const { timerEstado } = state;
    if (timerEstado === "no-iniciado" || timerEstado === "pausado") {
      iniciarTimer();
    } else if (timerEstado === "corriendo") {
      pausarTimer();
    }
  };

  const resetearTimer = () => {
    detenerIntervalo();
    state.segundosRestantes = TIEMPO_INICIAL;
    state.timerEstado = "no-iniciado";
    actualizarTimerUI();
  };

  // --- Construcción del Rosco ---
  const crearLetras = () => {
    dom.roscoContenedor.innerHTML = "";
    state.elementosLetras = LETRAS.map((letra, i) => {
      const div = document.createElement("div");
      div.className = "letra";
      div.style.setProperty("--i", i);
      div.textContent = letra;
      dom.roscoContenedor.appendChild(div);
      return div;
    });
  };

  const actualIndex = () => state.cola[0] ?? null;

  // --- Renderizado de Pantalla ---
  const render = () => {
    const { estadoLetras, cola, elementosLetras, timerEstado } = state;
    const idx = actualIndex();
    const tiempoAgotado = timerEstado === "terminado";

    // Actualización de nodos de cada letra
    elementosLetras.forEach((el, i) => {
      el.className = "letra";
      if (estadoLetras[i] !== "pendiente") el.classList.add(estadoLetras[i]);
    });

    if (idx !== null) {
      elementosLetras[idx].classList.add("actual");
      dom.letraActual.textContent = LETRAS[idx];
      dom.estado.textContent = tiempoAgotado ? "tiempo agotado" : "en juego";
    } else {
      dom.letraActual.textContent = "";
      dom.estado.textContent = "";
    }

    // Métricas del marcador
    const nCorrectas = estadoLetras.filter((s) => s === "correcta").length;
    const nIncorrectas = estadoLetras.filter((s) => s === "incorrecta").length;

    dom.nCorrecta.textContent = nCorrectas;
    dom.nIncorrecta.textContent = nIncorrectas;
    dom.nRestantes.textContent = cola.length;

    // Estado de los botones
    const sinJuego = idx === null || tiempoAgotado;
    const tiempoCorriendo = timerEstado === "corriendo";

    // Si se completó el rosco y el tiempo seguía corriendo, lo pausamos automáticamente
    if (sinJuego && tiempoCorriendo) {
      detenerIntervalo();
      state.timerEstado = "pausado";
      actualizarTimerUI();
    }

    const deshabilitarAcciones = sinJuego || !tiempoCorriendo;

    dom.btnCorrecta.disabled = deshabilitarAcciones;
    dom.btnIncorrecta.disabled = deshabilitarAcciones;
    dom.btnPasapalabra.disabled = deshabilitarAcciones || cola.length < 2;

    // Overlay modal al terminar la partida
    if (sinJuego) {
      dom.finalCorrecta.textContent = nCorrectas;
      dom.finalIncorrecta.textContent = nIncorrectas;
      dom.finalTitulo.textContent = tiempoAgotado && idx !== null ? "Se acabó el tiempo" : "Rosco completo";
      dom.overlay.classList.add("visible");
    } else {
      dom.overlay.classList.remove("visible");
    }
  };

  // --- Flujo de Juego ---
  const marcar = (resultado) => {
    const idx = actualIndex();
    if (idx === null || state.timerEstado !== "corriendo") return;

    if (resultado === "pasapalabra") {
      state.estadoLetras[idx] = "pasapalabra";
      state.cola.push(state.cola.shift());
      pausarTimer();
    } else {
      state.estadoLetras[idx] = resultado;
      state.cola.shift();

      // Si la respuesta es incorrecta, también pausamos el tiempo
      if (resultado === "incorrecta") {
        pausarTimer();
      }
    }
    render();
  };

  const iniciar = () => {
    state.estadoLetras = Array(LETRAS.length).fill("pendiente");
    state.cola = LETRAS.map((_, i) => i);
    resetearTimer();
    render();
  };

  // --- Modal de Confirmación Personalizado ---
  const confirmarReinicio = (onConfirmar) => {
    if (document.getElementById("modal-confirmacion")) return;

    const dialog = document.createElement("dialog");
    dialog.id = "modal-confirmacion";
    dialog.className = "overlay visible";
    dialog.innerHTML = `
      <div class="panel-final">
        <h2>¿Reiniciar rosco?</h2>
        <div class="resumen" style="margin-bottom: 20px; color: var(--text-dim); font-size: 14px;">
          Se perderá el progreso actual de la partida.
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button type="button" class="btn-reiniciar" id="btn-cancelar-reinicio">Cancelar</button>
          <button type="button" class="btn-correcta" id="btn-aceptar-reinicio" style="padding: 7px 18px; font-size: 13px;">Sí, reiniciar</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const cerrarModal = () => {
      dialog.remove();
    };

    dialog.querySelector("#btn-cancelar-reinicio").addEventListener("click", cerrarModal);
    dialog.querySelector("#btn-aceptar-reinicio").addEventListener("click", () => {
      cerrarModal();
      onConfirmar();
    });

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) cerrarModal();
    });
  };

  // Delegación de eventos
  document.body.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-accion]");
    if (!btn || btn.disabled) return;

    const { accion } = btn.dataset;
    if (accion === "reiniciar") {
      if (state.timerEstado === "corriendo") {
        pausarTimer();
      }
      confirmarReinicio(() => {
        iniciar();
      });
    }
    else if (accion === "alternar-tiempo") alternarTimer();
    else marcar(accion);
  });

  // Inicialización
  crearLetras();
  ajustarTamano();
  iniciar();
})();